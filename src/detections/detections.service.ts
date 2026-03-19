import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Workbook } from 'exceljs';

import { FindDetectionsQueryDto } from './dto/find-detections-query.dto';
import {
  DetectionsRepository,
  ExcelExportDataset,
} from './detections.repository';
import { Detection, DetectionSourceType } from './entities/detection.entity';

type ExcelColumn = {
  header: string;
  key: string;
  width: number;
};

const EXPORT_TIMEZONE = 'America/La_Paz';

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
      data: items.map((item) => this.mapDetectionItem(item)),
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
      data: this.mapDetectionDetail(detection),
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

  async buildExcelExport(): Promise<{ fileName: string; fileContent: Buffer }> {
    const dataset = await this.detectionsRepository.findAllForExcelExport();
    const workbook = new Workbook();

    workbook.creator = 'api_focos_de_calor';
    workbook.created = new Date();

    this.addSheet(
      workbook,
      'detections',
      [
        { header: 'id', key: 'id', width: 38 },
        { header: 'source_type', key: 'source_type', width: 14 },
        { header: 'latitude', key: 'latitude', width: 14 },
        { header: 'longitude', key: 'longitude', width: 14 },
        { header: 'scan', key: 'scan', width: 10 },
        { header: 'track', key: 'track', width: 10 },
        { header: 'acq_date', key: 'acq_date', width: 12 },
        { header: 'acq_time', key: 'acq_time', width: 10 },
        { header: 'satellite', key: 'satellite', width: 12 },
        { header: 'instrument', key: 'instrument', width: 14 },
        { header: 'confidence', key: 'confidence', width: 12 },
        { header: 'version', key: 'version', width: 10 },
        { header: 'frp', key: 'frp', width: 10 },
        { header: 'daynight', key: 'daynight', width: 10 },
        { header: 'dedupe_key', key: 'dedupe_key', width: 66 },
        { header: 'created_at', key: 'created_at', width: 28 },
        { header: 'updated_at', key: 'updated_at', width: 28 },
      ],
      dataset.detections,
    );

    this.addSheet(
      workbook,
      'viirs_details',
      [
        { header: 'id', key: 'id', width: 38 },
        { header: 'detection_id', key: 'detection_id', width: 38 },
        { header: 'bright_ti4', key: 'bright_ti4', width: 12 },
        { header: 'bright_ti5', key: 'bright_ti5', width: 12 },
        { header: 'created_at', key: 'created_at', width: 28 },
        { header: 'updated_at', key: 'updated_at', width: 28 },
      ],
      dataset.viirsDetails,
    );

    this.addSheet(
      workbook,
      'modis_details',
      [
        { header: 'id', key: 'id', width: 38 },
        { header: 'detection_id', key: 'detection_id', width: 38 },
        { header: 'brightness', key: 'brightness', width: 12 },
        { header: 'bright_t31', key: 'bright_t31', width: 12 },
        { header: 'created_at', key: 'created_at', width: 28 },
        { header: 'updated_at', key: 'updated_at', width: 28 },
      ],
      dataset.modisDetails,
    );

    const fileName = `detections_export_${this.getLaPazTimestampForFilename()}.xlsx`;
    const workbookBuffer = await workbook.xlsx.writeBuffer();
    const fileContent = Buffer.isBuffer(workbookBuffer)
      ? workbookBuffer
      : Buffer.from(workbookBuffer);

    return { fileName, fileContent };
  }

  private validateDateRange(query: FindDetectionsQueryDto): void {
    if (!query.date_from || !query.date_to) {
      return;
    }

    if (query.date_from > query.date_to) {
      throw new BadRequestException('date_from cannot be greater than date_to');
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

  private mapDetectionItem(detection: Detection) {
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

  private mapDetectionDetail(detection: Detection) {
    return {
      ...this.mapDetectionItem(detection),
      details: this.mapDetectionSourceDetail(detection),
    };
  }

  private mapDetectionSourceDetail(detection: Detection) {
    if (
      detection.sourceType === DetectionSourceType.VIIRS &&
      detection.viirsDetail
    ) {
      return {
        id: detection.viirsDetail.id,
        brightTi4: this.toNumber(detection.viirsDetail.brightTi4),
        brightTi5: this.toNumber(detection.viirsDetail.brightTi5),
        createdAt: detection.viirsDetail.createdAt.toISOString(),
        updatedAt: detection.viirsDetail.updatedAt.toISOString(),
      };
    }

    if (
      detection.sourceType === DetectionSourceType.MODIS &&
      detection.modisDetail
    ) {
      return {
        id: detection.modisDetail.id,
        brightness: this.toNumber(detection.modisDetail.brightness),
        brightT31: this.toNumber(detection.modisDetail.brightT31),
        createdAt: detection.modisDetail.createdAt.toISOString(),
        updatedAt: detection.modisDetail.updatedAt.toISOString(),
      };
    }

    if (detection.viirsDetail) {
      return {
        id: detection.viirsDetail.id,
        brightTi4: this.toNumber(detection.viirsDetail.brightTi4),
        brightTi5: this.toNumber(detection.viirsDetail.brightTi5),
        createdAt: detection.viirsDetail.createdAt.toISOString(),
        updatedAt: detection.viirsDetail.updatedAt.toISOString(),
      };
    }

    if (detection.modisDetail) {
      return {
        id: detection.modisDetail.id,
        brightness: this.toNumber(detection.modisDetail.brightness),
        brightT31: this.toNumber(detection.modisDetail.brightT31),
        createdAt: detection.modisDetail.createdAt.toISOString(),
        updatedAt: detection.modisDetail.updatedAt.toISOString(),
      };
    }

    return null;
  }

  private addSheet(
    workbook: Workbook,
    sheetName: string,
    columns: ExcelColumn[],
    rows: ExcelExportDataset[keyof ExcelExportDataset],
  ): void {
    const worksheet = workbook.addWorksheet(sheetName);
    worksheet.columns = columns;
    worksheet.addRows(rows as Record<string, unknown>[]);

    const headerRow = worksheet.getRow(1);
    headerRow.font = {
      bold: true,
      color: { argb: 'FF4B5563' },
      name: 'Calibri',
      size: 11,
    };
    headerRow.alignment = { vertical: 'middle' };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    };

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return;
      }

      row.eachCell((cell) => {
        cell.font = {
          color: { argb: 'FF6B7280' },
          name: 'Calibri',
          size: 11,
        };
      });
    });

    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = {
      from: 'A1',
      to: `${this.getExcelColumnName(columns.length)}1`,
    };
  }

  private getExcelColumnName(index: number): string {
    let columnNumber = index;
    let columnName = '';

    while (columnNumber > 0) {
      const modulo = (columnNumber - 1) % 26;
      columnName = String.fromCharCode(65 + modulo) + columnName;
      columnNumber = Math.floor((columnNumber - modulo) / 26);
    }

    return columnName;
  }

  private getLaPazTimestampForFilename(): string {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: EXPORT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const partMap = new Map(parts.map((part) => [part.type, part.value]));

    return `${partMap.get('year')}-${partMap.get('month')}-${partMap.get('day')}_${partMap.get('hour')}-${partMap.get('minute')}-${partMap.get('second')}`;
  }

  private toNumber(value: string): number {
    return Number(value);
  }
}
