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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_role_guard_1 = require("../../common/admin-role.guard");
const notification_service_1 = require("../notifications/notification.service");
const technicians_service_1 = require("../technicians/technicians.service");
const admin_access_guard_1 = require("./admin-access.guard");
const admin_service_1 = require("./admin.service");
const admin_dto_1 = require("./admin.dto");
let AdminController = class AdminController {
    constructor(service, technicians, notifications) {
        this.service = service;
        this.technicians = technicians;
        this.notifications = notifications;
    }
    dashboard() { return this.service.getDashboard(); }
    getMembers() { return this.service.getMembers(); }
    getMember(id) { return this.service.getMember(id); }
    createMember(dto) { return this.service.createMember(dto); }
    updateMember(id, dto) {
        return this.service.updateMember(id, dto);
    }
    deleteMember(id) {
        return this.service.deleteMember(id);
    }
    getSellers() { return this.service.getSellers(); }
    createSeller(dto) { return this.service.createSeller(dto); }
    updateSeller(id, dto) {
        return this.service.updateSeller(id, dto);
    }
    deleteSeller(id) {
        return this.service.deleteSeller(id);
    }
    getBookings() { return this.service.getBookings(); }
    createBooking(dto) { return this.service.createBooking(dto); }
    getBooking(id) { return this.service.getBooking(id); }
    assign(id, dto) {
        return this.service.assignTechnician(id, dto);
    }
    unassign(id) { return this.service.unassignTechnician(id); }
    updateStatus(id, dto) {
        return this.service.updateBookingStatus(id, dto);
    }
    updateBooking(id, dto) {
        return this.service.updateBooking(id, dto);
    }
    deleteBooking(id) {
        return this.service.deleteBooking(id);
    }
    getTechnicians() {
        return this.technicians.listAllBrief();
    }
    getOnboarding() {
        return this.technicians.getOnboardingRecords();
    }
    reviewOnboarding(id, dto) {
        return this.technicians.reviewOnboarding(id, dto);
    }
    updateOnboarding(id, dto) {
        return this.technicians.updateOnboardingRecord(id, dto);
    }
    deleteOnboarding(id) {
        return this.technicians.deleteOnboardingRecord(id);
    }
    createTechnician(dto) {
        return this.technicians.createByAdmin(dto);
    }
    updateTechnician(id, dto) {
        return this.technicians.updateByAdmin(id, dto);
    }
    deleteTechnician(id) {
        return this.technicians.deleteByAdmin(id);
    }
    getMaterials() {
        return this.service.getMaterials();
    }
    createMaterial(dto) {
        return this.service.createMaterial(dto);
    }
    updateMaterial(id, dto) {
        return this.service.updateMaterial(id, dto);
    }
    deleteMaterial(id) {
        return this.service.deleteMaterial(id);
    }
    getMaterialOrders() {
        return this.service.getMaterialPurchaseOrders();
    }
    updateMaterialOrder(id, dto) {
        return this.service.updateAdminMaterialPurchaseOrder(id, dto);
    }
    sellerPreviewSession(id) {
        return this.service.sellerPreviewSession(id);
    }
    technicianPreviewSession(id) {
        return this.service.technicianPreviewSession(id);
    }
    getPayments() { return this.service.getPayments(); }
    cancelPayment(id, dto, idempotencyKey) {
        return this.service.cancelPayment(id, dto, idempotencyKey);
    }
    getSettlements() { return this.service.getSettlements(); }
    confirmSettlement(req, id, dto, idempotencyKey) {
        return this.service.confirmSettlement(id, dto, idempotencyKey, {
            actor: req.adminSubject ?? 'admin',
            idempotencyKey,
        });
    }
    updateSettlementStatus(req, id, dto, idempotencyKey) {
        return this.service.updateSettlementStatus(id, dto, {
            actor: req.adminSubject ?? 'admin',
            idempotencyKey,
        });
    }
    deleteSettlement(req, id, idempotencyKey) {
        return this.service.deleteSettlement(id, {
            actor: req.adminSubject ?? 'admin',
            idempotencyKey,
        });
    }
    settlementEvents(orderId) {
        return this.service.listSettlementEvents(orderId);
    }
    getCoupons() { return this.service.getCoupons(); }
    createCoupon(dto) { return this.service.createCoupon(dto); }
    updateCoupon(id, dto) {
        return this.service.updateCoupon(id, dto);
    }
    deleteCoupon(id) {
        return this.service.deleteCoupon(id);
    }
    getLogs() { return this.service.getAdminLogs(); }
    getNotificationEvents() {
        return this.notifications.listEvents();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin', 'finance_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('members'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Get)('members/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getMember", null);
__decorate([
    (0, common_1.Post)('members'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateMemberDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createMember", null);
__decorate([
    (0, common_1.Patch)('members/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateMemberDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateMember", null);
__decorate([
    (0, common_1.Delete)('members/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteMember", null);
__decorate([
    (0, common_1.Get)('sellers'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getSellers", null);
__decorate([
    (0, common_1.Post)('sellers'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateSellerDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createSeller", null);
__decorate([
    (0, common_1.Patch)('sellers/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateSellerDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateSeller", null);
__decorate([
    (0, common_1.Delete)('sellers/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteSeller", null);
__decorate([
    (0, common_1.Get)('bookings'),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getBookings", null);
__decorate([
    (0, common_1.Post)('bookings'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateBookingDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Get)('bookings/:id'),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getBooking", null);
__decorate([
    (0, common_1.Post)('bookings/:id/assign-technician'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.AssignTechnicianDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)('bookings/:id/unassign-technician'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "unassign", null);
__decorate([
    (0, common_1.Patch)('bookings/:id/status'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateBookingStatusDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)('bookings/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateBookingDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateBooking", null);
__decorate([
    (0, common_1.Delete)('bookings/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteBooking", null);
__decorate([
    (0, common_1.Get)('technicians'),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getTechnicians", null);
__decorate([
    (0, common_1.Get)('technician-onboarding'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getOnboarding", null);
__decorate([
    (0, common_1.Post)('technician-onboarding/:id/review'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.ReviewOnboardingDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "reviewOnboarding", null);
__decorate([
    (0, common_1.Patch)('technician-onboarding/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateOnboardingDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateOnboarding", null);
__decorate([
    (0, common_1.Delete)('technician-onboarding/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteOnboarding", null);
__decorate([
    (0, common_1.Post)('technicians'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateTechnicianDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createTechnician", null);
__decorate([
    (0, common_1.Patch)('technicians/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateTechnicianDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateTechnician", null);
__decorate([
    (0, common_1.Delete)('technicians/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteTechnician", null);
__decorate([
    (0, common_1.Get)('materials'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getMaterials", null);
__decorate([
    (0, common_1.Post)('materials'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateMaterialDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createMaterial", null);
__decorate([
    (0, common_1.Patch)('materials/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateMaterialDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateMaterial", null);
__decorate([
    (0, common_1.Delete)('materials/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteMaterial", null);
__decorate([
    (0, common_1.Get)('material-orders'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getMaterialOrders", null);
__decorate([
    (0, common_1.Patch)('material-orders/:id'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateMaterialPurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateMaterialOrder", null);
__decorate([
    (0, common_1.Get)('sellers/:id/preview-session'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "sellerPreviewSession", null);
__decorate([
    (0, common_1.Get)('technicians/:id/preview-session'),
    (0, admin_role_guard_1.AdminRoles)('ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "technicianPreviewSession", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'finance_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPayments", null);
__decorate([
    (0, common_1.Post)('payments/:id/cancel'),
    (0, admin_role_guard_1.AdminRoles)('finance_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.CancelPaymentDto, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "cancelPayment", null);
__decorate([
    (0, common_1.Get)('settlements'),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'finance_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getSettlements", null);
__decorate([
    (0, common_1.Post)('settlements/:id/confirm'),
    (0, admin_role_guard_1.AdminRoles)('finance_admin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.ConfirmSettlementDto, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "confirmSettlement", null);
__decorate([
    (0, common_1.Patch)('settlements/:id/status'),
    (0, admin_role_guard_1.AdminRoles)('finance_admin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_dto_1.UpdateSettlementStatusDto, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateSettlementStatus", null);
__decorate([
    (0, common_1.Delete)('settlements/:id'),
    (0, admin_role_guard_1.AdminRoles)('finance_admin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteSettlement", null);
__decorate([
    (0, common_1.Get)('settlement-events'),
    (0, swagger_1.ApiOperation)({ summary: '정산 변경 감사(멱등키·액터 포함, Supabase DDL 필요)' }),
    (0, swagger_1.ApiQuery)({ name: 'orderId', required: false }),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'finance_admin'),
    __param(0, (0, common_1.Query)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "settlementEvents", null);
__decorate([
    (0, common_1.Get)('coupons'),
    (0, admin_role_guard_1.AdminRoles)('finance_admin', 'ops_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getCoupons", null);
__decorate([
    (0, common_1.Post)('coupons'),
    (0, admin_role_guard_1.AdminRoles)('finance_admin', 'ops_admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.CreateCouponDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createCoupon", null);
__decorate([
    (0, common_1.Patch)('coupons/:id'),
    (0, admin_role_guard_1.AdminRoles)('finance_admin', 'ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.UpdateCouponDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateCoupon", null);
__decorate([
    (0, common_1.Delete)('coupons/:id'),
    (0, admin_role_guard_1.AdminRoles)('finance_admin', 'ops_admin'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "deleteCoupon", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, admin_role_guard_1.AdminRoles)('super_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('notification-events'),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin', 'finance_admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getNotificationEvents", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, swagger_1.ApiSecurity)('admin-role'),
    (0, swagger_1.ApiHeader)({
        name: 'x-admin-role',
        required: false,
        description: 'JWT 미사용. role-only: dispatch_admin | ops_admin | finance_admin | super_admin',
    }),
    (0, common_1.UseGuards)(admin_access_guard_1.AdminAccessGuard, admin_role_guard_1.AdminRoleGuard),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        technicians_service_1.TechniciansService,
        notification_service_1.NotificationService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map