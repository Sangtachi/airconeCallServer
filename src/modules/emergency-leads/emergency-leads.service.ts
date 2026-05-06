import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EmergencyLeadDispatchBridge } from './emergency-lead-dispatch.bridge';
import { PatchEmergencyLeadAdminDto } from './dto/patch-emergency-lead-admin.dto';
import { PatchEmergencyLeadContactDto } from './dto/patch-emergency-lead-contact.dto';
import { PatchEmergencyLeadTimeoutDto } from './dto/patch-emergency-lead-timeout.dto';
import type { CreateEmergencyLeadDto } from './dto/create-emergency-lead.dto';
import { EMERGENCY_LEADS_REPO } from './emergency-leads.repository.port';
import type { EmergencyLeadsRepositoryPort } from './emergency-leads.repository.port';
import type { EmergencyLeadListFilters, EmergencyLeadRow } from './emergency-leads.types';

function normalizeDigitsPhone(v: string): string | null {
  const d = v.replace(/\D/g, '');
  return d.length >= 10 ? d : null;
}

function trimEmptyToNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t === '' ? null : t;
}

/** 마감 스윕 간격(ms). MVP 간격이 너무 길면 운영 감속을 위해 줄일 수 있습니다. */
const FINALIZE_SWEEP_MS = 45_000;

@Injectable()
export class EmergencyLeadsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmergencyLeadsService.name);
  private sweepTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(EMERGENCY_LEADS_REPO)
    private readonly repo: EmergencyLeadsRepositoryPort,
    private readonly dispatchBridge: EmergencyLeadDispatchBridge,
  ) {}

  onModuleInit(): void {
    this.sweepTimer = setInterval(() => {
      void this.runDeadlineSweep().catch((e) =>
        this.logger.warn(`deadline sweep: ${e instanceof Error ? e.message : String(e)}`),
      );
    }, FINALIZE_SWEEP_MS);
  }

  onModuleDestroy(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
  }

  private async finalizeAwait(row: EmergencyLeadRow): Promise<void> {
    try {
      await this.dispatchBridge.tryFinalizeLead(row);
    } catch (err) {
      this.logger.warn(
        `finalize lead=${row.id} — ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** 스윕 전용 비동기(인터벌 블록 방지·오류 무시 로그만) */
  private finalizeSweepFireAndForget(row: EmergencyLeadRow): void {
    void this.finalizeAwait(row);
  }

  private async runDeadlineSweep(): Promise<void> {
    const rows = await this.repo.list({});
    for (const r of rows) {
      this.finalizeSweepFireAndForget(r);
    }
  }

  private quotedFeeKrw(): number {
    const raw = process.env.QUOTED_DISPATCH_FEE_KRW;
    if (raw != null && raw !== '') {
      const n = Number(String(raw).trim());
      if (Number.isFinite(n) && n > 0) return Math.floor(n);
    }
    return 30000;
  }

  private assertSession(row: EmergencyLeadRow | null, session: string): asserts row is EmergencyLeadRow {
    if (!row || row.clientSessionId !== session) {
      throw new NotFoundException('emergency lead not found');
    }
  }

  async create(dto: CreateEmergencyLeadDto) {
    const timeout = Math.min(Math.max(dto.matchingTimeoutSeconds ?? 40, 5), 120);
    const started = new Date();
    const deadline = new Date(started.getTime() + timeout * 1000);
    const id = randomUUID();
    const nowIso = started.toISOString();
    const row: EmergencyLeadRow = {
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

  async patchContact(id: string, dto: PatchEmergencyLeadContactDto): Promise<EmergencyLeadRow> {
    const row = await this.repo.findById(id);
    this.assertSession(row, dto.clientSessionId);

    const hasAnyField =
      dto.customerPhone !== undefined || dto.customerName !== undefined || dto.userId !== undefined;
    if (!hasAnyField) {
      throw new BadRequestException('at least one of customerPhone, customerName, userId is required');
    }

    let phoneNext = row.customerPhone;
    if (dto.customerPhone !== undefined) {
      const raw = dto.customerPhone == null ? '' : String(dto.customerPhone).trim();
      if (raw === '') phoneNext = null;
      else {
        phoneNext = normalizeDigitsPhone(raw);
        if (!phoneNext) throw new BadRequestException('invalid customerPhone');
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
      throw new BadRequestException('contact cannot be empty');
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
    if (!saved) throw new NotFoundException('emergency lead not found');
    await this.finalizeAwait(saved);
    const out = await this.repo.findById(id);
    if (!out) throw new NotFoundException('emergency lead not found');
    return out;
  }

  async markTimeout(id: string, dto: PatchEmergencyLeadTimeoutDto): Promise<EmergencyLeadRow> {
    const row = await this.repo.findById(id);
    this.assertSession(row, dto.clientSessionId);
    const nowIso = new Date().toISOString();

    if (row.matchingStatus === 'converted_to_order') {
      await this.finalizeAwait(row);
      const refreshed = await this.repo.findById(id);
      if (!refreshed) throw new NotFoundException('emergency lead not found');
      return refreshed;
    }

    if (row.matchingStatus === 'contact_saved') {
      await this.finalizeAwait(row);
      const refreshed = await this.repo.findById(id);
      if (!refreshed) throw new NotFoundException('emergency lead not found');
      return refreshed;
    }

    if (row.matchingStatus === 'timed_out') {
      await this.finalizeAwait(row);
      const refreshed = await this.repo.findById(id);
      if (!refreshed) throw new NotFoundException('emergency lead not found');
      return refreshed;
    }

    if (row.matchingStatus !== 'pending') {
      throw new BadRequestException(`unexpected matchingStatus ${row.matchingStatus}`);
    }

    await this.repo.updatePartial(id, {
      matchingStatus: 'timed_out',
      updatedAt: nowIso,
    });
    const next = await this.repo.findById(id);
    if (!next) throw new NotFoundException('emergency lead not found');
    await this.finalizeAwait(next);
    const out = await this.repo.findById(id);
    if (!out) throw new NotFoundException('emergency lead not found');
    return out;
  }

  async listAdmin(filters: EmergencyLeadListFilters): Promise<EmergencyLeadRow[]> {
    return this.repo.list(filters);
  }

  async patchAdmin(id: string, dto: PatchEmergencyLeadAdminDto): Promise<EmergencyLeadRow> {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundException('emergency lead not found');
    if (dto.matchingStatus == null) {
      throw new BadRequestException('matchingStatus is required');
    }
    const nowIso = new Date().toISOString();
    await this.repo.updatePartial(id, {
      matchingStatus: dto.matchingStatus,
      updatedAt: nowIso,
    });
    const next = await this.repo.findById(id);
    if (!next) throw new NotFoundException('emergency lead not found');
    if (dto.matchingStatus === 'converted_to_order') {
      try {
        await this.dispatchBridge.tryFinalizeLeadForced(next);
      } catch (err) {
        this.logger.warn(
          `admin force finalize lead=${id} — ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      const finalized = await this.repo.findById(id);
      if (!finalized) throw new NotFoundException('emergency lead not found');
      return finalized;
    }
    return next;
  }
}
