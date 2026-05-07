import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { hashPassword, verifyPassword } from '../../common/password-hash';
import { SUPABASE_ADMIN } from '../../database/database.tokens';
import {
  CreateTechnicianDto,
  ReviewOnboardingDto,
  UpdateOnboardingDto,
  UpdateTechnicianDto,
} from '../admin/admin.dto';
import type { TechnicianOnboarding } from '../admin/admin.types';
import type { TechnicianCapability, TechnicianEntity } from './technician.types';
import { TechnicianDocumentPresignDto, TechnicianSignupDto } from './technician.dto';
import { fetchCapabilitiesBulk, technicianFromRow, technicianInsertPayload } from './technicians-db.mapper';

function normalizePhone(p: string): string {
  return String(p ?? '').replace(/\D/g, '');
}

function cleanList(v: string[] | undefined, fallback?: string | null): string[] {
  const rows = (v ?? [])
    .map((x) => String(x).trim())
    .filter(Boolean);
  if (rows.length > 0) return [...new Set(rows)];
  const f = fallback?.trim();
  return f ? [f] : [];
}

function availabilityFromSignup(dto: TechnicianSignupDto): TechnicianEntity['availability'] {
  const out: TechnicianEntity['availability'] = [];
  if (dto.availableSameDay) out.push('same_day');
  if (dto.availableReservation ?? true) out.push('reservation');
  if (dto.availableWeekend) out.push('weekend');
  if (dto.availableNight) out.push('night');
  return out.length > 0 ? out : ['reservation'];
}

function isMissingSupabaseRelation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /schema cache|could not find the table|relation .* does not exist/i.test(message);
}

function documentExtFromMime(mime: string | undefined): string {
  const normalized = String(mime ?? '').toLowerCase().split(';')[0].trim();
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  return map[normalized] ?? 'bin';
}

function technicianDocumentsBucketName(): string {
  return (process.env.SUPABASE_STORAGE_TECHNICIAN_DOCUMENTS_BUCKET ?? 'technician-documents').trim() || 'technician-documents';
}

export function toAdminTechnicianBrief(e: TechnicianEntity) {
  return {
    id: e.id,
    name: e.name,
    phone: e.phone,
    status: e.status,
    workStatus: e.workStatus,
    baseRegion: e.baseRegion ?? undefined,
    bankName: e.bankName ?? undefined,
    bankHolder: e.bankHolder ?? undefined,
    bankVerificationStatus: e.bankVerificationStatus,
    feeRate: e.platformFeeRate,
    regions: e.regions,
    capabilities: e.capabilities,
    documents: e.documents.map((d) => ({ type: d.documentType, status: d.status })),
  };
}

@Injectable()
export class TechniciansService implements OnModuleInit {
  private readonly logger = new Logger(TechniciansService.name);
  private byId = new Map<string, TechnicianEntity>();

  constructor(@Inject(SUPABASE_ADMIN) private readonly sb: SupabaseClient | null) {}

  private db(): SupabaseClient {
    if (!this.sb) {
      throw new ServiceUnavailableException(
        '서버 DB 연결 설정이 필요합니다. 로컬 .env.local에 Supabase 값을 넣고 서버를 재시작해 주세요.',
      );
    }
    return this.sb;
  }

  private ensureConfigured(): void {
    if (!this.sb) {
      throw new ServiceUnavailableException(
        '서버 DB 연결 설정이 필요합니다. 로컬 .env.local에 Supabase 값을 넣고 서버를 재시작해 주세요.',
      );
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.sb) {
      this.logger.warn('Technicians: Supabase 미설정 — 기사 API는 호출 시 503을 반환합니다.');
      return;
    }
    await this.hydrateFromDatabase();
    this.logger.log(`Technicians: Supabase 로드 ${this.byId.size}건`);
  }

  async presignDocumentUpload(dto: TechnicianDocumentPresignDto): Promise<{
    signedUrl: string;
    token: string;
    path: string;
    bucket: string;
    publicUrl: string | null;
    expiresInHours: number;
  }> {
    const sb = this.db();
    const bucket = technicianDocumentsBucketName();
    const ext = documentExtFromMime(dto.mimeType);
    const path = `onboarding/${dto.documentType}/${randomUUID().replace(/-/g, '')}.${ext}`;
    const { data, error } = await sb.storage.from(bucket).createSignedUploadUrl(path, { upsert: true });
    if (error || !data) throw new BadRequestException(error?.message ?? 'document presign failed');
    const { data: pub } = sb.storage.from(bucket).getPublicUrl(path);
    return {
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      bucket,
      publicUrl: pub?.publicUrl?.trim() || null,
      expiresInHours: 2,
    };
  }

