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
exports.EmergencyLeadsPublicController = void 0;
const common_1 = require("@nestjs/common");
const patch_emergency_lead_contact_dto_1 = require("./dto/patch-emergency-lead-contact.dto");
const patch_emergency_lead_timeout_dto_1 = require("./dto/patch-emergency-lead-timeout.dto");
const create_emergency_lead_dto_1 = require("./dto/create-emergency-lead.dto");
const emergency_leads_service_1 = require("./emergency-leads.service");
let EmergencyLeadsPublicController = class EmergencyLeadsPublicController {
    constructor(leads) {
        this.leads = leads;
    }
    create(dto) {
        return this.leads.create(dto);
    }
    patchContact(id, dto) {
        return this.leads.patchContact(id, dto);
    }
    markTimeout(id, dto) {
        return this.leads.markTimeout(id, dto);
    }
};
exports.EmergencyLeadsPublicController = EmergencyLeadsPublicController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_emergency_lead_dto_1.CreateEmergencyLeadDto]),
    __metadata("design:returntype", void 0)
], EmergencyLeadsPublicController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/contact'),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe({ version: '4' }))),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_emergency_lead_contact_dto_1.PatchEmergencyLeadContactDto]),
    __metadata("design:returntype", void 0)
], EmergencyLeadsPublicController.prototype, "patchContact", null);
__decorate([
    (0, common_1.Patch)(':id/timeout'),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe({ version: '4' }))),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, patch_emergency_lead_timeout_dto_1.PatchEmergencyLeadTimeoutDto]),
    __metadata("design:returntype", void 0)
], EmergencyLeadsPublicController.prototype, "markTimeout", null);
exports.EmergencyLeadsPublicController = EmergencyLeadsPublicController = __decorate([
    (0, common_1.Controller)('emergency-leads'),
    __metadata("design:paramtypes", [emergency_leads_service_1.EmergencyLeadsService])
], EmergencyLeadsPublicController);
//# sourceMappingURL=emergency-leads.public.controller.js.map