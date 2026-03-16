import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getStatus() {
    return {
      success: true,
      message: 'Service is healthy',
      data: {
        status: 'ok',
      },
    };
  }
}