  private async hydrateFromDatabase(): Promise<void> {
    const sb = this.db();
    const { data: rows, error } = await sb.from('technicians').select('*').order('created_at');
    if (error) throw new BadRequestException(error.message);
    const ids = (rows ?? []).map((r: { id: string }) => String(r.id));
    const [capMap, regionMap, availabilityMap, docMap] = await Promise.all([
      this.fetchOptionalTechnicianChildTable<TechnicianCapability>(
        'technician_capabilities',
        ids,
        () => this.emptyMap<TechnicianCapability>(ids),
        () => fetchCapabilitiesBulk(sb, ids),
      ),
      this.fetchOptionalTechnicianChildTable<string>(
        'technician_regions',
        ids,
        () => this.emptyMap<string>(ids),
        () => this.fetchRegionsBulk(ids),
      ),
      this.fetchOptionalTechnicianChildTable<TechnicianEntity['availability'][number]>(
        'technician_availability',
        ids,
        () => this.emptyMap<TechnicianEntity['availability'][number]>(ids),
        () => this.fetchAvailabilityBulk(ids),
      ),
      this.fetchOptionalTechnicianChildTable<TechnicianEntity['documents'][number]>(
        'technician_documents',
        ids,
        () => this.emptyMap<TechnicianEntity['documents'][number]>(ids),
        () => this.fetchDocumentsBulk(ids),
      ),
    ]);
    this.byId.clear();
    for (const r of rows ?? []) {
      const rec = r as Record<string, unknown>;
      const id = String(rec.id);
      const entity = technicianFromRow(
        rec,
        capMap.get(id) ?? [],
        regionMap.get(id) ?? [],
        availabilityMap.get(id) ?? [],
        docMap.get(id) ?? [],
      );
      this.byId.set(id, entity);
    }
  }

  private emptyMap<T>(technicianIds: string[]): Map<string, T[]> {
    const map = new Map<string, T[]>();
    technicianIds.forEach((id) => map.set(id, []));
    return map;
  }

  private async fetchOptionalTechnicianChildTable<T>(
    tableName: string,
    technicianIds: string[],
    fallback: () => Map<string, T[]>,
    read: () => Promise<Map<string, T[]>>,
  ): Promise<Map<string, T[]>> {
    try {
      return await read();
    } catch (error) {
      if (!isMissingSupabaseRelation(error)) throw error;
      this.logger.warn(
        `Technicians: ${tableName} 테이블 없음 — sql/auth_password_patch_and_samples.sql 적용 전까지 해당 관계는 빈 값으로 로드합니다.`,
      );
      return fallback();
    }
  }

