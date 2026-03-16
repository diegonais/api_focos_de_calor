import { Injectable } from '@nestjs/common';

import { CreateDetectionDto } from './dto/create-detection.dto';
import { FindDetectionsQueryDto } from './dto/find-detections-query.dto';
import { DetectionsRepository } from './detections.repository';

@Injectable()
export class DetectionsService {
  constructor(private readonly detectionsRepository: DetectionsRepository) {}

  async findAll(query: FindDetectionsQueryDto) {
    const items = await this.detectionsRepository.findAll(query);

    return {
      data: items,
      meta: {
        count: items.length,
        limit: query.limit,
      },
    };
  }

  async create(createDetectionDto: CreateDetectionDto) {
    const detection = this.detectionsRepository.createEntity(createDetectionDto);

    return this.detectionsRepository.save(detection);
  }
}
