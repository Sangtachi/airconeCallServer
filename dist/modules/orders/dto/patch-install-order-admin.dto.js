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
exports.PatchInstallOrderAdminDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const STATUSES = [
    'created',
    'paid',
    'matching',
    'assigned',
    'accepted',
    'on_the_way',
    'working',
    'completed',
    'cancelled',
    'refunded',
];
class PatchInstallOrderAdminDto {
}
exports.PatchInstallOrderAdminDto = PatchInstallOrderAdminDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: STATUSES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)([...STATUSES]),
    __metadata("design:type", String)
], PatchInstallOrderAdminDto.prototype, "orderStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: false,
        nullable: true,
        description: '기사 식별자(t_1 등). 빈 문자열이면 미배정으로 저장.',
    }),
    (0, class_validator_1.Allow)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], PatchInstallOrderAdminDto.prototype, "assignedTechnicianId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PatchInstallOrderAdminDto.prototype, "adminMemo", void 0);
//# sourceMappingURL=patch-install-order-admin.dto.js.map