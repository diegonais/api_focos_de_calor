import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ModisDetail } from '../modis_details/entities/modis_detail.entity';
import { ViirsDetail } from '../viirs_details/entities/viirs_detail.entity';
import { DetectionsController } from './detections.controller';
import { DetectionsRepository } from './detections.repository';
import { DetectionsService } from './detections.service';
import { Detection } from './entities/detection.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Detection, ViirsDetail, ModisDetail])],
  controllers: [DetectionsController],
  providers: [DetectionsService, DetectionsRepository],
  exports: [DetectionsService],
})
export class DetectionsModule {}
