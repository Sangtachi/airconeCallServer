import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../database/database.tokens';
import { TechniciansService } from '../technicians/technicians.service';
import { looksLikeUuid, paymentFromRow, settlementFromOrderRow } from './admin-payments-settlements.db';
import { AdminLog, Booking, BookingStatus, Coupon, Member, Payment, Settlement } from './admin.types';
import type { AdminSettlementContext } from './admin.actor';
import {
  AssignTechnicianDto,
  CancelPaymentDto,
  ConfirmSettlementDto,
  CreateBookingDto,
  CreateCouponDto,
  CreateMemberDto,
  UpdateBookingDto,
  UpdateBookingStatusDto,
  UpdateCouponDto,
  UpdateMemberDto,
  UpdateSettlementStatusDto,
} from './admin.dto';
import { SettlementAuditService } from './settlement-audit.service';

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  created: ['payment_pending', 'cancelled'],
  payment_pending: ['paid', 'cancelled'],
  paid: ['matching', 'cancelled', 'refunded'],
  matching: ['assigned', 'cancelled', 'refunded'],
  assigned: ['accepted', 'cancelled', 'refunded'],
  accepted: ['on_the_way', 'cancelled'],
  on_the_way: ['arrived', 'cancelled'],
  arrived: ['diagnosed', 'cancelled'],
  diagnosed: ['working', 'extra_payment_pending', 'cancelled'],
  extra_payment_pending: ['working', 'cancelled'],
  working: ['completed', 'cancelled'],
  completed: ['settlement_pending', 'refunded'],
  cancelled: [],
  refunded: ['settlement_pending'],
  settlement_pending: ['settled'],
  settled: [],
};

@Injectable()
export class AdminService {
  constructor(
    private readonly techniciansRegistry: TechniciansService,
    @Inject(SUPABASE_ADMIN) private readonly sb: SupabaseClient | null,
    private readonly settlementAudit: SettlementAuditService,
  ) {}

  private seq = 1;
  private bookingSeq = 1;
  private logs: AdminLog[] = [];
  private idempotency = new Map<string, unknown>();

  private members: Member[] = [
    {
      id: 'm_1',
      name: '홍길동',
      phone: '01012345678',
      role: 'customer',
      status: 'active',
      marketingConsent: true,
      createdAt: new Date().toISOString(),
    },
  ];

  private bookings: Booking[] = [
    {
      id: 'b_1',
      bookingNo: this.nextBookingNo(),
      customerName: '홍길동',
      customerPhone: '01012345678',
      region: '경기 파주시',
      symptomCode: 'no_cold_air',
      urgency: 'now',
      status: 'matching',
      assignedTechnicianId: null,
      paymentStatus: 'paid',
    },
  ];

  private payments: Payment[] = [
    { id: 'p_1', bookingId: 'b_1', amount: 40000, paymentType: 'deposit', provider: 'manual', status: 'paid' },
  ];
  private settlements: Settlement[] = [
    {
      id: 's_1',
      bookingId: 'b_1',
      technicianId: 't_1',
      grossAmount: 150000,
      partsAmount: 40000,
      commissionBase: 110000,
      platformFee: 22000,
      technicianAmount: 128000,
      adjustmentAmount: 0,
      status: 'pending',
    },
  ];
  private coupons: Coupon[] = [];

  async getDashboard() {
    let paidAmount = this.payments.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
    let settlementPending = this.settlements.filter((s) => s.status === 'pending').length;
    if (this.sb) {
      const { data: paidRows } = await this.sb.from('payments').select('amount').eq('status', 'paid');
      if (paidRows?.length) {
        paidAmount = paidRows.reduce((acc, r) => acc + Number((r as { amount: number }).amount ?? 0), 0);
      }
      const { count } = await this.sb
        .from('order_settlements')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (count != null) settlementPending = count;
    }
    return {
      todayBookings: this.bookings.length,
      members: this.members.length,
      technicians: this.techniciansRegistry.approvedCount(),
      matching: this.bookings.filter((b) => b.status === 'matching').length,
      completed: this.bookings.filter((b) => b.status === 'completed').length,
      paidAmount,
      settlementPending,
      /** Supabase orders row count (관제용) */
      supabaseOrdersApprox: this.sb
        ? (await this.sb.from('orders').select('id', { count: 'exact', head: true })).count ?? null
        : null,
    };
  }

