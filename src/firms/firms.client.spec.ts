import { ConfigService } from '@nestjs/config';

import { FirmsClient } from './firms.client';
import { FirmsSource } from './firms.constants';

describe('FirmsClient', () => {
  const settings = {
    FIRMS_MAP_KEY: 'test-map-key',
    FIRMS_BASE_URL: 'https://firms.example.test/api/area/csv',
    FIRMS_BBOX: '-69.8,-22.9,-57.4,-9.6',
    FIRMS_REQUEST_TIMEOUT_MS: 15000,
  };

  const createClient = () => {
    const configService = {
      getOrThrow: jest.fn((key: keyof typeof settings) => settings[key]),
    } as unknown as ConfigService;

    return new FirmsClient(configService);
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('includes the FIRMS response body when the request fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: jest.fn().mockResolvedValue('Invalid MAP_KEY.\n'),
    } as unknown as Response);

    await expect(
      createClient().fetchDetections(FirmsSource.VIIRS_SNPP_NRT, 1),
    ).rejects.toThrow(
      'FIRMS request failed for VIIRS_SNPP_NRT with status 400 Bad Request. Detail: Invalid MAP_KEY.',
    );
  });

  it('identifies transport failures separately from HTTP responses', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new TypeError('fetch failed'));

    await expect(
      createClient().fetchDetections(FirmsSource.MODIS_NRT, 1),
    ).rejects.toThrow(
      'FIRMS request failed for MODIS_NRT: TypeError: fetch failed',
    );
  });
});
