import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { DetectionSourceType } from '../entities/detection.entity';

function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class FindDetectionsQueryDto {
  @ApiPropertyOptional({
    enum: DetectionSourceType,
    example: DetectionSourceType.VIIRS,
    description: 'Fuente del dato satelital.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsEnum(DetectionSourceType)
  source?: DetectionSourceType;

  @ApiPropertyOptional({
    name: 'date_from',
    example: '2026-03-01',
    description: 'Fecha inicial inclusive en formato YYYY-MM-DD.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsDateString({ strict: true, strictSeparator: true })
  date_from?: string;

  @ApiPropertyOptional({
    name: 'date_to',
    example: '2026-03-16',
    description: 'Fecha final inclusive en formato YYYY-MM-DD.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsDateString({ strict: true, strictSeparator: true })
  date_to?: string;

  @ApiPropertyOptional({
    example: 'La Paz',
    description:
      'Reservado para futuras capas enriquecidas con informacion administrativa.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/\S/u)
  @Matches(/^[\p{L}\p{N}\s.'-]+$/u)
  department?: string;

  @ApiPropertyOptional({
    example: 'San Ignacio de Velasco',
    description:
      'Reservado para futuras capas enriquecidas con informacion administrativa.',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/\S/u)
  @Matches(/^[\p{L}\p{N}\s.'-]+$/u)
  municipality?: string;

  @ApiPropertyOptional({
    name: 'min_confidence',
    example: 70,
    minimum: 0,
    maximum: 100,
    description:
      'Filtra solo registros cuya confianza puede interpretarse como numerica y sea mayor o igual al umbral.',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  min_confidence?: number;

  @ApiPropertyOptional({ example: 'NOAA-20' })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/\S/u)
  satellite?: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
