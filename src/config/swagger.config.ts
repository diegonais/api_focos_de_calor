import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('API Focos de Calor')
    .setDescription(
      'Base profesional del backend en NestJS para la gestion de focos de calor.',
    )
    .setVersion('1.0.0')
    .build();
}
