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
function materialFromRow(row) {
    return {
        id: String(row.id),
        sellerId: str(row.seller_id),
        name: String(row.name ?? ''),
        code: String(row.code ?? ''),
        category: String(row.category ?? 'general'),
        unit: String(row.unit ?? 'each'),
        customerPrice: row.customer_price == null ? null : Number(row.customer_price),
        technicianCostAllowance: row.technician_cost_allowance == null ? null : Number(row.technician_cost_allowance),
        platformFeeRate: row.platform_fee_rate == null ? null : Number(row.platform_fee_rate),
        oemAvailable: Boolean(row.oem_available),
        supplierName: str(row.supplier_name),
        description: str(row.description),
        imageUrl: str(row.image_url),
        stockQuantity: Number(row.stock_quantity ?? 0),
        marketStatus: String(row.market_status ?? 'active'),
        deliveryNote: str(row.delivery_note),
        minOrderQuantity: Number(row.min_order_quantity ?? 1),
        isActive: row.is_active !== false,
        createdAt: String(row.created_at ?? new Date().toISOString()),
        updatedAt: String(row.updated_at ?? new Date().toISOString()),
    };
}
function materialPurchaseItemFromRow(row) {
    return {
        id: String(row.id),
        purchaseOrderId: String(row.purchase_order_id),
        materialId: str(row.material_id),
        sellerId: str(row.seller_id),
        name: String(row.name ?? ''),
        code: String(row.code ?? ''),
        unit: String(row.unit ?? 'each'),
        supplierName: str(row.supplier_name),
        unitPrice: Number(row.unit_price ?? 0),
        quantity: Number(row.quantity ?? 0),
        amount: Number(row.amount ?? 0),
        createdAt: String(row.created_at ?? new Date().toISOString()),
    };
}
function materialPurchaseOrderFromRow(row) {
    const rawItems = Array.isArray(row.items)
        ? row.items
        : Array.isArray(row.material_purchase_order_items)
            ? row.material_purchase_order_items
            : [];
    return {
        id: String(row.id),
        orderNo: String(row.order_no ?? ''),
        technicianId: String(row.technician_id ?? ''),
        technicianName: str(row.technician_name),
        technicianPhone: str(row.technician_phone),
        sellerId: str(row.seller_id),
        sellerName: str(row.seller_name),
        status: String(row.status ?? 'requested'),
        totalAmount: Number(row.total_amount ?? 0),
        deliveryAddress: String(row.delivery_address ?? ''),
        recipientName: str(row.recipient_name),
        recipientPhone: str(row.recipient_phone),
        requestMemo: str(row.request_memo),
        sellerMemo: str(row.seller_memo),
        adminMemo: str(row.admin_memo),
        confirmedAt: str(row.confirmed_at),
        preparingAt: str(row.preparing_at),
        shippedAt: str(row.shipped_at),
        deliveredAt: str(row.delivered_at),
        cancelledAt: str(row.cancelled_at),
        createdAt: String(row.created_at ?? new Date().toISOString()),
        updatedAt: String(row.updated_at ?? new Date().toISOString()),
        items: rawItems.map((it) => materialPurchaseItemFromRow(it)),
    };
}
function addressFromRow(row) {
    return {
        id: String(row.id),
        userId: String(row.user_id),
        address: String(row.address ?? ''),
        detailAddress: str(row.detail_address),
        sido: str(row.sido),
        sigungu: str(row.sigungu),
        dong: str(row.dong),
        latitude: row.latitude == null ? null : Number(row.latitude),
        longitude: row.longitude == null ? null : Number(row.longitude),
        isDefault: Boolean(row.is_default),
        createdAt: String(row.created_at ?? new Date().toISOString()),
        updatedAt: String(row.updated_at ?? new Date().toISOString()),
    };
}
function airconAssetFromRow(row) {
    return {
        id: String(row.id),
        userId: String(row.user_id),
        addressId: str(row.address_id),
        type: String(row.type ?? 'unknown'),
        brand: str(row.brand),
        modelName: str(row.model_name),
        installedYear: row.installed_year == null ? null : Number(row.installed_year),
        indoorPhotoUrl: str(row.indoor_photo_url),
        outdoorPhotoUrl: str(row.outdoor_photo_url),
        remotePhotoUrl: str(row.remote_photo_url),
        memo: str(row.memo),
        createdAt: String(row.created_at ?? new Date().toISOString()),
        updatedAt: String(row.updated_at ?? new Date().toISOString()),
    };
}
function rewardLogFromRow(row) {
    return {
        id: String(row.id),
        userId: String(row.user_id),
        actionType: String(row.action_type ?? ''),
        rewardType: String(row.reward_type ?? ''),
        amount: Number(row.amount ?? 0),
        status: String(row.status ?? 'created'),
        referenceId: str(row.reference_id),
        payload: row.payload ?? null,
        createdAt: String(row.created_at ?? new Date().toISOString()),
    };
}
function customerOrderFromRow(row) {
    return {
        id: String(row.id),
        orderNo: String(row.order_no ?? ''),
        productName: String(row.product_name_snap ?? ''),
        productCode: String(row.product_code_snap ?? ''),
        serviceType: String(row.service_type ?? ''),
        airconType: String(row.aircon_type ?? ''),
        orderStatus: String(row.order_status ?? ''),
        paymentStatus: String(row.payment_status ?? ''),
        totalPrice: Number(row.total_price ?? 0),
        addressSummary: String(row.address_summary ?? ''),
        desiredDate: str(row.desired_date),
        desiredTimeSlot: str(row.desired_time_slot),
        createdAt: String(row.created_at ?? new Date().toISOString()),
        updatedAt: String(row.updated_at ?? new Date().toISOString()),
    };
}
function reviewFromRow(row) {
    return {
        id: String(row.id),
        orderId: String(row.order_id),
        technicianId: str(row.technician_id),
        memberId: str(row.member_id),
        rating: Number(row.rating ?? 0),
        comment: str(row.comment),
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
            name: dto.name?.trim() || 'ACnow 고객',
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
        const [couponsRes, inquiriesRes, addressesRes, assetsRes, rewardsRes, ordersRes, reviewsRes] = await Promise.all([
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
            sb
                .from('user_addresses')
                .select('*')
                .eq('user_id', member.id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false }),
            sb
                .from('aircon_assets')
                .select('*')
                .eq('user_id', member.id)
                .order('created_at', { ascending: false }),
            sb
                .from('reward_logs')
                .select('*')
                .eq('user_id', member.id)
                .order('created_at', { ascending: false })
                .limit(50),
            sb
                .from('orders')
                .select('id,order_no,product_name_snap,product_code_snap,service_type,aircon_type,order_status,payment_status,total_price,address_summary,desired_date,desired_time_slot,created_at,updated_at')
                .or(`user_id.eq.${member.id},customer_phone.eq.${member.phone}`)
                .order('created_at', { ascending: false })
                .limit(30),
            sb
                .from('technician_reviews')
                .select('*')
                .eq('member_id', member.id)
                .order('created_at', { ascending: false })
                .limit(50),
        ]);
        if (couponsRes.error)
            throw new common_1.BadRequestException(couponsRes.error.message);
        if (inquiriesRes.error)
            throw new common_1.BadRequestException(inquiriesRes.error.message);
        if (addressesRes.error)
            throw new common_1.BadRequestException(addressesRes.error.message);
        if (assetsRes.error)
            throw new common_1.BadRequestException(assetsRes.error.message);
        if (rewardsRes.error)
            throw new common_1.BadRequestException(rewardsRes.error.message);
        if (ordersRes.error)
            throw new common_1.BadRequestException(ordersRes.error.message);
        if (reviewsRes.error)
            throw new common_1.BadRequestException(reviewsRes.error.message);
        return {
            member,
            coupons: (couponsRes.data ?? []).map(couponFromRow),
            rewardLogs: (rewardsRes.data ?? []).map(rewardLogFromRow),
            addresses: (addressesRes.data ?? []).map(addressFromRow),
            airconAssets: (assetsRes.data ?? []).map(airconAssetFromRow),
            orders: (ordersRes.data ?? []).map(customerOrderFromRow),
            reviews: (reviewsRes.data ?? []).map(reviewFromRow),
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
    async ensureMemberExists(memberId) {
        return this.getMember(requireUuid(memberId, 'member id'));
    }
    async assertAddressOwner(memberId, addressId) {
        const { data, error } = await this.db()
            .from('user_addresses')
            .select('id,user_id')
            .eq('id', requireUuid(addressId, 'address id'))
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data || String(data.user_id) !== memberId) {
            throw new common_1.NotFoundException('address not found');
        }
    }
    async assertAssetOwner(memberId, assetId) {
        const { data, error } = await this.db()
            .from('aircon_assets')
            .select('id,user_id')
            .eq('id', requireUuid(assetId, 'asset id'))
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data || String(data.user_id) !== memberId) {
            throw new common_1.NotFoundException('asset not found');
        }
    }
    async clearOtherDefaultAddresses(memberId, exceptId) {
        let q = this.db().from('user_addresses').update({ is_default: false }).eq('user_id', memberId);
        if (exceptId)
            q = q.neq('id', exceptId);
        const { error } = await q;
        if (error)
            throw new common_1.BadRequestException(error.message);
    }
    async createMemberAddress(memberId, dto) {
        const member = await this.ensureMemberExists(memberId);
        if (dto.isDefault)
            await this.clearOtherDefaultAddresses(member.id);
        const { data, error } = await this.db()
            .from('user_addresses')
            .insert({
            user_id: member.id,
            address: dto.address.trim(),
            detail_address: dto.detailAddress?.trim() || null,
            sido: dto.sido?.trim() || null,
            sigungu: dto.sigungu?.trim() || null,
            dong: dto.dong?.trim() || null,
            is_default: dto.isDefault ?? false,
        })
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('create_member_address', 'user_addresses', String(data.id), { memberId: member.id });
        return addressFromRow(data);
    }
    async updateMemberAddress(memberId, addressId, dto) {
        const member = await this.ensureMemberExists(memberId);
        await this.assertAddressOwner(member.id, addressId);
        if (dto.isDefault)
            await this.clearOtherDefaultAddresses(member.id, addressId);
        const patch = {};
        if (dto.address !== undefined)
            patch.address = dto.address.trim();
        if (dto.detailAddress !== undefined)
            patch.detail_address = dto.detailAddress.trim() || null;
        if (dto.sido !== undefined)
            patch.sido = dto.sido.trim() || null;
        if (dto.sigungu !== undefined)
            patch.sigungu = dto.sigungu.trim() || null;
        if (dto.dong !== undefined)
            patch.dong = dto.dong.trim() || null;
        if (dto.isDefault !== undefined)
            patch.is_default = dto.isDefault;
        const { data, error } = await this.db()
            .from('user_addresses')
            .update(patch)
            .eq('id', requireUuid(addressId, 'address id'))
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('update_member_address', 'user_addresses', addressId, { memberId: member.id });
        return addressFromRow(data);
    }
    async deleteMemberAddress(memberId, addressId) {
        const member = await this.ensureMemberExists(memberId);
        await this.assertAddressOwner(member.id, addressId);
        const { error } = await this.db().from('user_addresses').delete().eq('id', requireUuid(addressId, 'address id'));
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('delete_member_address', 'user_addresses', addressId, { memberId: member.id });
        return { id: addressId, deleted: true };
    }
    async createAirconAsset(memberId, dto) {
        const member = await this.ensureMemberExists(memberId);
        if (dto.addressId)
            await this.assertAddressOwner(member.id, dto.addressId);
        const { data, error } = await this.db()
            .from('aircon_assets')
            .insert({
            user_id: member.id,
            address_id: dto.addressId ?? null,
            type: dto.type,
            brand: dto.brand?.trim() || null,
            model_name: dto.modelName?.trim() || null,
            installed_year: dto.installedYear ?? null,
            memo: dto.memo?.trim() || null,
        })
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('create_aircon_asset', 'aircon_assets', String(data.id), { memberId: member.id });
        return airconAssetFromRow(data);
    }
    async updateAirconAsset(memberId, assetId, dto) {
        const member = await this.ensureMemberExists(memberId);
        await this.assertAssetOwner(member.id, assetId);
        if (dto.addressId)
            await this.assertAddressOwner(member.id, dto.addressId);
        const patch = {};
        if (dto.addressId !== undefined)
            patch.address_id = dto.addressId || null;
        if (dto.type !== undefined)
            patch.type = dto.type;
        if (dto.brand !== undefined)
            patch.brand = dto.brand.trim() || null;
        if (dto.modelName !== undefined)
            patch.model_name = dto.modelName.trim() || null;
        if (dto.installedYear !== undefined)
            patch.installed_year = dto.installedYear;
        if (dto.memo !== undefined)
            patch.memo = dto.memo.trim() || null;
        const { data, error } = await this.db()
            .from('aircon_assets')
            .update(patch)
            .eq('id', requireUuid(assetId, 'asset id'))
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('update_aircon_asset', 'aircon_assets', assetId, { memberId: member.id });
        return airconAssetFromRow(data);
    }
    async deleteAirconAsset(memberId, assetId) {
        const member = await this.ensureMemberExists(memberId);
        await this.assertAssetOwner(member.id, assetId);
        const { error } = await this.db().from('aircon_assets').delete().eq('id', requireUuid(assetId, 'asset id'));
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('delete_aircon_asset', 'aircon_assets', assetId, { memberId: member.id });
        return { id: assetId, deleted: true };
    }
    async useMemberCoupon(memberId, couponId, dto) {
        const member = await this.ensureMemberExists(memberId);
        const { data: coupon, error: e0 } = await this.db()
            .from('coupons')
            .select('*')
            .eq('id', requireUuid(couponId, 'coupon id'))
            .eq('user_id', member.id)
            .maybeSingle();
        if (e0)
            throw new common_1.BadRequestException(e0.message);
        if (!coupon)
            throw new common_1.NotFoundException('coupon not found');
        if (String(coupon.status) !== 'active') {
            throw new common_1.BadRequestException('coupon is not active');
        }
        const orderId = dto.orderId ? requireUuid(dto.orderId, 'order id') : null;
        const { data, error } = await this.db()
            .from('coupons')
            .update({ status: 'used', used_booking_id: orderId })
            .eq('id', couponId)
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.db().from('reward_logs').insert({
            user_id: member.id,
            action_type: 'coupon_use',
            reward_type: 'discount_coupon',
            amount: Number(coupon.amount ?? 0),
            status: 'used',
            reference_id: couponId,
            payload: { orderId },
        });
        await this.audit('use_member_coupon', 'coupons', couponId, { memberId: member.id, orderId });
        return couponFromRow(data);
    }
    async reviewMemberOrder(memberId, orderId, dto) {
        const member = await this.ensureMemberExists(memberId);
        const { data: order, error: e0 } = await this.db()
            .from('orders')
            .select('id,user_id,customer_phone,assigned_technician_id,order_status')
            .eq('id', requireUuid(orderId, 'order id'))
            .maybeSingle();
        if (e0)
            throw new common_1.BadRequestException(e0.message);
        if (!order)
            throw new common_1.NotFoundException('order not found');
        const o = order;
        if (String(o.user_id ?? '') !== member.id && String(o.customer_phone ?? '') !== member.phone) {
            throw new common_1.UnauthorizedException('회원 주문이 아닙니다.');
        }
        if (!['completed', 'settlement_pending', 'settled'].includes(String(o.order_status ?? ''))) {
            throw new common_1.BadRequestException('완료된 주문만 평가할 수 있습니다.');
        }
        const { data, error } = await this.db()
            .from('technician_reviews')
            .upsert({
            order_id: orderId,
            technician_id: o.assigned_technician_id ?? null,
            member_id: member.id,
            rating: dto.rating,
            comment: dto.comment?.trim() || null,
        }, { onConflict: 'order_id' })
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.db().from('reward_logs').insert({
            user_id: member.id,
            action_type: 'order_review',
            reward_type: 'review',
            amount: 0,
            status: 'created',
            reference_id: orderId,
            payload: { rating: dto.rating },
        });
        await this.audit('review_member_order', 'technician_reviews', String(data.id), {
            memberId: member.id,
            orderId,
            rating: dto.rating,
        });
        return reviewFromRow(data);
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
            materials: await this.sellerMaterials(id),
            materialOrders: await this.sellerMaterialOrders(id),
            scope: ['판매자 신청 상태', '회사/담당자 정보', '취급 품목', '자재/공급가'],
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
    async getMaterials() {
        const { data, error } = await this.db()
            .from('materials')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return (data ?? []).map(materialFromRow);
    }
    async createMaterial(dto) {
        const { data, error } = await this.db()
            .from('materials')
            .insert({
            name: dto.name.trim(),
            code: dto.code.trim(),
            category: dto.category?.trim() || 'general',
            unit: dto.unit?.trim() || 'each',
            customer_price: dto.customerPrice ?? null,
            technician_cost_allowance: dto.technicianCostAllowance ?? null,
            platform_fee_rate: dto.platformFeeRate ?? null,
            seller_id: dto.sellerId ? requireUuid(dto.sellerId, 'seller id') : null,
            supplier_name: dto.supplierName?.trim() || null,
            description: dto.description?.trim() || null,
            image_url: dto.imageUrl?.trim() || null,
            stock_quantity: dto.stockQuantity ?? 0,
            market_status: dto.marketStatus ?? ((dto.stockQuantity ?? 0) > 0 ? 'active' : 'sold_out'),
            delivery_note: dto.deliveryNote?.trim() || null,
            min_order_quantity: dto.minOrderQuantity ?? 1,
            oem_available: dto.oemAvailable ?? false,
            is_active: true,
        })
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        const material = materialFromRow(data);
        await this.audit('create_material', 'materials', material.id, dto);
        return material;
    }
    async updateMaterial(id, dto) {
        const patch = {};
        if (dto.name !== undefined)
            patch.name = dto.name.trim();
        if (dto.category !== undefined)
            patch.category = dto.category.trim() || 'general';
        if (dto.unit !== undefined)
            patch.unit = dto.unit.trim() || 'each';
        if (dto.customerPrice !== undefined)
            patch.customer_price = dto.customerPrice;
        if (dto.technicianCostAllowance !== undefined)
            patch.technician_cost_allowance = dto.technicianCostAllowance;
        if (dto.platformFeeRate !== undefined)
            patch.platform_fee_rate = dto.platformFeeRate;
        if (dto.sellerId !== undefined)
            patch.seller_id = dto.sellerId ? requireUuid(dto.sellerId, 'seller id') : null;
        if (dto.supplierName !== undefined)
            patch.supplier_name = dto.supplierName.trim() || null;
        if (dto.description !== undefined)
            patch.description = dto.description.trim() || null;
        if (dto.imageUrl !== undefined)
            patch.image_url = dto.imageUrl.trim() || null;
        if (dto.stockQuantity !== undefined)
            patch.stock_quantity = dto.stockQuantity;
        if (dto.marketStatus !== undefined)
            patch.market_status = dto.marketStatus;
        if (dto.deliveryNote !== undefined)
            patch.delivery_note = dto.deliveryNote.trim() || null;
        if (dto.minOrderQuantity !== undefined)
            patch.min_order_quantity = dto.minOrderQuantity;
        if (dto.oemAvailable !== undefined)
            patch.oem_available = dto.oemAvailable;
        if (dto.isActive !== undefined)
            patch.is_active = dto.isActive;
        const { data, error } = await this.db()
            .from('materials')
            .update(patch)
            .eq('id', requireUuid(id, 'material id'))
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        const material = materialFromRow(data);
        await this.audit('update_material', 'materials', id, dto);
        return material;
    }
    async deleteMaterial(id) {
        const { error } = await this.db()
            .from('materials')
            .update({ is_active: false })
            .eq('id', requireUuid(id, 'material id'));
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.audit('delete_material', 'materials', id, { soft: true });
        return { id, deleted: true, softDeleted: true };
    }
    async sellerById(id) {
        const { data, error } = await this.db()
            .from('seller_applications')
            .select('*')
            .eq('id', requireUuid(id, 'seller id'))
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data)
            throw new common_1.NotFoundException('seller not found');
        return sellerFromRow(data);
    }
    async sellerMaterials(sellerId) {
        const seller = await this.sellerById(sellerId);
        const id = requireUuid(sellerId, 'seller id');
        const { data: byId, error: e1 } = await this.db()
            .from('materials')
            .select('*')
            .eq('seller_id', id)
            .order('created_at', { ascending: false });
        if (e1)
            throw new common_1.BadRequestException(e1.message);
        const { data: byName, error: e2 } = await this.db()
            .from('materials')
            .select('*')
            .is('seller_id', null)
            .eq('supplier_name', seller.companyName)
            .order('created_at', { ascending: false });
        if (e2)
            throw new common_1.BadRequestException(e2.message);
        const merged = new Map();
        for (const row of [...(byId ?? []), ...(byName ?? [])]) {
            merged.set(String(row.id), row);
        }
        return [...merged.values()].map(materialFromRow);
    }
    async createSellerMaterial(sellerId, dto) {
        const seller = await this.sellerById(sellerId);
        const material = await this.createMaterial({
            ...dto,
            sellerId,
            supplierName: seller.companyName,
        });
        await this.audit('seller_create_material', 'materials', material.id, {
            sellerId,
            supplierName: seller.companyName,
            code: dto.code,
        });
        return material;
    }
    async updateSellerMaterial(sellerId, materialId, dto) {
        const seller = await this.sellerById(sellerId);
        const { data: before, error } = await this.db()
            .from('materials')
            .select('id,supplier_name,seller_id')
            .eq('id', requireUuid(materialId, 'material id'))
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!before)
            throw new common_1.NotFoundException('material not found');
        const rec = before;
        if (String(rec.seller_id ?? '') !== sellerId && String(rec.supplier_name ?? '') !== seller.companyName) {
            throw new common_1.UnauthorizedException('해당 판매자 공급가가 아닙니다.');
        }
        const material = await this.updateMaterial(materialId, {
            ...dto,
            sellerId,
            supplierName: seller.companyName,
        });
        await this.audit('seller_update_material', 'materials', materialId, {
            sellerId,
            supplierName: seller.companyName,
        });
        return material;
    }
    async deleteSellerMaterial(sellerId, materialId) {
        await this.updateSellerMaterial(sellerId, materialId, { isActive: false });
        await this.audit('seller_delete_material', 'materials', materialId, { sellerId, soft: true });
        return { id: materialId, deleted: true, softDeleted: true };
    }
    async sellerMaterialOrders(sellerId) {
        const seller = await this.sellerById(sellerId);
        const { data, error } = await this.db()
            .from('material_purchase_orders')
            .select('*,items:material_purchase_order_items(*)')
            .eq('seller_id', seller.id)
            .order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return (data ?? []).map(materialPurchaseOrderFromRow);
    }
    async getMaterialPurchaseOrders() {
        const { data, error } = await this.db()
            .from('material_purchase_orders')
            .select('*,items:material_purchase_order_items(*)')
            .order('created_at', { ascending: false })
            .limit(500);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return (data ?? []).map(materialPurchaseOrderFromRow);
    }
    async updateSellerMaterialPurchaseOrder(sellerId, orderId, dto) {
        const seller = await this.sellerById(sellerId);
        return this.updateMaterialPurchaseOrder(orderId, dto, {
            actor: 'seller',
            sellerId: seller.id,
        });
    }
    async updateAdminMaterialPurchaseOrder(orderId, dto) {
        return this.updateMaterialPurchaseOrder(orderId, dto, { actor: 'admin' });
    }
    async sellerPreviewSession(id) {
        const seller = await this.sellerById(id);
        return {
            id: seller.id,
            role: 'seller',
            name: seller.companyName || seller.ownerName,
            phone: seller.phone,
            status: seller.status,
            preview: true,
            previewLabel: '관리자 운영 미리보기',
        };
    }
    async technicianPreviewSession(id) {
        const technician = this.techniciansRegistry.findById(requireUuid(id, 'technician id'));
        if (!technician)
            throw new common_1.NotFoundException('technician not found');
        return {
            id: technician.id,
            role: 'technician',
            name: technician.name,
            phone: technician.phone,
            status: technician.status,
            preview: true,
            previewLabel: '관리자 운영 미리보기',
        };
    }
    async updateMaterialPurchaseOrder(orderId, dto, scope) {
        const id = requireUuid(orderId, 'material order id');
        const { data: before, error: beforeError } = await this.db()
            .from('material_purchase_orders')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (beforeError)
            throw new common_1.BadRequestException(beforeError.message);
        if (!before)
            throw new common_1.NotFoundException('material order not found');
        const rec = before;
        if (scope.actor === 'seller' && String(rec.seller_id ?? '') !== scope.sellerId) {
            throw new common_1.UnauthorizedException('해당 판매자 구매요청이 아닙니다.');
        }
        const status = dto.status;
        const now = new Date().toISOString();
        const patch = { status };
        if (scope.actor === 'seller' && dto.sellerMemo !== undefined)
            patch.seller_memo = dto.sellerMemo.trim() || null;
        if (scope.actor === 'admin') {
            if (dto.sellerMemo !== undefined)
                patch.seller_memo = dto.sellerMemo.trim() || null;
            if (dto.adminMemo !== undefined)
                patch.admin_memo = dto.adminMemo.trim() || null;
        }
        if (status === 'confirmed')
            patch.confirmed_at = now;
        if (status === 'preparing')
            patch.preparing_at = now;
        if (status === 'shipped')
            patch.shipped_at = now;
        if (status === 'delivered')
            patch.delivered_at = now;
        if (status === 'cancelled')
            patch.cancelled_at = now;
        const { data, error } = await this.db()
            .from('material_purchase_orders')
            .update(patch)
            .eq('id', id)
            .select('*,items:material_purchase_order_items(*)')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (status === 'cancelled' && String(rec.status ?? '') !== 'cancelled' && String(rec.status ?? '') !== 'delivered') {
            await this.restoreMaterialOrderStock(id);
        }
        await this.audit(scope.actor === 'seller' ? 'seller_update_material_order' : 'admin_update_material_order', 'material_purchase_orders', id, { status, sellerId: scope.sellerId ?? null });
        return materialPurchaseOrderFromRow(data);
    }
    async restoreMaterialOrderStock(orderId) {
        const { data, error } = await this.db()
            .from('material_purchase_order_items')
            .select('material_id,quantity')
            .eq('purchase_order_id', orderId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        for (const row of (data ?? [])) {
            const materialId = str(row.material_id);
            if (!materialId)
                continue;
            const quantity = Math.max(0, Number(row.quantity ?? 0));
            const { data: material, error: e1 } = await this.db()
                .from('materials')
                .select('stock_quantity,market_status')
                .eq('id', materialId)
                .maybeSingle();
            if (e1)
                throw new common_1.BadRequestException(e1.message);
            if (!material)
                continue;
            const nextStock = Number(material.stock_quantity ?? 0) + quantity;
            const currentStatus = String(material.market_status ?? 'active');
            const { error: e2 } = await this.db()
                .from('materials')
                .update({
                stock_quantity: nextStock,
                market_status: currentStatus === 'sold_out' && nextStock > 0 ? 'active' : currentStatus,
            })
                .eq('id', materialId);
            if (e2)
                throw new common_1.BadRequestException(e2.message);
        }
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