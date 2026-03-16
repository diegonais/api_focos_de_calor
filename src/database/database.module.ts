import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getDatabaseConfig } from '../config/database.config';
import { EnvironmentVariables } from '../config/env.validation';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) =>
        getDatabaseConfig(configService),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
