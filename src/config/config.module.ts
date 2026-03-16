import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from './env.validation';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate: validateEnv,
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
