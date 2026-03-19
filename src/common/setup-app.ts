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

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    buildSwaggerConfig(),
  );
  SwaggerModule.setup(SWAGGER_PATH, app, swaggerDocument, {
    customSiteTitle: 'API Focos de Calor Docs',
    customCss: `
      .swagger-ui .download-contents {
        background: #60a5fa !important;
        border: 1px solid #60a5fa !important;
        color: #ffffff !important;
      }

      .swagger-ui .download-contents:hover {
        background: #93c5fd !important;
        border-color: #93c5fd !important;
        color: #ffffff !important;
      }

      .swagger-ui .response-col_links a {
        color: #60a5fa !important;
      }

      .swagger-ui .response-col_links a:hover {
        color: #93c5fd !important;
      }

      .swagger-ui .responses-inner a,
      .swagger-ui .responses-wrapper a,
      .swagger-ui .response-col_description a {
        color: #93c5fd !important;
        font-weight: 600 !important;
        text-decoration: underline !important;
      }

      .swagger-ui .responses-inner a:hover,
      .swagger-ui .responses-wrapper a:hover,
      .swagger-ui .response-col_description a:hover {
        color: #bfdbfe !important;
      }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
    },
  });
}
