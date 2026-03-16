import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { CreateDetectionDto } from './dto/create-detection.dto';
import { FindDetectionsQueryDto } from './dto/find-detections-query.dto';
import { Detection } from './entities/detection.entity';

@Injectable()
export class DetectionsRepository {
  constructor(
    @InjectRepository(Detection)
    private readonly detectionRepository: Repository<Detection>,
  ) {}

  createEntity(payload: CreateDetectionDto): Detection {
    return this.detectionRepository.create(payload);
  }

  async save(detection: Detection): Promise<Detection> {
    return this.detectionRepository.save(detection);
  }

  async findAll(filters: FindDetectionsQueryDto): Promise<Detection[]> {
    const where: FindOptionsWhere<Detection> = {};

    if (filters.sourceType) {
      where.sourceType = filters.sourceType;
    }

    if (filters.satellite) {
      where.satellite = filters.satellite;
    }

    return this.detectionRepository.find({
      where,
      take: filters.limit,
      order: {
        acqDate: 'DESC',
        createdAt: 'DESC',
      },
    });
  }
}
