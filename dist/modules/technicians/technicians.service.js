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
const password_hash_1 = require("../../common/password-hash");
const database_tokens_1 = require("../../database/database.tokens");
const technicians_db_mapper_1 = require("./technicians-db.mapper");
function normalizePhone(p) {
    return String(p ?? '').replace(/\D/g, '');
}
function cleanList(v, fallback) {
    const rows = (v ?? [])
        .map((x) => String(x).trim())
        .filter(Boolean);
    if (rows.length > 0)
        return [...new Set(rows)];
    const f = fallback?.trim();
    return f ? [f] : [];
}
function availabilityFromSignup(dto) {
    const out = [];
    if (dto.availableSameDay)
        out.push('same_day');
    if (dto.availableReservation ?? true)
        out.push('reservation');
    if (dto.availableWeekend)
        out.push('weekend');
    if (dto.availableNight)
        out.push('night');
    return out.length > 0 ? out : ['reservation'];
}
function isMissingSupabaseRelation(error) {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return /schema cache|could not find the table|relation .* does not exist/i.test(message);
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
        regions: e.regions,
        capabilities: e.capabilities,
        documents: e.documents.map((d) => ({ type: d.documentType, status: d.status })),
    };
}
let TechniciansService = TechniciansService_1 = class TechniciansService {
    constructor(sb) {
        this.sb = sb;
        this.logger = new common_1.Logger(TechniciansService_1.name);
        this.byId = new Map();
    }
    db() {
        if (!this.sb) {
            throw new common_1.ServiceUnavailableException('서버 DB 연결 설정이 필요합니다. 로컬 .env.local에 Supabase 값을 넣고 서버를 재시작해 주세요.');
        }
        return this.sb;
    }
    ensureConfigured() {
        if (!this.sb) {
            throw new common_1.ServiceUnavailableException('서버 DB 연결 설정이 필요합니다. 로컬 .env.local에 Supabase 값을 넣고 서버를 재시작해 주세요.');
        }
    }
    async onModuleInit() {
        if (!this.sb) {
            this.logger.warn('Technicians: Supabase 미설정 — 기사 API는 호출 시 503을 반환합니다.');
            return;
        }
        await this.hydrateFromDatabase();
        this.logger.log(`Technicians: Supabase 로드 ${this.byId.size}건`);
    }
    async hydrateFromDatabase() {
        const sb = this.db();
        const { data: rows, error } = await sb.from('technicians').select('*').order('created_at');
        if (error)
            throw new common_1.BadRequestException(error.message);
        const ids = (rows ?? []).map((r) => String(r.id));
        const [capMap, regionMap, availabilityMap, docMap] = await Promise.all([
            this.fetchOptionalTechnicianChildTable('technician_capabilities', ids, () => this.emptyMap(ids), () => (0, technicians_db_mapper_1.fetchCapabilitiesBulk)(sb, ids)),
            this.fetchOptionalTechnicianChildTable('technician_regions', ids, () => this.emptyMap(ids), () => this.fetchRegionsBulk(ids)),
            this.fetchOptionalTechnicianChildTable('technician_availability', ids, () => this.emptyMap(ids), () => this.fetchAvailabilityBulk(ids)),
            this.fetchOptionalTechnicianChildTable('technician_documents', ids, () => this.emptyMap(ids), () => this.fetchDocumentsBulk(ids)),
        ]);
        this.byId.clear();
        for (const r of rows ?? []) {
            const rec = r;
            const id = String(rec.id);
            const entity = (0, technicians_db_mapper_1.technicianFromRow)(rec, capMap.get(id) ?? [], regionMap.get(id) ?? [], availabilityMap.get(id) ?? [], docMap.get(id) ?? []);
            this.byId.set(id, entity);
        }
    }
    emptyMap(technicianIds) {
        const map = new Map();
        technicianIds.forEach((id) => map.set(id, []));
        return map;
    }
    async fetchOptionalTechnicianChildTable(tableName, technicianIds, fallback, read) {
        try {
            return await read();
        }
        catch (error) {
            if (!isMissingSupabaseRelation(error))
                throw error;
            this.logger.warn(`Technicians: ${tableName} 테이블 없음 — sql/auth_password_patch_and_samples.sql 적용 전까지 해당 관계는 빈 값으로 로드합니다.`);
            return fallback();
        }
    }
    async fetchRegionsBulk(technicianIds) {
        const map = new Map();
        technicianIds.forEach((id) => map.set(id, []));
        if (technicianIds.length === 0)
            return map;
        const { data, error } = await this.db()
            .from('technician_regions')
            .select('technician_id, region')
            .in('technician_id', technicianIds);
        if (error)
            throw new common_1.BadRequestException(error.message);
        for (const r of data ?? []) {
            const id = String(r.technician_id);
            const list = map.get(id) ?? [];
            list.push(String(r.region));
            map.set(id, list);
        }
        return map;
    }
    async fetchAvailabilityBulk(technicianIds) {
        const map = new Map();
        technicianIds.forEach((id) => map.set(id, []));
        if (technicianIds.length === 0)
            return map;
        const { data, error } = await this.db()
            .from('technician_availability')
            .select('technician_id, availability_code')
            .in('technician_id', technicianIds);
        if (error)
            throw new common_1.BadRequestException(error.message);
        for (const r of data ?? []) {
            const id = String(r.technician_id);
            const list = map.get(id) ?? [];
            list.push(r.availability_code);
            map.set(id, list);
        }
        return map;
    }
    async fetchDocumentsBulk(technicianIds) {
        const map = new Map();
        technicianIds.forEach((id) => map.set(id, []));
        if (technicianIds.length === 0)
            return map;
        const { data, error } = await this.db()
            .from('technician_documents')
            .select('id, technician_id, document_type, file_url, status')
            .in('technician_id', technicianIds);
        if (error)
            throw new common_1.BadRequestException(error.message);
        for (const r of data ?? []) {
            const rec = r;
            const id = String(rec.technician_id);
            const list = map.get(id) ?? [];
            list.push({
                id: String(rec.id),
                documentType: String(rec.document_type),
                fileUrl: String(rec.file_url),
                status: rec.status,
            });
            map.set(id, list);
        }
        return map;
    }
    async reload() {
        await this.hydrateFromDatabase();
    }
    approvedCount() {
        this.ensureConfigured();
        return [...this.byId.values()].filter((t) => t.status === 'approved').length;
    }
    listAllBrief() {
        this.ensureConfigured();
        return [...this.byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toAdminTechnicianBrief);
    }
    getOnboardingRecords() {
        this.ensureConfigured();
        return [...this.byId.values()]
            .filter((t) => t.status === 'pending' || t.status === 'reviewing')
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map(getOnboardingFromEntity);
    }
    signup(dto) {
        this.ensureConfigured();
        const phone = normalizePhone(dto.phone);
        if (phone.length < 9)
            throw new common_1.BadRequestException('invalid phone');
        const id = (0, node_crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const regions = cleanList(dto.regions, dto.baseRegion);
        const entity = {
            id,
            name: dto.name.trim(),
            phone,
            passwordHash: (0, password_hash_1.hashPassword)(dto.password),
            businessType: dto.businessType ?? 'individual',
            businessNumber: dto.businessNumber?.trim() || null,
            careerYears: null,
            status: 'pending',
            workStatus: 'offline',
            baseRegion: dto.baseRegion?.trim() || regions[0] || null,
            bankName: dto.bankName?.trim() || null,
            bankAccount: dto.bankAccount?.trim() || null,
            bankHolder: dto.bankHolder?.trim() || null,
            platformFeeRate: 20,
            profilePhotoUrl: null,
            rejectReason: null,
            memo: null,
            createdAt: now,
            capabilities: dto.capabilities.map((c) => ({
                serviceType: c.serviceType,
                airconType: c.airconType,
            })),
            regions,
            availability: availabilityFromSignup(dto),
            documents: dto.documents?.map((d) => ({
                id: (0, node_crypto_1.randomUUID)(),
                documentType: d.documentType,
                fileUrl: d.fileUrl.trim(),
                status: 'pending',
            })) ?? [],
        };
        return this.persistNewTechnician(entity);
    }
    async persistNewTechnician(entity) {
        const sb = this.db();
        const { error: e1 } = await sb.from('technicians').insert((0, technicians_db_mapper_1.technicianInsertPayload)(entity));
        if (e1)
            throw new common_1.BadRequestException(e1.message);
        if (entity.capabilities.length > 0) {
            const { error } = await sb.from('technician_capabilities').insert(entity.capabilities.map((c) => ({
                technician_id: entity.id,
                service_type: c.serviceType,
                aircon_type: c.airconType,
            })));
            if (error)
                throw new common_1.BadRequestException(error.message);
        }
        if (entity.regions.length > 0) {
            const { error } = await sb.from('technician_regions').insert(entity.regions.map((region) => ({
                technician_id: entity.id,
                region,
            })));
            if (error)
                throw new common_1.BadRequestException(error.message);
        }
        if (entity.availability.length > 0) {
            const { error } = await sb.from('technician_availability').insert(entity.availability.map((availabilityCode) => ({
                technician_id: entity.id,
                availability_code: availabilityCode,
            })));
            if (error)
                throw new common_1.BadRequestException(error.message);
        }
        if (entity.documents.length > 0) {
            const { error } = await sb.from('technician_documents').insert(entity.documents.map((doc) => ({
                id: doc.id,
                technician_id: entity.id,
                document_type: doc.documentType,
                file_url: doc.fileUrl,
                status: doc.status,
            })));
            if (error)
                throw new common_1.BadRequestException(error.message);
        }
        await this.reload();
        return { id: entity.id, status: entity.status };
    }
    findApprovedByCredentials(phone, password) {
        this.ensureConfigured();
        const p = normalizePhone(phone);
        const row = [...this.byId.values()].find((t) => normalizePhone(t.phone) === p && t.status === 'approved') ?? null;
        if (!row || !(0, password_hash_1.verifyPassword)(password, row.passwordHash))
            return null;
        return row;
    }
    getApprovedById(id) {
        this.ensureConfigured();
        const t = this.byId.get(id);
        if (!t || t.status !== 'approved')
            return null;
        return t;
    }
    findById(id) {
        this.ensureConfigured();
        return this.byId.get(id);
    }
    createByAdmin(dto) {
        this.ensureConfigured();
        const p = normalizePhone(dto.phone);
        const entity = {
            id: (0, node_crypto_1.randomUUID)(),
            name: dto.name,
            phone: p,
            passwordHash: dto.password ? (0, password_hash_1.hashPassword)(dto.password) : null,
            businessType: 'individual',
            businessNumber: null,
            careerYears: null,
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
            regions: cleanList(undefined, dto.baseRegion),
            availability: ['reservation'],
            documents: [],
        };
        return this.persistNewTechnician(entity).then(() => this.getRequired(entity.id)).then(toAdminTechnicianBrief);
    }
    getRequired(id) {
        this.ensureConfigured();
        const t = this.byId.get(id);
        if (!t)
            throw new common_1.NotFoundException('technician not found');
        return t;
    }
    async updateByAdmin(id, dto) {
        const row = this.getRequired(id);
        const patch = {};
        if (dto.name !== undefined)
            patch.name = dto.name;
        if (dto.phone !== undefined)
            patch.phone = normalizePhone(dto.phone);
        if (dto.password !== undefined && dto.password.trim() !== '') {
            patch.password_hash = (0, password_hash_1.hashPassword)(dto.password);
            patch.password_updated_at = new Date().toISOString();
        }
        if (dto.baseRegion !== undefined)
            patch.base_region = dto.baseRegion ?? null;
        if (dto.status !== undefined)
            patch.status = dto.status;
        patch.reject_reason = null;
        const { error } = await this.db().from('technicians').update(patch).eq('id', row.id);
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.reload();
        return toAdminTechnicianBrief(this.getRequired(id));
    }
    async deleteByAdmin(id) {
        const row = this.getRequired(id);
        const { error } = await this.db().from('technicians').delete().eq('id', id);
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.reload();
        return { id: row.id, deleted: true };
    }
    async updateOnboardingRecord(id, dto) {
        const row = this.getRequired(id);
        if (row.status !== 'pending' && row.status !== 'reviewing')
            throw new common_1.BadRequestException('not an onboarding applicant');
        const patch = {};
        if (dto.name !== undefined)
            patch.name = dto.name;
        if (dto.phone !== undefined)
            patch.phone = normalizePhone(dto.phone);
        const { error } = await this.db().from('technicians').update(patch).eq('id', id);
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.reload();
        return getOnboardingFromEntity(this.getRequired(id));
    }
    async deleteOnboardingRecord(id) {
        const row = this.getRequired(id);
        if (row.status !== 'pending' && row.status !== 'reviewing')
            throw new common_1.BadRequestException('cannot delete onboarding for this technician');
        const { error } = await this.db().from('technicians').delete().eq('id', id);
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.reload();
        return { id, deleted: true };
    }
    async reviewOnboarding(id, dto) {
        const row = this.getRequired(id);
        if (row.status !== 'pending' && row.status !== 'reviewing')
            throw new common_1.BadRequestException('technician not in onboarding workflow');
        const status = dto.status === 'approved' ? 'approved' : dto.status === 'rejected' ? 'rejected' : 'reviewing';
        const { error } = await this.db()
            .from('technicians')
            .update({
            status,
            reject_reason: dto.rejectReason ?? null,
        })
            .eq('id', id);
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.reload();
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
        documents: t.documents.map((d) => `${d.documentType}:${d.status}`),
        rejectReason: t.rejectReason ?? undefined,
        createdAt: t.createdAt,
    };
}
//# sourceMappingURL=technicians.service.js.map