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
exports.ExtraQuotesAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_role_guard_1 = require("../../common/admin-role.guard");
const admin_access_guard_1 = require("../admin/admin-access.guard");
const extra_quotes_service_1 = require("./extra-quotes.service");
let ExtraQuotesAdminController = class ExtraQuotesAdminController {
    constructor(quotes) {
        this.quotes = quotes;
    }
    list(orderId) {
        return this.quotes.adminListQuotes(orderId);
    }
    approve(quoteId) {
        return this.quotes.adminCustomerApprove(quoteId);
    }
    reject(quoteId) {
        return this.quotes.adminReject(quoteId);
    }
    cancel(quoteId) {
        return this.quotes.adminCancel(quoteId);
    }
    mockPay(quoteId) {
        return this.quotes.adminMockPay(quoteId);
    }
};
exports.ExtraQuotesAdminController = ExtraQuotesAdminController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '추가금 견적 목록(Supabase)' }),
    (0, swagger_1.ApiQuery)({ name: 'orderId', required: false }),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin', 'finance_admin'),
    __param(0, (0, common_1.Query)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExtraQuotesAdminController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':quoteId/customer-approved'),
    (0, swagger_1.ApiOperation)({ summary: '고객 승인 처리(별도 문자/전화 검증 미포함 MVP)' }),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin', 'finance_admin'),
    __param(0, (0, common_1.Param)('quoteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExtraQuotesAdminController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':quoteId/reject'),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin', 'finance_admin'),
    __param(0, (0, common_1.Param)('quoteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExtraQuotesAdminController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':quoteId/cancel'),
    (0, admin_role_guard_1.AdminRoles)('dispatch_admin', 'ops_admin', 'finance_admin'),
    __param(0, (0, common_1.Param)('quoteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExtraQuotesAdminController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':quoteId/mock-record-payment'),
    (0, swagger_1.ApiOperation)({ summary: '모의 추가 결제 행 작성 + 견적 paid' }),
    (0, admin_role_guard_1.AdminRoles)('finance_admin'),
    __param(0, (0, common_1.Param)('quoteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExtraQuotesAdminController.prototype, "mockPay", null);
exports.ExtraQuotesAdminController = ExtraQuotesAdminController = __decorate([
    (0, swagger_1.ApiTags)('admin-extra-quotes'),
    (0, swagger_1.ApiSecurity)('admin-role'),
    (0, swagger_1.ApiHeader)({
        name: 'x-admin-role',
        required: false,
        description: 'role-only 모드: dispatch_admin | ops_admin | finance_admin | super_admin',
    }),
    (0, common_1.UseGuards)(admin_access_guard_1.AdminAccessGuard, admin_role_guard_1.AdminRoleGuard),
    (0, common_1.Controller)('admin/extra-quotes'),
    __metadata("design:paramtypes", [extra_quotes_service_1.ExtraQuotesService])
], ExtraQuotesAdminController);
//# sourceMappingURL=extra-quotes-admin.controller.js.map