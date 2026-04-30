import { BadRequestException } from '@nestjs/common';
import type { EmergencyLeadsRepositoryPort } from './emergency-leads.repository.port';
import type { EmergencyLeadListFilters, EmergencyLeadRow } from './emergency-leads.types';

function parseIso(ms: unknown): number {
  const t = typeof ms === 'string' ? Date.parse(ms) : NaN;
  return Number.isFinite(t) ? t : NaN;
}

export class MemoryEmergencyLeadsRepository implements EmergencyLeadsRepositoryPort {
  private rows = new Map<string, EmergencyLeadRow>();

  async insert(row: EmergencyLeadRow): Promise<void> {
    this.rows.set(row.id, { ...row });
  }

  async findById(id: string): Promise<EmergencyLeadRow | null> {
    return this.rows.has(id) ? { ...this.rows.get(id)! } : null;
  }

  async list(filters: EmergencyLeadListFilters): Promise<EmergencyLeadRow[]> {
    const fromMs = filters.fromIso ? parseIso(filters.fromIso) : null;
    const toMs = filters.toIso ? parseIso(filters.toIso) : null;
    const out = [...this.rows.values()]
      .filter((r) => {
        if (filters.matchingStatus && r.matchingStatus !== filters.matchingStatus) return false;
        const cms = parseIso(r.createdAt);
        if (fromMs != null && Number.isFinite(cms) && cms < fromMs) return false;
        if (toMs != null && Number.isFinite(cms) && cms > toMs) return false;
        return true;
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return out.map((r) => ({ ...r }));
  }

  async updatePartial(id: string, patch: Partial<EmergencyLeadRow>): Promise<void> {
    const cur = this.rows.get(id);
    if (!cur) throw new BadRequestException(`emergency lead ${id} not found`);
    const next = { ...cur, ...patch, id: cur.id };
    this.rows.set(id, next);
  }
}
