import type { SupabaseClient } from '@supabase/supabase-js';
import type { TechnicianCapability, TechnicianEntity, TechnicianWorkStatus } from './technician.types';

function num(v: unknown, d = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v !== '') return Number(v) || d;
  return d;
}

export function technicianFromRow(
  row: Record<string, unknown>,
  capabilities: TechnicianCapability[],
  regions: string[] = [],
  availability: TechnicianEntity['availability'] = [],
  documents: TechnicianEntity['documents'] = [],
): TechnicianEntity {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone),
    passwordHash: row.password_hash == null ? null : String(row.password_hash),
    businessType: (String(row.business_type || 'individual') as TechnicianEntity['businessType']) || 'individual',
    businessNumber: row.business_number == null ? null : String(row.business_number),
    careerYears: row.career_years == null ? null : num(row.career_years, 0),
    status: row.status as TechnicianEntity['status'],
    workStatus: row.work_status as TechnicianWorkStatus,
    baseRegion: row.base_region == null ? null : String(row.base_region),
    bankName: row.bank_name == null ? null : String(row.bank_name),
    bankAccount: row.bank_account == null ? null : String(row.bank_account),
    bankHolder: row.bank_holder == null ? null : String(row.bank_holder),
    bankVerificationStatus: (String(row.bank_verification_status || 'unsubmitted') as TechnicianEntity['bankVerificationStatus']) || 'unsubmitted',
    bankVerifiedAt: row.bank_verified_at == null ? null : String(row.bank_verified_at),
    bankRejectReason: row.bank_reject_reason == null ? null : String(row.bank_reject_reason),
    platformFeeRate: num(row.platform_fee_rate, 20),
    profilePhotoUrl: row.profile_photo_url == null ? null : String(row.profile_photo_url),
    rejectReason: row.reject_reason == null ? null : String(row.reject_reason),
    memo: row.memo == null ? null : String(row.memo),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    capabilities,
    regions,
    availability,
    documents,
  };
}

export async function fetchCapabilitiesBulk(
  sb: SupabaseClient,
  technicianIds: string[],
): Promise<Map<string, TechnicianCapability[]>> {
  const map = new Map<string, TechnicianCapability[]>();
  technicianIds.forEach((id) => map.set(id, []));
  if (technicianIds.length === 0) return map;
  const { data, error } = await sb.from('technician_capabilities').select('*').in('technician_id', technicianIds);
  if (error) throw new Error(error.message);
  for (const r of data ?? []) {
    const row = r as Record<string, unknown>;
    const id = String(row.technician_id);
    const list = map.get(id) ?? [];
    list.push({
      serviceType: row.service_type as TechnicianCapability['serviceType'],
      airconType: row.aircon_type as TechnicianCapability['airconType'],
    });
    map.set(id, list);
  }
  return map;
}

export function technicianInsertPayload(e: Omit<TechnicianEntity, 'capabilities'>) {
  return {
    id: e.id,
    name: e.name,
    phone: e.phone,
    password_hash: e.passwordHash,
    business_type: e.businessType,
    business_number: e.businessNumber,
    career_years: e.careerYears,
    status: e.status,
    work_status: e.workStatus,
    base_region: e.baseRegion,
    bank_name: e.bankName,
    bank_account: e.bankAccount,
    bank_holder: e.bankHolder,
    bank_verification_status: e.bankVerificationStatus,
    bank_verified_at: e.bankVerifiedAt,
    bank_reject_reason: e.bankRejectReason,
    platform_fee_rate: e.platformFeeRate,
    profile_photo_url: e.profilePhotoUrl,
    reject_reason: e.rejectReason,
    memo: e.memo,
    available_same_day: e.availability.includes('same_day'),
    available_reservation: e.availability.includes('reservation'),
    available_weekend: e.availability.includes('weekend'),
    available_night: e.availability.includes('night'),
  };
}
