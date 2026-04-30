import type { Payment, PaymentStatus, Settlement, SettlementStatus } from './admin.types';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function looksLikeUuid(id: string): boolean {
  return UUID.test(id.trim());
}

function mapSettlementStatus(rec: Record<string, unknown>): SettlementStatus {
  if (rec.paid_at) return 'paid';
  const s = String(rec.status ?? 'pending');
  if (s === 'pending' || s === 'confirmed' || s === 'paid' || s === 'held' || s === 'cancelled') return s;
  return 'pending';
}

export function settlementFromOrderRow(
  r: Record<string, unknown>,
  orderNo: string,
): Settlement {
  const grossAmount = Number(r.gross_amount ?? 0);
  const partsAmount = Number(r.material_allowance ?? 0);
  const commissionBase =
    r.fee_base_amount != null ? Number(r.fee_base_amount) : Math.max(0, grossAmount - partsAmount);
  return {
    id: String(r.id),
    bookingId: orderNo || String(r.order_id),
    technicianId: String(r.technician_id ?? ''),
    grossAmount,
    partsAmount,
    commissionBase,
    platformFee: Number(r.platform_fee ?? 0),
    technicianAmount: Number(r.technician_payout ?? 0),
    adjustmentAmount: 0,
    status: mapSettlementStatus(r),
    orderId: String(r.order_id),
    dataSource: 'database',
  };
}

function mapDbPaymentStatus(pst: string): PaymentStatus {
  const raw = pst.toLowerCase();
  const by: Record<string, PaymentStatus> = {
    paid: 'paid',
    failed: 'failed',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    partial_cancelled: 'partial_cancelled',
  };
  return by[raw] ?? 'ready';
}

export function paymentFromRow(r: Record<string, unknown>, orderNo: string): Payment {
  const ptype = String(r.payment_type ?? 'product');
  const paymentType: Payment['paymentType'] =
    ptype === 'extra' ? 'extra' : ptype === 'cancellation_fee' ? 'cancellation_fee' : 'final';
  const prov = String(r.provider ?? 'manual').toLowerCase();
  const provider =
    prov === 'toss' ? 'toss' : prov === 'portone' ? 'portone' : ('manual' as Payment['provider']);
  return {
    id: String(r.id),
    bookingId: orderNo || String(r.order_id ?? ''),
    amount: Number(r.amount ?? 0),
    paymentType,
    provider,
    status: mapDbPaymentStatus(String(r.status ?? 'ready')),
    orderId: String(r.order_id ?? ''),
    dataSource: 'database',
  };
}
