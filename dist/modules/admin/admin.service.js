"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const database_tokens_1 = require("../../database/database.tokens");
const technicians_service_1 = require("../technicians/technicians.service");
const admin_payments_settlements_db_1 = require("./admin-payments-settlements.db");
const settlement_audit_service_1 = require("./settlement-audit.service");
const allowedTransitions = {
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
let AdminService = class AdminService {
    constructor(techniciansRegistry, sb, settlementAudit) {
        this.techniciansRegistry = techniciansRegistry;
        this.sb = sb;
        this.settlementAudit = settlementAudit;
        this.seq = 1;
        this.bookingSeq = 1;
        this.logs = [];
        this.idempotency = new Map();
        this.members = [
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
        this.bookings = [
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
        this.payments = [
            { id: 'p_1', bookingId: 'b_1', amount: 40000, paymentType: 'deposit', provider: 'manual', status: 'paid' },
        ];
        this.settlements = [
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
        this.coupons = [];
    }
    async getDashboard() {
        let paidAmount = this.payments.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
        let settlementPending = this.settlements.filter((s) => s.status === 'pending').length;
        if (this.sb) {
            const { data: paidRows } = await this.sb.from('payments').select('amount').eq('status', 'paid');
            if (paidRows?.length) {
                paidAmount = paidRows.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
            }
            const { count } = await this.sb
                .from('order_settlements')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending');
            if (count != null)
                settlementPending = count;
        }
        return {
            todayBookings: this.bookings.length,
            members: this.members.length,
            technicians: this.techniciansRegistry.approvedCount(),
            matching: this.bookings.filter((b) => b.status === 'matching').length,
            completed: this.bookings.filter((b) => b.status === 'completed').length,
            paidAmount,
            settlementPending,
            supabaseOrdersApprox: this.sb
                ? (await this.sb.from('orders').select('id', { count: 'exact', head: true })).count ?? null
                : null,
        };
    }
    getMembers() { return this.members; }
    getMember(id) {
        const row = this.members.find((m) => m.id === id);
        if (!row)
            throw new common_1.NotFoundException('member not found');
        return row;
    }
    createMember(dto) {
        const row = {
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
    updateMember(id, dto) {
        const row = this.getMember(id);
        Object.assign(row, dto);
        this.audit('update_member', 'members', id, dto);
        return row;
    }
    deleteMember(id) {
        const i = this.members.findIndex((m) => m.id === id);
        if (i === -1)
            throw new common_1.NotFoundException('member not found');
        this.members.splice(i, 1);
        this.audit('delete_member', 'members', id);
        return { id, deleted: true };
    }
    getBookings() { return this.bookings; }
    getBooking(id) {
        const row = this.bookings.find((b) => b.id === id);
        if (!row)
            throw new common_1.NotFoundException('booking not found');
        return row;
    }
    assignTechnician(id, dto) {
        const booking = this.getBooking(id);
        const tech = this.techniciansRegistry.findById(dto.technicianId);
        if (!tech || tech.status !== 'approved') {
            throw new common_1.NotFoundException('technician not found or not approved');
        }
        booking.assignedTechnicianId = dto.technicianId;
        booking.status = 'assigned';
        this.audit('assign_technician', 'bookings', id, dto);
        return booking;
    }
    unassignTechnician(id) {
        const booking = this.getBooking(id);
        booking.assignedTechnicianId = null;
        booking.status = 'matching';
        this.audit('unassign_technician', 'bookings', id);
        return booking;
    }
    updateBookingStatus(id, dto) {
        const booking = this.getBooking(id);
        if (!allowedTransitions[booking.status].includes(dto.toStatus)) {
            throw new common_1.BadRequestException(`invalid transition ${booking.status} -> ${dto.toStatus}`);
        }
        booking.status = dto.toStatus;
        this.audit('update_booking_status', 'bookings', id, dto);
        return booking;
    }
    createBooking(dto) {
        const row = {
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
    updateBooking(id, dto) {
        const row = this.getBooking(id);
        Object.assign(row, dto);
        this.audit('update_booking', 'bookings', id, dto);
        return row;
    }
    deleteBooking(id) {
        const i = this.bookings.findIndex((b) => b.id === id);
        if (i === -1)
            throw new common_1.NotFoundException('booking not found');
        this.bookings.splice(i, 1);
        this.audit('delete_booking', 'bookings', id);
        return { id, deleted: true };
    }
    async orderNoById(orderIds) {
        const map = new Map();
        if (!this.sb || orderIds.length === 0)
            return map;
        const uniq = [...new Set(orderIds)].filter(Boolean);
        const { data, error } = await this.sb.from('orders').select('id, order_no').in('id', uniq);
        if (error)
            throw new common_1.BadRequestException(error.message);
        for (const o of data ?? []) {
            const r = o;
            map.set(String(r.id), String(r.order_no));
        }
        return map;
    }
    async getPayments() {
        if (!this.sb)
            return this.payments;
        const { data, error } = await this.sb.from('payments').select('*').order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        const rows = (data ?? []);
        const orderIds = rows.map((r) => String(r.order_id ?? '')).filter(Boolean);
        const on = await this.orderNoById(orderIds);
        return rows.map((r) => (0, admin_payments_settlements_db_1.paymentFromRow)(r, on.get(String(r.order_id)) ?? ''));
    }
    async cancelPayment(id, dto, idempotencyKey) {
        if (idempotencyKey && this.idempotency.has(`cancel:${idempotencyKey}`)) {
            return this.idempotency.get(`cancel:${idempotencyKey}`);
        }
        if (this.sb && (0, admin_payments_settlements_db_1.looksLikeUuid)(id)) {
            const { data: before, error: e0 } = await this.sb.from('payments').select('*').eq('id', id).maybeSingle();
            if (e0)
                throw new common_1.BadRequestException(e0.message);
            if (!before)
                throw new common_1.NotFoundException('payment not found');
            const { error } = await this.sb
                .from('payments')
                .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
                .eq('id', id);
            if (error)
                throw new common_1.BadRequestException(error.message);
            const orderMap = await this.orderNoById([String(before.order_id)]);
            const payload = {
                ...(0, admin_payments_settlements_db_1.paymentFromRow)(before, orderMap.get(String(before.order_id)) ?? ''),
                reason: dto.reason ?? null,
            };
            this.audit('cancel_payment', 'payments', id, payload);
            if (idempotencyKey)
                this.idempotency.set(`cancel:${idempotencyKey}`, payload);
            return payload;
        }
        const row = this.payments.find((p) => p.id === id);
        if (!row)
            throw new common_1.NotFoundException('payment not found');
        row.status = 'cancelled';
        const payload = { ...row, reason: dto.reason ?? null };
        this.audit('cancel_payment', 'payments', id, payload);
        if (idempotencyKey)
            this.idempotency.set(`cancel:${idempotencyKey}`, payload);
        return payload;
    }
    async getSettlements() {
        if (!this.sb)
            return this.settlements;
        const { data, error } = await this.sb
            .from('order_settlements')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        const rows = (data ?? []);
        const orderIds = rows.map((r) => String(r.order_id ?? '')).filter(Boolean);
        const on = await this.orderNoById(orderIds);
        return rows.map((r) => (0, admin_payments_settlements_db_1.settlementFromOrderRow)(r, on.get(String(r.order_id)) ?? ''));
    }
    async confirmSettlement(id, dto, idempotencyKey, ctx) {
        if (idempotencyKey && this.idempotency.has(`settle:${idempotencyKey}`)) {
            return this.idempotency.get(`settle:${idempotencyKey}`);
        }
        if (this.sb && (0, admin_payments_settlements_db_1.looksLikeUuid)(id)) {
            const { data: row, error: e0 } = await this.sb.from('order_settlements').select('*').eq('id', id).maybeSingle();
            if (e0)
                throw new common_1.BadRequestException(e0.message);
            if (!row)
                throw new common_1.NotFoundException('settlement not found');
            const r = row;
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
            if (e1)
                throw new common_1.BadRequestException(e1.message);
            const { data: after } = await this.sb.from('order_settlements').select('*').eq('id', id).single();
            const orderMap = await this.orderNoById([String(after.order_id)]);
            const mapped = (0, admin_payments_settlements_db_1.settlementFromOrderRow)(after, orderMap.get(String(after.order_id)) ?? '');
            mapped.adjustmentAmount = adjustment;
            await this.settlementAudit.record({
                settlementId: id,
                orderId: String(after.order_id),
                actor: ctx?.actor ?? 'admin',
                action: 'confirm',
                idempotencyKey: ctx?.idempotencyKey?.trim()
                    ? `settlement:confirm:${ctx.idempotencyKey.trim()}`
                    : null,
                payload: { adjustment, settlementId: id },
            });
            this.audit('confirm_settlement', 'settlements', id, mapped);
            if (idempotencyKey)
                this.idempotency.set(`settle:${idempotencyKey}`, mapped);
            return mapped;
        }
        const row = this.settlements.find((s) => s.id === id);
        if (!row)
            throw new common_1.NotFoundException('settlement not found');
        const adjustment = dto.adjustmentAmount ?? 0;
        row.adjustmentAmount = adjustment;
        row.commissionBase = Math.max(0, row.grossAmount - row.partsAmount);
        row.platformFee = Math.round((row.commissionBase * 20) / 100);
        row.technicianAmount = Math.max(0, row.grossAmount - row.platformFee + row.adjustmentAmount);
        row.status = 'confirmed';
        this.audit('confirm_settlement', 'settlements', id, row);
        if (idempotencyKey)
            this.idempotency.set(`settle:${idempotencyKey}`, row);
        return row;
    }
    async updateSettlementStatus(id, dto, ctx) {
        if (this.sb && (0, admin_payments_settlements_db_1.looksLikeUuid)(id)) {
            const patch = { status: dto.status };
            if (dto.status === 'paid')
                patch.paid_at = new Date().toISOString();
            const { error } = await this.sb.from('order_settlements').update(patch).eq('id', id);
            if (error)
                throw new common_1.BadRequestException(error.message);
            const { data: after } = await this.sb.from('order_settlements').select('*').eq('id', id).maybeSingle();
            if (!after)
                throw new common_1.NotFoundException('settlement not found');
            const orderMap = await this.orderNoById([String(after.order_id)]);
            const mapped = (0, admin_payments_settlements_db_1.settlementFromOrderRow)(after, orderMap.get(String(after.order_id)) ?? '');
            await this.settlementAudit.record({
                settlementId: id,
                orderId: String(after.order_id),
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
        if (!row)
            throw new common_1.NotFoundException('settlement not found');
        row.status = dto.status;
        this.audit('update_settlement_status', 'settlements', id, dto);
        return row;
    }
    async deleteSettlement(id, ctx) {
        if (this.sb && (0, admin_payments_settlements_db_1.looksLikeUuid)(id)) {
            const { data: before } = await this.sb.from('order_settlements').select('order_id').eq('id', id).maybeSingle();
            const { error } = await this.sb.from('order_settlements').update({ status: 'cancelled' }).eq('id', id);
            if (error)
                throw new common_1.BadRequestException(error.message);
            await this.settlementAudit.record({
                settlementId: id,
                orderId: before ? String(before.order_id) : null,
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
        if (i === -1)
            throw new common_1.NotFoundException('settlement not found');
        this.settlements.splice(i, 1);
        this.audit('delete_settlement', 'settlements', id);
        return { id, deleted: true };
    }
    async listSettlementEvents(orderId) {
        if (!this.sb)
            return [];
        let q = this.sb
            .from('settlement_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);
        if (orderId)
            q = q.eq('order_id', orderId);
        const { data, error } = await q;
        if (error)
            throw new common_1.BadRequestException(error.message);
        return data ?? [];
    }
    getCoupons() { return this.coupons; }
    createCoupon(dto) {
        const row = {
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
    updateCoupon(id, dto) {
        const row = this.coupons.find((c) => c.id === id);
        if (!row)
            throw new common_1.NotFoundException('coupon not found');
        Object.assign(row, dto);
        this.audit('update_coupon', 'coupons', id, dto);
        return row;
    }
    deleteCoupon(id) {
        const i = this.coupons.findIndex((c) => c.id === id);
        if (i === -1)
            throw new common_1.NotFoundException('coupon not found');
        this.coupons.splice(i, 1);
        this.audit('delete_coupon', 'coupons', id);
        return { id, deleted: true };
    }
    getAdminLogs() { return this.logs; }
    audit(action, targetTable, targetId, payload) {
        this.logs.unshift({
            id: `log_${++this.seq}`,
            action,
            targetTable,
            targetId,
            createdAt: new Date().toISOString(),
            payload,
        });
    }
    nextBookingNo() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const seq = String(this.bookingSeq++).padStart(4, '0');
        return `AC${y}${m}${day}-${seq}`;
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(database_tokens_1.SUPABASE_ADMIN)),
    __metadata("design:paramtypes", [technicians_service_1.TechniciansService, Object, settlement_audit_service_1.SettlementAuditService])
], AdminService);
//# sourceMappingURL=admin.service.js.map