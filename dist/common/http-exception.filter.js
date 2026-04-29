"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionEnvelopeFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionEnvelopeFilter = class HttpExceptionEnvelopeFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const err = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : 'Internal server error';
        response.status(status).json({
            ok: false,
            error: err,
            path: request.url,
            statusCode: status,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.HttpExceptionEnvelopeFilter = HttpExceptionEnvelopeFilter;
exports.HttpExceptionEnvelopeFilter = HttpExceptionEnvelopeFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionEnvelopeFilter);
//# sourceMappingURL=http-exception.filter.js.map