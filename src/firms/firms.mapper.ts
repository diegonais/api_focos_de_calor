import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

import { DetectionSourceType } from '../detections/entities/detection.entity';
import { FirmsSource } from './firms.constants';
import {
  DetectionInsertPayload,
  FirmsCsvRecord,
  PreparedDetectionRecord,
} from './firms.types';

type FirmsSourceMetadata = {
  sourceType: DetectionSourceType;
  satelliteFallback: string;
  instrumentFallback: string;
};

const BOLIVIA_TIME_ZONE = 'America/La_Paz';
const ACQ_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: BOLIVIA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const SOURCE_METADATA: Record<FirmsSource, FirmsSourceMetadata> = {
  [FirmsSource.VIIRS_SNPP_NRT]: {
    sourceType: DetectionSourceType.VIIRS,
    satelliteFallback: 'SUOMI NPP',
    instrumentFallback: 'VIIRS',
  },
  [FirmsSource.VIIRS_NOAA20_NRT]: {
    sourceType: DetectionSourceType.VIIRS,
    satelliteFallback: 'NOAA-20',
    instrumentFallback: 'VIIRS',
  },
  [FirmsSource.VIIRS_NOAA21_NRT]: {
    sourceType: DetectionSourceType.VIIRS,
    satelliteFallback: 'NOAA-21',
    instrumentFallback: 'VIIRS',
  },
  [FirmsSource.MODIS_NRT]: {
    sourceType: DetectionSourceType.MODIS,
    satelliteFallback: 'TERRA/AQUA',
    instrumentFallback: 'MODIS',
  },
};

@Injectable()
export class FirmsMapper {
  mapRows(
    source: FirmsSource,
    rows: FirmsCsvRecord[],
  ): PreparedDetectionRecord[] {
    return rows.map((row, index) => this.mapRow(source, row, index));
  }

  private mapRow(
    source: FirmsSource,
    row: FirmsCsvRecord,
    index: number,
  ): PreparedDetectionRecord {
    const metadata = SOURCE_METADATA[source];
    const acqDateUtc = this.normalizeDate(row.acq_date, source, index);
    const acqTimeUtc = this.normalizeAcqTime(row.acq_time, source, index);
    const localAcqDateTime = this.convertUtcAcqDateTimeToBolivia(
      acqDateUtc,
      acqTimeUtc,
      source,
      index,
    );
    const detection: Omit<DetectionInsertPayload, 'dedupeKey'> = {
      sourceType: metadata.sourceType,
      latitude: this.normalizeDecimal(
        row.latitude,
        6,
        'latitude',
        source,
        index,
      ),
      longitude: this.normalizeDecimal(
        row.longitude,
        6,
        'longitude',
        source,
        index,
      ),
      scan: this.normalizeDecimal(row.scan, 3, 'scan', source, index),
      track: this.normalizeDecimal(row.track, 3, 'track', source, index),
      acqDate: localAcqDateTime.acqDate,
      acqTime: localAcqDateTime.acqTime,
      satellite: this.normalizeString(
        row.satellite || metadata.satelliteFallback,
        'satellite',
        source,
        index,
        20,
      ),
      instrument: this.normalizeString(
        row.instrument || metadata.instrumentFallback,
        'instrument',
        source,
        index,
        20,
      ),
      confidence: this.normalizeConfidence(row.confidence, source, index),
      version: this.normalizeString(row.version, 'version', source, index, 20),
      frp: this.normalizeDecimal(row.frp, 3, 'frp', source, index),
      daynight: this.normalizeDaynight(row.daynight, source, index),
    };
    const dedupeKey = this.buildDedupeKey(detection);

    if (metadata.sourceType === DetectionSourceType.VIIRS) {
      return {
        dedupeKey,
        detection: {
          ...detection,
          dedupeKey,
        },
        viirsDetail: {
          brightTi4: this.normalizeDecimal(
            row.bright_ti4,
            3,
            'bright_ti4',
            source,
            index,
          ),
          brightTi5: this.normalizeDecimal(
            row.bright_ti5,
            3,
            'bright_ti5',
            source,
            index,
          ),
        },
      };
    }

    return {
      dedupeKey,
      detection: {
        ...detection,
        dedupeKey,
      },
      modisDetail: {
        brightness: this.normalizeDecimal(
          row.brightness,
          3,
          'brightness',
          source,
          index,
        ),
        brightT31: this.normalizeDecimal(
          row.bright_t31,
          3,
          'bright_t31',
          source,
          index,
        ),
      },
    };
  }

