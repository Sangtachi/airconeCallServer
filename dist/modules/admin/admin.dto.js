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
exports.ReviewOnboardingDto = exports.UpdateCouponDto = exports.CreateCouponDto = exports.UpdateSettlementStatusDto = exports.ConfirmSettlementDto = exports.CancelPaymentDto = exports.UpdateTechnicianDto = exports.CreateBookingDto = exports.UpdateMemberDto = exports.CreateMemberDto = exports.CreateTechnicianDto = exports.UpdateBookingStatusDto = exports.AssignTechnicianDto = void 0;
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
    (0, swagger_1.ApiProperty)({ required: false, enum: ['active', 'inactive', 'banned'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'inactive', 'banned']),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "memo", void 0);
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
], UpdateTechnicianDto.prototype, "baseRegion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['pending', 'approved', 'rejected', 'suspended'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['pending', 'approved', 'rejected', 'suspended']),
    __metadata("design:type", String)
], UpdateTechnicianDto.prototype, "status", void 0);
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
//# sourceMappingURL=admin.dto.js.map