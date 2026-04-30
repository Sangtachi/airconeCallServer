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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAccessGuard = void 0;
const common_1 = require("@nestjs/common");
const admin_auth_service_1 = require("./admin-auth.service");
let AdminAccessGuard = class AdminAccessGuard {
    constructor(auth) {
        this.auth = auth;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const allowLegacyRaw = process.env.ADMIN_LEGACY_X_ADMIN_ROLE;
        const allowLegacy = allowLegacyRaw == null ||
            ['1', 'true', 'yes', 'on'].includes(String(allowLegacyRaw).trim().toLowerCase());
        const authHeader = String(req.headers['authorization'] ?? '');
        if (authHeader.toLowerCase().startsWith('bearer ')) {
            const payload = this.auth.verifyBearerToken(authHeader);
            req.adminRole = payload.role;
            req.adminSubject = payload.sub;
            return true;
        }
        if (allowLegacy) {
            const role = req.headers['x-admin-role'];
            if (role === 'admin' || role === 'super_admin') {
                req.adminRole = role;
                req.adminSubject = 'legacy-header';
                return true;
            }
        }
        throw new common_1.UnauthorizedException('Authorization: Bearer <JWT> 또는 허용된 x-admin-role 이 필요합니다.');
    }
};
exports.AdminAccessGuard = AdminAccessGuard;
exports.AdminAccessGuard = AdminAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [admin_auth_service_1.AdminAuthService])
], AdminAccessGuard);
//# sourceMappingURL=admin-access.guard.js.map