import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumberString,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { DetectionSourceType } from '../entities/detection.entity';

export class CreateDetectionDto {
  @ApiProperty({
    enum: DetectionSourceType,
    example: DetectionSourceType.VIIRS,
  })
  @IsEnum(DetectionSourceType)
  sourceType!: DetectionSourceType;

  @ApiProperty({ example: '12.345678' })
  @IsNumberString()
  latitude!: string;

  @ApiProperty({ example: '-68.123456' })
  @IsNumberString()
  longitude!: string;

  @ApiProperty({ example: '1.000' })
  @IsNumberString()
  scan!: string;

  @ApiProperty({ example: '1.100' })
  @IsNumberString()
  track!: string;

  @ApiProperty({ example: '2026-03-16' })
  @IsDateString()
  acqDate!: string;

  @ApiProperty({ example: 1435 })
  @IsInt()
  @Min(0)
  acqTime!: number;

  @ApiProperty({ example: 'NOAA-20' })
  @IsString()
  @MaxLength(20)
  satellite!: string;

  @ApiProperty({ example: 'VIIRS' })
  @IsString()
  @MaxLength(20)
  instrument!: string;

  @ApiProperty({ example: 'nominal' })
  @IsString()
  @MaxLength(20)
  confidence!: string;

  @ApiProperty({ example: '2.0NRT' })
  @IsString()
  @MaxLength(20)
  version!: string;

  @ApiProperty({ example: '15.200' })
  @IsNumberString()
  frp!: string;

  @ApiProperty({ example: 'D', enum: ['D', 'N'] })
  @IsIn(['D', 'N'])
  daynight!: string;
}
