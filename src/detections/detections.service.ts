import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { FindDetectionsQueryDto } from './dto/find-detections-query.dto';
import { DetectionsRepository } from './detections.repository';
import { Detection } from './entities/detection.entity';

@Injectable()
export class DetectionsService {
  constructor(private readonly detectionsRepository: DetectionsRepository) {}

  async findAll(query: FindDetectionsQueryDto) {
    this.validateDateRange(query);
    this.validateAdministrativeFilters(query);

    const { items, total } = await this.detectionsRepository.findAll(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      success: true,
      message: 'Detections retrieved successfully',
      data: items.map((item) => this.mapDetection(item)),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const detection = await this.detectionsRepository.findOneById(id);

    if (!detection) {
      throw new NotFoundException('Detection not found');
    }

    return {
      success: true,
      message: 'Detection retrieved successfully',
      data: this.mapDetection(detection),
    };
  }

  async getSummary() {
    const summary = await this.detectionsRepository.getSummary();

    return {
      success: true,
      message: 'Detection summary retrieved successfully',
      data: summary,
    };
  }

  private validateDateRange(query: FindDetectionsQueryDto): void {
    if (!query.date_from || !query.date_to) {
      return;
    }

    if (query.date_from > query.date_to) {
      throw new BadRequestException(
        'date_from cannot be greater than date_to',
      );
    }
  }

  private validateAdministrativeFilters(query: FindDetectionsQueryDto): void {
    if (!query.department && !query.municipality) {
      return;
    }

    throw new BadRequestException(
      'Filtering by department or municipality is not available with the current detections schema',
    );
  }

  private mapDetection(detection: Detection) {
    return {
      id: detection.id,
      source: detection.sourceType,
      latitude: this.toNumber(detection.latitude),
      longitude: this.toNumber(detection.longitude),
      scan: this.toNumber(detection.scan),
      track: this.toNumber(detection.track),
      acqDate: detection.acqDate,
      acqTime: detection.acqTime,
      satellite: detection.satellite,
      instrument: detection.instrument,
      confidence: detection.confidence,
      version: detection.version,
      frp: this.toNumber(detection.frp),
      daynight: detection.daynight,
      createdAt: detection.createdAt.toISOString(),
      updatedAt: detection.updatedAt.toISOString(),
    };
  }

  private toNumber(value: string): number {
    return Number(value);
  }
}
