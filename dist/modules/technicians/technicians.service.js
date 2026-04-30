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
var TechniciansService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechniciansService = void 0;
exports.toAdminTechnicianBrief = toAdminTechnicianBrief;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const database_tokens_1 = require("../../database/database.tokens");
const technicians_db_mapper_1 = require("./technicians-db.mapper");
function memorySeedApproved() {
    const now = new Date().toISOString();
    return {
        id: 't_1',
        name: '김기사',
        phone: '01099998888',
        businessType: 'individual',
        businessNumber: null,
        status: 'approved',
        workStatus: 'available',
        baseRegion: '경기 파주',
        bankName: null,
        bankAccount: null,
        bankHolder: null,
        platformFeeRate: 20,
        profilePhotoUrl: null,
        rejectReason: null,
        memo: null,
        createdAt: now,
        capabilities: [
            { serviceType: 'install', airconType: 'wall' },
            { serviceType: 'install', airconType: 'stand' },
            { serviceType: 'cleaning', airconType: 'wall' },
        ],
    };
}
function memorySeedPending() {
    const now = new Date().toISOString();
    return {
        id: 'o_demo_pending',
        name: '박신청',
        phone: '01055557777',
        businessType: 'individual',
        businessNumber: null,
        status: 'pending',
        workStatus: 'offline',
        baseRegion: '서울',
        bankName: null,
        bankAccount: null,
        bankHolder: null,
        platformFeeRate: 20,
        profilePhotoUrl: null,
        rejectReason: null,
        memo: null,
        createdAt: now,
        capabilities: [{ serviceType: 'install', airconType: 'wall' }],
    };
}
function normalizePhone(p) {
    return p.replace(/\D/g, '');
}
function toAdminTechnicianBrief(e) {
    return {
        id: e.id,
        name: e.name,
        phone: e.phone,
        status: e.status,
        workStatus: e.workStatus,
        baseRegion: e.baseRegion ?? undefined,
        feeRate: e.platformFeeRate,
    };
}
let TechniciansService = TechniciansService_1 = class TechniciansService {
    constructor(sb) {
        this.sb = sb;
        this.logger = new common_1.Logger(TechniciansService_1.name);
        this.useDb = false;
        this.byId = new Map();
        this.seq = 1;
    }
    assertUniquePhone(phoneNorm, excludeId) {
        for (const t of this.byId.values()) {
            if (excludeId !== undefined && t.id === excludeId)
                continue;
            if (normalizePhone(t.phone) === phoneNorm)
                throw new common_1.BadRequestException('phone already registered');
        }
    }
    async onModuleInit() {
        if (!this.sb) {
            this.bootstrapMemoryOnly();
            this.logger.log('Technicians: 메모리(시드 t_1 + 데모 pending)');
            return;
        }
        try {
            await this.hydrateFromDatabase();
            this.useDb = true;
            this.logger.log(`Technicians: Supabase 로드 ${this.byId.size}건`);
        }
        catch (e) {
            this.logger.warn(`Technicians DB 실패 — 로컬 시드 폴백: ${e instanceof Error ? e.message : String(e)}`);
            this.bootstrapMemoryOnly();
        }
    }
    bootstrapMemoryOnly() {
        this.byId.clear();
        for (const e of [memorySeedApproved(), memorySeedPending()]) {
            this.byId.set(e.id, e);
        }
    }
    async hydrateFromDatabase() {
        const { data: rows, error } = await this.sb.from('technicians').select('*').order('created_at');
        if (error)
            throw new Error(error.message);
        const ids = (rows ?? []).map((r) => String(r.id));
        const capMap = await (0, technicians_db_mapper_1.fetchCapabilitiesBulk)(this.sb, ids);
        this.byId.clear();
        for (const r of rows ?? []) {
            const rec = r;
            const id = String(rec.id);
            const entity = (0, technicians_db_mapper_1.technicianFromRow)(rec, capMap.get(id) ?? []);
            this.byId.set(id, entity);
        }
    }
    async reloadIfDb() {
        if (!this.useDb || !this.sb)
            return;
        await this.hydrateFromDatabase();
    }
    approvedCount() {
        return [...this.byId.values()].filter((t) => t.status === 'approved').length;
    }
    listAllBrief() {
        return [...this.byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toAdminTechnicianBrief);
    }
    getOnboardingRecords() {
        return [...this.byId.values()]
            .filter((t) => t.status === 'pending' || t.status === 'reviewing')
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((t) => ({
            id: t.id,
            name: t.name,
            phone: t.phone,
            status: t.status === 'pending' ? 'pending' : t.status === 'reviewing' ? 'reviewing' : 'approved',
            documents: ['id_card', 'business_license'],
            rejectReason: t.rejectReason ?? undefined,
            createdAt: t.createdAt,
        }));
    }
    signup(dto) {
        const phone = normalizePhone(dto.phone);
        if (phone.length < 9)
            throw new common_1.BadRequestException('invalid phone');
        const id = (0, node_crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const entity = {
            id,
            name: dto.name.trim(),
            phone,
            businessType: 'individual',
            businessNumber: null,
            status: 'pending',
            workStatus: 'offline',
            baseRegion: dto.baseRegion?.trim() ?? null,
            bankName: null,
            bankAccount: null,
            bankHolder: null,
            platformFeeRate: 20,
            profilePhotoUrl: null,
            rejectReason: null,
            memo: null,
            createdAt: now,
            capabilities: dto.capabilities.map((c) => ({
                serviceType: c.serviceType,
                airconType: c.airconType,
            })),
        };
        return this.persistNewTechnician(entity);
    }
    async persistNewTechnician(entity) {
        if (!this.useDb)
            this.assertUniquePhone(normalizePhone(entity.phone));
        if (this.useDb && this.sb) {
            const { error: e1 } = await this.sb.from('technicians').insert((0, technicians_db_mapper_1.technicianInsertPayload)(entity));
            if (e1)
                throw new common_1.BadRequestException(e1.message);
            const caps = entity.capabilities.map((c) => ({
                technician_id: entity.id,
                service_type: c.serviceType,
                aircon_type: c.airconType,
            }));
            const { error: e2 } = await this.sb.from('technician_capabilities').insert(caps);
            if (e2)
                throw new common_1.BadRequestException(e2.message);
            await this.hydrateFromDatabase();
            return { id: entity.id, status: entity.status };
        }
        this.byId.set(entity.id, entity);
        return { id: entity.id, status: entity.status };
    }
    findApprovedByPhone(phone) {
        const p = normalizePhone(phone);
        return [...this.byId.values()].find((t) => normalizePhone(t.phone) === p && t.status === 'approved') ?? null;
    }
    getApprovedById(id) {
        const t = this.byId.get(id);
        if (!t || t.status !== 'approved')
            return null;
        return t;
    }
    findById(id) {
        return this.byId.get(id);
    }
    createByAdmin(dto) {
        const p = normalizePhone(dto.phone);
        const entity = {
            id: this.useDb ? (0, node_crypto_1.randomUUID)() : `t_${++this.seq}`,
            name: dto.name,
            phone: p,
            businessType: 'individual',
            businessNumber: null,
            status: 'pending',
            workStatus: 'offline',
            baseRegion: dto.baseRegion ?? null,
            bankName: null,
            bankAccount: null,
            bankHolder: null,
            platformFeeRate: 20,
            profilePhotoUrl: null,
            rejectReason: null,
            memo: null,
            createdAt: new Date().toISOString(),
            capabilities: [{ serviceType: 'install', airconType: 'wall' }],
        };
        return this.persistNewTechnician(entity).then(() => this.getRequired(entity.id)).then(toAdminTechnicianBrief);
    }
    getRequired(id) {
        const t = this.byId.get(id);
        if (!t)
            throw new common_1.NotFoundException('technician not found');
        return t;
    }
    async updateByAdmin(id, dto) {
        const row = this.getRequired(id);
        if (dto.name !== undefined)
            row.name = dto.name;
        if (dto.phone !== undefined) {
            const p = normalizePhone(dto.phone);
            this.assertUniquePhone(p, id);
            row.phone = p;
        }
        if (dto.baseRegion !== undefined)
            row.baseRegion = dto.baseRegion ?? null;
        if (dto.status !== undefined)
            row.status = dto.status;
        row.rejectReason = null;
        if (this.useDb && this.sb) {
            const { error } = await this.sb
                .from('technicians')
                .update({
                name: row.name,
                phone: row.phone,
                base_region: row.baseRegion,
                status: row.status,
                reject_reason: null,
            })
                .eq('id', row.id);
            if (error)
                throw new common_1.BadRequestException(error.message);
            await this.reloadIfDb();
        }
        return toAdminTechnicianBrief(this.getRequired(id));
    }
    async deleteByAdmin(id) {
        const row = this.getRequired(id);
        if (this.useDb && this.sb) {
            const { error } = await this.sb.from('technicians').delete().eq('id', id);
            if (error)
                throw new common_1.BadRequestException(error.message);
            await this.reloadIfDb();
        }
        else
            this.byId.delete(id);
        return { id: row.id, deleted: true };
    }
    async updateOnboardingRecord(id, dto) {
        const row = this.getRequired(id);
        if (row.status !== 'pending' && row.status !== 'reviewing')
            throw new common_1.BadRequestException('not an onboarding applicant');
        if (dto.name !== undefined)
            row.name = dto.name;
        if (dto.phone !== undefined)
            row.phone = normalizePhone(dto.phone);
        if (this.useDb && this.sb) {
            const { error } = await this.sb
                .from('technicians')
                .update({ name: row.name, phone: row.phone })
                .eq('id', id);
            if (error)
                throw new common_1.BadRequestException(error.message);
            await this.reloadIfDb();
        }
        return this.getOnboardingRecords().find((o) => o.id === id) ?? getOnboardingFromEntity(this.getRequired(id));
    }
    async deleteOnboardingRecord(id) {
        const row = this.getRequired(id);
        if (row.status !== 'pending' && row.status !== 'reviewing')
            throw new common_1.BadRequestException('cannot delete onboarding for this technician');
        if (this.useDb && this.sb) {
            const { error } = await this.sb.from('technicians').delete().eq('id', id);
            if (error)
                throw new common_1.BadRequestException(error.message);
            await this.reloadIfDb();
        }
        else
            this.byId.delete(id);
        return { id, deleted: true };
    }
    async reviewOnboarding(id, dto) {
        const row = this.getRequired(id);
        if (row.status !== 'pending' && row.status !== 'reviewing')
            throw new common_1.BadRequestException('technician not in onboarding workflow');
        row.rejectReason = dto.rejectReason ?? null;
        row.status =
            dto.status === 'approved' ? 'approved' : dto.status === 'rejected' ? 'rejected' : 'reviewing';
        if (this.useDb && this.sb) {
            const { error } = await this.sb
                .from('technicians')
                .update({
                status: row.status,
                reject_reason: row.rejectReason,
            })
                .eq('id', id);
            if (error)
                throw new common_1.BadRequestException(error.message);
            await this.reloadIfDb();
        }
        return getOnboardingFromEntity(this.getRequired(id));
    }
};
exports.TechniciansService = TechniciansService;
exports.TechniciansService = TechniciansService = TechniciansService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_tokens_1.SUPABASE_ADMIN)),
    __metadata("design:paramtypes", [Object])
], TechniciansService);
function getOnboardingFromEntity(t) {
    const st = t.status === 'approved'
        ? 'approved'
        : t.status === 'rejected'
            ? 'rejected'
            : t.status === 'reviewing'
                ? 'reviewing'
                : 'pending';
    return {
        id: t.id,
        name: t.name,
        phone: t.phone,
        status: st,
        documents: ['id_card'],
        rejectReason: t.rejectReason ?? undefined,
        createdAt: t.createdAt,
    };
}
//# sourceMappingURL=technicians.service.js.map