  getMembers() { return this.members; }
  getMember(id: string) {
    const row = this.members.find((m) => m.id === id);
    if (!row) throw new NotFoundException('member not found');
    return row;
  }
  createMember(dto: CreateMemberDto) {
    const row: Member = {
      id: `m_${++this.seq}`,
      name: dto.name,
      phone: dto.phone,
      role: 'customer',
      status: 'active',
      marketingConsent: false,
      createdAt: new Date().toISOString(),
    };
    this.members.unshift(row);
    this.audit('create_member', 'members', row.id, dto);
    return row;
  }
  updateMember(id: string, dto: UpdateMemberDto) {
    const row = this.getMember(id);
    Object.assign(row, dto);
    this.audit('update_member', 'members', id, dto);
    return row;
  }

  deleteMember(id: string) {
    const i = this.members.findIndex((m) => m.id === id);
    if (i === -1) throw new NotFoundException('member not found');
    this.members.splice(i, 1);
    this.audit('delete_member', 'members', id);
    return { id, deleted: true };
  }

  getBookings() { return this.bookings; }
  getBooking(id: string) {
    const row = this.bookings.find((b) => b.id === id);
    if (!row) throw new NotFoundException('booking not found');
    return row;
  }

  assignTechnician(id: string, dto: AssignTechnicianDto) {
    const booking = this.getBooking(id);
    const tech = this.techniciansRegistry.findById(dto.technicianId);
    if (!tech || tech.status !== 'approved') {
      throw new NotFoundException('technician not found or not approved');
    }
    booking.assignedTechnicianId = dto.technicianId;
    booking.status = 'assigned';
    this.audit('assign_technician', 'bookings', id, dto);
    return booking;
  }

  unassignTechnician(id: string) {
    const booking = this.getBooking(id);
    booking.assignedTechnicianId = null;
    booking.status = 'matching';
    this.audit('unassign_technician', 'bookings', id);
    return booking;
  }

  updateBookingStatus(id: string, dto: UpdateBookingStatusDto) {
    const booking = this.getBooking(id);
    if (!allowedTransitions[booking.status].includes(dto.toStatus)) {
      throw new BadRequestException(`invalid transition ${booking.status} -> ${dto.toStatus}`);
    }
    booking.status = dto.toStatus;
    this.audit('update_booking_status', 'bookings', id, dto);
    return booking;
  }

  createBooking(dto: CreateBookingDto) {
    const row: Booking = {
      id: `b_${++this.seq}`,
      bookingNo: this.nextBookingNo(),
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      region: dto.region,
      symptomCode: dto.symptomCode,
      urgency: 'scheduled',
      status: 'created',
      assignedTechnicianId: null,
      paymentStatus: 'ready',
    };
    this.bookings.unshift(row);
    this.audit('create_booking', 'bookings', row.id, dto);
    return row;
  }

  updateBooking(id: string, dto: UpdateBookingDto) {
    const row = this.getBooking(id);
    Object.assign(row, dto);
    this.audit('update_booking', 'bookings', id, dto);
    return row;
  }

  deleteBooking(id: string) {
    const i = this.bookings.findIndex((b) => b.id === id);
    if (i === -1) throw new NotFoundException('booking not found');
    this.bookings.splice(i, 1);
    this.audit('delete_booking', 'bookings', id);
    return { id, deleted: true };
  }

  private async orderNoById(orderIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (!this.sb || orderIds.length === 0) return map;
    const uniq = [...new Set(orderIds)].filter(Boolean);
    const { data, error } = await this.sb.from('orders').select('id, order_no').in('id', uniq);
    if (error) throw new BadRequestException(error.message);
    for (const o of data ?? []) {
      const r = o as { id: string; order_no: string };
      map.set(String(r.id), String(r.order_no));
    }
    return map;
  }

