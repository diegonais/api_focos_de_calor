import {
  DEFAULT_FIRMS_SOURCES,
  FIRMS_MAX_DAY_RANGE,
  FirmsSource,
} from '../firms/firms.constants';

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  TZ: string;
  FIRMS_MAP_KEY: string;
  FIRMS_BASE_URL: string;
  FIRMS_BBOX: string;
  FIRMS_ENABLED_SOURCES: FirmsSource[];
  FIRMS_INITIAL_SYNC_START_DATE: string;
  FIRMS_LOOKBACK_DAYS: number;
  FIRMS_SYNC_EVERY_MINUTES: number;
  FIRMS_RUN_ON_BOOT: boolean;
  FIRMS_REQUEST_TIMEOUT_MS: number;
  DATABASE_URL?: string;
  DB_HOST?: string;
  DB_PORT: number;
  DB_USERNAME?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
  DB_SSL: boolean;
  DB_SYNCHRONIZE: boolean;
  DB_LOGGING: boolean;
}

type EnvRecord = Record<string, unknown>;

const ALLOWED_NODE_ENVS: EnvironmentVariables['NODE_ENV'][] = [
  'development',
  'test',
  'production',
];

function getStringValue(config: EnvRecord, key: string): string | undefined {
  const rawValue = config[key];

  if (rawValue === undefined || rawValue === null) {
    return undefined;
  }

  const normalizedValue = String(rawValue).trim();

  return normalizedValue === '' ? undefined : normalizedValue;
}

function parsePort(
  key: string,
  value: string | undefined,
  fallback: number,
  errors: string[],
): number {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < 1 ||
    parsedValue > 65535
  ) {
    errors.push(`${key} debe ser un numero entero entre 1 y 65535.`);
    return fallback;
  }

  return parsedValue;
}

function parsePositiveInteger(
  key: string,
  value: string | undefined,
  fallback: number,
  errors: string[],
  minimum = 1,
): number {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < minimum) {
    errors.push(`${key} debe ser un numero entero mayor o igual a ${minimum}.`);
    return fallback;
  }

  return parsedValue;
}

function parseBoolean(
  key: string,
  value: string | undefined,
  fallback: boolean,
  errors: string[],
): boolean {
  if (!value) {
    return fallback;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  errors.push(`${key} debe ser "true" o "false".`);
  return fallback;
}

function parseCsvList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function validateBbox(value: string, errors: string[]): void {
  const parts = value.split(',').map((item) => item.trim());

  if (parts.length !== 4) {
    errors.push(
      'FIRMS_BBOX debe tener cuatro coordenadas en formato minLon,minLat,maxLon,maxLat.',
    );
    return;
  }

  const hasInvalidCoordinate = parts.some(
    (item) => !Number.isFinite(Number(item)),
  );

  if (hasInvalidCoordinate) {
    errors.push(`FIRMS_BBOX debe contener coordenadas numericas validas.`);
  }
}

function validateIsoDate(key: string, value: string, errors: string[]): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`${key} debe tener formato YYYY-MM-DD.`);
    return;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    errors.push(`${key} debe ser una fecha valida.`);
  }
}

function validateTimeZone(timeZone: string, errors: string[]): void {
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
  } catch {
    errors.push(
      `TZ no es una zona horaria valida. Ejemplo esperado: America/La_Paz.`,
    );
  }
}

