export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  TZ: string;
  MAP_KEY: string;
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

  if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 65535) {
    errors.push(`${key} debe ser un numero entero entre 1 y 65535.`);
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

function validateTimeZone(timeZone: string, errors: string[]): void {
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
  } catch {
    errors.push(`TZ no es una zona horaria valida. Ejemplo esperado: America/La_Paz.`);
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
  const mapKey = getStringValue(config, 'MAP_KEY');
  validateTimeZone(timeZone, errors);

  if (!mapKey) {
    errors.push(`MAP_KEY es obligatoria.`);
  }

  const databaseUrl = getStringValue(config, 'DATABASE_URL');
  const dbHost = getStringValue(config, 'DB_HOST');
  const dbPort = parsePort('DB_PORT', getStringValue(config, 'DB_PORT'), 5432, errors);
  const dbUsername = getStringValue(config, 'DB_USERNAME');
  const dbPassword = getStringValue(config, 'DB_PASSWORD');
  const dbName = getStringValue(config, 'DB_NAME');
  const dbSsl = parseBoolean('DB_SSL', getStringValue(config, 'DB_SSL'), false, errors);
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
      errors.push(`DB_HOST es obligatorio cuando DATABASE_URL no esta definido.`);
    }

    if (!dbUsername) {
      errors.push(`DB_USERNAME es obligatorio cuando DATABASE_URL no esta definido.`);
    }

    if (!dbPassword) {
      errors.push(`DB_PASSWORD es obligatorio cuando DATABASE_URL no esta definido.`);
    }

    if (!dbName) {
      errors.push(`DB_NAME es obligatorio cuando DATABASE_URL no esta definido.`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`La validacion de variables de entorno fallo:\n- ${errors.join('\n- ')}`);
  }

  return {
    NODE_ENV: nodeEnv ?? 'development',
    PORT: port,
    TZ: timeZone,
    MAP_KEY: mapKey ?? '',
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
