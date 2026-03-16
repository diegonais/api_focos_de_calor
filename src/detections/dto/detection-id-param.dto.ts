import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DetectionIdParamDto {
  @ApiProperty({
    example: '0f7d0e6a-d4d2-4d70-96ab-c04c3a5807d1',
    description:
      'Identificador UUID de la deteccion. Se conserva este formato por compatibilidad con el esquema actual.',
  })
  @IsUUID()
  id!: string;
}