  private async fetchRegionsBulk(technicianIds: string[]): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    technicianIds.forEach((id) => map.set(id, []));
    if (technicianIds.length === 0) return map;
    const { data, error } = await this.db()
      .from('technician_regions')
      .select('technician_id, region')
      .in('technician_id', technicianIds);
    if (error) throw new BadRequestException(error.message);
    for (const r of data ?? []) {
      const id = String((r as { technician_id: string }).technician_id);
      const list = map.get(id) ?? [];
      list.push(String((r as { region: string }).region));
      map.set(id, list);
    }
    return map;
  }

  private async fetchAvailabilityBulk(
    technicianIds: string[],
  ): Promise<Map<string, TechnicianEntity['availability']>> {
    const map = new Map<string, TechnicianEntity['availability']>();
    technicianIds.forEach((id) => map.set(id, []));
    if (technicianIds.length === 0) return map;
    const { data, error } = await this.db()
      .from('technician_availability')
      .select('technician_id, availability_code')
      .in('technician_id', technicianIds);
    if (error) throw new BadRequestException(error.message);
    for (const r of data ?? []) {
      const id = String((r as { technician_id: string }).technician_id);
      const list = map.get(id) ?? [];
      list.push((r as { availability_code: TechnicianEntity['availability'][number] }).availability_code);
      map.set(id, list);
    }
    return map;
  }

  private async fetchDocumentsBulk(technicianIds: string[]): Promise<Map<string, TechnicianEntity['documents']>> {
    const map = new Map<string, TechnicianEntity['documents']>();
    technicianIds.forEach((id) => map.set(id, []));
    if (technicianIds.length === 0) return map;
    const { data, error } = await this.db()
      .from('technician_documents')
      .select('id, technician_id, document_type, file_url, status')
      .in('technician_id', technicianIds);
    if (error) throw new BadRequestException(error.message);
    for (const r of data ?? []) {
      const rec = r as Record<string, unknown>;
      const id = String(rec.technician_id);
      const list = map.get(id) ?? [];
      list.push({
        id: String(rec.id),
        documentType: String(rec.document_type),
        fileUrl: String(rec.file_url),
        status: rec.status as TechnicianEntity['documents'][number]['status'],
      });
      map.set(id, list);
    }
    return map;
  }

  private async reload(): Promise<void> {
    await this.hydrateFromDatabase();
  }

  approvedCount(): number {
    this.ensureConfigured();
    return [...this.byId.values()].filter((t) => t.status === 'approved').length;
  }

  listAllBrief() {
    this.ensureConfigured();
    return [...this.byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toAdminTechnicianBrief);
  }

  getOnboardingRecords(): TechnicianOnboarding[] {
    this.ensureConfigured();
    return [...this.byId.values()]
      .filter((t) => t.status === 'pending' || t.status === 'reviewing')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(getOnboardingFromEntity);
  }

  signup(dto: TechnicianSignupDto): Promise<{ id: string; status: string }> {
    this.ensureConfigured();
    const phone = normalizePhone(dto.phone);
    if (phone.length < 9) throw new BadRequestException('invalid phone');
    const id = randomUUID();
    const now = new Date().toISOString();
    const regions = cleanList(dto.regions, dto.baseRegion);
    const entity: TechnicianEntity = {
      id,
      name: dto.name.trim(),
      phone,
      passwordHash: hashPassword(dto.password),
      businessType: dto.businessType ?? 'individual',
      businessNumber: dto.businessNumber?.trim() || null,
      careerYears: null,
      status: 'pending',
      workStatus: 'offline',
      baseRegion: dto.baseRegion?.trim() || regions[0] || null,
      bankName: dto.bankName?.trim() || null,
      bankAccount: dto.bankAccount?.trim() || null,
      bankHolder: dto.bankHolder?.trim() || null,
      bankVerificationStatus: dto.bankName || dto.bankAccount || dto.bankHolder ? 'pending' : 'unsubmitted',
      bankVerifiedAt: null,
      bankRejectReason: null,
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
      documents:
        dto.documents?.map((d) => ({
          id: randomUUID(),
          documentType: d.documentType,
          fileUrl: d.fileUrl.trim(),
          status: 'pending' as const,
        })) ?? [],
    };

    return this.persistNewTechnician(entity);
  }

  private async persistNewTechnician(entity: TechnicianEntity): Promise<{ id: string; status: string }> {
    const sb = this.db();
    const { error: e1 } = await sb.from('technicians').insert(technicianInsertPayload(entity));
    if (e1) throw new BadRequestException(e1.message);
    if (entity.capabilities.length > 0) {
      const { error } = await sb.from('technician_capabilities').insert(
        entity.capabilities.map((c) => ({
          technician_id: entity.id,
          service_type: c.serviceType,
          aircon_type: c.airconType,
        })),
      );
      if (error) throw new BadRequestException(error.message);
    }
    if (entity.regions.length > 0) {
      const { error } = await sb.from('technician_regions').insert(
        entity.regions.map((region) => ({
          technician_id: entity.id,
          region,
        })),
      );
      if (error) throw new BadRequestException(error.message);
    }
    if (entity.availability.length > 0) {
      const { error } = await sb.from('technician_availability').insert(
        entity.availability.map((availabilityCode) => ({
          technician_id: entity.id,
          availability_code: availabilityCode,
        })),
      );
      if (error) throw new BadRequestException(error.message);
    }
    if (entity.documents.length > 0) {
      const { error } = await sb.from('technician_documents').insert(
        entity.documents.map((doc) => ({
          id: doc.id,
          technician_id: entity.id,
          document_type: doc.documentType,
          file_url: doc.fileUrl,
          status: doc.status,
        })),
      );
      if (error) throw new BadRequestException(error.message);
    }
    await this.reload();
    return { id: entity.id, status: entity.status };
  }

  findApprovedByCredentials(phone: string, password: string): TechnicianEntity | null {
    this.ensureConfigured();
    const p = normalizePhone(phone);
    const row = [...this.byId.values()].find((t) => normalizePhone(t.phone) === p && t.status === 'approved') ?? null;
    if (!row || !verifyPassword(password, row.passwordHash)) return null;
    return row;
  }

  getApprovedById(id: string): TechnicianEntity | null {
    this.ensureConfigured();
    const t = this.byId.get(id);
    if (!t || t.status !== 'approved') return null;
    return t;
  }

  async updateWorkStatus(
    id: string,
    workStatus: TechnicianEntity['workStatus'],
  ): Promise<Pick<TechnicianEntity, 'id' | 'workStatus' | 'status' | 'name'>> {
    const row = this.getApprovedById(id);
    if (!row) throw new NotFoundException('approved technician not found');
    const { error } = await this.db()
      .from('technicians')
      .update({ work_status: workStatus })
      .eq('id', id);
    if (error) throw new BadRequestException(error.message);
    await this.reload();
    const next = this.getRequired(id);
    return {
      id: next.id,
      name: next.name,
      status: next.status,
      workStatus: next.workStatus,
    };
  }

  findById(id: string): TechnicianEntity | undefined {
    this.ensureConfigured();
    return this.byId.get(id);
  }

  createByAdmin(dto: CreateTechnicianDto): Promise<ReturnType<typeof toAdminTechnicianBrief>> {
    this.ensureConfigured();
    const p = normalizePhone(dto.phone);
    const entity: TechnicianEntity = {
      id: randomUUID(),
      name: dto.name,
      phone: p,
      passwordHash: dto.password ? hashPassword(dto.password) : null,
      businessType: 'individual',
      businessNumber: null,
      careerYears: null,
      status: 'pending',
      workStatus: 'offline',
      baseRegion: dto.baseRegion ?? null,
      bankName: null,
      bankAccount: null,
      bankHolder: null,
      bankVerificationStatus: 'unsubmitted',
      bankVerifiedAt: null,
      bankRejectReason: null,
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

  private getRequired(id: string): TechnicianEntity {
    this.ensureConfigured();
    const t = this.byId.get(id);
    if (!t) throw new NotFoundException('technician not found');
    return t;
  }

  async updateByAdmin(id: string, dto: UpdateTechnicianDto): Promise<ReturnType<typeof toAdminTechnicianBrief>> {
    const row = this.getRequired(id);
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.phone !== undefined) patch.phone = normalizePhone(dto.phone);
    if (dto.password !== undefined && dto.password.trim() !== '') {
      patch.password_hash = hashPassword(dto.password);
      patch.password_updated_at = new Date().toISOString();
    }
    if (dto.baseRegion !== undefined) patch.base_region = dto.baseRegion ?? null;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.bankVerificationStatus !== undefined) {
      patch.bank_verification_status = dto.bankVerificationStatus;
      patch.bank_verified_at = dto.bankVerificationStatus === 'verified' ? new Date().toISOString() : null;
      if (dto.bankVerificationStatus !== 'rejected') patch.bank_reject_reason = null;
    }
    if (dto.bankRejectReason !== undefined) patch.bank_reject_reason = dto.bankRejectReason?.trim() || null;
    patch.reject_reason = null;
    const { error } = await this.db().from('technicians').update(patch).eq('id', row.id);
    if (error) throw new BadRequestException(error.message);
    await this.reload();
    return toAdminTechnicianBrief(this.getRequired(id));
  }

  async deleteByAdmin(id: string): Promise<{ id: string; deleted: boolean }> {
    const row = this.getRequired(id);
    const { error } = await this.db().from('technicians').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    await this.reload();
    return { id: row.id, deleted: true };
  }

  async updateOnboardingRecord(id: string, dto: UpdateOnboardingDto): Promise<TechnicianOnboarding> {
    const row = this.getRequired(id);
    if (row.status !== 'pending' && row.status !== 'reviewing')
      throw new BadRequestException('not an onboarding applicant');
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.phone !== undefined) patch.phone = normalizePhone(dto.phone);
    const { error } = await this.db().from('technicians').update(patch).eq('id', id);
    if (error) throw new BadRequestException(error.message);
    await this.reload();
    return getOnboardingFromEntity(this.getRequired(id));
  }

  async deleteOnboardingRecord(id: string): Promise<{ id: string; deleted: boolean }> {
    const row = this.getRequired(id);
    if (row.status !== 'pending' && row.status !== 'reviewing')
      throw new BadRequestException('cannot delete onboarding for this technician');
    const { error } = await this.db().from('technicians').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    await this.reload();
    return { id, deleted: true };
  }

  async reviewOnboarding(id: string, dto: ReviewOnboardingDto): Promise<TechnicianOnboarding> {
    const row = this.getRequired(id);
    if (row.status !== 'pending' && row.status !== 'reviewing')
      throw new BadRequestException('technician not in onboarding workflow');
    const status =
      dto.status === 'approved' ? 'approved' : dto.status === 'rejected' ? 'rejected' : 'reviewing';
    const { error } = await this.db()
      .from('technicians')
      .update({
        status,
        reject_reason: dto.rejectReason ?? null,
      })
      .eq('id', id);
    if (error) throw new BadRequestException(error.message);
    await this.reload();
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
    documents: t.documents.map((d) => `${d.documentType}:${d.status}`),
    rejectReason: t.rejectReason ?? undefined,
    createdAt: t.createdAt,
  };
}
