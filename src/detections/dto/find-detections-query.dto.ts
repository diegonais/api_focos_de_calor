import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { DetectionSourceType } from '../entities/detection.entity';

export class FindDetectionsQueryDto {
  @ApiPropertyOptional({ enum: DetectionSourceType })
  @IsOptional()
  @IsEnum(DetectionSourceType)
  sourceType?: DetectionSourceType;

  @ApiPropertyOptional({ example: 'NOAA-20' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  satellite?: string;

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
