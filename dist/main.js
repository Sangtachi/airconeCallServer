"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/http-exception.filter");
const response_envelope_interceptor_1 = require("./common/response-envelope.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const corsDefault = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://airconecall.vercel.app',
    ].join(',');
    const corsRaw = process.env.CORS_ORIGIN?.trim();
    const corsList = (corsRaw && corsRaw.length > 0 ? corsRaw : corsDefault)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    app.enableCors({
        origin: corsList,
        credentials: true,
    });
    app.setGlobalPrefix('api', {
        exclude: [
            { path: '', method: common_1.RequestMethod.GET },
            { path: 'health', method: common_1.RequestMethod.GET },
        ],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionEnvelopeFilter());
    app.useGlobalInterceptors(new response_envelope_interceptor_1.ResponseEnvelopeInterceptor());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Aircone Call Backend')
        .setDescription('관리 JWT·추가금 견적·모의결제 등. ADMIN_LEGACY_X_ADMIN_ROLE 로 x-admin-role 폴백 가능.')
        .setVersion('0.2.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'admin-jwt')
        .addApiKey({ type: 'apiKey', in: 'header', name: 'x-admin-role' }, 'admin-role')
        .build();
    const doc = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, doc);
    const port = Number(process.env.PORT || 4000);
    await app.listen(port);
    console.log(`admin backend listening on :${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map