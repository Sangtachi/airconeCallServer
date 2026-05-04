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
exports.EmergencyLeadsAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_role_guard_1 = require("../../common/admin-role.guard");
const admin_access_guard_1 = require("../admin/admin-access.guard");
const patch_emergency_lead_admin_dto_1 = require("./dto/patch-emergency-lead-admin.dto");
const list_emergency_leads_admin_query_dto_1 = require("./dto/list-emergency-leads-admin-query.dto");
const emergency_leads_service_1 = require("./emergency-leads.service");
let EmergencyLeadsAdminController = class EmergencyLeadsAdminController {
    constructor(leads) {
        this.leads = leads;
    }
    list(q) {
        return this.leads.listAdmin({
            matchingStatus: q.matchingStatus,
            fromIso: q.from ?? undefined,
            toIso: q.to ?? undefined,
        });
    }
    patch(id, dto) {
        return this.leads.patchAdmin(id, dto);
    }
};
exports.EmergencyLeadsAdminController = EmergencyLeadsAdminController;
__decorate([
    (0, common_1.Get)(),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_emergency_leads_admin_query_dto_1.ListEmergencyLeadsAdminQueryDto]),
    __metadata("design:returntype", void 0)
], EmergencyLeadsAdminController.prototype, "list", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe({ version: '4' }))),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_emergency_lead_admin_dto_1.PatchEmergencyLeadAdminDto]),
    __metadata("design:returntype", void 0)
], EmergencyLeadsAdminController.prototype, "patch", null);
exports.EmergencyLeadsAdminController = EmergencyLeadsAdminController = __decorate([
    (0, swagger_1.ApiTags)('admin-emergency-leads'),
    (0, swagger_1.ApiSecurity)('admin-role'),
    (0, swagger_1.ApiHeader)({ name: 'x-admin-role', required: false }),
    (0, common_1.UseGuards)(admin_access_guard_1.AdminAccessGuard, admin_role_guard_1.AdminRoleGuard),
    (0, common_1.Controller)('admin/emergency-leads'),
    __metadata("design:paramtypes", [emergency_leads_service_1.EmergencyLeadsService])
], EmergencyLeadsAdminController);
//# sourceMappingURL=emergency-leads-admin.controller.js.map