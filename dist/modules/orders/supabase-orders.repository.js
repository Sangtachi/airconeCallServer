"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseOrdersRepository = void 0;
const common_1 = require("@nestjs/common");
function num(v, fallback = 0) {
    if (typeof v === 'number' && Number.isFinite(v))
        return v;
    if (typeof v === 'string' && v !== '')
        return Number(v) || fallback;
    return fallback;
}
function str(v) {
    if (v == null)
        return null;
    const s = String(v).trim();
    return s === '' ? null : s;
}
function dateOnly(v) {
    if (v == null)
        return null;
    if (v instanceof Date && !Number.isNaN(v.getTime()))
        return v.toISOString().slice(0, 10);
    const s = str(v);
    if (!s)
        return null;
    return s.length >= 10 ? s.slice(0, 10) : s;
}
function fromDb(rec) {
    return {
        id: String(rec.id),
        orderNo: String(rec.order_no),
        userId: str(rec.user_id),
        productId: String(rec.product_id),
        productCode: String(rec.product_code_snap),
        productName: String(rec.product_name_snap),
        serviceType: String(rec.service_type),
        airconType: String(rec.aircon_type),
        scheduleType: rec.schedule_type,
        desiredDate: dateOnly(rec.desired_date),
        desiredTimeSlot: str(rec.desired_time_slot),
        addressSummary: String(rec.address_summary),
        sido: str(rec.sido),
        sigungu: str(rec.sigungu),
        dong: str(rec.dong),
        detailAddress: str(rec.detail_address),
        customerName: String(rec.customer_name),
        customerPhone: String(rec.customer_phone),
        basePrice: num(rec.base_price),
        sameDayExtraPrice: num(rec.same_day_extra_price),
        productTotalPrice: num(rec.product_total_price),
        extraTotalPrice: num(rec.extra_total_price),
        discountAmount: num(rec.discount_amount),
        totalPrice: num(rec.total_price),
        paymentStatus: rec.payment_status,
        orderStatus: rec.order_status,
        assignedTechnicianId: str(rec.assigned_technician_id),
        customerMemo: str(rec.customer_memo),
        adminMemo: str(rec.admin_memo),
        createdAt: String(rec.created_at ?? new Date().toISOString()),
        updatedAt: String(rec.updated_at ?? new Date().toISOString()),
    };
}
function toInsert(rec) {
    return {
        id: rec.id,
        order_no: rec.orderNo,
        user_id: rec.userId ?? null,
        product_id: rec.productId,
        service_type: rec.serviceType,
        aircon_type: rec.airconType,
        schedule_type: rec.scheduleType,
        desired_date: rec.desiredDate ?? null,
        desired_time_slot: rec.desiredTimeSlot ?? null,
        address_summary: rec.addressSummary,
        sido: rec.sido ?? null,
        sigungu: rec.sigungu ?? null,
        dong: rec.dong ?? null,
        detail_address: rec.detailAddress ?? null,
        customer_name: rec.customerName,
        customer_phone: rec.customerPhone,
        product_code_snap: rec.productCode,
        product_name_snap: rec.productName,
        base_price: rec.basePrice,
        same_day_extra_price: rec.sameDayExtraPrice,
        product_total_price: rec.productTotalPrice,
        extra_total_price: rec.extraTotalPrice,
        discount_amount: rec.discountAmount,
        total_price: rec.totalPrice,
        payment_status: rec.paymentStatus,
        order_status: rec.orderStatus,
        assigned_technician_id: rec.assignedTechnicianId ?? null,
        customer_memo: rec.customerMemo ?? null,
        admin_memo: rec.adminMemo ?? null,
    };
}
function toUpdate(rec) {
    return {
        user_id: rec.userId ?? null,
        service_type: rec.serviceType,
        aircon_type: rec.airconType,
        schedule_type: rec.scheduleType,
        desired_date: rec.desiredDate ?? null,
        desired_time_slot: rec.desiredTimeSlot ?? null,
        address_summary: rec.addressSummary,
        sido: rec.sido ?? null,
        sigungu: rec.sigungu ?? null,
        dong: rec.dong ?? null,
        detail_address: rec.detailAddress ?? null,
        customer_name: rec.customerName,
        customer_phone: rec.customerPhone,
        product_code_snap: rec.productCode,
        product_name_snap: rec.productName,
        base_price: rec.basePrice,
        same_day_extra_price: rec.sameDayExtraPrice,
        product_total_price: rec.productTotalPrice,
        extra_total_price: rec.extraTotalPrice,
        discount_amount: rec.discountAmount,
        total_price: rec.totalPrice,
        payment_status: rec.paymentStatus,
        order_status: rec.orderStatus,
        assigned_technician_id: rec.assignedTechnicianId ?? null,
        customer_memo: rec.customerMemo ?? null,
        admin_memo: rec.adminMemo ?? null,
    };
}
class SupabaseOrdersRepository {
    constructor(client) {
        this.client = client;
    }
    async insert(row) {
        const { error } = await this.client.from('orders').insert(toInsert(row));
        if (error)
            throw new common_1.BadRequestException(error.message);
    }
    async replace(row) {
        const { error } = await this.client.from('orders').update(toUpdate(row)).eq('id', row.id);
        if (error)
            throw new common_1.BadRequestException(error.message);
    }
    async findById(id) {
        const { data, error } = await this.client.from('orders').select('*').eq('id', id).maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data)
            return null;
        return fromDb(data);
    }
    async listNewestFirst() {
        const { data, error } = await this.client.from('orders').select('*').order('created_at', {
            ascending: false,
        });
        if (error)
            throw new common_1.BadRequestException(error.message);
        const rows = (data ?? []);
        return rows.map(fromDb);
    }
    async appendMockProductPayment(row) {
        const existing = await this.client
            .from('payments')
            .select('id')
            .eq('order_id', row.id)
            .eq('payment_type', 'product')
            .eq('status', 'paid')
            .limit(1);
        if (existing.error)
            throw new common_1.BadRequestException(existing.error.message);
        if ((existing.data?.length ?? 0) > 0)
            return;
        const { error } = await this.client.from('payments').insert({
            order_id: row.id,
            provider: 'mock',
            amount: row.totalPrice,
            status: 'paid',
            payment_type: 'product',
            paid_at: new Date().toISOString(),
        });
        if (error)
            throw new common_1.BadRequestException(error.message);
    }
}
exports.SupabaseOrdersRepository = SupabaseOrdersRepository;
//# sourceMappingURL=supabase-orders.repository.js.map