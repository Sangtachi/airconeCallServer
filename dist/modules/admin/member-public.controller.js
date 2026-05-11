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
exports.SellerPublicController = exports.MemberPublicController = exports.AuthPublicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notification_dto_1 = require("../notifications/notification.dto");
const notification_service_1 = require("../notifications/notification.service");
const admin_dto_1 = require("./admin.dto");
const admin_service_1 = require("./admin.service");
let AuthPublicController = class AuthPublicController {
    constructor(admin) {
        this.admin = admin;
    }
    session(dto) {
        return this.admin.unifiedSession(dto);
    }
};
exports.AuthPublicController = AuthPublicController;
__decorate([
    (0, common_1.Post)('session'),
    (0, swagger_1.ApiOperation)({ summary: '전화번호/비밀번호 통합 로그인: DB role 기준 대시보드 분기' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.MemberSessionDto]),
    __metadata("design:returntype", void 0)
], AuthPublicController.prototype, "session", null);
exports.AuthPublicController = AuthPublicController = __decorate([
    (0, swagger_1.ApiTags)('auth-public'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AuthPublicController);
let MemberPublicController = class MemberPublicController {
    constructor(admin, notifications) {
        this.admin = admin;
        this.notifications = notifications;
    }
    register(dto) {
        return this.admin.registerMember(dto);
    }
    session(dto) {
        return this.admin.memberSession(dto);
    }
    dashboard(id) {
        return this.admin.memberDashboard(id);
    }
    registerNotificationDevice(id, dto, userAgent) {
        return this.notifications.registerDevice('member', id, dto, userAgent);
    }
    orderExtraQuotes(id, orderId) {
        return this.admin.memberListOrderExtraQuotes(id, orderId);
    }
    approveAndPayExtraQuote(id, orderId, quoteId) {
        return this.admin.memberApproveAndMockPayExtraQuote(id, orderId, quoteId);
    }
    createAddress(id, dto) {
        return this.admin.createMemberAddress(id, dto);
    }
    updateAddress(id, addressId, dto) {
        return this.admin.updateMemberAddress(id, addressId, dto);
    }
    deleteAddress(id, addressId) {
        return this.admin.deleteMemberAddress(id, addressId);
    }
    createAsset(id, dto) {
        return this.admin.createAirconAsset(id, dto);
    }
    updateAsset(id, assetId, dto) {
        return this.admin.updateAirconAsset(id, assetId, dto);
    }
    deleteAsset(id, assetId) {
        return this.admin.deleteAirconAsset(id, assetId);
    }
    useCoupon(id, couponId, dto) {
        return this.admin.useMemberCoupon(id, couponId, dto);
    }
    reviewOrder(id, orderId, dto) {
        return this.admin.reviewMemberOrder(id, orderId, dto);
    }
};
exports.MemberPublicController = MemberPublicController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: '고객 회원 upsert + 가입 쿠폰 멱등 발급(Supabase)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.RegisterMemberDto]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('session'),
    (0, swagger_1.ApiOperation)({ summary: 'members 테이블 전화번호 기반 임시 로그인(Supabase)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.MemberSessionDto]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "session", null);
__decorate([
    (0, common_1.Get)(':id/dashboard'),
    (0, swagger_1.ApiOperation)({ summary: '고객 대시보드: 회원 정보, 쿠폰, 문의 목록(Supabase)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Post)(':id/notification-devices'),
    (0, swagger_1.ApiOperation)({ summary: '고객 Web Push 디바이스 등록(Supabase notification_devices)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('user-agent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, notification_dto_1.RegisterNotificationDeviceDto, String]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "registerNotificationDevice", null);
__decorate([
    (0, common_1.Get)(':id/orders/:orderId/extra-quotes'),
    (0, swagger_1.ApiOperation)({ summary: '고객 주문 추가금 명세서 목록' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "orderExtraQuotes", null);
__decorate([
    (0, common_1.Post)(':id/orders/:orderId/extra-quotes/:quoteId/approve-and-pay'),
    (0, swagger_1.ApiOperation)({ summary: '고객 추가금 승인 + 모의 결제 기록' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Param)('quoteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "approveAndPayExtraQuote", null);
__decorate([
    (0, common_1.Post)(':id/addresses'),
    (0, swagger_1.ApiOperation)({ summary: '고객 주소 등록(Supabase)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.CreateMemberAddressDto]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "createAddress", null);
__decorate([
    (0, common_1.Patch)(':id/addresses/:addressId'),
    (0, swagger_1.ApiOperation)({ summary: '고객 주소 수정(Supabase)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('addressId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, admin_dto_1.UpdateMemberAddressDto]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "updateAddress", null);
__decorate([
    (0, common_1.Delete)(':id/addresses/:addressId'),
    (0, swagger_1.ApiOperation)({ summary: '고객 주소 삭제(Supabase)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('addressId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "deleteAddress", null);
__decorate([
    (0, common_1.Post)(':id/assets'),
    (0, swagger_1.ApiOperation)({ summary: '고객 에어컨 자산 등록(Supabase)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.CreateAirconAssetDto]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "createAsset", null);
__decorate([
    (0, common_1.Patch)(':id/assets/:assetId'),
    (0, swagger_1.ApiOperation)({ summary: '고객 에어컨 자산 수정(Supabase)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('assetId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, admin_dto_1.UpdateAirconAssetDto]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "updateAsset", null);
__decorate([
    (0, common_1.Delete)(':id/assets/:assetId'),
    (0, swagger_1.ApiOperation)({ summary: '고객 에어컨 자산 삭제(Supabase)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('assetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "deleteAsset", null);
__decorate([
    (0, common_1.Post)(':id/coupons/:couponId/use'),
    (0, swagger_1.ApiOperation)({ summary: '고객 쿠폰 사용 처리 + 리워드 로그(Supabase)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('couponId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, admin_dto_1.UseCouponDto]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "useCoupon", null);
__decorate([
    (0, common_1.Post)(':id/orders/:orderId/review'),
    (0, swagger_1.ApiOperation)({ summary: '고객 주문 리뷰 등록/수정(Supabase)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, admin_dto_1.CreateOrderReviewDto]),
    __metadata("design:returntype", void 0)
], MemberPublicController.prototype, "reviewOrder", null);
exports.MemberPublicController = MemberPublicController = __decorate([
    (0, swagger_1.ApiTags)('members-public'),
    (0, common_1.Controller)('members'),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        notification_service_1.NotificationService])
], MemberPublicController);
let SellerPublicController = class SellerPublicController {
    constructor(admin) {
        this.admin = admin;
    }
    register(dto) {
        return this.admin.registerSeller(dto);
    }
    session(dto) {
        return this.admin.sellerSession(dto);
    }
    dashboard(id) {
        return this.admin.sellerDashboard(id);
    }
    materials(id) {
        return this.admin.sellerMaterials(id);
    }
    createMaterial(id, dto) {
        return this.admin.createSellerMaterial(id, dto);
    }
    updateMaterial(id, materialId, dto) {
        return this.admin.updateSellerMaterial(id, materialId, dto);
    }
    deleteMaterial(id, materialId) {
        return this.admin.deleteSellerMaterial(id, materialId);
    }
    materialOrders(id) {
        return this.admin.sellerMaterialOrders(id);
    }
    updateMaterialOrder(id, orderId, dto) {
        return this.admin.updateSellerMaterialPurchaseOrder(id, orderId, dto);
    }
};
exports.SellerPublicController = SellerPublicController;
__decorate([
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: '판매자 신청 upsert(Supabase)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.RegisterSellerDto]),
    __metadata("design:returntype", void 0)
], SellerPublicController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('session'),
    (0, swagger_1.ApiOperation)({ summary: '판매자 전화번호 기반 임시 로그인(Supabase)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_dto_1.MemberSessionDto]),
    __metadata("design:returntype", void 0)
], SellerPublicController.prototype, "session", null);
__decorate([
    (0, common_1.Get)(':id/dashboard'),
    (0, swagger_1.ApiOperation)({ summary: '판매자 대시보드: 판매자 신청/검토 상태(Supabase)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SellerPublicController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)(':id/materials'),
    (0, swagger_1.ApiOperation)({ summary: '판매자 자재/공급가 목록(Supabase materials)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SellerPublicController.prototype, "materials", null);
__decorate([
    (0, common_1.Post)(':id/materials'),
    (0, swagger_1.ApiOperation)({ summary: '판매자 자재/공급가 등록(Supabase materials)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_dto_1.CreateMaterialDto]),
    __metadata("design:returntype", void 0)
], SellerPublicController.prototype, "createMaterial", null);
__decorate([
    (0, common_1.Patch)(':id/materials/:materialId'),
    (0, swagger_1.ApiOperation)({ summary: '판매자 자재/공급가 수정(Supabase materials)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('materialId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, admin_dto_1.UpdateMaterialDto]),
    __metadata("design:returntype", void 0)
], SellerPublicController.prototype, "updateMaterial", null);
__decorate([
    (0, common_1.Delete)(':id/materials/:materialId'),
    (0, swagger_1.ApiOperation)({ summary: '판매자 자재/공급가 비활성화(Supabase materials)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('materialId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SellerPublicController.prototype, "deleteMaterial", null);
__decorate([
    (0, common_1.Get)(':id/material-orders'),
    (0, swagger_1.ApiOperation)({ summary: '판매자 자재 구매요청 목록(Supabase material_purchase_orders)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SellerPublicController.prototype, "materialOrders", null);
__decorate([
    (0, common_1.Patch)(':id/material-orders/:orderId'),
    (0, swagger_1.ApiOperation)({ summary: '판매자 자재 구매요청 상태 변경(Supabase material_purchase_orders)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('orderId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, admin_dto_1.UpdateMaterialPurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], SellerPublicController.prototype, "updateMaterialOrder", null);
exports.SellerPublicController = SellerPublicController = __decorate([
    (0, swagger_1.ApiTags)('sellers-public'),
    (0, common_1.Controller)('sellers'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], SellerPublicController);
//# sourceMappingURL=member-public.controller.js.map