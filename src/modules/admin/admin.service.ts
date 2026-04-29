import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AdminLog,
  Booking,
  BookingStatus,
  Coupon,
  Member,
  Payment,
  Settlement,
  Technician,
  TechnicianOnboarding,
} from './admin.types';
import {
  AssignTechnicianDto,
  CancelPaymentDto,
  ConfirmSettlementDto,
  CreateBookingDto,
  CreateCouponDto,
  CreateMemberDto,
  CreateTechnicianDto,
  ReviewOnboardingDto,
  UpdateBookingStatusDto,
  UpdateCouponDto,
  UpdateMemberDto,
  UpdateSettlementStatusDto,
  UpdateTechnicianDto,
} from './admin.dto';

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

  private technicians: Technician[] = [
    { id: 't_1', name: '김기사', phone: '01099998888', status: 'approved', workStatus: 'available', feeRate: 20, baseRegion: '경기 파주' },
  ];
  private onboarding: TechnicianOnboarding[] = [
    {
      id: 'o_1',
      name: '박신청',
      phone: '01055557777',
      status: 'pending',
      documents: ['id_card', 'business_license'],
      createdAt: new Date().toISOString(),
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

  getBookings() { return this.bookings; }
  getBooking(id: string) {
    const row = this.bookings.find((b) => b.id === id);
    if (!row) throw new NotFoundException('booking not found');
    return row;
  }

  assignTechnician(id: string, dto: AssignTechnicianDto) {
    const booking = this.getBooking(id);
    const tech = this.technicians.find((t) => t.id === dto.technicianId);
    if (!tech) throw new NotFoundException('technician not found');
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

  getTechnicians() { return this.technicians; }
  createTechnician(dto: CreateTechnicianDto) {
    const next: Technician = {
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
  updateTechnician(id: string, dto: UpdateTechnicianDto) {
    const row = this.technicians.find((t) => t.id === id);
    if (!row) throw new NotFoundException('technician not found');
    Object.assign(row, dto);
    this.audit('update_technician', 'technicians', id, dto);
    return row;
  }

  getOnboarding() { return this.onboarding; }
  reviewOnboarding(id: string, dto: ReviewOnboardingDto) {
    const row = this.onboarding.find((v) => v.id === id);
    if (!row) throw new NotFoundException('onboarding not found');
    row.status = dto.status;
    row.rejectReason = dto.rejectReason;
    if (dto.status === 'approved') {
      const tech: Technician = {
        id: `t_${++this.seq}`,
        name: row.name,
        phone: row.phone,
        status: 'approved',
        workStatus: 'offline',
        feeRate: 20,
      };
      this.technicians.unshift(tech);
      this.audit('approve_onboarding', 'technicians', tech.id, { onboardingId: id });
    } else {
      this.audit('review_onboarding', 'technician_onboarding', id, dto);
    }
    return row;
  }

  getPayments() { return this.payments; }
  cancelPayment(id: string, dto: CancelPaymentDto, idempotencyKey?: string) {
    if (idempotencyKey && this.idempotency.has(`cancel:${idempotencyKey}`)) {
      return this.idempotency.get(`cancel:${idempotencyKey}`);
    }
    const row = this.payments.find((p) => p.id === id);
    if (!row) throw new NotFoundException('payment not found');
    row.status = 'cancelled';
    const payload = { ...row, reason: dto.reason ?? null };
    this.audit('cancel_payment', 'payments', id, payload);
    if (idempotencyKey) this.idempotency.set(`cancel:${idempotencyKey}`, payload);
    return payload;
  }

  getSettlements() { return this.settlements; }
  confirmSettlement(id: string, dto: ConfirmSettlementDto, idempotencyKey?: string) {
    if (idempotencyKey && this.idempotency.has(`settle:${idempotencyKey}`)) {
      return this.idempotency.get(`settle:${idempotencyKey}`);
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
  updateSettlementStatus(id: string, dto: UpdateSettlementStatusDto) {
    const row = this.settlements.find((s) => s.id === id);
    if (!row) throw new NotFoundException('settlement not found');
    row.status = dto.status;
    this.audit('update_settlement_status', 'settlements', id, dto);
    return row;
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
