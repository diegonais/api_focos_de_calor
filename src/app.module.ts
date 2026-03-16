import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { DetectionsModule } from './detections/detections.module';
import { FirmsModule } from './firms/firms.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    AppConfigModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,
    DetectionsModule,
    FirmsModule,
  ],
})
export class AppModule {}
