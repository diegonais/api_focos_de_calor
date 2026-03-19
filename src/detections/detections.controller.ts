import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { DetectionIdParamDto } from './dto/detection-id-param.dto';
import {
  DetectionDetailDto,
  DetectionDetailResponseDto,
  DetectionsListResponseDto,
  DetectionSummaryResponseDto,
  ModisDetailDto,
  ViirsDetailDto,
} from './dto/detection-response.dto';
import { FindDetectionsQueryDto } from './dto/find-detections-query.dto';
import { DetectionsService } from './detections.service';

@ApiTags('detections')
@ApiExtraModels(DetectionDetailDto, ViirsDetailDto, ModisDetailDto)
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

  @Get('export/excel')
  @ApiOperation({
    summary:
      'Descargar un archivo Excel con las tablas detections, viirs_details y modis_details',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOkResponse({
    description:
      'Archivo Excel con 3 hojas: detections, viirs_details y modis_details.',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  async exportExcel(@Res() res: Response) {
    const { fileName, fileContent } = await this.detectionsService.buildExcelExport();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fileContent);
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
