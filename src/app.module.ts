import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { DetectionsModule } from './detections/detections.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, HealthModule, DetectionsModule],
})
export class AppModule {}
