"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
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
    constructor() {
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
        this.technicians = [
            { id: 't_1', name: '김기사', phone: '01099998888', status: 'approved', workStatus: 'available', feeRate: 20, baseRegion: '경기 파주' },
        ];
        this.onboarding = [
            {
                id: 'o_1',
                name: '박신청',
                phone: '01055557777',
                status: 'pending',
                documents: ['id_card', 'business_license'],
                createdAt: new Date().toISOString(),
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
    getDashboard() {
        return {
            todayBookings: this.bookings.length,
            members: this.members.length,
            technicians: this.technicians.length,
            matching: this.bookings.filter((b) => b.status === 'matching').length,
            completed: this.bookings.filter((b) => b.status === 'completed').length,
            paidAmount: this.payments.filter((p) => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0),
            settlementPending: this.settlements.filter((s) => s.status === 'pending').length,
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
    getBookings() { return this.bookings; }
    getBooking(id) {
        const row = this.bookings.find((b) => b.id === id);
        if (!row)
            throw new common_1.NotFoundException('booking not found');
        return row;
    }
    assignTechnician(id, dto) {
        const booking = this.getBooking(id);
        const tech = this.technicians.find((t) => t.id === dto.technicianId);
        if (!tech)
            throw new common_1.NotFoundException('technician not found');
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
    getTechnicians() { return this.technicians; }
    createTechnician(dto) {
        const next = {
            id: `t_${++this.seq}`,
            name: dto.name,
            phone: dto.phone,
            baseRegion: dto.baseRegion,
            status: 'pending',
            workStatus: 'offline',
            feeRate: 20,
        };
        this.technicians.unshift(next);
        this.audit('create_technician', 'technicians', next.id, dto);
        return next;
    }
    updateTechnician(id, dto) {
        const row = this.technicians.find((t) => t.id === id);
        if (!row)
            throw new common_1.NotFoundException('technician not found');
        Object.assign(row, dto);
        this.audit('update_technician', 'technicians', id, dto);
        return row;
    }
    getOnboarding() { return this.onboarding; }
    reviewOnboarding(id, dto) {
        const row = this.onboarding.find((v) => v.id === id);
        if (!row)
            throw new common_1.NotFoundException('onboarding not found');
        row.status = dto.status;
        row.rejectReason = dto.rejectReason;
        if (dto.status === 'approved') {
            const tech = {
                id: `t_${++this.seq}`,
                name: row.name,
                phone: row.phone,
                status: 'approved',
                workStatus: 'offline',
                feeRate: 20,
            };
            this.technicians.unshift(tech);
            this.audit('approve_onboarding', 'technicians', tech.id, { onboardingId: id });
        }
        else {
            this.audit('review_onboarding', 'technician_onboarding', id, dto);
        }
        return row;
    }
    getPayments() { return this.payments; }
    cancelPayment(id, dto, idempotencyKey) {
        if (idempotencyKey && this.idempotency.has(`cancel:${idempotencyKey}`)) {
            return this.idempotency.get(`cancel:${idempotencyKey}`);
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
    getSettlements() { return this.settlements; }
    confirmSettlement(id, dto, idempotencyKey) {
        if (idempotencyKey && this.idempotency.has(`settle:${idempotencyKey}`)) {
            return this.idempotency.get(`settle:${idempotencyKey}`);
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
    updateSettlementStatus(id, dto) {
        const row = this.settlements.find((s) => s.id === id);
        if (!row)
            throw new common_1.NotFoundException('settlement not found');
        row.status = dto.status;
        this.audit('update_settlement_status', 'settlements', id, dto);
        return row;
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
    (0, common_1.Injectable)()
], AdminService);
//# sourceMappingURL=admin.service.js.map