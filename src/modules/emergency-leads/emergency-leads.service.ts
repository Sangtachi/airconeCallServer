import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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

@Injectable()
export class EmergencyLeadsService {
  constructor(
    @Inject(EMERGENCY_LEADS_REPO)
    private readonly repo: EmergencyLeadsRepositoryPort,
  ) {}

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
      customerPhone: null,
      customerName: null,
      userId: null,
      convertedOrderId: null,
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
    return saved;
  }

  async markTimeout(id: string, dto: PatchEmergencyLeadTimeoutDto): Promise<EmergencyLeadRow> {
    const row = await this.repo.findById(id);
    this.assertSession(row, dto.clientSessionId);
    if (row.matchingStatus === 'contact_saved' || row.matchingStatus === 'converted_to_order') {
      return row;
    }
    if (row.matchingStatus === 'timed_out') return row;
    const nowIso = new Date().toISOString();
    await this.repo.updatePartial(id, {
      matchingStatus: 'timed_out',
      updatedAt: nowIso,
    });
    const next = await this.repo.findById(id);
    if (!next) throw new NotFoundException('emergency lead not found');
    return next;
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
    return next;
  }
}
