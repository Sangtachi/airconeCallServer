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
var SettlementAuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementAuditService = void 0;
const common_1 = require("@nestjs/common");
const database_tokens_1 = require("../../database/database.tokens");
let SettlementAuditService = SettlementAuditService_1 = class SettlementAuditService {
    constructor(sb) {
        this.sb = sb;
        this.log = new common_1.Logger(SettlementAuditService_1.name);
    }
    async record(input) {
        if (!this.sb)
            return;
        const row = {
            settlement_id: input.settlementId ?? null,
            order_id: input.orderId ?? null,
            actor: input.actor,
            action: input.action,
            idempotency_key: input.idempotencyKey && input.idempotencyKey.trim().length > 0
                ? input.idempotencyKey.trim()
                : null,
            payload: input.payload == null ? null : JSON.parse(JSON.stringify(input.payload)),
        };
        const { error } = await this.sb.from('settlement_events').insert(row);
        if (error?.code === '23505' ||
            error?.message?.toLowerCase()?.includes('duplicate') ||
            error?.message?.toLowerCase()?.includes('unique')) {
            this.log.debug(`settlement_events idempotent skip: ${input.idempotencyKey}`);
            return;
        }
        if (error) {
            this.log.warn(`settlement_events insert failed (non-blocking): ${error.message}`);
        }
    }
};
exports.SettlementAuditService = SettlementAuditService;
exports.SettlementAuditService = SettlementAuditService = SettlementAuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_tokens_1.SUPABASE_ADMIN)),
    __metadata("design:paramtypes", [Object])
], SettlementAuditService);
//# sourceMappingURL=settlement-audit.service.js.map