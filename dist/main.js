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
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionEnvelopeFilter());
    app.useGlobalInterceptors(new response_envelope_interceptor_1.ResponseEnvelopeInterceptor());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Aircone Admin Backend (No Supabase)')
        .setDescription('Admin P0 API with in-memory adapters')
        .setVersion('0.1.0')
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