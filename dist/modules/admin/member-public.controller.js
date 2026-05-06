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
    constructor(admin) {
        this.admin = admin;
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
exports.MemberPublicController = MemberPublicController = __decorate([
    (0, swagger_1.ApiTags)('members-public'),
    (0, common_1.Controller)('members'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
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
exports.SellerPublicController = SellerPublicController = __decorate([
    (0, swagger_1.ApiTags)('sellers-public'),
    (0, common_1.Controller)('sellers'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], SellerPublicController);
//# sourceMappingURL=member-public.controller.js.map