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
    app.use((req, res, next) => {
        if (req.method === 'OPTIONS' &&
            String(req.headers['access-control-request-private-network']).toLowerCase() === 'true') {
            res.setHeader('Access-Control-Allow-Private-Network', 'true');
        }
        next();
    });
    const isProd = process.env.NODE_ENV === 'production';
    const localRelaxCors = ['1', 'true', 'yes', 'on'].includes(String(process.env.LOCAL_RELAX_CORS ?? '').trim().toLowerCase());
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
    const staticAllowList = isProd && !localRelaxCors
        ? envOrigins.length > 0
            ? [...envOrigins]
            : ['https://airconecall.vercel.app']
        : [
            ...new Set([
                ...localViteOrigins,
                ...(envOrigins.length > 0 ? envOrigins : ['https://airconecall.vercel.app']),
            ]),
        ];
    const localhostOriginOk = (origin) => {
        try {
            const u = new URL(origin);
            const h = u.hostname.toLowerCase();
            return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h === '::1';
        }
        catch {
            return false;
        }
    };
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
    const corsOriginSetting = !isProd
        ? true
        : localRelaxCors
            ? (origin, cb) => {
                if (!origin)
                    return cb(null, true);
                if (staticAllowList.includes(origin) || localhostOriginOk(origin))
                    return cb(null, true);
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
    const swaggerEnabled = process.env.ENABLE_SWAGGER === 'true';
    if (swaggerEnabled) {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Airconecall Backend')
            .setDescription('관리자 role-only 헤더(x-admin-role)·추가금 견적·모의결제 API')
            .setVersion('0.2.0')
            .addApiKey({ type: 'apiKey', in: 'header', name: 'x-admin-role' }, 'admin-role')
            .build();
        const doc = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, doc);
    }
    const port = Number(process.env.PORT || 4000);
    await app.listen(port);
    console.log(`admin backend listening on :${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map