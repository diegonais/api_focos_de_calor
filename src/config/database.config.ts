import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EnvironmentVariables } from './env.validation';

export function getDatabaseConfig(
  configService: ConfigService<EnvironmentVariables>,
): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const hasDatabaseUrl = Boolean(databaseUrl);

  return {
    type: 'postgres',
    url: hasDatabaseUrl ? databaseUrl : undefined,
    host: hasDatabaseUrl ? undefined : configService.getOrThrow<string>('DB_HOST'),
    port: hasDatabaseUrl ? undefined : configService.getOrThrow<number>('DB_PORT'),
    username: hasDatabaseUrl
      ? undefined
      : configService.getOrThrow<string>('DB_USERNAME'),
    password: hasDatabaseUrl
      ? undefined
      : configService.getOrThrow<string>('DB_PASSWORD'),
    database: hasDatabaseUrl ? undefined : configService.getOrThrow<string>('DB_NAME'),
    ssl: configService.get<boolean>('DB_SSL') ? { rejectUnauthorized: false } : false,
    autoLoadEntities: true,
    synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
    logging: configService.get<boolean>('DB_LOGGING', false),
  };
}