export function validateEnv(config: EnvRecord): EnvironmentVariables {
  const errors: string[] = [];

  const nodeEnvValue = getStringValue(config, 'NODE_ENV') ?? 'development';
  const nodeEnv = ALLOWED_NODE_ENVS.find((value) => value === nodeEnvValue);

  if (!nodeEnv) {
    errors.push(
      `NODE_ENV debe ser uno de los siguientes valores: ${ALLOWED_NODE_ENVS.join(', ')}.`,
    );
  }

  const port = parsePort('PORT', getStringValue(config, 'PORT'), 3000, errors);
  const timeZone = getStringValue(config, 'TZ') ?? 'America/La_Paz';
  const firmsMapKey = getStringValue(config, 'FIRMS_MAP_KEY');
  validateTimeZone(timeZone, errors);

  if (!firmsMapKey) {
    errors.push(`FIRMS_MAP_KEY es obligatoria.`);
  }

  const firmsBaseUrl =
    getStringValue(config, 'FIRMS_BASE_URL') ??
    'https://firms.modaps.eosdis.nasa.gov/api/area/csv';
  const firmsBbox =
    getStringValue(config, 'FIRMS_BBOX') ?? '-69.8,-22.9,-57.4,-9.6';
  const firmsEnabledSourcesRaw = parseCsvList(
    getStringValue(config, 'FIRMS_ENABLED_SOURCES') ??
      DEFAULT_FIRMS_SOURCES.join(','),
  );
  const firmsInitialSyncStartDate =
    getStringValue(config, 'FIRMS_INITIAL_SYNC_START_DATE') ?? '2026-01-01';
  const firmsLookbackDays = parsePositiveInteger(
    'FIRMS_LOOKBACK_DAYS',
    getStringValue(config, 'FIRMS_LOOKBACK_DAYS'),
    4,
    errors,
  );
  const firmsSyncEveryMinutes = parsePositiveInteger(
    'FIRMS_SYNC_EVERY_MINUTES',
    getStringValue(config, 'FIRMS_SYNC_EVERY_MINUTES'),
    5,
    errors,
  );
  const firmsRunOnBoot = parseBoolean(
    'FIRMS_RUN_ON_BOOT',
    getStringValue(config, 'FIRMS_RUN_ON_BOOT'),
    true,
    errors,
  );
  const firmsRequestTimeoutMs = parsePositiveInteger(
    'FIRMS_REQUEST_TIMEOUT_MS',
    getStringValue(config, 'FIRMS_REQUEST_TIMEOUT_MS'),
    15000,
    errors,
    1000,
  );

  validateBbox(firmsBbox, errors);
  validateIsoDate(
    'FIRMS_INITIAL_SYNC_START_DATE',
    firmsInitialSyncStartDate,
    errors,
  );

  if (firmsLookbackDays > FIRMS_MAX_DAY_RANGE) {
    errors.push(
      `FIRMS_LOOKBACK_DAYS no puede ser mayor a ${FIRMS_MAX_DAY_RANGE} para el endpoint area de FIRMS.`,
    );
  }

  if (firmsEnabledSourcesRaw.length === 0) {
    errors.push(`FIRMS_ENABLED_SOURCES debe incluir al menos una fuente.`);
  }

  const invalidFirmsSources = firmsEnabledSourcesRaw.filter(
    (source) => !Object.values(FirmsSource).includes(source as FirmsSource),
  );

  if (invalidFirmsSources.length > 0) {
    errors.push(
      `FIRMS_ENABLED_SOURCES contiene valores invalidos: ${invalidFirmsSources.join(', ')}.`,
    );
  }

  const databaseUrl = getStringValue(config, 'DATABASE_URL');
  const dbHost = getStringValue(config, 'DB_HOST');
  const dbPort = parsePort(
    'DB_PORT',
    getStringValue(config, 'DB_PORT'),
    5432,
    errors,
  );
  const dbUsername = getStringValue(config, 'DB_USERNAME');
  const dbPassword = getStringValue(config, 'DB_PASSWORD');
  const dbName = getStringValue(config, 'DB_NAME');
  const dbSsl = parseBoolean(
    'DB_SSL',
    getStringValue(config, 'DB_SSL'),
    false,
    errors,
  );
  const dbSynchronize = parseBoolean(
    'DB_SYNCHRONIZE',
    getStringValue(config, 'DB_SYNCHRONIZE'),
    false,
    errors,
  );
  const dbLogging = parseBoolean(
    'DB_LOGGING',
    getStringValue(config, 'DB_LOGGING'),
    false,
    errors,
  );

  if (!databaseUrl) {
    if (!dbHost) {
      errors.push(
        `DB_HOST es obligatorio cuando DATABASE_URL no esta definido.`,
      );
    }

    if (!dbUsername) {
      errors.push(
        `DB_USERNAME es obligatorio cuando DATABASE_URL no esta definido.`,
      );
    }

    if (!dbPassword) {
      errors.push(
        `DB_PASSWORD es obligatorio cuando DATABASE_URL no esta definido.`,
      );
    }

    if (!dbName) {
      errors.push(
        `DB_NAME es obligatorio cuando DATABASE_URL no esta definido.`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `La validacion de variables de entorno fallo:\n- ${errors.join('\n- ')}`,
    );
  }

  return {
    NODE_ENV: nodeEnv ?? 'development',
    PORT: port,
    TZ: timeZone,
    FIRMS_MAP_KEY: firmsMapKey ?? '',
    FIRMS_BASE_URL: firmsBaseUrl,
    FIRMS_BBOX: firmsBbox,
    FIRMS_ENABLED_SOURCES: firmsEnabledSourcesRaw as FirmsSource[],
    FIRMS_INITIAL_SYNC_START_DATE: firmsInitialSyncStartDate,
    FIRMS_LOOKBACK_DAYS: firmsLookbackDays,
    FIRMS_SYNC_EVERY_MINUTES: firmsSyncEveryMinutes,
    FIRMS_RUN_ON_BOOT: firmsRunOnBoot,
    FIRMS_REQUEST_TIMEOUT_MS: firmsRequestTimeoutMs,
    DATABASE_URL: databaseUrl,
    DB_HOST: dbHost,
    DB_PORT: dbPort,
    DB_USERNAME: dbUsername,
    DB_PASSWORD: dbPassword,
    DB_NAME: dbName,
    DB_SSL: dbSsl,
    DB_SYNCHRONIZE: dbSynchronize,
    DB_LOGGING: dbLogging,
  };
}
