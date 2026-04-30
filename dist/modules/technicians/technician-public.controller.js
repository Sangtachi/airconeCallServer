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
exports.TechnicianPublicController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const technician_dto_1 = require("./technician.dto");
const technicians_service_1 = require("./technicians.service");
let TechnicianPublicController = class TechnicianPublicController {
    constructor(technicians) {
        this.technicians = technicians;
    }
    register(dto) {
        return this.technicians.signup(dto);
    }
    session(dto) {
        const row = this.technicians.findApprovedByPhone(dto.phone);
        if (!row) {
            throw new common_1.UnauthorizedException('승인된 기사만 로그인됩니다 — 가입 후 관리자 승인 또는 데모 전화번호(01099998888) 승인 기사 필요');
        }
        return {
            technicianId: row.id,
            name: row.name,
            baseRegion: row.baseRegion,
        };
    }
};
exports.TechnicianPublicController = TechnicianPublicController;
__decorate([
    (0, common_1.Post)('technician/register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technician_dto_1.TechnicianSignupDto]),
    __metadata("design:returntype", void 0)
], TechnicianPublicController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('technician/session'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [technician_dto_1.TechnicianSessionDto]),
    __metadata("design:returntype", void 0)
], TechnicianPublicController.prototype, "session", null);
exports.TechnicianPublicController = TechnicianPublicController = __decorate([
    (0, swagger_1.ApiTags)('technician-public'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [technicians_service_1.TechniciansService])
], TechnicianPublicController);
//# sourceMappingURL=technician-public.controller.js.map