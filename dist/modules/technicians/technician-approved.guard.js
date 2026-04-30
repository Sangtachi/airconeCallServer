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
exports.TechnicianApprovedGuard = void 0;
const common_1 = require("@nestjs/common");
const technicians_service_1 = require("./technicians.service");
let TechnicianApprovedGuard = class TechnicianApprovedGuard {
    constructor(technicians) {
        this.technicians = technicians;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const raw = req.headers['x-technician-id'];
        const id = Array.isArray(raw) ? raw[0] : raw;
        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new common_1.UnauthorizedException('x-technician-id header required');
        }
        const row = this.technicians.getApprovedById(id.trim());
        if (!row)
            throw new common_1.ForbiddenException('not an approved technician');
        req.technician = row;
        return true;
    }
};
exports.TechnicianApprovedGuard = TechnicianApprovedGuard;
exports.TechnicianApprovedGuard = TechnicianApprovedGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [technicians_service_1.TechniciansService])
], TechnicianApprovedGuard);
//# sourceMappingURL=technician-approved.guard.js.map