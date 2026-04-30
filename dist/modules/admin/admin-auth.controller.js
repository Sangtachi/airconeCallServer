"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_access_guard_1 = require("./admin-access.guard");
const admin_auth_dto_1 = require("./admin-auth.dto");
const admin_auth_service_1 = require("./admin-auth.service");
let AdminAuthController = class AdminAuthController {
    constructor(auth) {
        this.auth = auth;
    }
    login(dto) {
        if (!this.auth.bootstrapPassword()) {
            throw new common_1.ForbiddenException('ADMIN_BOOTSTRAP_PASSWORD 가 비어 있어 로그인을 비활성화했습니다.');
        }
        if (!this.auth.validateBootstrapPassword(dto.password)) {
            throw new common_1.ForbiddenException('비밀번호가 올바르지 않습니다.');
        }
        const role = dto.username === 'super_admin' ? 'super_admin' : 'admin';
        return this.auth.issueToken(role);
    }
    me(req) {
        return {
            subject: req.adminSubject ?? null,
            role: req.adminRole ?? null,
        };
    }
};
exports.AdminAuthController = AdminAuthController;
__decorate([
    (0, common_1.Post)('admin/auth/login'),
    (0, swagger_1.ApiOperation)({
        summary: '관리자 부트스트랩 로그인(JWT)',
        description: 'ADMIN_BOOTSTRAP_PASSWORD + ADMIN_JWT_SECRET(16자+) 설정 시 사용. 운영은 Supabase Auth 등으로 교체 권장.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_auth_dto_1.AdminLoginDto]),
    __metadata("design:returntype", void 0)
], AdminAuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('admin/auth/me'),
    (0, common_1.UseGuards)(admin_access_guard_1.AdminAccessGuard),
    (0, swagger_1.ApiOperation)({ summary: '현재 관리자 컨텍스트(레거시 헤더 또는 JWT)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminAuthController.prototype, "me", null);
exports.AdminAuthController = AdminAuthController = __decorate([
    (0, swagger_1.ApiTags)('admin-auth'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [admin_auth_service_1.AdminAuthService])
], AdminAuthController);
//# sourceMappingURL=admin-auth.controller.js.map