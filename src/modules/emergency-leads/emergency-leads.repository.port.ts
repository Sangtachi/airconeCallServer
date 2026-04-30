import type { EmergencyLeadListFilters, EmergencyLeadRow } from './emergency-leads.types';

export const EMERGENCY_LEADS_REPO = Symbol('EMERGENCY_LEADS_REPO');

/** DB / 메모리 공통 레포 계약 */
export interface EmergencyLeadsRepositoryPort {
  insert(row: EmergencyLeadRow): Promise<void>;
  findById(id: string): Promise<EmergencyLeadRow | null>;
  list(filters: EmergencyLeadListFilters): Promise<EmergencyLeadRow[]>;
  updatePartial(id: string, patch: Partial<EmergencyLeadRow>): Promise<void>;
}
