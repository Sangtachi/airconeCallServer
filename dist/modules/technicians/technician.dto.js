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
exports.TechnicianOrderPhotoDto = exports.TechnicianSessionDto = exports.TechnicianSignupDto = exports.TechnicianCapabilityInputDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class TechnicianCapabilityInputDto {
}
exports.TechnicianCapabilityInputDto = TechnicianCapabilityInputDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['install', 'cleaning'] }),
    (0, class_validator_1.IsIn)(['install', 'cleaning']),
    __metadata("design:type", String)
], TechnicianCapabilityInputDto.prototype, "serviceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['wall', 'stand', 'two_in_one', 'system'] }),
    (0, class_validator_1.IsIn)(['wall', 'stand', 'two_in_one', 'system']),
    __metadata("design:type", String)
], TechnicianCapabilityInputDto.prototype, "airconType", void 0);
class TechnicianSignupDto {
}
exports.TechnicianSignupDto = TechnicianSignupDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], TechnicianSignupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '숫자만 또는 하이픈 포함 — 저장 시 간단히 정규화' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], TechnicianSignupDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicianSignupDto.prototype, "baseRegion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TechnicianCapabilityInputDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TechnicianCapabilityInputDto),
    __metadata("design:type", Array)
], TechnicianSignupDto.prototype, "capabilities", void 0);
class TechnicianSessionDto {
}
exports.TechnicianSessionDto = TechnicianSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '승인된 기사 로그인(데모용 — OTP 없음)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], TechnicianSessionDto.prototype, "phone", void 0);
class TechnicianOrderPhotoDto {
}
exports.TechnicianOrderPhotoDto = TechnicianOrderPhotoDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['before_work', 'after_work', 'other'] }),
    (0, class_validator_1.IsIn)(['before_work', 'after_work', 'other']),
    __metadata("design:type", String)
], TechnicianOrderPhotoDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'MVP: 공개 URL 문자열(S3 업로드·Presign은 후속).' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    __metadata("design:type", String)
], TechnicianOrderPhotoDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicianOrderPhotoDto.prototype, "caption", void 0);
//# sourceMappingURL=technician.dto.js.map