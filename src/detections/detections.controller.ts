import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { DetectionIdParamDto } from './dto/detection-id-param.dto';
import {
  DetectionDetailResponseDto,
  DetectionsListResponseDto,
  DetectionSummaryResponseDto,
} from './dto/detection-response.dto';
import { FindDetectionsQueryDto } from './dto/find-detections-query.dto';
import { DetectionsService } from './detections.service';

@ApiTags('detections')
@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar detecciones con filtros y paginacion' })
  @ApiOkResponse({
    description: 'Listado paginado de detecciones.',
    type: DetectionsListResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Query params invalidos.' })
  findAll(@Query() query: FindDetectionsQueryDto) {
    return this.detectionsService.findAll(query);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Obtener un resumen agregado de detecciones' })
  @ApiOkResponse({
    description: 'Resumen agregado para el MVP.',
    type: DetectionSummaryResponseDto,
  })
  getSummary() {
    return this.detectionsService.getSummary();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una deteccion por su identificador' })
  @ApiOkResponse({
    description: 'Detalle de una deteccion.',
    type: DetectionDetailResponseDto,
  })
  @ApiBadRequestResponse({ description: 'El identificador es invalido.' })
  @ApiNotFoundResponse({ description: 'La deteccion no existe.' })
  findOne(@Param() params: DetectionIdParamDto) {
    return this.detectionsService.findOne(params.id);
  }
}