  private buildDedupeKey(
    detection: Omit<DetectionInsertPayload, 'dedupeKey'>,
  ): string {
    return createHash('sha256')
      .update(
        [
          detection.sourceType,
          detection.satellite,
          detection.instrument,
          detection.acqDate,
          String(detection.acqTime).padStart(4, '0'),
          detection.latitude,
          detection.longitude,
          detection.scan,
          detection.track,
          detection.confidence,
          detection.version,
          detection.frp,
          detection.daynight,
        ].join('|'),
      )
      .digest('hex');
  }

  private normalizeString(
    value: string | undefined,
    fieldName: string,
    source: FirmsSource,
    index: number,
    maxLength: number,
  ): string {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
      throw new Error(`Missing ${fieldName} for ${source} row ${index + 1}`);
    }

    if (normalizedValue.length > maxLength) {
      throw new Error(
        `Invalid ${fieldName} length for ${source} row ${index + 1}`,
      );
    }

    return normalizedValue.toUpperCase();
  }

  private normalizeDate(
    value: string | undefined,
    source: FirmsSource,
    index: number,
  ): string {
    const normalizedValue = value?.trim();

    if (!normalizedValue || !/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
      throw new Error(`Invalid acq_date for ${source} row ${index + 1}`);
    }

    return normalizedValue;
  }

  private normalizeAcqTime(
    value: string | undefined,
    source: FirmsSource,
    index: number,
  ): number {
    const normalizedValue = value?.trim();
    if (!normalizedValue || !/^\d{1,4}$/.test(normalizedValue)) {
      throw new Error(`Invalid acq_time for ${source} row ${index + 1}`);
    }

    const paddedTime = normalizedValue.padStart(4, '0');
    const hours = Number(paddedTime.slice(0, 2));
    const minutes = Number(paddedTime.slice(2, 4));

    if (hours > 23 || minutes > 59) {
      throw new Error(`Invalid acq_time for ${source} row ${index + 1}`);
    }

    return Number(paddedTime);
  }

  private convertUtcAcqDateTimeToBolivia(
    acqDateUtc: string,
    acqTimeUtc: number,
    source: FirmsSource,
    index: number,
  ): { acqDate: string; acqTime: number } {
    const dateMatch = acqDateUtc.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!dateMatch) {
      throw new Error(`Invalid acq_date for ${source} row ${index + 1}`);
    }

    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    const paddedUtcTime = String(acqTimeUtc).padStart(4, '0');
    const hours = Number(paddedUtcTime.slice(0, 2));
    const minutes = Number(paddedUtcTime.slice(2, 4));
    const utcTimestamp = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
    const parts = ACQ_DATE_TIME_FORMATTER.formatToParts(new Date(utcTimestamp));
    const partMap = new Map(parts.map((part) => [part.type, part.value]));
    const localYear = partMap.get('year');
    const localMonth = partMap.get('month');
    const localDay = partMap.get('day');
    const localHours = partMap.get('hour');
    const localMinutes = partMap.get('minute');

    if (
      !localYear ||
      !localMonth ||
      !localDay ||
      !localHours ||
      !localMinutes
    ) {
      throw new Error(
        `Could not convert acq_date/acq_time to ${BOLIVIA_TIME_ZONE} for ${source} row ${index + 1}`,
      );
    }

    return {
      acqDate: `${localYear}-${localMonth}-${localDay}`,
      acqTime: Number(`${localHours}${localMinutes}`),
    };
  }

  private normalizeDecimal(
    value: string | undefined,
    scale: number,
    fieldName: string,
    source: FirmsSource,
    index: number,
  ): string {
    const normalizedValue = value?.trim();
    const parsedValue = Number(normalizedValue);

    if (!normalizedValue || !Number.isFinite(parsedValue)) {
      throw new Error(`Invalid ${fieldName} for ${source} row ${index + 1}`);
    }

    return parsedValue.toFixed(scale);
  }

  private normalizeConfidence(
    value: string | undefined,
    source: FirmsSource,
    index: number,
  ): string {
    const normalizedValue = value?.trim();

    if (!normalizedValue) {
      throw new Error(`Missing confidence for ${source} row ${index + 1}`);
    }

    const numericValue = Number(normalizedValue);

    if (Number.isFinite(numericValue)) {
      return numericValue.toString();
    }

    return normalizedValue.toUpperCase();
  }

  private normalizeDaynight(
    value: string | undefined,
    source: FirmsSource,
    index: number,
  ): string {
    const normalizedValue = value?.trim().toUpperCase();

    if (normalizedValue !== 'D' && normalizedValue !== 'N') {
      throw new Error(`Invalid daynight for ${source} row ${index + 1}`);
    }

    return normalizedValue;
  }
}
