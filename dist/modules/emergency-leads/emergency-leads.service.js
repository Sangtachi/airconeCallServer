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
var EmergencyLeadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyLeadsService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const emergency_lead_dispatch_bridge_1 = require("./emergency-lead-dispatch.bridge");
const emergency_leads_repository_port_1 = require("./emergency-leads.repository.port");
function normalizeDigitsPhone(v) {
    const d = v.replace(/\D/g, '');
    return d.length >= 10 ? d : null;
}
function trimEmptyToNull(v) {
    if (v == null)
        return null;
    const t = String(v).trim();
    return t === '' ? null : t;
}
const FINALIZE_SWEEP_MS = 45_000;
let EmergencyLeadsService = EmergencyLeadsService_1 = class EmergencyLeadsService {
    constructor(repo, dispatchBridge) {
        this.repo = repo;
        this.dispatchBridge = dispatchBridge;
        this.logger = new common_1.Logger(EmergencyLeadsService_1.name);
        this.sweepTimer = null;
    }
    onModuleInit() {
        this.sweepTimer = setInterval(() => {
            void this.runDeadlineSweep().catch((e) => this.logger.warn(`deadline sweep: ${e instanceof Error ? e.message : String(e)}`));
        }, FINALIZE_SWEEP_MS);
    }
    onModuleDestroy() {
        if (this.sweepTimer) {
            clearInterval(this.sweepTimer);
            this.sweepTimer = null;
        }
    }
    async finalizeAwait(row) {
        try {
            await this.dispatchBridge.tryFinalizeLead(row);
        }
        catch (err) {
            this.logger.warn(`finalize lead=${row.id} — ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    finalizeSweepFireAndForget(row) {
        void this.finalizeAwait(row);
    }
    async runDeadlineSweep() {
        const rows = await this.repo.list({});
        for (const r of rows) {
            this.finalizeSweepFireAndForget(r);
        }
    }
    quotedFeeKrw() {
        const raw = process.env.QUOTED_DISPATCH_FEE_KRW;
        if (raw != null && raw !== '') {
            const n = Number(String(raw).trim());
            if (Number.isFinite(n) && n > 0)
                return Math.floor(n);
        }
        return 30000;
    }
    assertSession(row, session) {
        if (!row || row.clientSessionId !== session) {
            throw new common_1.NotFoundException('emergency lead not found');
        }
    }
    async create(dto) {
        const timeout = Math.min(Math.max(dto.matchingTimeoutSeconds ?? 40, 5), 120);
        const started = new Date();
        const deadline = new Date(started.getTime() + timeout * 1000);
        const id = (0, node_crypto_1.randomUUID)();
        const nowIso = started.toISOString();
        const row = {
            id,
            clientSessionId: dto.clientSessionId,
            locationText: dto.location.trim(),
            airconType: (dto.acType ?? '').trim(),
            issueText: (dto.issue ?? '').trim(),
            urgency: dto.urgency === 'scheduled' ? 'scheduled' : 'now',
            quotedFeeKrw: this.quotedFeeKrw(),
            matchingTimeoutSeconds: timeout,
            matchingStartedAt: nowIso,
            matchingDeadlineAt: deadline.toISOString(),
            matchingStatus: 'pending',
            customerPhone: dto.customerPhone ? normalizeDigitsPhone(dto.customerPhone) : null,
            customerName: trimEmptyToNull(dto.customerName),
            userId: trimEmptyToNull(dto.userId),
            convertedOrderId: null,
            convertedBookingId: null,
            createdAt: nowIso,
            updatedAt: nowIso,
        };
        await this.repo.insert(row);
        return {
            leadId: row.id,
            clientSessionId: row.clientSessionId,
            matchingTimeoutSeconds: row.matchingTimeoutSeconds,
            deadlineIso: row.matchingDeadlineAt,
            quotedFeeKrw: row.quotedFeeKrw,
        };
    }
    async patchContact(id, dto) {
        const row = await this.repo.findById(id);
        this.assertSession(row, dto.clientSessionId);
        const hasAnyField = dto.customerPhone !== undefined || dto.customerName !== undefined || dto.userId !== undefined;
        if (!hasAnyField) {
            throw new common_1.BadRequestException('at least one of customerPhone, customerName, userId is required');
        }
        let phoneNext = row.customerPhone;
        if (dto.customerPhone !== undefined) {
            const raw = dto.customerPhone == null ? '' : String(dto.customerPhone).trim();
            if (raw === '')
                phoneNext = null;
            else {
                phoneNext = normalizeDigitsPhone(raw);
                if (!phoneNext)
                    throw new common_1.BadRequestException('invalid customerPhone');
            }
        }
        let nameNext = row.customerName;
        if (dto.customerName !== undefined) {
            nameNext = trimEmptyToNull(dto.customerName);
        }
        let userNext = row.userId;
        if (dto.userId !== undefined) {
            userNext = trimEmptyToNull(dto.userId);
        }
        if (!phoneNext && !nameNext && !userNext) {
            throw new common_1.BadRequestException('contact cannot be empty');
        }
        const nowIso = new Date().toISOString();
        await this.repo.updatePartial(id, {
            customerPhone: phoneNext,
            customerName: nameNext,
            userId: userNext,
            matchingStatus: 'contact_saved',
            updatedAt: nowIso,
        });
        const saved = await this.repo.findById(id);
        if (!saved)
            throw new common_1.NotFoundException('emergency lead not found');
        await this.finalizeAwait(saved);
        const out = await this.repo.findById(id);
        if (!out)
            throw new common_1.NotFoundException('emergency lead not found');
        return out;
    }
    async markTimeout(id, dto) {
        const row = await this.repo.findById(id);
        this.assertSession(row, dto.clientSessionId);
        const nowIso = new Date().toISOString();
        if (row.matchingStatus === 'converted_to_order') {
            await this.finalizeAwait(row);
            const refreshed = await this.repo.findById(id);
            if (!refreshed)
                throw new common_1.NotFoundException('emergency lead not found');
            return refreshed;
        }
        if (row.matchingStatus === 'contact_saved') {
            await this.finalizeAwait(row);
            const refreshed = await this.repo.findById(id);
            if (!refreshed)
                throw new common_1.NotFoundException('emergency lead not found');
            return refreshed;
        }
        if (row.matchingStatus === 'timed_out') {
            await this.finalizeAwait(row);
            const refreshed = await this.repo.findById(id);
            if (!refreshed)
                throw new common_1.NotFoundException('emergency lead not found');
            return refreshed;
        }
        if (row.matchingStatus !== 'pending') {
            throw new common_1.BadRequestException(`unexpected matchingStatus ${row.matchingStatus}`);
        }
        await this.repo.updatePartial(id, {
            matchingStatus: 'timed_out',
            updatedAt: nowIso,
        });
        const next = await this.repo.findById(id);
        if (!next)
            throw new common_1.NotFoundException('emergency lead not found');
        await this.finalizeAwait(next);
        const out = await this.repo.findById(id);
        if (!out)
            throw new common_1.NotFoundException('emergency lead not found');
        return out;
    }
    async listAdmin(filters) {
        return this.repo.list(filters);
    }
    async patchAdmin(id, dto) {
        const row = await this.repo.findById(id);
        if (!row)
            throw new common_1.NotFoundException('emergency lead not found');
        if (dto.matchingStatus == null) {
            throw new common_1.BadRequestException('matchingStatus is required');
        }
        const nowIso = new Date().toISOString();
        await this.repo.updatePartial(id, {
            matchingStatus: dto.matchingStatus,
            updatedAt: nowIso,
        });
        const next = await this.repo.findById(id);
        if (!next)
            throw new common_1.NotFoundException('emergency lead not found');
        if (dto.matchingStatus === 'converted_to_order') {
            try {
                await this.dispatchBridge.tryFinalizeLeadForced(next);
            }
            catch (err) {
                this.logger.warn(`admin force finalize lead=${id} — ${err instanceof Error ? err.message : String(err)}`);
            }
            const finalized = await this.repo.findById(id);
            if (!finalized)
                throw new common_1.NotFoundException('emergency lead not found');
            return finalized;
        }
        return next;
    }
};
exports.EmergencyLeadsService = EmergencyLeadsService;
exports.EmergencyLeadsService = EmergencyLeadsService = EmergencyLeadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(emergency_leads_repository_port_1.EMERGENCY_LEADS_REPO)),
    __metadata("design:paramtypes", [Object, emergency_lead_dispatch_bridge_1.EmergencyLeadDispatchBridge])
], EmergencyLeadsService);
//# sourceMappingURL=emergency-leads.service.js.map