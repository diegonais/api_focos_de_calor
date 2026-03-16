import { ConfigService } from '@nestjs/config';

import { EnvironmentVariables } from '../config/env.validation';
import { FirmsSource } from './firms.constants';

export type FirmsSettings = {
  mapKey: string;
  baseUrl: string;
  bbox: string;
  enabledSources: FirmsSource[];
  initialSyncStartDate: string;
  lookbackDays: number;
  syncEveryMinutes: number;
  runOnBoot: boolean;
  requestTimeoutMs: number;
};

export function getFirmsSettings(
  configService: ConfigService<EnvironmentVariables>,
): FirmsSettings {
  return {
    mapKey: configService.getOrThrow<string>('FIRMS_MAP_KEY'),
    baseUrl: configService.getOrThrow<string>('FIRMS_BASE_URL'),
    bbox: configService.getOrThrow<string>('FIRMS_BBOX'),
    enabledSources: configService.getOrThrow<FirmsSource[]>(
      'FIRMS_ENABLED_SOURCES',
    ),
    initialSyncStartDate: configService.getOrThrow<string>(
      'FIRMS_INITIAL_SYNC_START_DATE',
    ),
    lookbackDays: configService.getOrThrow<number>('FIRMS_LOOKBACK_DAYS'),
    syncEveryMinutes: configService.getOrThrow<number>(
      'FIRMS_SYNC_EVERY_MINUTES',
    ),
    runOnBoot: configService.getOrThrow<boolean>('FIRMS_RUN_ON_BOOT'),
    requestTimeoutMs: configService.getOrThrow<number>(
      'FIRMS_REQUEST_TIMEOUT_MS',
    ),
  };
}
