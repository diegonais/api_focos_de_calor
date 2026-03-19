import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';

import { EnvironmentVariables } from '../config/env.validation';
import { IngestionRunTrigger } from './entities/ingestion-run.entity';
import { getFirmsSettings } from './firms.config';
import { FIRMS_SYNC_INTERVAL_NAME } from './firms.constants';
import { FirmsIngestionService } from './firms.ingestion.service';

@Injectable()
export class FirmsScheduler implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(FirmsScheduler.name);

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly firmsIngestionService: FirmsIngestionService,
  ) {}

  onApplicationBootstrap(): void {
    const settings = getFirmsSettings(this.configService);
    const nodeEnv = this.configService.getOrThrow<
      'development' | 'test' | 'production'
    >('NODE_ENV');

    if (nodeEnv === 'test') {
      this.logger.log('FIRMS scheduler disabled for test environment.');
      return;
    }

    if (settings.enabledSources.length === 0) {
      this.logger.warn(
        'FIRMS scheduler is disabled because no enabled sources were configured.',
      );
      return;
    }

    this.registerRecurringSync(settings.syncEveryMinutes);

    if (settings.runOnBoot) {
      setTimeout(() => {
        void this.firmsIngestionService.runSync(IngestionRunTrigger.BOOT);
      }, 0);
    }
  }

  onModuleDestroy(): void {
    if (!this.hasInterval(FIRMS_SYNC_INTERVAL_NAME)) {
      return;
    }

    this.schedulerRegistry.deleteInterval(FIRMS_SYNC_INTERVAL_NAME);
  }

  private registerRecurringSync(syncEveryMinutes: number): void {
    if (this.hasInterval(FIRMS_SYNC_INTERVAL_NAME)) {
      this.schedulerRegistry.deleteInterval(FIRMS_SYNC_INTERVAL_NAME);
    }

    const interval = setInterval(
      () => {
        void this.firmsIngestionService.runSync(IngestionRunTrigger.SCHEDULED);
      },
      syncEveryMinutes * 60 * 1000,
    );

    this.schedulerRegistry.addInterval(FIRMS_SYNC_INTERVAL_NAME, interval);
    this.logger.log(
      `FIRMS scheduler registered to run every ${syncEveryMinutes} minutes.`,
    );
  }

  private hasInterval(name: string): boolean {
    try {
      this.schedulerRegistry.getInterval(name);
      return true;
    } catch {
      return false;
    }
  }
}
