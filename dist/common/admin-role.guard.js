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
exports.AdminRoleGuard = exports.AdminRoles = exports.ADMIN_ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
exports.ADMIN_ROLES_KEY = 'admin_roles';
const AdminRoles = (...roles) => (0, common_1.SetMetadata)(exports.ADMIN_ROLES_KEY, roles);
exports.AdminRoles = AdminRoles;
function normalizeRole(role) {
    if (!role)
        return null;
    if (role === 'admin')
        return 'dispatch_admin';
    return role;
}
let AdminRoleGuard = class AdminRoleGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const required = this.reflector.getAllAndOverride(exports.ADMIN_ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required || required.length === 0)
            return true;
        const req = context.switchToHttp().getRequest();
        const role = normalizeRole(req.adminRole ?? null);
        if (!role) {
            throw new common_1.ForbiddenException('관리자 role 정보가 없습니다.');
        }
        if (role === 'super_admin' || required.includes(role))
            return true;
        throw new common_1.ForbiddenException(`권한 부족: required=${required.join(',')} current=${role}`);
    }
};
exports.AdminRoleGuard = AdminRoleGuard;
exports.AdminRoleGuard = AdminRoleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], AdminRoleGuard);
//# sourceMappingURL=admin-role.guard.js.map