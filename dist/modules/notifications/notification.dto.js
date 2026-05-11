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
exports.RegisterNotificationDeviceDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RegisterNotificationDeviceDto {
}
exports.RegisterNotificationDeviceDto = RegisterNotificationDeviceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['fcm', 'web_push'] }),
    (0, class_validator_1.IsIn)(['fcm', 'web_push']),
    __metadata("design:type", String)
], RegisterNotificationDeviceDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'FCM registration token 또는 Web Push endpoint' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(3000),
    __metadata("design:type", String)
], RegisterNotificationDeviceDto.prototype, "token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'PushSubscription JSON' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RegisterNotificationDeviceDto.prototype, "subscription", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, enum: ['web', 'android', 'ios', 'unknown'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], RegisterNotificationDeviceDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], RegisterNotificationDeviceDto.prototype, "deviceLabel", void 0);
//# sourceMappingURL=notification.dto.js.map