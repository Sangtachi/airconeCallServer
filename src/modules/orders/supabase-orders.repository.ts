import { BadRequestException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OrdersRepositoryPort } from './orders.repository.port';
import type { CustomerOrderRow } from './orders.types';

function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v !== '') return Number(v) || fallback;
  return fallback;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function dateOnly(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const s = str(v);
  if (!s) return null;
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function fromDb(rec: Record<string, unknown>): CustomerOrderRow {
  return {
    id: String(rec.id),
    orderNo: String(rec.order_no),
    userId: str(rec.user_id),
    productId: String(rec.product_id),
    productCode: String(rec.product_code_snap),
    productName: String(rec.product_name_snap),
    serviceType: String(rec.service_type),
    airconType: String(rec.aircon_type),
    scheduleType: rec.schedule_type as CustomerOrderRow['scheduleType'],
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
    paymentStatus: rec.payment_status as CustomerOrderRow['paymentStatus'],
    orderStatus: rec.order_status as CustomerOrderRow['orderStatus'],
    assignedTechnicianId: str(rec.assigned_technician_id),
    customerMemo: str(rec.customer_memo),
    adminMemo: str(rec.admin_memo),
    createdAt: String(rec.created_at ?? new Date().toISOString()),
    updatedAt: String(rec.updated_at ?? new Date().toISOString()),
  };
}

function toInsert(rec: CustomerOrderRow): Record<string, unknown> {
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

/** 갱신 시 PK·불변 컬럼 제외(DB 트리거가 updated_at 처리) */
function toUpdate(rec: CustomerOrderRow): Record<string, unknown> {
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

export class SupabaseOrdersRepository implements OrdersRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  async insert(row: CustomerOrderRow): Promise<void> {
    const { error } = await this.client.from('orders').insert(toInsert(row));
    if (error) throw new BadRequestException(error.message);
  }

  async replace(row: CustomerOrderRow): Promise<void> {
    const { error } = await this.client.from('orders').update(toUpdate(row)).eq('id', row.id);
    if (error) throw new BadRequestException(error.message);
  }

  async findById(id: string): Promise<CustomerOrderRow | null> {
    const { data, error } = await this.client.from('orders').select('*').eq('id', id).maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) return null;
    return fromDb(data as Record<string, unknown>);
  }

  async listNewestFirst(): Promise<CustomerOrderRow[]> {
    const { data, error } = await this.client.from('orders').select('*').order('created_at', {
      ascending: false,
    });
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []) as Record<string, unknown>[];
    return rows.map(fromDb);
  }

  async appendMockProductPayment(row: CustomerOrderRow): Promise<void> {
    const existing = await this.client
      .from('payments')
      .select('id')
      .eq('order_id', row.id)
      .eq('payment_type', 'product')
      .eq('status', 'paid')
      .limit(1);
    if (existing.error) throw new BadRequestException(existing.error.message);
    if ((existing.data?.length ?? 0) > 0) return;

    const { error } = await this.client.from('payments').insert({
      order_id: row.id,
      provider: 'mock',
      amount: row.totalPrice,
      status: 'paid',
      payment_type: 'product',
      paid_at: new Date().toISOString(),
    });
    if (error) throw new BadRequestException(error.message);
  }
}
