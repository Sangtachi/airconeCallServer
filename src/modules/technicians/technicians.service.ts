import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../database/database.tokens';
import {
  CreateTechnicianDto,
  ReviewOnboardingDto,
  UpdateOnboardingDto,
  UpdateTechnicianDto,
} from '../admin/admin.dto';
import type { TechnicianOnboarding } from '../admin/admin.types';
import type { TechnicianEntity } from './technician.types';
import { TechnicianSignupDto } from './technician.dto';
import { fetchCapabilitiesBulk, technicianFromRow, technicianInsertPayload } from './technicians-db.mapper';

/** 메모리 기본값 — 레거시 admin 과 동일 축약 id (Supabase 미사용 로컬 테스트용). */
function memorySeedApproved(): TechnicianEntity {
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

function memorySeedPending(): TechnicianEntity {
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

function normalizePhone(p: string): string {
  return p.replace(/\D/g, '');
}

/** 관리자 API용 — 기존 Technician 타입 근사 */
export function toAdminTechnicianBrief(e: TechnicianEntity) {
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

@Injectable()
export class TechniciansService implements OnModuleInit {
  private readonly logger = new Logger(TechniciansService.name);

  /** Supabase 존재 + 로드 성공 시 true → 서버 시작 후 기사 상태를 테이블에 반영 */
  private useDb = false;

  /** id → technician (메모리 캐시; DB 모드에서는 로드 결과) */
  private byId = new Map<string, TechnicianEntity>();

  private seq = 1;

  constructor(@Inject(SUPABASE_ADMIN) private readonly sb: SupabaseClient | null) {}

  private assertUniquePhone(phoneNorm: string, excludeId?: string): void {
    for (const t of this.byId.values()) {
      if (excludeId !== undefined && t.id === excludeId) continue;
      if (normalizePhone(t.phone) === phoneNorm)
        throw new BadRequestException('phone already registered');
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.sb) {
      this.bootstrapMemoryOnly();
      this.logger.log('Technicians: 메모리(시드 t_1 + 데모 pending)');
      return;
    }
    try {
      await this.hydrateFromDatabase();
      this.useDb = true;
      this.logger.log(`Technicians: Supabase 로드 ${this.byId.size}건`);
    } catch (e) {
      this.logger.warn(
        `Technicians DB 실패 — 로컬 시드 폴백: ${e instanceof Error ? e.message : String(e)}`,
      );
      this.bootstrapMemoryOnly();
    }
  }

  private bootstrapMemoryOnly(): void {
    this.byId.clear();
    for (const e of [memorySeedApproved(), memorySeedPending()]) {
      this.byId.set(e.id, e);
    }
  }

  private async hydrateFromDatabase(): Promise<void> {
    const { data: rows, error } = await this.sb!.from('technicians').select('*').order('created_at');
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r: { id: string }) => String(r.id));
    const capMap = await fetchCapabilitiesBulk(this.sb!, ids);
    this.byId.clear();
    for (const r of rows ?? []) {
      const rec = r as Record<string, unknown>;
      const id = String(rec.id);
      const entity = technicianFromRow(rec, capMap.get(id) ?? []);
      this.byId.set(id, entity);
    }
  }

  private async reloadIfDb(): Promise<void> {
    if (!this.useDb || !this.sb) return;
    await this.hydrateFromDatabase();
  }

  approvedCount(): number {
    return [...this.byId.values()].filter((t) => t.status === 'approved').length;
  }

  listAllBrief() {
    return [...this.byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toAdminTechnicianBrief);
  }

  getOnboardingRecords(): TechnicianOnboarding[] {
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

  signup(dto: TechnicianSignupDto): Promise<{ id: string; status: string }> {
    const phone = normalizePhone(dto.phone);
    if (phone.length < 9) throw new BadRequestException('invalid phone');
    const id = randomUUID();
    const now = new Date().toISOString();
    const entity: TechnicianEntity = {
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

  private async persistNewTechnician(entity: TechnicianEntity): Promise<{ id: string; status: string }> {
    if (!this.useDb) this.assertUniquePhone(normalizePhone(entity.phone));
    if (this.useDb && this.sb) {
      const { error: e1 } = await this.sb.from('technicians').insert(technicianInsertPayload(entity));
      if (e1) throw new BadRequestException(e1.message);
      const caps = entity.capabilities.map((c) => ({
        technician_id: entity.id,
        service_type: c.serviceType,
        aircon_type: c.airconType,
      }));
      const { error: e2 } = await this.sb.from('technician_capabilities').insert(caps);
      if (e2) throw new BadRequestException(e2.message);
      await this.hydrateFromDatabase();
      return { id: entity.id, status: entity.status };
    }

    this.byId.set(entity.id, entity);
    return { id: entity.id, status: entity.status };
  }

  findApprovedByPhone(phone: string): TechnicianEntity | null {
    const p = normalizePhone(phone);
    return [...this.byId.values()].find((t) => normalizePhone(t.phone) === p && t.status === 'approved') ?? null;
  }

  /** 포털 Guard — 문자열 ID (UUID 또는 레거시 t_1 ). */
  getApprovedById(id: string): TechnicianEntity | null {
    const t = this.byId.get(id);
    if (!t || t.status !== 'approved') return null;
    return t;
  }

  findById(id: string): TechnicianEntity | undefined {
    return this.byId.get(id);
  }

  createByAdmin(dto: CreateTechnicianDto): Promise<ReturnType<typeof toAdminTechnicianBrief>> {
    const p = normalizePhone(dto.phone);
    const entity: TechnicianEntity = {
      id: this.useDb ? randomUUID() : `t_${++this.seq}`,
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

  private getRequired(id: string): TechnicianEntity {
    const t = this.byId.get(id);
    if (!t) throw new NotFoundException('technician not found');
    return t;
  }

  async updateByAdmin(id: string, dto: UpdateTechnicianDto): Promise<ReturnType<typeof toAdminTechnicianBrief>> {
    const row = this.getRequired(id);
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.phone !== undefined) {
      const p = normalizePhone(dto.phone);
      this.assertUniquePhone(p, id);
      row.phone = p;
    }
    if (dto.baseRegion !== undefined) row.baseRegion = dto.baseRegion ?? null;
    if (dto.status !== undefined) row.status = dto.status;
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
      if (error) throw new BadRequestException(error.message);
      await this.reloadIfDb();
    }
    return toAdminTechnicianBrief(this.getRequired(id));
  }

  async deleteByAdmin(id: string): Promise<{ id: string; deleted: boolean }> {
    const row = this.getRequired(id);
    if (this.useDb && this.sb) {
      const { error } = await this.sb.from('technicians').delete().eq('id', id);
      if (error) throw new BadRequestException(error.message);
      await this.reloadIfDb();
    } else this.byId.delete(id);
    return { id: row.id, deleted: true };
  }

  async updateOnboardingRecord(id: string, dto: UpdateOnboardingDto): Promise<TechnicianOnboarding> {
    const row = this.getRequired(id);
    if (row.status !== 'pending' && row.status !== 'reviewing')
      throw new BadRequestException('not an onboarding applicant');
    if (dto.name !== undefined) row.name = dto.name;
    if (dto.phone !== undefined) row.phone = normalizePhone(dto.phone);
    if (this.useDb && this.sb) {
      const { error } = await this.sb
        .from('technicians')
        .update({ name: row.name, phone: row.phone })
        .eq('id', id);
      if (error) throw new BadRequestException(error.message);
      await this.reloadIfDb();
    }
    return this.getOnboardingRecords().find((o) => o.id === id) ?? getOnboardingFromEntity(this.getRequired(id));
  }

  async deleteOnboardingRecord(id: string): Promise<{ id: string; deleted: boolean }> {
    const row = this.getRequired(id);
    if (row.status !== 'pending' && row.status !== 'reviewing')
      throw new BadRequestException('cannot delete onboarding for this technician');
    if (this.useDb && this.sb) {
      const { error } = await this.sb.from('technicians').delete().eq('id', id);
      if (error) throw new BadRequestException(error.message);
      await this.reloadIfDb();
    } else this.byId.delete(id);
    return { id, deleted: true };
  }

  async reviewOnboarding(id: string, dto: ReviewOnboardingDto): Promise<TechnicianOnboarding> {
    const row = this.getRequired(id);
    if (row.status !== 'pending' && row.status !== 'reviewing')
      throw new BadRequestException('technician not in onboarding workflow');
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
      if (error) throw new BadRequestException(error.message);
      await this.reloadIfDb();
    }

    return getOnboardingFromEntity(this.getRequired(id));
  }
}

function getOnboardingFromEntity(t: TechnicianEntity): TechnicianOnboarding {
  const st =
    t.status === 'approved'
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
