import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { EnvironmentVariables } from '../config/env.validation';
import { Detection } from '../detections/entities/detection.entity';
import {
  IngestionRun,
  IngestionRunStatus,
  IngestionRunTrigger,
} from './entities/ingestion-run.entity';
import { getFirmsSettings } from './firms.config';
import { FirmsClient } from './firms.client';
import { FIRMS_MAX_DAY_RANGE } from './firms.constants';
import { FirmsMapper } from './firms.mapper';
import { FirmsSyncWindow, PreparedDetectionRecord } from './firms.types';
import { ModisDetail } from '../modis_details/entities/modis_detail.entity';
import { ViirsDetail } from '../viirs_details/entities/viirs_detail.entity';

type DetectionIdLookupRow = {
  dedupe_key: string;
  id: string;
};

type PersistedSourceTotals = {
  fetchedCount: number;
  insertedCount: number;
  duplicateCount: number;
};

@Injectable()
export class FirmsIngestionService {
  private readonly logger = new Logger(FirmsIngestionService.name);
  private isRunning = false;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly dataSource: DataSource,
    private readonly firmsClient: FirmsClient,
    private readonly firmsMapper: FirmsMapper,
    @InjectRepository(Detection)
    private readonly detectionRepository: Repository<Detection>,
    @InjectRepository(IngestionRun)
    private readonly ingestionRunRepository: Repository<IngestionRun>,
  ) {}

  async runSync(trigger: IngestionRunTrigger): Promise<void> {
    const settings = getFirmsSettings(this.configService);
    const useHistoricalBootstrap =
      await this.shouldRunHistoricalBootstrap(trigger);
    const syncWindows = this.resolveSyncWindows(
      trigger,
      settings,
      useHistoricalBootstrap,
    );
    const syncMode = useHistoricalBootstrap
      ? `historical sync from ${settings.initialSyncStartDate} to current date in ${syncWindows.length} window(s)`
      : `incremental sync for the last ${syncWindows[0].dayRange} day(s)`;

    if (settings.enabledSources.length === 0) {
      this.logger.warn(
        'FIRMS ingestion skipped because no sources are configured.',
      );
      return;
    }

    if (this.isRunning) {
      await this.recordSkippedRun(trigger);
      this.logger.warn(
        `FIRMS ingestion skipped for ${trigger} because a previous run is still active.`,
      );
      return;
    }

    this.isRunning = true;
    this.logger.log(`---Starting FIRMS ${syncMode}.---`);
    const startedAt = new Date();
    let fetchedCount = 0;
    let insertedCount = 0;
    let duplicateCount = 0;
    const sourceErrors: string[] = [];
    const run = await this.ingestionRunRepository.save(
      this.ingestionRunRepository.create({
        status: IngestionRunStatus.RUNNING,
        trigger,
        sources: settings.enabledSources,
        lookbackDays: syncWindows.reduce(
          (total, window) => total + window.dayRange,
          0,
        ),
        fetchedCount: 0,
        insertedCount: 0,
        duplicateCount: 0,
        startedAt,
      }),
    );

    try {
      for (const source of settings.enabledSources) {
        try {
          let sourceFetchedCount = 0;
          let sourceInsertedCount = 0;
          let sourceDuplicateCount = 0;

          for (const window of syncWindows) {
            const rawRows = await this.firmsClient.fetchDetections(
              source,
              window.dayRange,
              window.startDate,
            );
            const preparedRows = this.firmsMapper.mapRows(source, rawRows);
            const result = await this.persistPreparedRows(preparedRows);

            sourceFetchedCount += result.fetchedCount;
            sourceInsertedCount += result.insertedCount;
            sourceDuplicateCount += result.duplicateCount;
          }

          fetchedCount += sourceFetchedCount;
          insertedCount += sourceInsertedCount;
          duplicateCount += sourceDuplicateCount;

          this.logger.log(
            `FIRMS ${source}: fetched=${sourceFetchedCount}, inserted=${sourceInsertedCount}, duplicates=${sourceDuplicateCount}`,
          );
        } catch (error) {
          const errorMessage = this.getErrorMessage(error);
          sourceErrors.push(`${source}: ${errorMessage}`);
          this.logger.error(
            `FIRMS ingestion failed for ${source}`,
            errorMessage,
          );
        }
      }
    } finally {
      const finishedAt = new Date();

      run.status =
        sourceErrors.length > 0
          ? IngestionRunStatus.FAILED
          : IngestionRunStatus.SUCCEEDED;
      run.fetchedCount = fetchedCount;
      run.insertedCount = insertedCount;
      run.duplicateCount = duplicateCount;
      run.finishedAt = finishedAt;
      run.durationMs = finishedAt.getTime() - startedAt.getTime();
      run.errorMessage =
        sourceErrors.length > 0 ? sourceErrors.join(' | ') : null;
      await this.ingestionRunRepository.save(run);

      this.isRunning = false;
    }
  }

  private async recordSkippedRun(trigger: IngestionRunTrigger): Promise<void> {
    const settings = getFirmsSettings(this.configService);
    const useHistoricalBootstrap =
      await this.shouldRunHistoricalBootstrap(trigger);
    const syncWindows = this.resolveSyncWindows(
      trigger,
      settings,
      useHistoricalBootstrap,
    );
    const now = new Date();

    await this.ingestionRunRepository.save(
      this.ingestionRunRepository.create({
        status: IngestionRunStatus.SKIPPED,
        trigger,
        sources: settings.enabledSources,
        lookbackDays: syncWindows.reduce(
          (total, window) => total + window.dayRange,
          0,
        ),
        fetchedCount: 0,
        insertedCount: 0,
        duplicateCount: 0,
        startedAt: now,
        finishedAt: now,
        durationMs: 0,
        errorMessage:
          'Skipped because a previous ingestion run is still active',
      }),
    );
  }

  private resolveLookbackDays(
    settings: ReturnType<typeof getFirmsSettings>,
  ): number {
    const startDate = new Date(
      `${settings.initialSyncStartDate}T00:00:00.000Z`,
    );
    const today = new Date();
    const currentDateUtc = Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    );
    const startDateUtc = Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    );

    if (startDateUtc > currentDateUtc) {
      throw new Error(
        `FIRMS initial sync start date ${settings.initialSyncStartDate} cannot be in the future`,
      );
    }

    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return Math.floor((currentDateUtc - startDateUtc) / millisecondsPerDay) + 1;
  }

  private resolveSyncWindows(
    trigger: IngestionRunTrigger,
    settings: ReturnType<typeof getFirmsSettings>,
    useHistoricalBootstrap: boolean,
  ): FirmsSyncWindow[] {
    if (trigger !== IngestionRunTrigger.BOOT || !useHistoricalBootstrap) {
      return [
        {
          dayRange: settings.lookbackDays,
        },
      ];
    }

    const totalHistoricalDays = this.resolveLookbackDays(settings);
    const startDate = new Date(
      `${settings.initialSyncStartDate}T00:00:00.000Z`,
    );
    const windows: FirmsSyncWindow[] = [];

    for (
      let dayOffset = 0;
      dayOffset < totalHistoricalDays;
      dayOffset += FIRMS_MAX_DAY_RANGE
    ) {
      const windowStartDate = new Date(startDate);
      windowStartDate.setUTCDate(windowStartDate.getUTCDate() + dayOffset);

      windows.push({
        startDate: this.formatUtcDate(windowStartDate),
        dayRange: Math.min(
          FIRMS_MAX_DAY_RANGE,
          totalHistoricalDays - dayOffset,
        ),
      });
    }

    return windows;
  }

  private async shouldRunHistoricalBootstrap(
    trigger: IngestionRunTrigger,
  ): Promise<boolean> {
    if (trigger !== IngestionRunTrigger.BOOT) {
      return false;
    }

    const hasSuccessfulBootstrapRun = await this.ingestionRunRepository.exists({
      where: {
        trigger: IngestionRunTrigger.BOOT,
        status: IngestionRunStatus.SUCCEEDED,
      },
    });

    if (hasSuccessfulBootstrapRun) {
      return false;
    }

    const detectionsCount = await this.detectionRepository.count();

    return detectionsCount === 0;
  }

  private formatUtcDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private async persistPreparedRows(
    preparedRows: PreparedDetectionRecord[],
  ): Promise<PersistedSourceTotals> {
    if (preparedRows.length === 0) {
      return {
        fetchedCount: 0,
        insertedCount: 0,
        duplicateCount: 0,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const insertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(Detection)
        .values(preparedRows.map((row) => row.detection))
        .orIgnore()
        .returning(['id', 'dedupe_key'])
        .execute();

      // With `orIgnore()`, TypeORM identifiers can include attempted rows.
      // Postgres `raw` reflects rows actually inserted by RETURNING.
      const insertedCount = Array.isArray(insertResult.raw)
        ? insertResult.raw.length
        : 0;
      const detectionIdsByDedupe = await this.findDetectionIdsByDedupeKeys(
        manager,
        preparedRows.map((row) => row.dedupeKey),
      );
      const viirsDetails = preparedRows.flatMap((row) => {
        const detectionId = detectionIdsByDedupe.get(row.dedupeKey);

        if (!detectionId || !row.viirsDetail) {
          return [];
        }

        return [
          {
            detection: { id: detectionId },
            brightTi4: row.viirsDetail.brightTi4,
            brightTi5: row.viirsDetail.brightTi5,
          },
        ];
      });
      const modisDetails = preparedRows.flatMap((row) => {
        const detectionId = detectionIdsByDedupe.get(row.dedupeKey);

        if (!detectionId || !row.modisDetail) {
          return [];
        }

        return [
          {
            detection: { id: detectionId },
            brightness: row.modisDetail.brightness,
            brightT31: row.modisDetail.brightT31,
          },
        ];
      });

      if (viirsDetails.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(ViirsDetail)
          .values(viirsDetails)
          .orIgnore()
          .execute();
      }

      if (modisDetails.length > 0) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(ModisDetail)
          .values(modisDetails)
          .orIgnore()
          .execute();
      }

      return {
        fetchedCount: preparedRows.length,
        insertedCount,
        duplicateCount: preparedRows.length - insertedCount,
      };
    });
  }

  private async findDetectionIdsByDedupeKeys(
    manager: EntityManager,
    dedupeKeys: string[],
  ): Promise<Map<string, string>> {
    const uniqueDedupeKeys = [...new Set(dedupeKeys)];

    if (uniqueDedupeKeys.length === 0) {
      return new Map();
    }

    const detectionRows = await manager
      .createQueryBuilder()
      .select('d.id', 'id')
      .addSelect('d.dedupe_key', 'dedupe_key')
      .from(Detection, 'd')
      .where('d.dedupe_key IN (:...dedupeKeys)', {
        dedupeKeys: uniqueDedupeKeys,
      })
      .getRawMany<DetectionIdLookupRow>();

    return new Map(detectionRows.map((row) => [row.dedupe_key, row.id]));
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown FIRMS ingestion error';
  }
}
