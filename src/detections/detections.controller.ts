import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CreateDetectionDto } from './dto/create-detection.dto';
import { FindDetectionsQueryDto } from './dto/find-detections-query.dto';
import { DetectionsService } from './detections.service';

@ApiTags('detections')
@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar detecciones' })
  @ApiOkResponse({
    description: 'Lista base de detecciones para futuras expansiones.',
  })
  findAll(@Query() query: FindDetectionsQueryDto) {
    return this.detectionsService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una deteccion base' })
  @ApiCreatedResponse({
    description: 'Deteccion creada correctamente.',
  })
  create(@Body() createDetectionDto: CreateDetectionDto) {
    return this.detectionsService.create(createDetectionDto);
  }
}