  async getPayments(): Promise<Payment[]> {
    if (!this.sb) return this.payments;
    const { data, error } = await this.sb.from('payments').select('*').order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []) as Record<string, unknown>[];
    const orderIds = rows.map((r) => String(r.order_id ?? '')).filter(Boolean);
    const on = await this.orderNoById(orderIds);
    return rows.map((r) => paymentFromRow(r, on.get(String(r.order_id)) ?? ''));
  }

  async cancelPayment(id: string, dto: CancelPaymentDto, idempotencyKey?: string) {
    if (idempotencyKey && this.idempotency.has(`cancel:${idempotencyKey}`)) {
      return this.idempotency.get(`cancel:${idempotencyKey}`);
    }
    if (this.sb && looksLikeUuid(id)) {
      const { data: before, error: e0 } = await this.sb.from('payments').select('*').eq('id', id).maybeSingle();
      if (e0) throw new BadRequestException(e0.message);
      if (!before) throw new NotFoundException('payment not found');
      const { error } = await this.sb
        .from('payments')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new BadRequestException(error.message);
      const orderMap = await this.orderNoById([String((before as { order_id: string }).order_id)]);
      const payload = {
        ...paymentFromRow(before as Record<string, unknown>, orderMap.get(String((before as { order_id: string }).order_id)) ?? ''),
        reason: dto.reason ?? null,
      };
      this.audit('cancel_payment', 'payments', id, payload);
      if (idempotencyKey) this.idempotency.set(`cancel:${idempotencyKey}`, payload);
      return payload;
    }
    const row = this.payments.find((p) => p.id === id);
    if (!row) throw new NotFoundException('payment not found');
    row.status = 'cancelled';
    const payload = { ...row, reason: dto.reason ?? null };
    this.audit('cancel_payment', 'payments', id, payload);
    if (idempotencyKey) this.idempotency.set(`cancel:${idempotencyKey}`, payload);
    return payload;
  }

  async getSettlements(): Promise<Settlement[]> {
    if (!this.sb) return this.settlements;
    const { data, error } = await this.sb
      .from('order_settlements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []) as Record<string, unknown>[];
    const orderIds = rows.map((r) => String(r.order_id ?? '')).filter(Boolean);
    const on = await this.orderNoById(orderIds);
    return rows.map((r) => settlementFromOrderRow(r, on.get(String(r.order_id)) ?? ''));
  }

  async confirmSettlement(
    id: string,
    dto: ConfirmSettlementDto,
    idempotencyKey?: string,
    ctx?: AdminSettlementContext,
  ) {
    if (idempotencyKey && this.idempotency.has(`settle:${idempotencyKey}`)) {
      return this.idempotency.get(`settle:${idempotencyKey}`);
    }
    if (this.sb && looksLikeUuid(id)) {
      const { data: row, error: e0 } = await this.sb.from('order_settlements').select('*').eq('id', id).maybeSingle();
      if (e0) throw new BadRequestException(e0.message);
      if (!row) throw new NotFoundException('settlement not found');
      const r = row as Record<string, unknown>;
      const adjustment = dto.adjustmentAmount ?? 0;
      const payout = Math.max(0, Number(r.technician_payout ?? 0) + adjustment);
      const prevMemo = r.memo == null ? '' : String(r.memo);
      const memo = [prevMemo, adjustment ? `adjustment:${adjustment}` : ''].filter(Boolean).join('\n') || null;
      const { error: e1 } = await this.sb
        .from('order_settlements')
        .update({
          technician_payout: payout,
          memo,
          status: 'confirmed',
        })
        .eq('id', id);
      if (e1) throw new BadRequestException(e1.message);
      const { data: after } = await this.sb.from('order_settlements').select('*').eq('id', id).single();
      const orderMap = await this.orderNoById([String((after as { order_id: string }).order_id)]);
      const mapped = settlementFromOrderRow(
        after as Record<string, unknown>,
        orderMap.get(String((after as { order_id: string }).order_id)) ?? '',
      );
      mapped.adjustmentAmount = adjustment;
      await this.settlementAudit.record({
        settlementId: id,
        orderId: String((after as { order_id: string }).order_id),
        actor: ctx?.actor ?? 'admin',
        action: 'confirm',
        idempotencyKey: ctx?.idempotencyKey?.trim()
          ? `settlement:confirm:${ctx.idempotencyKey.trim()}`
          : null,
        payload: { adjustment, settlementId: id },
      });
      this.audit('confirm_settlement', 'settlements', id, mapped);
      if (idempotencyKey) this.idempotency.set(`settle:${idempotencyKey}`, mapped);
      return mapped;
    }
    const row = this.settlements.find((s) => s.id === id);
    if (!row) throw new NotFoundException('settlement not found');
    const adjustment = dto.adjustmentAmount ?? 0;
    row.adjustmentAmount = adjustment;
    row.commissionBase = Math.max(0, row.grossAmount - row.partsAmount);
    row.platformFee = Math.round((row.commissionBase * 20) / 100);
    row.technicianAmount = Math.max(0, row.grossAmount - row.platformFee + row.adjustmentAmount);
    row.status = 'confirmed';
    this.audit('confirm_settlement', 'settlements', id, row);
    if (idempotencyKey) this.idempotency.set(`settle:${idempotencyKey}`, row);
    return row;
  }

  async updateSettlementStatus(id: string, dto: UpdateSettlementStatusDto, ctx?: AdminSettlementContext) {
    if (this.sb && looksLikeUuid(id)) {
      const patch: Record<string, unknown> = { status: dto.status };
      if (dto.status === 'paid') patch.paid_at = new Date().toISOString();
      const { error } = await this.sb.from('order_settlements').update(patch).eq('id', id);
      if (error) throw new BadRequestException(error.message);
      const { data: after } = await this.sb.from('order_settlements').select('*').eq('id', id).maybeSingle();
      if (!after) throw new NotFoundException('settlement not found');
      const orderMap = await this.orderNoById([String((after as { order_id: string }).order_id)]);
      const mapped = settlementFromOrderRow(
        after as Record<string, unknown>,
        orderMap.get(String((after as { order_id: string }).order_id)) ?? '',
      );
      await this.settlementAudit.record({
        settlementId: id,
        orderId: String((after as { order_id: string }).order_id),
        actor: ctx?.actor ?? 'admin',
        action: `status:${dto.status}`,
        idempotencyKey: ctx?.idempotencyKey?.trim()
          ? `settlement:status:${id}:${ctx.idempotencyKey.trim()}`
          : null,
        payload: dto,
      });
      this.audit('update_settlement_status', 'settlements', id, dto);
      return mapped;
    }
    const row = this.settlements.find((s) => s.id === id);
    if (!row) throw new NotFoundException('settlement not found');
    row.status = dto.status;
    this.audit('update_settlement_status', 'settlements', id, dto);
    return row;
  }

  async deleteSettlement(id: string, ctx?: AdminSettlementContext) {
    if (this.sb && looksLikeUuid(id)) {
      const { data: before } = await this.sb.from('order_settlements').select('order_id').eq('id', id).maybeSingle();
      const { error } = await this.sb.from('order_settlements').update({ status: 'cancelled' }).eq('id', id);
      if (error) throw new BadRequestException(error.message);
      await this.settlementAudit.record({
        settlementId: id,
        orderId: before ? String((before as { order_id: string }).order_id) : null,
        actor: ctx?.actor ?? 'admin',
        action: 'soft_cancel',
        idempotencyKey: ctx?.idempotencyKey?.trim()
          ? `settlement:delete:${id}:${ctx.idempotencyKey.trim()}`
          : null,
        payload: {},
      });
      this.audit('delete_settlement', 'settlements', id, { soft: true });
      return { id, deleted: true };
    }
    const i = this.settlements.findIndex((s) => s.id === id);
    if (i === -1) throw new NotFoundException('settlement not found');
    this.settlements.splice(i, 1);
    this.audit('delete_settlement', 'settlements', id);
    return { id, deleted: true };
  }

  async listSettlementEvents(orderId?: string) {
    if (!this.sb) return [];
    let q = this.sb
      .from('settlement_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (orderId) q = q.eq('order_id', orderId);
    const { data, error } = await q;
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  getCoupons() { return this.coupons; }
  createCoupon(dto: CreateCouponDto) {
    const row: Coupon = {
      id: `c_${++this.seq}`,
      userId: dto.userId,
      couponType: dto.couponType,
      amount: dto.amount,
      status: 'active',
      expiresAt: dto.expiresAt,
      usedBookingId: null,
    };
    this.coupons.unshift(row);
    this.audit('create_coupon', 'coupons', row.id, dto);
    return row;
  }
  updateCoupon(id: string, dto: UpdateCouponDto) {
    const row = this.coupons.find((c) => c.id === id);
    if (!row) throw new NotFoundException('coupon not found');
    Object.assign(row, dto);
    this.audit('update_coupon', 'coupons', id, dto);
    return row;
  }

  deleteCoupon(id: string) {
    const i = this.coupons.findIndex((c) => c.id === id);
    if (i === -1) throw new NotFoundException('coupon not found');
    this.coupons.splice(i, 1);
    this.audit('delete_coupon', 'coupons', id);
    return { id, deleted: true };
  }

  getAdminLogs() { return this.logs; }

  private audit(action: string, targetTable: string, targetId: string, payload?: unknown) {
    this.logs.unshift({
      id: `log_${++this.seq}`,
      action,
      targetTable,
      targetId,
      createdAt: new Date().toISOString(),
      payload,
    });
  }

  private nextBookingNo(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const seq = String(this.bookingSeq++).padStart(4, '0');
    return `AC${y}${m}${day}-${seq}`;
  }
}
