import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvironmentVariables } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<EnvironmentVariables>);
  const logger = new Logger('Bootstrap');
  const port = configService.getOrThrow<number>('PORT');

  await app.listen(port);
  logger.log(`API ejecutandose en el puerto ${port}`);
}
bootstrap();
