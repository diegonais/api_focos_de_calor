import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getStatus() {
    return {
      status: 'ok',
      service: 'api_focos_de_calor',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
    };
  }
}
