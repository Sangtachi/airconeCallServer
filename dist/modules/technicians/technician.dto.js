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
exports.TechnicianDispatchPreferencesDto = exports.TechnicianDispatchOffersQueryDto = exports.TechnicianWorkStatusDto = exports.TechnicianOrderPhotoDto = exports.TechnicianDocumentPresignDto = exports.TechnicianSessionDto = exports.TechnicianSignupDto = exports.TechnicianDocumentInputDto = exports.TechnicianCapabilityInputDto = void 0;
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
class TechnicianDocumentInputDto {
}
exports.TechnicianDocumentInputDto = TechnicianDocumentInputDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['id_card', 'business_license', 'career', 'insurance', 'bankbook', 'other'] }),
    (0, class_validator_1.IsIn)(['id_card', 'business_license', 'career', 'insurance', 'bankbook', 'other']),
    __metadata("design:type", String)
], TechnicianDocumentInputDto.prototype, "documentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '임시 MVP: Storage 업로드 후 URL 또는 외부 파일 URL' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(4),
    __metadata("design:type", String)
], TechnicianDocumentInputDto.prototype, "fileUrl", void 0);
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
    (0, swagger_1.ApiProperty)({ description: '임시 자체 인증용 비밀번호. 추후 SMS/Supabase Auth로 교체' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], TechnicianSignupDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicianSignupDto.prototype, "baseRegion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['individual', 'sole_business', 'company'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['individual', 'sole_business', 'company']),
    __metadata("design:type", String)
], TechnicianSignupDto.prototype, "businessType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicianSignupDto.prototype, "businessNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicianSignupDto.prototype, "bankName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicianSignupDto.prototype, "bankAccount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicianSignupDto.prototype, "bankHolder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [String], description: '활동 가능 지역 목록' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], TechnicianSignupDto.prototype, "regions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TechnicianSignupDto.prototype, "availableSameDay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TechnicianSignupDto.prototype, "availableReservation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TechnicianSignupDto.prototype, "availableWeekend", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TechnicianSignupDto.prototype, "availableNight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TechnicianCapabilityInputDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TechnicianCapabilityInputDto),
    __metadata("design:type", Array)
], TechnicianSignupDto.prototype, "capabilities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [TechnicianDocumentInputDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TechnicianDocumentInputDto),
    __metadata("design:type", Array)
], TechnicianSignupDto.prototype, "documents", void 0);
class TechnicianSessionDto {
}
exports.TechnicianSessionDto = TechnicianSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '승인된 기사 로그인 전화번호' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], TechnicianSessionDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '비밀번호' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(5),
    __metadata("design:type", String)
], TechnicianSessionDto.prototype, "password", void 0);
class TechnicianDocumentPresignDto {
}
exports.TechnicianDocumentPresignDto = TechnicianDocumentPresignDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['id_card', 'business_license', 'career', 'insurance', 'bankbook', 'other'] }),
    (0, class_validator_1.IsIn)(['id_card', 'business_license', 'career', 'insurance', 'bankbook', 'other']),
    __metadata("design:type", String)
], TechnicianDocumentPresignDto.prototype, "documentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicianDocumentPresignDto.prototype, "mimeType", void 0);
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
class TechnicianWorkStatusDto {
}
exports.TechnicianWorkStatusDto = TechnicianWorkStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['offline', 'available', 'busy', 'reserved_only'] }),
    (0, class_validator_1.IsIn)(['offline', 'available', 'busy', 'reserved_only']),
    __metadata("design:type", String)
], TechnicianWorkStatusDto.prototype, "workStatus", void 0);
class TechnicianDispatchOffersQueryDto {
}
exports.TechnicianDispatchOffersQueryDto = TechnicianDispatchOffersQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['same_day', 'reservation'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['same_day', 'reservation']),
    __metadata("design:type", String)
], TechnicianDispatchOffersQueryDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['today', 'tomorrow', 'week', 'next_week'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['today', 'tomorrow', 'week', 'next_week']),
    __metadata("design:type", String)
], TechnicianDispatchOffersQueryDto.prototype, "range", void 0);
class TechnicianDispatchPreferencesDto {
}
exports.TechnicianDispatchPreferencesDto = TechnicianDispatchPreferencesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], TechnicianDispatchPreferencesDto.prototype, "regions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], TechnicianDispatchPreferencesDto.prototype, "serviceTypes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], TechnicianDispatchPreferencesDto.prototype, "airconTypes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], TechnicianDispatchPreferencesDto.prototype, "availabilityCodes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], TechnicianDispatchPreferencesDto.prototype, "minimumPayout", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(300),
    __metadata("design:type", Number)
], TechnicianDispatchPreferencesDto.prototype, "maxDistanceKm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TechnicianDispatchPreferencesDto.prototype, "sameDayEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TechnicianDispatchPreferencesDto.prototype, "reservationEnabled", void 0);
//# sourceMappingURL=technician.dto.js.map