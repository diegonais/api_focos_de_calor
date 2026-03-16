import 'dotenv/config';
import 'reflect-metadata';

import { DataSource, DataSourceOptions } from 'typeorm';

import { Detection } from '../detections/entities/detection.entity';
import { ModisDetail } from '../modis_details/entities/modis_detail.entity';
import { ViirsDetail } from '../viirs_details/entities/viirs_detail.entity';
import { CreateDetectionsTable20260316110100 } from './migrations/20260316110100-CreateDetectionsTable';
import { CreateModisDetailsTable20260316110300 } from './migrations/20260316110300-CreateModisDetailsTable';
import { CreateViirsDetailsTable20260316110200 } from './migrations/20260316110200-CreateViirsDetailsTable';

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value.trim().toLowerCase() === 'true';
}

function parsePort(value: string | undefined, fallback = 5432): number {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) ? parsedValue : fallback;
}

const databaseUrl = process.env.DATABASE_URL?.trim();
const useSsl = parseBoolean(process.env.DB_SSL);

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: databaseUrl || undefined,
  host: databaseUrl ? undefined : process.env.DB_HOST,
  port: databaseUrl ? undefined : parsePort(process.env.DB_PORT),
  username: databaseUrl ? undefined : process.env.DB_USERNAME,
  password: databaseUrl ? undefined : process.env.DB_PASSWORD,
  database: databaseUrl ? undefined : process.env.DB_NAME,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  synchronize: false,
  logging: parseBoolean(process.env.DB_LOGGING),
  entities: [Detection, ViirsDetail, ModisDetail],
  migrations: [
    CreateDetectionsTable20260316110100,
    CreateViirsDetailsTable20260316110200,
    CreateModisDetailsTable20260316110300,
  ],
};

export default new DataSource(dataSourceOptions);
