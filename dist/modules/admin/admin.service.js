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
const password_hash_1 = require("../../common/password-hash");
const database_tokens_1 = require("../../database/database.tokens");
const service_catalog_service_1 = require("../service-catalog/service-catalog.service");
const technicians_service_1 = require("../technicians/technicians.service");
const orders_service_1 = require("../orders/orders.service");
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
function normalizePhone(v) {
    return String(v ?? '').replace(/\D/g, '');
}
function requireUuid(id, label) {
    if (!(0, admin_payments_settlements_db_1.looksLikeUuid)(id))
        throw new common_1.BadRequestException(`${label} must be a UUID`);
    return id;
}
function str(v) {
    if (v == null)
        return null;
    const s = String(v).trim();
    return s === '' ? null : s;
}
function memberFromRow(row) {
    return {
        id: String(row.id),
        name: String(row.name ?? ''),
        phone: String(row.phone ?? ''),
        role: String(row.role ?? 'customer') || 'customer',
        status: String(row.status ?? 'active') || 'active',
        marketingConsent: Boolean(row.marketing_consent),
        createdAt: String(row.created_at ?? new Date().toISOString()),
        memo: str(row.memo) ?? undefined,
    };
}
function couponFromRow(row) {
    return {
        id: String(row.id),
        userId: String(row.user_id),
        couponType: row.coupon_type,
        amount: Number(row.amount ?? 0),
        status: row.status,
        expiresAt: str(row.expires_at) ?? undefined,
        usedBookingId: str(row.used_booking_id),
    };
}
function logFromRow(row) {
    return {
        id: String(row.id),
        action: String(row.action),
        targetTable: String(row.target_table),
        targetId: String(row.target_id),
        createdAt: String(row.created_at ?? new Date().toISOString()),
        payload: row.payload,
    };
}
function sellerFromRow(row) {
    return {
        id: String(row.id),
        ownerName: String(row.owner_name ?? ''),
        phone: String(row.phone ?? ''),
        companyName: String(row.company_name ?? ''),
        businessNumber: str(row.business_number),
        productCategory: str(row.product_category),
        status: String(row.status ?? 'pending'),
        memo: str(row.memo),
        createdAt: String(row.created_at ?? new Date().toISOString()),
        updatedAt: String(row.updated_at ?? new Date().toISOString()),
    };
}
function paymentStatusFromOrder(row) {
    if (row.paymentStatus === 'paid')
        return 'paid';
    if (row.paymentStatus === 'failed')
        return 'failed';
    if (row.paymentStatus === 'refunded')
        return 'cancelled';
    if (row.paymentStatus === 'partial_refunded')
        return 'partial_cancelled';
    return 'ready';
}
function bookingFromOrder(row) {
    const sourceEmergencyLeadId = row.customerMemo?.match(/\[긴급 접수 리드 ([0-9a-f-]{36})\]/i)?.[1] ?? null;
    return {
        id: row.id,
        bookingNo: row.orderNo,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        region: row.addressSummary,
        symptomCode: row.customerMemo ?? row.productCode,
        urgency: row.scheduleType === 'same_day' ? 'now' : 'scheduled',
        status: row.orderStatus,
        assignedTechnicianId: row.assignedTechnicianId,
        paymentStatus: paymentStatusFromOrder(row),
        adminMemo: row.adminMemo ?? undefined,
        sourceEmergencyLeadId,
    };
}
let AdminService = class AdminService {
    constructor(techniciansRegistry, orders, catalog, sb, settlementAudit) {
        this.techniciansRegistry = techniciansRegistry;
        this.orders = orders;
        this.catalog = catalog;
        this.sb = sb;
        this.settlementAudit = settlementAudit;
    }
    db() {
        if (!this.sb) {
            throw new common_1.ServiceUnavailableException('서버 DB 연결 설정이 필요합니다. 로컬 .env.local에 Supabase 값을 넣고 서버를 재시작해 주세요.');
        }
        return this.sb;
    }
    async getDashboard() {
        const sb = this.db();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIso = today.toISOString();
        const [ordersToday, members, matching, completed, paidRows, settlementPending,] = await Promise.all([
            sb.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
            sb.from('members').select('id', { count: 'exact', head: true }),
            sb.from('orders').select('id', { count: 'exact', head: true }).eq('order_status', 'matching'),
            sb.from('orders').select('id', { count: 'exact', head: true }).eq('order_status', 'completed'),
            sb.from('payments').select('amount').eq('status', 'paid'),
            sb.from('order_settlements').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);
        for (const r of [ordersToday, members, matching, completed, paidRows, settlementPending]) {
            if (r.error)
                throw new common_1.BadRequestException(r.error.message);
        }
        const paidAmount = (paidRows.data ?? []).reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
        return {
            todayBookings: ordersToday.count ?? 0,
            members: members.count ?? 0,
            technicians: this.techniciansRegistry.approvedCount(),
            matching: matching.count ?? 0,
            completed: completed.count ?? 0,
            paidAmount,
            settlementPending: settlementPending.count ?? 0,
            canonicalModel: 'orders',
        };
    }
    async getMembers() {
        const { data, error } = await this.db().from('members').select('*').order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return (data ?? []).map(memberFromRow);
    }
    async getMember(id) {
        const { data, error } = await this.db().from('members').select('*').eq('id', requireUuid(id, 'member id')).maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data)
            throw new common_1.NotFoundException('member not found');
        return memberFromRow(data);
    }
    async createMember(dto) {
        const phone = normalizePhone(dto.phone);
        if (phone.length < 10)
            throw new common_1.BadRequestException('invalid phone');
        const passwordHash = dto.password ? (0, password_hash_1.hashPassword)(dto.password) : null;
        const { data, error } = await this.db()
            .from('members')
            .insert({
            name: dto.name.trim(),
            phone,
            role: dto.role ?? 'customer',
            status: 'active',
            marketing_consent: false,
            password_hash: passwordHash,
            password_updated_at: passwordHash ? new Date().toISOString() : null,
        })
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('create_member', 'members', String(data.id), dto);
        return memberFromRow(data);
    }
    async registerMember(dto) {
        const phone = normalizePhone(dto.phone);
        if (phone.length < 10)
            throw new common_1.BadRequestException('invalid phone');
        const sb = this.db();
        const now = new Date();
        const passwordHash = (0, password_hash_1.hashPassword)(dto.password);
        const { data: existingMember, error: existingMemberError } = await sb
            .from('members')
            .select('id,role,password_hash')
            .eq('phone', phone)
            .maybeSingle();
        if (existingMemberError)
            throw new common_1.BadRequestException(existingMemberError.message);
        if (existingMember) {
            const existing = existingMember;
            if (existing.role && existing.role !== 'customer') {
                throw new common_1.ConflictException('관리자 계정은 공개 회원가입으로 변경할 수 없습니다.');
            }
            if (existing.password_hash) {
                throw new common_1.ConflictException('이미 가입된 전화번호입니다. 로그인해 주세요.');
            }
        }
        const { data, error } = await sb
            .from('members')
            .upsert({
            name: dto.name?.trim() || 'Airconecall 고객',
            phone,
            role: 'customer',
            status: 'active',
            marketing_consent: dto.marketingConsent ?? false,
            password_hash: passwordHash,
            password_updated_at: now.toISOString(),
        }, { onConflict: 'phone' })
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        const member = memberFromRow(data);
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        let signupCoupon = null;
        let signupCouponCreated = false;
        const { data: existingCoupon, error: existingCouponError } = await sb
            .from('coupons')
            .select('*')
            .eq('user_id', member.id)
            .eq('coupon_type', 'signup')
            .maybeSingle();
        if (existingCouponError)
            throw new common_1.BadRequestException(existingCouponError.message);
        if (existingCoupon) {
            signupCoupon = couponFromRow(existingCoupon);
        }
        else {
            const { data: insertedCoupon, error: insertCouponError } = await sb
                .from('coupons')
                .insert({
                user_id: member.id,
                coupon_type: 'signup',
                amount: 5000,
                status: 'active',
                min_order_amount: 50000,
                expires_at: expiresAt,
            })
                .select('*')
                .single();
            if (insertCouponError) {
                const { data: racedCoupon, error: racedCouponError } = await sb
                    .from('coupons')
                    .select('*')
                    .eq('user_id', member.id)
                    .eq('coupon_type', 'signup')
                    .maybeSingle();
                if (racedCouponError || !racedCoupon)
                    throw new common_1.BadRequestException(insertCouponError.message);
                signupCoupon = couponFromRow(racedCoupon);
            }
            else {
                signupCoupon = couponFromRow(insertedCoupon);
                signupCouponCreated = true;
            }
        }
        if (signupCouponCreated && signupCoupon) {
            await sb.from('reward_logs').insert({
                user_id: member.id,
                action_type: 'member_signup',
                reward_type: 'signup_coupon',
                amount: signupCoupon.amount,
                status: 'created',
                reference_id: signupCoupon.id,
                payload: { bookingRef: dto.bookingRef ?? null },
            });
        }
        await this.audit('register_member', 'members', member.id, { bookingRef: dto.bookingRef ?? null });
        return { member, signupCoupon };
    }
    async memberSession(dto) {
        const phone = normalizePhone(dto.phone);
        if (phone.length < 10)
            throw new common_1.BadRequestException('invalid phone');
        const { data, error } = await this.db()
            .from('members')
            .select('*,password_hash')
            .eq('phone', phone)
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data)
            throw new common_1.NotFoundException('member not found');
        if (!(0, password_hash_1.verifyPassword)(dto.password, data.password_hash)) {
            throw new common_1.UnauthorizedException('전화번호 또는 비밀번호가 맞지 않습니다.');
        }
        const member = memberFromRow(data);
        if (member.status !== 'active')
            throw new common_1.BadRequestException(`member status is ${member.status}`);
        return {
            memberId: member.id,
            name: member.name,
            phone: member.phone,
            role: member.role,
            status: member.status,
        };
    }
    async unifiedSession(dto) {
        const phone = normalizePhone(dto.phone);
        if (phone.length < 10)
            throw new common_1.BadRequestException('invalid phone');
        const sb = this.db();
        const { data: memberRow, error: memberError } = await sb
            .from('members')
            .select('*,password_hash')
            .eq('phone', phone)
            .maybeSingle();
        if (memberError)
            throw new common_1.BadRequestException(memberError.message);
        if (memberRow) {
            if (!(0, password_hash_1.verifyPassword)(dto.password, memberRow.password_hash)) {
                throw new common_1.UnauthorizedException('전화번호 또는 비밀번호가 맞지 않습니다.');
            }
            const member = memberFromRow(memberRow);
            if (member.status !== 'active')
                throw new common_1.BadRequestException(`member status is ${member.status}`);
            return {
                id: member.id,
                memberId: member.id,
                role: member.role,
                name: member.name,
                phone: member.phone,
                status: member.status,
            };
        }
        const { data: sellerRow, error: sellerError } = await sb
            .from('seller_applications')
            .select('*,password_hash')
            .eq('phone', phone)
            .maybeSingle();
        if (sellerError)
            throw new common_1.BadRequestException(sellerError.message);
        if (sellerRow) {
            if (!(0, password_hash_1.verifyPassword)(dto.password, sellerRow.password_hash)) {
                throw new common_1.UnauthorizedException('전화번호 또는 비밀번호가 맞지 않습니다.');
            }
            return {
                id: String(sellerRow.id),
                sellerId: String(sellerRow.id),
                role: 'seller',
                name: String(sellerRow.owner_name ?? ''),
                companyName: String(sellerRow.company_name ?? ''),
                phone: String(sellerRow.phone ?? phone),
                status: String(sellerRow.status ?? 'pending'),
            };
        }
        const technician = this.techniciansRegistry.findApprovedByCredentials(phone, dto.password);
        if (technician) {
            return {
                id: technician.id,
                technicianId: technician.id,
                role: 'technician',
                name: technician.name,
                phone: technician.phone,
                status: technician.status,
                workStatus: technician.workStatus,
                baseRegion: technician.baseRegion,
            };
        }
        throw new common_1.UnauthorizedException('전화번호 또는 비밀번호가 맞지 않습니다.');
    }
    async memberDashboard(id) {
        const member = await this.getMember(id);
        if (member.role !== 'customer') {
            throw new common_1.UnauthorizedException('고객 대시보드 계정이 아닙니다.');
        }
        const sb = this.db();
        const [couponsRes, inquiriesRes] = await Promise.all([
            sb
                .from('coupons')
                .select('*')
                .eq('user_id', member.id)
                .order('created_at', { ascending: false }),
            sb
                .from('emergency_service_leads')
                .select('id,location_text,aircon_type,issue_text,urgency,matching_status,converted_order_id,created_at,updated_at')
                .or(`user_id.eq.${member.id},customer_phone.eq.${member.phone}`)
                .order('created_at', { ascending: false })
                .limit(20),
        ]);
        if (couponsRes.error)
            throw new common_1.BadRequestException(couponsRes.error.message);
        if (inquiriesRes.error)
            throw new common_1.BadRequestException(inquiriesRes.error.message);
        return {
            member,
            coupons: (couponsRes.data ?? []).map(couponFromRow),
            inquiries: (inquiriesRes.data ?? []).map((r) => ({
                id: String(r.id),
                location: str(r.location_text),
                airconType: str(r.aircon_type),
                issue: str(r.issue_text),
                urgency: String(r.urgency ?? 'now'),
                status: String(r.matching_status ?? 'pending'),
                convertedOrderId: str(r.converted_order_id),
                createdAt: String(r.created_at ?? new Date().toISOString()),
                updatedAt: String(r.updated_at ?? new Date().toISOString()),
            })),
        };
    }
    async registerSeller(dto) {
        const phone = normalizePhone(dto.phone);
        if (phone.length < 10)
            throw new common_1.BadRequestException('invalid phone');
        const passwordHash = (0, password_hash_1.hashPassword)(dto.password);
        const { data: existingSeller, error: existingSellerError } = await this.db()
            .from('seller_applications')
            .select('id,password_hash')
            .eq('phone', phone)
            .maybeSingle();
        if (existingSellerError)
            throw new common_1.BadRequestException(existingSellerError.message);
        if (existingSeller && existingSeller.password_hash) {
            throw new common_1.ConflictException('이미 신청된 판매자 전화번호입니다. 로그인해 주세요.');
        }
        const { data, error } = await this.db()
            .from('seller_applications')
            .upsert({
            owner_name: dto.ownerName.trim(),
            phone,
            company_name: dto.companyName.trim(),
            business_number: dto.businessNumber?.trim() || null,
            product_category: dto.productCategory?.trim() || null,
            password_hash: passwordHash,
            password_updated_at: new Date().toISOString(),
            status: 'pending',
        }, { onConflict: 'phone' })
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        const id = String(data.id);
        await this.audit('register_seller', 'seller_applications', id, {
            companyName: dto.companyName,
            productCategory: dto.productCategory ?? null,
        });
        return {
            sellerId: id,
            status: String(data.status ?? 'pending'),
            companyName: String(data.company_name ?? ''),
        };
    }
    async sellerSession(dto) {
        const phone = normalizePhone(dto.phone);
        if (phone.length < 10)
            throw new common_1.BadRequestException('invalid phone');
        const { data, error } = await this.db()
            .from('seller_applications')
            .select('*,password_hash')
            .eq('phone', phone)
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data)
            throw new common_1.NotFoundException('seller not found');
        if (!(0, password_hash_1.verifyPassword)(dto.password, data.password_hash)) {
            throw new common_1.UnauthorizedException('전화번호 또는 비밀번호가 맞지 않습니다.');
        }
        return {
            sellerId: String(data.id),
            companyName: String(data.company_name ?? ''),
            status: String(data.status ?? 'pending'),
        };
    }
    async sellerDashboard(id) {
        const { data, error } = await this.db()
            .from('seller_applications')
            .select('*')
            .eq('id', requireUuid(id, 'seller id'))
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data)
            throw new common_1.NotFoundException('seller not found');
        const seller = sellerFromRow(data);
        return {
            seller,
            scope: ['판매자 신청 상태', '회사/담당자 정보', '취급 품목'],
        };
    }
    async updateMember(id, dto) {
        const patch = {};
        if (dto.name !== undefined)
            patch.name = dto.name;
        if (dto.phone !== undefined)
            patch.phone = normalizePhone(dto.phone);
        if (dto.status !== undefined)
            patch.status = dto.status;
        if (dto.role !== undefined)
            patch.role = dto.role;
        if (dto.password !== undefined && dto.password.trim() !== '') {
            patch.password_hash = (0, password_hash_1.hashPassword)(dto.password);
            patch.password_updated_at = new Date().toISOString();
        }
        if (dto.marketingConsent !== undefined)
            patch.marketing_consent = dto.marketingConsent;
        if (dto.memo !== undefined)
            patch.memo = dto.memo;
        const { data, error } = await this.db()
            .from('members')
            .update(patch)
            .eq('id', requireUuid(id, 'member id'))
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('update_member', 'members', id, dto);
        return memberFromRow(data);
    }
    async deleteMember(id) {
        const { error } = await this.db().from('members').delete().eq('id', requireUuid(id, 'member id'));
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('delete_member', 'members', id);
        return { id, deleted: true };
    }
    async getSellers() {
        const { data, error } = await this.db()
            .from('seller_applications')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return (data ?? []).map(sellerFromRow);
    }
    async createSeller(dto) {
        const phone = normalizePhone(dto.phone);
        if (phone.length < 10)
            throw new common_1.BadRequestException('invalid phone');
        const { data, error } = await this.db()
            .from('seller_applications')
            .insert({
            owner_name: dto.ownerName.trim(),
            phone,
            password_hash: (0, password_hash_1.hashPassword)(dto.password),
            password_updated_at: new Date().toISOString(),
            company_name: dto.companyName.trim(),
            business_number: dto.businessNumber?.trim() || null,
            product_category: dto.productCategory?.trim() || null,
            status: dto.status ?? 'approved',
            memo: dto.memo?.trim() || null,
        })
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        const seller = sellerFromRow(data);
        await this.audit('create_seller', 'seller_applications', seller.id, { phone });
        return seller;
    }
    async updateSeller(id, dto) {
        const patch = {};
        if (dto.ownerName !== undefined)
            patch.owner_name = dto.ownerName.trim();
        if (dto.phone !== undefined)
            patch.phone = normalizePhone(dto.phone);
        if (dto.password !== undefined && dto.password.trim() !== '') {
            patch.password_hash = (0, password_hash_1.hashPassword)(dto.password);
            patch.password_updated_at = new Date().toISOString();
        }
        if (dto.companyName !== undefined)
            patch.company_name = dto.companyName.trim();
        if (dto.businessNumber !== undefined)
            patch.business_number = dto.businessNumber.trim() || null;
        if (dto.productCategory !== undefined)
            patch.product_category = dto.productCategory.trim() || null;
        if (dto.status !== undefined)
            patch.status = dto.status;
        if (dto.memo !== undefined)
            patch.memo = dto.memo.trim() || null;
        const { data, error } = await this.db()
            .from('seller_applications')
            .update(patch)
            .eq('id', requireUuid(id, 'seller id'))
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        const seller = sellerFromRow(data);
        await this.audit('update_seller', 'seller_applications', id, dto);
        return seller;
    }
    async deleteSeller(id) {
        const { error } = await this.db()
            .from('seller_applications')
            .delete()
            .eq('id', requireUuid(id, 'seller id'));
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('delete_seller', 'seller_applications', id);
        return { id, deleted: true };
    }
    async getBookings() {
        const rows = await this.orders.listOrders();
        return rows.map(bookingFromOrder);
    }
    async getBooking(id) {
        return bookingFromOrder(await this.orders.getOrder(id));
    }
    async assignTechnician(id, dto) {
        const tech = this.techniciansRegistry.findById(dto.technicianId);
        if (!tech || tech.status !== 'approved')
            throw new common_1.NotFoundException('technician not found or not approved');
        const row = await this.orders.patchAdmin(id, {
            assignedTechnicianId: dto.technicianId,
            orderStatus: 'assigned',
        });
        await this.audit('assign_technician', 'orders', id, dto);
        return bookingFromOrder(row);
    }
    async unassignTechnician(id) {
        const row = await this.orders.patchAdmin(id, {
            assignedTechnicianId: null,
            orderStatus: 'matching',
        });
        await this.audit('unassign_technician', 'orders', id);
        return bookingFromOrder(row);
    }
    async updateBookingStatus(id, dto) {
        const current = bookingFromOrder(await this.orders.getOrder(id));
        if (!allowedTransitions[current.status]?.includes(dto.toStatus)) {
            throw new common_1.BadRequestException(`invalid transition ${current.status} -> ${dto.toStatus}`);
        }
        const row = await this.orders.patchAdmin(id, { orderStatus: dto.toStatus });
        await this.audit('update_order_status', 'orders', id, dto);
        return bookingFromOrder(row);
    }
    async createBooking(dto) {
        const productId = this.catalog.resolveDefaultEmergencyProductId();
        const row = await this.orders.createDraft({
            productId,
            scheduleType: 'reservation',
            customerName: dto.customerName,
            customerPhone: normalizePhone(dto.customerPhone),
            addressSummary: dto.region,
            customerMemo: dto.symptomCode,
        });
        await this.audit('create_order_from_admin_booking_api', 'orders', row.id, dto);
        return bookingFromOrder(row);
    }
    async updateBooking(id, dto) {
        const patch = {};
        if (dto.customerName !== undefined)
            patch.customer_name = dto.customerName;
        if (dto.customerPhone !== undefined)
            patch.customer_phone = normalizePhone(dto.customerPhone);
        if (dto.region !== undefined)
            patch.address_summary = dto.region;
        if (dto.symptomCode !== undefined)
            patch.customer_memo = dto.symptomCode;
        if (dto.adminMemo !== undefined)
            patch.admin_memo = dto.adminMemo;
        const { error } = await this.db().from('orders').update(patch).eq('id', requireUuid(id, 'order id'));
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('update_order_from_booking_api', 'orders', id, dto);
        return this.getBooking(id);
    }
    async deleteBooking(id) {
        await this.orders.patchAdmin(id, { orderStatus: 'cancelled' });
        await this.audit('cancel_order_from_booking_api', 'orders', id);
        return { id, deleted: true, softDeleted: true };
    }
    async orderNoById(orderIds) {
        const map = new Map();
        if (orderIds.length === 0)
            return map;
        const { data, error } = await this.db().from('orders').select('id, order_no').in('id', [...new Set(orderIds)]);
        if (error)
            throw new common_1.BadRequestException(error.message);
        for (const o of data ?? []) {
            const r = o;
            map.set(String(r.id), String(r.order_no));
        }
        return map;
    }
    async getPayments() {
        const { data, error } = await this.db().from('payments').select('*').order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        const rows = (data ?? []);
        const orderIds = rows.map((r) => String(r.order_id ?? '')).filter(Boolean);
        const on = await this.orderNoById(orderIds);
        return rows.map((r) => (0, admin_payments_settlements_db_1.paymentFromRow)(r, on.get(String(r.order_id)) ?? ''));
    }
    async cancelPayment(id, dto, idempotencyKey) {
        const cached = await this.getIdempotentResponse('payment_cancel', idempotencyKey);
        if (cached)
            return cached;
        const { data: before, error: e0 } = await this.db().from('payments').select('*').eq('id', requireUuid(id, 'payment id')).maybeSingle();
        if (e0)
            throw new common_1.BadRequestException(e0.message);
        if (!before)
            throw new common_1.NotFoundException('payment not found');
        const { error } = await this.db()
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
        await this.audit('cancel_payment', 'payments', id, payload);
        await this.saveIdempotentResponse('payment_cancel', idempotencyKey, payload);
        return payload;
    }
    async getSettlements() {
        const { data, error } = await this.db()
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
        const cached = await this.getIdempotentResponse('settlement_confirm', idempotencyKey);
        if (cached)
            return cached;
        const { data: row, error: e0 } = await this.db()
            .from('order_settlements')
            .select('*')
            .eq('id', requireUuid(id, 'settlement id'))
            .maybeSingle();
        if (e0)
            throw new common_1.BadRequestException(e0.message);
        if (!row)
            throw new common_1.NotFoundException('settlement not found');
        const r = row;
        const adjustment = dto.adjustmentAmount ?? 0;
        const payout = Math.max(0, Number(r.technician_payout ?? 0) + adjustment);
        const prevMemo = r.memo == null ? '' : String(r.memo);
        const memo = [prevMemo, adjustment ? `adjustment:${adjustment}` : ''].filter(Boolean).join('\n') || null;
        const { error: e1 } = await this.db()
            .from('order_settlements')
            .update({ technician_payout: payout, memo, status: 'confirmed' })
            .eq('id', id);
        if (e1)
            throw new common_1.BadRequestException(e1.message);
        const { data: after } = await this.db().from('order_settlements').select('*').eq('id', id).single();
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
        await this.audit('confirm_settlement', 'settlements', id, mapped);
        await this.saveIdempotentResponse('settlement_confirm', idempotencyKey, mapped);
        return mapped;
    }
    async updateSettlementStatus(id, dto, ctx) {
        const patch = { status: dto.status };
        if (dto.status === 'paid')
            patch.paid_at = new Date().toISOString();
        const { error } = await this.db()
            .from('order_settlements')
            .update(patch)
            .eq('id', requireUuid(id, 'settlement id'));
        if (error)
            throw new common_1.BadRequestException(error.message);
        const { data: after } = await this.db().from('order_settlements').select('*').eq('id', id).maybeSingle();
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
        await this.audit('update_settlement_status', 'settlements', id, dto);
        return mapped;
    }
    async deleteSettlement(id, ctx) {
        const { data: before } = await this.db()
            .from('order_settlements')
            .select('order_id')
            .eq('id', requireUuid(id, 'settlement id'))
            .maybeSingle();
        const { error } = await this.db().from('order_settlements').update({ status: 'cancelled' }).eq('id', id);
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
        await this.audit('delete_settlement', 'settlements', id, { soft: true });
        return { id, deleted: true };
    }
    async listSettlementEvents(orderId) {
        let q = this.db()
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
    async getCoupons() {
        const { data, error } = await this.db().from('coupons').select('*').order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return (data ?? []).map(couponFromRow);
    }
    async createCoupon(dto) {
        const { data, error } = await this.db()
            .from('coupons')
            .insert({
            user_id: requireUuid(dto.userId, 'userId'),
            coupon_type: dto.couponType,
            amount: dto.amount,
            status: 'active',
            min_order_amount: 50000,
            expires_at: dto.expiresAt ?? null,
            used_booking_id: null,
        })
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('create_coupon', 'coupons', String(data.id), dto);
        return couponFromRow(data);
    }
    async updateCoupon(id, dto) {
        const patch = {};
        if (dto.status !== undefined)
            patch.status = dto.status;
        if (dto.expiresAt !== undefined)
            patch.expires_at = dto.expiresAt;
        const { data, error } = await this.db()
            .from('coupons')
            .update(patch)
            .eq('id', requireUuid(id, 'coupon id'))
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('update_coupon', 'coupons', id, dto);
        return couponFromRow(data);
    }
    async deleteCoupon(id) {
        const { error } = await this.db()
            .from('coupons')
            .update({ status: 'cancelled' })
            .eq('id', requireUuid(id, 'coupon id'));
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('delete_coupon', 'coupons', id, { soft: true });
        return { id, deleted: true, softDeleted: true };
    }
    async getAdminLogs() {
        const { data, error } = await this.db().from('admin_logs').select('*').order('created_at', { ascending: false }).limit(500);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return (data ?? []).map(logFromRow);
    }
    async getIdempotentResponse(scope, key) {
        if (!key?.trim())
            return null;
        const { data, error } = await this.db()
            .from('idempotency_keys')
            .select('response')
            .eq('scope', scope)
            .eq('key', key.trim())
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return data ? data.response : null;
    }
    async saveIdempotentResponse(scope, key, response) {
        if (!key?.trim())
            return;
        const { error } = await this.db()
            .from('idempotency_keys')
            .upsert({ scope, key: key.trim(), response }, { onConflict: 'scope,key' });
        if (error)
            throw new common_1.BadRequestException(error.message);
    }
    async audit(action, targetTable, targetId, payload) {
        const { error } = await this.db().from('admin_logs').insert({
            action,
            target_table: targetTable,
            target_id: targetId,
            payload: payload ?? null,
            actor: 'x-admin-role-temporary',
        });
        if (error)
            throw new common_1.BadRequestException(error.message);
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(database_tokens_1.SUPABASE_ADMIN)),
    __metadata("design:paramtypes", [technicians_service_1.TechniciansService,
        orders_service_1.OrdersService,
        service_catalog_service_1.ServiceCatalogService, Object, settlement_audit_service_1.SettlementAuditService])
], AdminService);
//# sourceMappingURL=admin.service.js.map