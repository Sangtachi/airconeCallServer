"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAccessGuard = void 0;
const common_1 = require("@nestjs/common");
let AdminAccessGuard = class AdminAccessGuard {
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const role = String(req.headers['x-admin-role'] ?? '').trim();
        if (role === 'admin' ||
            role === 'dispatch_admin' ||
            role === 'ops_admin' ||
            role === 'finance_admin' ||
            role === 'super_admin') {
            req.adminRole = role;
            req.adminSubject = 'x-admin-role';
            return true;
        }
        throw new common_1.UnauthorizedException('x-admin-role 헤더가 필요합니다. (allowed: dispatch_admin|ops_admin|finance_admin|super_admin)');
    }
};
exports.AdminAccessGuard = AdminAccessGuard;
exports.AdminAccessGuard = AdminAccessGuard = __decorate([
    (0, common_1.Injectable)()
], AdminAccessGuard);
//# sourceMappingURL=admin-access.guard.js.map