import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('API Focos de Calor')
    .setDescription(
      'API REST de consulta para focos de calor en Bolivia, documentada para consumo publico.',
    )
    .setVersion('1.0.0')
    .build();
}
