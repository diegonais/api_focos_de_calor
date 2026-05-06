import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EnvironmentVariables } from '../config/env.validation';
import { getFirmsSettings } from './firms.config';
import { FirmsSource } from './firms.constants';
import { FirmsCsvRecord } from './firms.types';

@Injectable()
export class FirmsClient {
  private static readonly MAX_ERROR_DETAIL_LENGTH = 500;

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async fetchDetections(
    source: FirmsSource,
    dayRange: number,
    startDate?: string,
  ): Promise<FirmsCsvRecord[]> {
    const settings = getFirmsSettings(this.configService);
    const url = this.buildSourceUrl(
      settings.baseUrl,
      settings.mapKey,
      source,
      settings.bbox,
      dayRange,
      startDate,
    );
    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Accept: 'text/csv',
        },
        signal: AbortSignal.timeout(settings.requestTimeoutMs),
      });
    } catch (error) {
      throw new Error(
        `FIRMS request failed for ${source}: ${this.formatTransportError(error)}`,
      );
    }

    if (!response.ok) {
      const errorDetail = await this.readErrorDetail(response);
      const statusText = response.statusText ? ` ${response.statusText}` : '';
      const detailMessage = errorDetail ? `. Detail: ${errorDetail}` : '';

      throw new Error(
        `FIRMS request failed for ${source} with status ${response.status}${statusText}${detailMessage}`,
      );
    }

    const responseText = await response.text();

    return this.parseCsv(responseText);
  }

  private buildSourceUrl(
    baseUrl: string,
    mapKey: string,
    source: FirmsSource,
    bbox: string,
    dayRange: number,
    startDate?: string,
  ): string {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const basePath = `${normalizedBaseUrl}/${encodeURIComponent(mapKey)}/${encodeURIComponent(source)}/${bbox}/${dayRange}`;

    if (!startDate) {
      return basePath;
    }

    return `${basePath}/${startDate}`;
  }

  private async readErrorDetail(response: Response): Promise<string | null> {
    try {
      const responseText = await response.text();
      const normalizedDetail = responseText.replace(/\s+/g, ' ').trim();

      if (!normalizedDetail) {
        return null;
      }

      if (normalizedDetail.length <= FirmsClient.MAX_ERROR_DETAIL_LENGTH) {
        return normalizedDetail;
      }

      return `${normalizedDetail.slice(
        0,
        FirmsClient.MAX_ERROR_DETAIL_LENGTH,
      )}...`;
    } catch {
      return 'Could not read FIRMS error response body';
    }
  }

  private formatTransportError(error: unknown): string {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        return `request timeout (${error.message})`;
      }

      return `${error.name}: ${error.message}`;
    }

    return 'Unknown network error';
  }

  private parseCsv(csv: string): FirmsCsvRecord[] {
    const normalizedCsv = csv.replace(/^\uFEFF/, '').trim();

    if (!normalizedCsv) {
      return [];
    }

    const lines = normalizedCsv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length <= 1) {
      return [];
    }

    const headers = this.splitCsvLine(lines[0]).map((header) =>
      header.trim().toLowerCase(),
    );

    return lines.slice(1).map((line) => {
      const values = this.splitCsvLine(line);

      return headers.reduce<FirmsCsvRecord>((row, header, index) => {
        row[header] = (values[index] ?? '').trim();
        return row;
      }, {});
    });
  }

  private splitCsvLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let isInsideQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      const nextCharacter = line[index + 1];

      if (character === '"') {
        if (isInsideQuotes && nextCharacter === '"') {
          currentValue += '"';
          index += 1;
          continue;
        }

        isInsideQuotes = !isInsideQuotes;
        continue;
      }

      if (character === ',' && !isInsideQuotes) {
        values.push(currentValue);
        currentValue = '';
        continue;
      }

      currentValue += character;
    }

    values.push(currentValue);

    return values;
  }
}
