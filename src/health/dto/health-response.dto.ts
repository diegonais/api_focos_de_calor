import { ApiProperty } from '@nestjs/swagger';

export class HealthStatusDto {
  @ApiProperty({ example: 'ok' })
  status!: string;
}

export class HealthResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Service is healthy' })
  message!: string;

  @ApiProperty({ type: HealthStatusDto })
  data!: HealthStatusDto;
}
