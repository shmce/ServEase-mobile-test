import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { GatewayModule } from './gateway.module.js';
import { ensureKafkaTopics } from '@app/common';
import { RpcToHttpExceptionFilter } from './filters/rpc-exception.filter.js';

async function bootstrap() {
  await ensureKafkaTopics();
  const app = await NestFactory.create(GatewayModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new RpcToHttpExceptionFilter(httpAdapter));

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`ServEase Gateway is running on http://localhost:${port}`);
}
bootstrap();
