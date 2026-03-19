import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Detection } from '../detections/entities/detection.entity';
import { IngestionRun } from './entities/ingestion-run.entity';
import { FirmsClient } from './firms.client';
import { FirmsIngestionService } from './firms.ingestion.service';
import { FirmsMapper } from './firms.mapper';
import { FirmsScheduler } from './firms.scheduler';

@Module({
  imports: [TypeOrmModule.forFeature([Detection, IngestionRun])],
  providers: [FirmsClient, FirmsMapper, FirmsIngestionService, FirmsScheduler],
})
export class FirmsModule {}
