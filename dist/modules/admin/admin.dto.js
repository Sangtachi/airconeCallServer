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
exports.CreateAdminInviteDto = exports.ReviewOnboardingDto = exports.UpdateCouponDto = exports.CreateCouponDto = exports.UpdateSettlementStatusDto = exports.ConfirmSettlementDto = exports.CancelPaymentDto = exports.UpdateOnboardingDto = exports.UpdateTechnicianDto = exports.UpdateBookingDto = exports.CreateBookingDto = exports.UpdateMaterialDto = exports.CreateMaterialDto = exports.UpdateSellerDto = exports.UpdateMemberDto = exports.CreateSellerDto = exports.RegisterSellerDto = exports.CreateOrderReviewDto = exports.UseCouponDto = exports.UpdateAirconAssetDto = exports.CreateAirconAssetDto = exports.UpdateMemberAddressDto = exports.CreateMemberAddressDto = exports.MemberSessionDto = exports.RegisterMemberDto = exports.CreateMemberDto = exports.CreateTechnicianDto = exports.UpdateBookingStatusDto = exports.AssignTechnicianDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AssignTechnicianDto {
}
exports.AssignTechnicianDto = AssignTechnicianDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignTechnicianDto.prototype, "technicianId", void 0);
class UpdateBookingStatusDto {
}
exports.UpdateBookingStatusDto = UpdateBookingStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsIn)([
        'created',
        'payment_pending',
        'paid',
        'matching',
        'assigned',
        'accepted',
        'on_the_way',
        'arrived',
        'diagnosed',
        'extra_payment_pending',
        'working',
        'completed',
        'cancelled',
        'refunded',
        'settlement_pending',
        'settled',
    ]),
    __metadata("design:type", String)
], UpdateBookingStatusDto.prototype, "toStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBookingStatusDto.prototype, "reason", void 0);
class CreateTechnicianDto {
}
exports.CreateTechnicianDto = CreateTechnicianDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTechnicianDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTechnicianDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: '관리자 생성 시 기사 초기 비밀번호' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CreateTechnicianDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTechnicianDto.prototype, "baseRegion", void 0);
class CreateMemberDto {
}
exports.CreateMemberDto = CreateMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: '관리자 생성 시 초기 비밀번호' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['customer', 'admin', 'super_admin'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['customer', 'admin', 'super_admin']),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "role", void 0);
class RegisterMemberDto {
}
exports.RegisterMemberDto = RegisterMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '전화번호. 숫자/하이픈 모두 허용' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterMemberDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '임시 자체 인증용 비밀번호. 추후 SMS/Supabase Auth로 교체' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], RegisterMemberDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RegisterMemberDto.prototype, "marketingConsent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: '긴급 리드 또는 주문 참조값' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterMemberDto.prototype, "bookingRef", void 0);
class MemberSessionDto {
}
exports.MemberSessionDto = MemberSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '전화번호. 숫자/하이픈 모두 허용' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MemberSessionDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '비밀번호' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], MemberSessionDto.prototype, "password", void 0);
class CreateMemberAddressDto {
}
exports.CreateMemberAddressDto = CreateMemberAddressDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], CreateMemberAddressDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberAddressDto.prototype, "detailAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberAddressDto.prototype, "sido", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberAddressDto.prototype, "sigungu", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberAddressDto.prototype, "dong", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMemberAddressDto.prototype, "isDefault", void 0);
class UpdateMemberAddressDto {
}
exports.UpdateMemberAddressDto = UpdateMemberAddressDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], UpdateMemberAddressDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMemberAddressDto.prototype, "detailAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMemberAddressDto.prototype, "sido", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMemberAddressDto.prototype, "sigungu", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMemberAddressDto.prototype, "dong", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateMemberAddressDto.prototype, "isDefault", void 0);
class CreateAirconAssetDto {
}
exports.CreateAirconAssetDto = CreateAirconAssetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAirconAssetDto.prototype, "addressId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['wall', 'stand', 'two_in_one', 'system', 'unknown'] }),
    (0, class_validator_1.IsIn)(['wall', 'stand', 'two_in_one', 'system', 'unknown']),
    __metadata("design:type", String)
], CreateAirconAssetDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAirconAssetDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAirconAssetDto.prototype, "modelName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1990),
    __metadata("design:type", Number)
], CreateAirconAssetDto.prototype, "installedYear", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAirconAssetDto.prototype, "memo", void 0);
class UpdateAirconAssetDto {
}
exports.UpdateAirconAssetDto = UpdateAirconAssetDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateAirconAssetDto.prototype, "addressId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['wall', 'stand', 'two_in_one', 'system', 'unknown'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['wall', 'stand', 'two_in_one', 'system', 'unknown']),
    __metadata("design:type", String)
], UpdateAirconAssetDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAirconAssetDto.prototype, "brand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAirconAssetDto.prototype, "modelName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1990),
    __metadata("design:type", Number)
], UpdateAirconAssetDto.prototype, "installedYear", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAirconAssetDto.prototype, "memo", void 0);
class UseCouponDto {
}
exports.UseCouponDto = UseCouponDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: '쿠폰을 특정 주문에 사용할 때 전달' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UseCouponDto.prototype, "orderId", void 0);
class CreateOrderReviewDto {
}
exports.CreateOrderReviewDto = CreateOrderReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 1, maximum: 5 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateOrderReviewDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderReviewDto.prototype, "comment", void 0);
class RegisterSellerDto {
}
exports.RegisterSellerDto = RegisterSellerDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSellerDto.prototype, "ownerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '전화번호. 숫자/하이픈 모두 허용' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSellerDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '임시 자체 인증용 비밀번호. 추후 SMS/Supabase Auth로 교체' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], RegisterSellerDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSellerDto.prototype, "companyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSellerDto.prototype, "businessNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterSellerDto.prototype, "productCategory", void 0);
class CreateSellerDto {
}
exports.CreateSellerDto = CreateSellerDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSellerDto.prototype, "ownerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '전화번호. 숫자/하이픈 모두 허용' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSellerDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '초기 비밀번호' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], CreateSellerDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSellerDto.prototype, "companyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSellerDto.prototype, "businessNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSellerDto.prototype, "productCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['pending', 'reviewing', 'approved', 'rejected', 'suspended'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['pending', 'reviewing', 'approved', 'rejected', 'suspended']),
    __metadata("design:type", String)
], CreateSellerDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSellerDto.prototype, "memo", void 0);
class UpdateMemberDto {
}
exports.UpdateMemberDto = UpdateMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['active', 'inactive', 'banned'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'inactive', 'banned']),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['customer', 'admin', 'super_admin'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['customer', 'admin', 'super_admin']),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: '비워두면 변경하지 않음' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateMemberDto.prototype, "marketingConsent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "memo", void 0);
class UpdateSellerDto {
}
exports.UpdateSellerDto = UpdateSellerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSellerDto.prototype, "ownerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSellerDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: '비워두면 변경하지 않음' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], UpdateSellerDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSellerDto.prototype, "companyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSellerDto.prototype, "businessNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSellerDto.prototype, "productCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['pending', 'reviewing', 'approved', 'rejected', 'suspended'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['pending', 'reviewing', 'approved', 'rejected', 'suspended']),
    __metadata("design:type", String)
], UpdateSellerDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSellerDto.prototype, "memo", void 0);
class CreateMaterialDto {
}
exports.CreateMaterialDto = CreateMaterialDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateMaterialDto.prototype, "customerPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateMaterialDto.prototype, "technicianCostAllowance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMaterialDto.prototype, "platformFeeRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMaterialDto.prototype, "supplierName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMaterialDto.prototype, "oemAvailable", void 0);
class UpdateMaterialDto {
}
exports.UpdateMaterialDto = UpdateMaterialDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaterialDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaterialDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaterialDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateMaterialDto.prototype, "customerPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateMaterialDto.prototype, "technicianCostAllowance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateMaterialDto.prototype, "platformFeeRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMaterialDto.prototype, "supplierName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateMaterialDto.prototype, "oemAvailable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateMaterialDto.prototype, "isActive", void 0);
class CreateBookingDto {
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "customerPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "symptomCode", void 0);
class UpdateBookingDto {
}
exports.UpdateBookingDto = UpdateBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "customerPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "symptomCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateBookingDto.prototype, "adminMemo", void 0);
class UpdateTechnicianDto {
}
exports.UpdateTechnicianDto = UpdateTechnicianDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTechnicianDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTechnicianDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: '비워두면 변경하지 않음' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], UpdateTechnicianDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTechnicianDto.prototype, "baseRegion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['pending', 'reviewing', 'approved', 'rejected', 'suspended'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['pending', 'reviewing', 'approved', 'rejected', 'suspended']),
    __metadata("design:type", String)
], UpdateTechnicianDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['unsubmitted', 'pending', 'verified', 'rejected'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['unsubmitted', 'pending', 'verified', 'rejected']),
    __metadata("design:type", String)
], UpdateTechnicianDto.prototype, "bankVerificationStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTechnicianDto.prototype, "bankRejectReason", void 0);
class UpdateOnboardingDto {
}
exports.UpdateOnboardingDto = UpdateOnboardingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOnboardingDto.prototype, "phone", void 0);
class CancelPaymentDto {
}
exports.CancelPaymentDto = CancelPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelPaymentDto.prototype, "reason", void 0);
class ConfirmSettlementDto {
}
exports.ConfirmSettlementDto = ConfirmSettlementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ConfirmSettlementDto.prototype, "adjustmentAmount", void 0);
class UpdateSettlementStatusDto {
}
exports.UpdateSettlementStatusDto = UpdateSettlementStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['pending', 'confirmed', 'paid', 'held', 'cancelled'] }),
    (0, class_validator_1.IsIn)(['pending', 'confirmed', 'paid', 'held', 'cancelled']),
    __metadata("design:type", String)
], UpdateSettlementStatusDto.prototype, "status", void 0);
class CreateCouponDto {
}
exports.CreateCouponDto = CreateCouponDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['signup', 'aircon_register', 'referral', 'manual'] }),
    (0, class_validator_1.IsIn)(['signup', 'aircon_register', 'referral', 'manual']),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "couponType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1000),
    __metadata("design:type", Number)
], CreateCouponDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCouponDto.prototype, "expiresAt", void 0);
class UpdateCouponDto {
}
exports.UpdateCouponDto = UpdateCouponDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['active', 'used', 'expired', 'cancelled'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'used', 'expired', 'cancelled']),
    __metadata("design:type", String)
], UpdateCouponDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCouponDto.prototype, "expiresAt", void 0);
class ReviewOnboardingDto {
}
exports.ReviewOnboardingDto = ReviewOnboardingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['reviewing', 'approved', 'rejected'] }),
    (0, class_validator_1.IsIn)(['reviewing', 'approved', 'rejected']),
    __metadata("design:type", String)
], ReviewOnboardingDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewOnboardingDto.prototype, "rejectReason", void 0);
class CreateAdminInviteDto {
}
exports.CreateAdminInviteDto = CreateAdminInviteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminInviteDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminInviteDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['dispatch_admin', 'ops_admin', 'finance_admin', 'super_admin'] }),
    (0, class_validator_1.IsIn)(['dispatch_admin', 'ops_admin', 'finance_admin', 'super_admin']),
    __metadata("design:type", String)
], CreateAdminInviteDto.prototype, "role", void 0);
//# sourceMappingURL=admin.dto.js.map