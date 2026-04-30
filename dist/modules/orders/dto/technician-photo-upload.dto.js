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
exports.TechnicianPhotoMultipartMetaDto = exports.TechnicianPhotoConfirmDto = exports.TechnicianPhotoPresignDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class TechnicianPhotoPresignDto {
}
exports.TechnicianPhotoPresignDto = TechnicianPhotoPresignDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ['image/jpeg', 'image/png', 'image/webp'],
        description: 'Signed PUT 업로드 시 Content-Type 과 동일해야 합니다.',
        default: 'image/jpeg',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
    __metadata("design:type", String)
], TechnicianPhotoPresignDto.prototype, "mimeType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: '로그 추적용(미사용). presign 경로는 UUID 로 고정입니다.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicianPhotoPresignDto.prototype, "filename", void 0);
class TechnicianPhotoConfirmDto {
}
exports.TechnicianPhotoConfirmDto = TechnicianPhotoConfirmDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Supabase Storage 내 전체 객체 경로 (presign 응답과 동일). 예: orders/{orderId}/uuid.jpg',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], TechnicianPhotoConfirmDto.prototype, "path", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['before_work', 'after_work', 'other'] }),
    (0, class_validator_1.IsIn)(['before_work', 'after_work', 'other']),
    __metadata("design:type", String)
], TechnicianPhotoConfirmDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicianPhotoConfirmDto.prototype, "caption", void 0);
class TechnicianPhotoMultipartMetaDto {
}
exports.TechnicianPhotoMultipartMetaDto = TechnicianPhotoMultipartMetaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['before_work', 'after_work', 'other'] }),
    (0, class_validator_1.IsIn)(['before_work', 'after_work', 'other']),
    __metadata("design:type", String)
], TechnicianPhotoMultipartMetaDto.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TechnicianPhotoMultipartMetaDto.prototype, "caption", void 0);
//# sourceMappingURL=technician-photo-upload.dto.js.map