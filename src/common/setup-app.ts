import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';

import { buildSwaggerConfig } from '../config/swagger.config';
import { API_PREFIX, SWAGGER_PATH } from './constants/api.constants';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

export function setupApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerDocument = SwaggerModule.createDocument(app, buildSwaggerConfig());
  SwaggerModule.setup(SWAGGER_PATH, app, swaggerDocument, {
    customSiteTitle: 'API Focos de Calor Docs',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });
}
