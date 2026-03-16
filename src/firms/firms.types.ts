import { DetectionSourceType } from '../detections/entities/detection.entity';
import { FirmsSource } from './firms.constants';

export type FirmsCsvRecord = Record<string, string>;

export type DetectionInsertPayload = {
  sourceType: DetectionSourceType;
  latitude: string;
  longitude: string;
  scan: string;
  track: string;
  acqDate: string;
  acqTime: number;
  satellite: string;
  instrument: string;
  confidence: string;
  version: string;
  frp: string;
  daynight: string;
  dedupeKey: string;
};

export type PreparedDetectionRecord = {
  dedupeKey: string;
  detection: DetectionInsertPayload;
  viirsDetail?: {
    brightTi4: string;
    brightTi5: string;
  };
  modisDetail?: {
    brightness: string;
    brightT31: string;
  };
};

export type FirmsSyncWindow = {
  startDate?: string;
  dayRange: number;
};

export type SourceIngestionResult = {
  source: FirmsSource;
  fetchedCount: number;
  insertedCount: number;
  duplicateCount: number;
};
