import 'reflect-metadata';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionEnvelopeFilter } from './common/http-exception.filter';
import { ResponseEnvelopeInterceptor } from './common/response-envelope.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Chrome 등: localhost → 로컬 API 프리플라이트에 필요할 수 있음
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.method === 'OPTIONS' &&
      String(req.headers['access-control-request-private-network']).toLowerCase() === 'true'
    ) {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
  });

  const isProd = process.env.NODE_ENV === 'production';
  /** 로컬에서 Nest 만 `NODE_ENV=production` 로 띄운 경우 OPTIONS(POST+json) 에 ACAO 없으면 크롬이 막음 */
  const localRelaxCors = ['1', 'true', 'yes', 'on'].includes(
    String(process.env.LOCAL_RELAX_CORS ?? '').trim().toLowerCase(),
  );

  const corsRaw = process.env.CORS_ORIGIN?.trim();
  const envOrigins = corsRaw
    ? corsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const localViteOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://[::1]:5173',
  ];

  /**
   * 프로덕션(+LOCAL_RELAX_CORS 미사용): CORS_ORIGIN 또는 Vercel 기본만 허용.
   * LOCAL_RELAX: 로컬 Vite 목록과 env 목록 합류(5173 빠져도 패턴 허용).
   * 비프로덕션: `origin: true` — 어떤 Vite 포트·POST=json 프리플라이트도 통과.
   */
  const staticAllowList: string[] =
    isProd && !localRelaxCors
      ? envOrigins.length > 0
        ? [...envOrigins]
        : ['https://acnow.vercel.app']
      : [
          ...new Set([
            ...localViteOrigins,
            ...(envOrigins.length > 0 ? envOrigins : ['https://acnow.vercel.app']),
          ]),
        ];

  const localhostOriginOk = (origin: string): boolean => {
    try {
      const u = new URL(origin);
      const h = u.hostname.toLowerCase();
      return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
    } catch {
      return false;
    }
  };

  /** POST·PATCH 시 Content-Type 과 커스텀 헤더 프리플라이트 허용 */
  const corsAllowedHeaders = [
    'Content-Type',
    'Authorization',
    'x-admin-role',
    'x-technician-id',
    'idempotency-key',
    'accept',
    'origin',
    'access-control-request-method',
    'access-control-request-headers',
  ];

  const corsOriginSetting:
    | true
    | string[]
    | ((
        origin: string | undefined,
        cb: (err: Error | null, allow?: boolean) => void,
      ) => void) = !isProd
    ? true
    : localRelaxCors
      ? (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
          if (!origin) return cb(null, true);
          if (staticAllowList.includes(origin) || localhostOriginOk(origin)) return cb(null, true);
          cb(null, false);
        }
      : staticAllowList;

  app.enableCors({
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: corsAllowedHeaders,
    origin: corsOriginSetting,
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

  const swaggerEnabled = process.env.ENABLE_SWAGGER === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Living Bridge ACnow Management API')
      .setDescription('리빙브릿지의 ACnow 관리 API · 관리자 role-only 헤더(x-admin-role)·추가금 견적·모의결제')
      .setVersion('0.2.0')
      .addApiKey({ type: 'apiKey', in: 'header', name: 'x-admin-role' }, 'admin-role')
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, doc);
  }

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`admin backend listening on :${port}`);
}

bootstrap();
