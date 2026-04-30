"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.looksLikeUuid = looksLikeUuid;
exports.settlementFromOrderRow = settlementFromOrderRow;
exports.paymentFromRow = paymentFromRow;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function looksLikeUuid(id) {
    return UUID.test(id.trim());
}
function mapSettlementStatus(rec) {
    if (rec.paid_at)
        return 'paid';
    const s = String(rec.status ?? 'pending');
    if (s === 'pending' || s === 'confirmed' || s === 'paid' || s === 'held' || s === 'cancelled')
        return s;
    return 'pending';
}
function settlementFromOrderRow(r, orderNo) {
    const grossAmount = Number(r.gross_amount ?? 0);
    const partsAmount = Number(r.material_allowance ?? 0);
    const commissionBase = r.fee_base_amount != null ? Number(r.fee_base_amount) : Math.max(0, grossAmount - partsAmount);
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
function mapDbPaymentStatus(pst) {
    const raw = pst.toLowerCase();
    const by = {
        paid: 'paid',
        failed: 'failed',
        cancelled: 'cancelled',
        canceled: 'cancelled',
        partial_cancelled: 'partial_cancelled',
    };
    return by[raw] ?? 'ready';
}
function paymentFromRow(r, orderNo) {
    const ptype = String(r.payment_type ?? 'product');
    const paymentType = ptype === 'extra' ? 'extra' : ptype === 'cancellation_fee' ? 'cancellation_fee' : 'final';
    const prov = String(r.provider ?? 'manual').toLowerCase();
    const provider = prov === 'toss' ? 'toss' : prov === 'portone' ? 'portone' : 'manual';
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
//# sourceMappingURL=admin-payments-settlements.db.js.map