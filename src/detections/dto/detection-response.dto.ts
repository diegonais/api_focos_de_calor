import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';

import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { DetectionSourceType } from '../entities/detection.entity';

export class DetectionItemDto {
  @ApiProperty({ example: '0f7d0e6a-d4d2-4d70-96ab-c04c3a5807d1' })
  id!: string;

  @ApiProperty({
    enum: DetectionSourceType,
    example: DetectionSourceType.VIIRS,
  })
  source!: DetectionSourceType;

  @ApiProperty({ example: -16.489125 })
  latitude!: number;

  @ApiProperty({ example: -68.119293 })
  longitude!: number;

  @ApiProperty({ example: 1.023 })
  scan!: number;

  @ApiProperty({ example: 1.157 })
  track!: number;

  @ApiProperty({ example: '2026-03-16' })
  acqDate!: string;

  @ApiProperty({ example: 1435 })
  acqTime!: number;

  @ApiProperty({ example: 'NOAA-20' })
  satellite!: string;

  @ApiProperty({ example: 'VIIRS' })
  instrument!: string;

  @ApiProperty({ example: '85' })
  confidence!: string;

  @ApiProperty({ example: '2.0NRT' })
  version!: string;

  @ApiProperty({ example: 15.2 })
  frp!: number;

  @ApiProperty({ example: 'D', enum: ['D', 'N'] })
  daynight!: string;

  @ApiProperty({ example: '2026-03-16T15:42:11.310Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-03-16T15:42:11.310Z' })
  updatedAt!: string;
}

export class ViirsDetailDto {
  @ApiProperty({ example: '0f7d0e6a-d4d2-4d70-96ab-c04c3a5807d1' })
  id!: string;

  @ApiProperty({ example: 335.4 })
  brightTi4!: number;

  @ApiProperty({ example: 291.2 })
  brightTi5!: number;

  @ApiProperty({ example: '2026-03-16T15:42:11.310Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-03-16T15:42:11.310Z' })
  updatedAt!: string;
}

export class ModisDetailDto {
  @ApiProperty({ example: '0f7d0e6a-d4d2-4d70-96ab-c04c3a5807d1' })
  id!: string;

  @ApiProperty({ example: 343.1 })
  brightness!: number;

  @ApiProperty({ example: 295.7 })
  brightT31!: number;

  @ApiProperty({ example: '2026-03-16T15:42:11.310Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-03-16T15:42:11.310Z' })
  updatedAt!: string;
}

export class DetectionDetailDto extends DetectionItemDto {
  @ApiPropertyOptional({
    nullable: true,
    oneOf: [
      { $ref: getSchemaPath(ViirsDetailDto) },
      { $ref: getSchemaPath(ModisDetailDto) },
    ],
    description:
      'Detalle especifico segun la fuente de la deteccion. Sera VIIRS o MODIS.',
  })
  details!: ViirsDetailDto | ModisDetailDto | null;
}

export class SourceSummaryDto {
  @ApiProperty({
    enum: DetectionSourceType,
    example: DetectionSourceType.VIIRS,
  })
  source!: DetectionSourceType;

  @ApiProperty({ example: 94 })
  total!: number;
}

export class DetectionSummaryDto {
  @ApiProperty({ example: 150 })
  totalDetections!: number;

  @ApiProperty({ type: [SourceSummaryDto] })
  totalsBySource!: SourceSummaryDto[];

  @ApiPropertyOptional({
    example: 76.4,
    nullable: true,
    description:
      'Promedio calculado solo sobre registros cuya confianza puede convertirse a valor numerico.',
  })
  averageConfidence!: number | null;

  @ApiProperty({ example: 98 })
  numericConfidenceCount!: number;
}

class BaseSuccessResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Request completed successfully' })
  message!: string;
}

export class DetectionsListResponseDto extends BaseSuccessResponseDto {
  @ApiProperty({ type: [DetectionItemDto] })
  data!: DetectionItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class DetectionDetailResponseDto extends BaseSuccessResponseDto {
  @ApiProperty({ type: DetectionDetailDto })
  data!: DetectionDetailDto;
}

export class DetectionSummaryResponseDto extends BaseSuccessResponseDto {
  @ApiProperty({ type: DetectionSummaryDto })
  data!: DetectionSummaryDto;
}
