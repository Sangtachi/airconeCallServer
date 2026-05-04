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
exports.CustomerOrdersAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_role_guard_1 = require("../../common/admin-role.guard");
const admin_access_guard_1 = require("../admin/admin-access.guard");
const patch_install_order_admin_dto_1 = require("./dto/patch-install-order-admin.dto");
const orders_service_1 = require("./orders.service");
let CustomerOrdersAdminController = class CustomerOrdersAdminController {
    constructor(orders) {
        this.orders = orders;
    }
    async list() {
        return this.orders.listOrders();
    }
    async getOne(id) {
        return this.orders.getOrder(id);
    }
    async patch(id, dto) {
        return this.orders.patchAdmin(id, dto);
    }
};
exports.CustomerOrdersAdminController = CustomerOrdersAdminController;
__decorate([
    (0, common_1.Get)(),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin', 'finance_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CustomerOrdersAdminController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin', 'finance_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerOrdersAdminController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin', 'finance_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_install_order_admin_dto_1.PatchInstallOrderAdminDto]),
    __metadata("design:returntype", Promise)
], CustomerOrdersAdminController.prototype, "patch", null);
exports.CustomerOrdersAdminController = CustomerOrdersAdminController = __decorate([
    (0, swagger_1.ApiTags)('admin-customer-orders'),
    (0, swagger_1.ApiSecurity)('admin-role'),
    (0, swagger_1.ApiHeader)({ name: 'x-admin-role', required: false }),
    (0, common_1.UseGuards)(admin_access_guard_1.AdminAccessGuard, admin_role_guard_1.AdminRoleGuard),
    (0, common_1.Controller)('admin/customer-orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], CustomerOrdersAdminController);
//# sourceMappingURL=customer-orders-admin.controller.js.map