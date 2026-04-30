import 'reflect-metadata';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionEnvelopeFilter } from './common/http-exception.filter';
import { ResponseEnvelopeInterceptor } from './common/response-envelope.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173')
      .split(',')
      .map((s) => s.trim()),
    credentials: true,
  });
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionEnvelopeFilter());
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Aircone Call Backend')
    .setDescription('관리 JWT·추가금 견적·모의결제 등. ADMIN_LEGACY_X_ADMIN_ROLE 로 x-admin-role 폴백 가능.')
    .setVersion('0.2.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'admin-jwt')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-admin-role' }, 'admin-role')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`admin backend listening on :${port}`);
}

bootstrap();
