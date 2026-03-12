import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getDatabaseConfig(): TypeOrmModuleOptions {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;

  return {
    type: 'postgres',
    url: hasDatabaseUrl ? process.env.DATABASE_URL : undefined,
    host: hasDatabaseUrl ? undefined : process.env.DB_HOST,
    port: hasDatabaseUrl ? undefined : Number(process.env.DB_PORT ?? 5432),
    username: hasDatabaseUrl ? undefined : process.env.DB_USERNAME,
    password: hasDatabaseUrl ? undefined : process.env.DB_PASSWORD,
    database: hasDatabaseUrl ? undefined : process.env.DB_NAME,
    ssl:
      process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
    autoLoadEntities: true,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
  };
}