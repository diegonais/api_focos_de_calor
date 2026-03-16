import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { API_PREFIX, SWAGGER_PATH } from './common/constants/api.constants';
import { setupApp } from './common/setup-app';
import { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService<EnvironmentVariables>);
  const logger = new Logger('Bootstrap');
  const port = configService.getOrThrow<number>('PORT');

  setupApp(app);
  await app.listen(port);
  logger.log(`API ejecutandose en http://localhost:${port}/${API_PREFIX}`);
  logger.log(`Swagger disponible en http://localhost:${port}/${SWAGGER_PATH}`);
}

void bootstrap();
