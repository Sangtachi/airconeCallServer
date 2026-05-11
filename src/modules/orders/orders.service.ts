import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Express } from 'express';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../database/database.tokens';
import { NotificationService } from '../notifications/notification.service';
import { ServiceCatalogService } from '../service-catalog/service-catalog.service';
import { fetchCapabilitiesBulk, technicianFromRow } from '../technicians/technicians-db.mapper';
import type { TechnicianOrderPhotoDto } from '../technicians/technician.dto';
import type {
  TechnicianPhotoConfirmDto,
  TechnicianPhotoPresignDto,
} from './dto/technician-photo-upload.dto';
import type { OrderPhotoKind, OrderPhotoRow } from './order-photo.types';
import type { OrdersRepositoryPort } from './orders.repository.port';
import { ORDERS_REPO } from './orders.repository.port';
import type { EmergencyLeadRow } from '../emergency-leads/emergency-leads.types';
import type { TechnicianEntity } from '../technicians/technician.types';
import type { CustomerOrderRow } from './orders.types';
import { CreateOrderDraftDto } from './dto/create-order-draft.dto';
import type { PatchInstallOrderAdminDto } from './dto/patch-install-order-admin.dto';
import type { CreateMaterialPurchaseOrderDto } from '../admin/admin.dto';
import {
  assertOrderPhotoStoragePath,
  extFromMime,
  orderPhotosBucketName,
} from './order-photo-storage.paths';

export interface TechnicianSettlementListItem {
  id: string;
  orderId: string;
  orderNo: string | null;
  grossAmount: number;
  materialAllowance: number;
  platformFee: number | null;
  technicianPayout: number | null;
  platformFeeRate: number | null;
  status: string;
  paidAt: string | null;
  payoutRequestedAt: string | null;
  createdAt: string;
}

export interface TechnicianMaterialListItem {
  id: string;
  sellerId: string | null;
  name: string;
  code: string;
  category: string;
  unit: string;
  customerPrice: number | null;
  technicianCostAllowance: number | null;
  oemAvailable: boolean;
  supplierName: string | null;
  description: string | null;
  imageUrl: string | null;
  stockQuantity: number;
  marketStatus: string;
  deliveryNote: string | null;
  minOrderQuantity: number;
  isActive: boolean;
}

export interface TechnicianDispatchOffer {
  id: string;
  orderNo: string;
  serviceType: string;
  serviceTypeLabel: string;
  airconType: string;
  airconTypeLabel: string;
  scheduleType: 'same_day' | 'reservation';
  scheduleLabel: string;
  scheduleText: string;
  regionLabel: string;
  customerPaymentAmount: number;
  expectedPayout: number;
  includedItems: string[];
  extraPotential: string;
  acceptanceDeadlineSec: number;
  distanceLabel: string;
  createdAt: string;
}

export interface TechnicianDispatchPreferences {
  regions: string[];
  serviceTypes: string[];
  airconTypes: string[];
  availabilityCodes: string[];
  minimumPayout: number | null;
  maxDistanceKm: number | null;
  sameDayEnabled: boolean;
  reservationEnabled: boolean;
}

export interface TechnicianReviewSummary {
  averageRating: number | null;
  reviewCount: number;
  recent: Array<{
    id: string;
    orderId: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }>;
}

export interface TechnicianPartnerHome {
  technician: {
    id: string;
    name: string;
    workStatus: TechnicianEntity['workStatus'];
    baseRegion: string | null;
    grade: string;
    benefitText: string;
  };
  summary: {
    todayReservations: number;
    sameDayOffers: number;
    weeklyExpectedPayout: number;
    pendingPayout: number;
  };
  quickOffers: TechnicianDispatchOffer[];
  todayJobs: Array<{
    id: string;
    orderNo: string;
    productName: string;
    scheduleText: string;
    regionLabel: string;
    orderStatus: string;
    expectedPayout: number;
  }>;
  materialAlerts: string[];
  notices: Array<{ id: string; title: string; body: string; createdAt: string }>;
  reviewSummary: TechnicianReviewSummary;
}

/** order_photos.technician_id 는 technicians UUID FK — 레거시 t_· 등 비UUID는 null 저장 */
function technicianIdForPhotosForeignKey(technicianId: string): string | null {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    technicianId.trim(),
  )
    ? technicianId.trim()
    : null;
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v.trim(),
  );
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function materialOrderNo(): string {
  const d = new Date();
  const ymd = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('');
  return `MP-${ymd}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function settlementRowFromDb(r: Record<string, unknown>): TechnicianSettlementListItem {
  return {
    id: String(r.id),
    orderId: String(r.order_id),
    orderNo: r.order_no == null ? null : String(r.order_no),
    grossAmount: Number(r.gross_amount ?? 0),
    materialAllowance: Number(r.material_allowance ?? 0),
    platformFee: r.platform_fee == null ? null : Number(r.platform_fee),
    technicianPayout: r.technician_payout == null ? null : Number(r.technician_payout),
    platformFeeRate: r.platform_fee_rate == null ? null : Number(r.platform_fee_rate),
    status: String(r.status ?? 'pending'),
    paidAt: r.paid_at == null ? null : String(r.paid_at),
    payoutRequestedAt: r.payout_requested_at == null ? null : String(r.payout_requested_at),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function maskAccount(account: unknown): string | null {
  const digits = String(account ?? '').replace(/\D/g, '');
  if (digits.length < 4) return null;
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

function materialRowFromDb(r: Record<string, unknown>): TechnicianMaterialListItem {
  return {
    id: String(r.id),
    sellerId: str(r.seller_id),
    name: String(r.name),
    code: String(r.code),
    category: String(r.category ?? 'general'),
    unit: String(r.unit ?? 'each'),
    customerPrice: r.customer_price == null ? null : Number(r.customer_price),
    technicianCostAllowance:
      r.technician_cost_allowance == null ? null : Number(r.technician_cost_allowance),
    oemAvailable: Boolean(r.oem_available),
    supplierName: r.supplier_name == null ? null : String(r.supplier_name),
    description: str(r.description),
    imageUrl: str(r.image_url),
    stockQuantity: Number(r.stock_quantity ?? 0),
    marketStatus: String(r.market_status ?? 'active'),
    deliveryNote: str(r.delivery_note),
    minOrderQuantity: Number(r.min_order_quantity ?? 1),
    isActive: r.is_active !== false,
  };
}

function materialPurchaseItemFromDb(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    purchaseOrderId: String(r.purchase_order_id),
    materialId: str(r.material_id),
    sellerId: str(r.seller_id),
    name: String(r.name ?? ''),
    code: String(r.code ?? ''),
    unit: String(r.unit ?? 'each'),
    supplierName: str(r.supplier_name),
    unitPrice: Number(r.unit_price ?? 0),
    quantity: Number(r.quantity ?? 0),
    amount: Number(r.amount ?? 0),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

function materialPurchaseOrderFromDb(r: Record<string, unknown>) {
  const rawItems = Array.isArray(r.items)
    ? r.items
    : Array.isArray(r.material_purchase_order_items)
      ? r.material_purchase_order_items
      : [];
  return {
    id: String(r.id),
    orderNo: String(r.order_no ?? ''),
    technicianId: String(r.technician_id ?? ''),
    technicianName: str(r.technician_name),
    technicianPhone: str(r.technician_phone),
    sellerId: str(r.seller_id),
    sellerName: str(r.seller_name),
    status: String(r.status ?? 'requested'),
    totalAmount: Number(r.total_amount ?? 0),
    deliveryAddress: String(r.delivery_address ?? ''),
    recipientName: str(r.recipient_name),
    recipientPhone: str(r.recipient_phone),
    requestMemo: str(r.request_memo),
    sellerMemo: str(r.seller_memo),
    adminMemo: str(r.admin_memo),
    confirmedAt: str(r.confirmed_at),
    preparingAt: str(r.preparing_at),
    shippedAt: str(r.shipped_at),
    deliveredAt: str(r.delivered_at),
    cancelledAt: str(r.cancelled_at),
    createdAt: String(r.created_at ?? new Date().toISOString()),
    updatedAt: String(r.updated_at ?? new Date().toISOString()),
    items: rawItems.map((item) => materialPurchaseItemFromDb(item as Record<string, unknown>)),
  };
}

function serviceTypeLabel(v: string): string {
  return v === 'cleaning' ? '청소' : '설치';
}

function airconTypeLabel(v: string): string {
  return (
    {
      wall: '벽걸이',
      stand: '스탠드',
      two_in_one: '투인원',
      system: '시스템',
    } as Record<string, string>
  )[v] ?? v;
}

function expectedTechnicianPayout(order: Pick<CustomerOrderRow, 'totalPrice'>): number {
  return Math.max(0, Math.round((Number(order.totalPrice) || 0) * 0.8));
}

function orderRegionLabel(order: CustomerOrderRow, revealDetail = false): string {
  const coarse = [order.sigungu, order.dong].map((x) => x?.trim()).filter(Boolean).join(' ');
  if (coarse) return coarse;
  const summary = String(order.addressSummary ?? '').trim();
  if (revealDetail) return summary || '주소 확인 필요';
  const parts = summary.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return parts.slice(0, 2).join(' ');
  return summary || '지역 확인 중';
}

function scheduleText(order: CustomerOrderRow): string {
  if (order.scheduleType === 'same_day') {
    return order.desiredTimeSlot ? `오늘 ${order.desiredTimeSlot}` : '오늘 당일';
  }
  const date = order.desiredDate ?? '예약일 협의';
  return order.desiredTimeSlot ? `${date} ${order.desiredTimeSlot}` : date;
}

function includedItemsForOrder(order: CustomerOrderRow): string[] {
  const items: string[] = [];
  if (order.serviceType === 'install') {
    items.push('기본 배관 5m');
    if (order.airconType !== 'wall') items.push('냉매 보충 1회');
    if (order.airconType === 'two_in_one' || order.airconType === 'stand') items.push('타공 1회');
  } else {
    items.push('기본 세척');
    items.push('필터 점검');
    if (order.airconType === 'system') items.push('시스템 실내기 점검');
  }
  return items;
}

function dispatchOfferFromOrder(order: CustomerOrderRow): TechnicianDispatchOffer {
  return {
    id: order.id,
    orderNo: order.orderNo,
    serviceType: order.serviceType,
    serviceTypeLabel: serviceTypeLabel(order.serviceType),
    airconType: order.airconType,
    airconTypeLabel: airconTypeLabel(order.airconType),
    scheduleType: order.scheduleType,
    scheduleLabel: order.scheduleType === 'same_day' ? '당일' : '예약',
    scheduleText: scheduleText(order),
    regionLabel: orderRegionLabel(order, false),
    customerPaymentAmount: Number(order.totalPrice) || 0,
    expectedPayout: expectedTechnicianPayout(order),
    includedItems: includedItemsForOrder(order),
    extraPotential: '현장 확인 후 앱 승인',
    acceptanceDeadlineSec: 45,
    distanceLabel: '활동 지역 기준',
    createdAt: order.createdAt,
  };
}

function dateRange(range: string | undefined): { start: string; end: string } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  const end = new Date(today);
  if (range === 'tomorrow') {
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 2);
  } else if (range === 'week') {
    end.setDate(end.getDate() + 7);
  } else if (range === 'next_week') {
    start.setDate(start.getDate() + 7);
    end.setDate(end.getDate() + 14);
  } else {
    end.setDate(end.getDate() + 1);
  }
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function cleanStringList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((x) => String(x).trim()).filter(Boolean))];
}

function defaultPreferences(technician: TechnicianEntity): TechnicianDispatchPreferences {
  return {
    regions: technician.regions.length > 0 ? technician.regions : technician.baseRegion ? [technician.baseRegion] : [],
    serviceTypes: [...new Set(technician.capabilities.map((c) => c.serviceType))],
    airconTypes: [...new Set(technician.capabilities.map((c) => c.airconType))],
    availabilityCodes: technician.availability,
    minimumPayout: null,
    maxDistanceKm: 20,
    sameDayEnabled: technician.availability.includes('same_day'),
    reservationEnabled: technician.availability.includes('reservation'),
  };
}

function missingOptionalRelation(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /schema cache|could not find the table|relation .* does not exist/i.test(msg);
}

function photoRowFromDb(r: Record<string, unknown>): OrderPhotoRow {
  return {
    id: String(r.id),
    orderId: String(r.order_id),
    technicianId: r.technician_id == null ? null : String(r.technician_id),
    kind: r.kind as OrderPhotoKind,
    url: String(r.url),
    caption: r.caption == null ? null : String(r.caption),
    createdAt: String(r.created_at ?? new Date().toISOString()),
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly catalog: ServiceCatalogService,
    @Inject(ORDERS_REPO) private readonly store: OrdersRepositoryPort,
    @Inject(SUPABASE_ADMIN) private readonly sb: SupabaseClient | null,
    private readonly notifications: NotificationService,
  ) {}

  private db(): SupabaseClient {
    if (!this.sb) {
      throw new ServiceUnavailableException(
        'OrdersService requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
      );
    }
    return this.sb;
  }

  async createEmergencyLeadDraft(lead: EmergencyLeadRow, productId: string): Promise<CustomerOrderRow> {
    const placeholderPhone = '01000001234';
    const scheduleType = lead.urgency === 'scheduled' ? 'reservation' : 'same_day';
    const digits = (lead.customerPhone ?? '').replace(/\D/g, '');
    const customerPhone = digits.length >= 10 ? digits : placeholderPhone;
    const customerName = (lead.customerName?.trim() ?? '') !== '' ? String(lead.customerName).trim() : '긴급 접수 고객';

    let addressSummary = lead.locationText.trim();
    if (addressSummary.length < 3) {
      addressSummary = `${addressSummary} (주소 추가 확인)`.trim();
    }
    if (addressSummary.length < 3) {
      addressSummary = '주소 확인 필요';
    }

    const memoParts = [
      `[긴급 접수 리드 ${lead.id}]`,
      `에어컨: ${lead.airconType || '-'}`,
      `증상: ${lead.issueText || '-'}`,
    ];
    if (digits.length < 10) memoParts.push('실제 고객 전화 미확인 — placeholder 사용');

    const dto = Object.assign(new CreateOrderDraftDto(), {
      productId,
      scheduleType,
      customerName,
      customerPhone,
      addressSummary,
      userId: lead.userId ?? undefined,
      customerMemo: memoParts.join(' | '),
    });
    const order = await this.createDraft(dto);
    order.orderStatus = 'matching';
    order.updatedAt = new Date().toISOString();
    await this.store.replace(order);
    await this.notifyDispatchableOrder(order);
    return order;
  }

  async createDraft(dto: CreateOrderDraftDto): Promise<CustomerOrderRow> {
    const product = this.catalog.resolveProductPrice(dto.productId, dto.scheduleType);
    const productTotalPrice =
      dto.scheduleType === 'same_day' ? product.sameDayPrice : product.basePrice;
    const now = new Date().toISOString();
    const row: CustomerOrderRow = {
      id: randomUUID(),
      orderNo: OrdersService.makeOrderNo(),
      userId: dto.userId ?? null,
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      serviceType: product.serviceType,
      airconType: product.airconType,
      scheduleType: dto.scheduleType,
      desiredDate: null,
      desiredTimeSlot: null,
      addressSummary: dto.addressSummary,
      sido: null,
      sigungu: null,
      dong: null,
      detailAddress: null,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      basePrice: product.basePrice,
      sameDayExtraPrice: product.sameDayExtraPrice,
      productTotalPrice,
      extraTotalPrice: 0,
      discountAmount: 0,
      totalPrice: productTotalPrice,
      paymentStatus: 'pending',
      orderStatus: 'created',
      assignedTechnicianId: null,
      customerMemo: dto.customerMemo ?? null,
      adminMemo: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.insert(row);
    return row;
  }

  async getOrder(id: string): Promise<CustomerOrderRow> {
    const row = await this.store.findById(id);
    if (!row) throw new NotFoundException('order not found');
    return row;
  }

  async listOrders(): Promise<CustomerOrderRow[]> {
    return this.store.listNewestFirst();
  }

  /** 관리자: 주문 상태 수동 수정 */
  async patchAdmin(id: string, dto: PatchInstallOrderAdminDto): Promise<CustomerOrderRow> {
    const row = await this.getOrder(id);
    const now = new Date().toISOString();
    if (dto.adminMemo !== undefined) row.adminMemo = dto.adminMemo;
    if (dto.assignedTechnicianId !== undefined) {
      const v = dto.assignedTechnicianId;
      if (v === '' || v === null) {
        row.assignedTechnicianId = null;
      } else {
        row.assignedTechnicianId = await this.requireApprovedTechnicianId(v, row);
      }
    }
    if (dto.orderStatus !== undefined) {
      row.orderStatus = dto.orderStatus;
      if (dto.orderStatus === 'refunded') row.paymentStatus = 'refunded';
      else if (dto.orderStatus === 'cancelled') row.paymentStatus = 'failed';
      else if (
        (dto.orderStatus === 'matching' || dto.orderStatus === 'assigned') &&
        row.paymentStatus === 'pending'
      ) {
        row.paymentStatus = 'paid';
      }
    }
    row.updatedAt = now;
    await this.store.replace(row);
    if (row.orderStatus === 'matching') await this.notifyDispatchableOrder(row);
    return row;
  }

  private async requireApprovedTechnicianId(technicianId: string, order?: CustomerOrderRow): Promise<string> {
    const id = technicianId.trim();
    if (!isUuid(id)) throw new BadRequestException('assignedTechnicianId must be an approved technician UUID');
    const { data, error } = await this.db()
      .from('technicians')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    const tech = data as Record<string, unknown> | null;
    if (!tech || String(tech.status ?? '') !== 'approved') {
      throw new BadRequestException('assignedTechnicianId must reference an approved technician');
    }
    if (String(tech.work_status ?? 'available') === 'offline') {
      throw new BadRequestException('assigned technician is offline');
    }
    if (order) {
      const availabilityCode = order.scheduleType === 'same_day' ? 'same_day' : 'reservation';
      const columnOk =
        availabilityCode === 'same_day'
          ? tech.available_same_day !== false
          : tech.available_reservation !== false;
      const avRows = await this.db()
        .from('technician_availability')
        .select('availability_code')
        .eq('technician_id', id)
        .eq('availability_code', availabilityCode)
        .limit(1);
      if (avRows.error) throw new BadRequestException(avRows.error.message);
      if (!columnOk && (avRows.data?.length ?? 0) === 0) {
        throw new BadRequestException(`assigned technician is not available for ${availabilityCode}`);
      }
      const regions = await this.db()
        .from('technician_regions')
        .select('region')
        .eq('technician_id', id);
      if (regions.error) throw new BadRequestException(regions.error.message);
      const regionList = (regions.data ?? [])
        .map((r) => String((r as { region?: string }).region ?? '').trim())
        .filter(Boolean);
      const baseRegion = String(tech.base_region ?? '').trim();
      if (baseRegion) regionList.push(baseRegion);
      const uniqueRegions = [...new Set(regionList)];
      if (uniqueRegions.length > 0 && !uniqueRegions.some((region) => order.addressSummary.includes(region))) {
        throw new BadRequestException('assigned technician is outside configured regions');
      }
    }
    return id;
  }

  async mockConfirmPayment(orderId: string): Promise<CustomerOrderRow> {
    const row = await this.getOrder(orderId);
    if (row.paymentStatus === 'paid') return row;
    if (row.orderStatus !== 'created' || row.paymentStatus !== 'pending') {
      throw new BadRequestException('order cannot confirm in current state');
    }
    row.paymentStatus = 'paid';
    row.orderStatus = 'matching';
    row.updatedAt = new Date().toISOString();
    await this.store.replace(row);
    await this.store.appendMockProductPayment(row);
    await this.notifyDispatchableOrder(row);
    return row;
  }

  async technicianGetDispatchPreferences(technician: TechnicianEntity): Promise<TechnicianDispatchPreferences> {
    const fallback = defaultPreferences(technician);
    try {
      const { data, error } = await this.db()
        .from('technician_dispatch_preferences')
        .select('*')
        .eq('technician_id', technician.id)
        .maybeSingle();
      if (error) throw new BadRequestException(error.message);
      if (!data) return fallback;
      const row = data as Record<string, unknown>;
      return {
        regions: cleanStringList(row.regions).length > 0 ? cleanStringList(row.regions) : fallback.regions,
        serviceTypes: cleanStringList(row.service_types).length > 0 ? cleanStringList(row.service_types) : fallback.serviceTypes,
        airconTypes: cleanStringList(row.aircon_types).length > 0 ? cleanStringList(row.aircon_types) : fallback.airconTypes,
        availabilityCodes:
          cleanStringList(row.availability_codes).length > 0
            ? cleanStringList(row.availability_codes)
            : fallback.availabilityCodes,
        minimumPayout: row.minimum_payout == null ? fallback.minimumPayout : Number(row.minimum_payout),
        maxDistanceKm: row.max_distance_km == null ? fallback.maxDistanceKm : Number(row.max_distance_km),
        sameDayEnabled: row.same_day_enabled == null ? fallback.sameDayEnabled : Boolean(row.same_day_enabled),
        reservationEnabled:
          row.reservation_enabled == null ? fallback.reservationEnabled : Boolean(row.reservation_enabled),
      };
    } catch (error) {
      if (missingOptionalRelation(error)) return fallback;
      throw error;
    }
  }

  async technicianUpdateDispatchPreferences(
    technician: TechnicianEntity,
    dto: Partial<TechnicianDispatchPreferences>,
  ): Promise<TechnicianDispatchPreferences> {
    const current = await this.technicianGetDispatchPreferences(technician);
    const next: TechnicianDispatchPreferences = {
      regions: dto.regions !== undefined ? cleanStringList(dto.regions) : current.regions,
      serviceTypes: dto.serviceTypes !== undefined ? cleanStringList(dto.serviceTypes) : current.serviceTypes,
      airconTypes: dto.airconTypes !== undefined ? cleanStringList(dto.airconTypes) : current.airconTypes,
      availabilityCodes:
        dto.availabilityCodes !== undefined ? cleanStringList(dto.availabilityCodes) : current.availabilityCodes,
      minimumPayout:
        dto.minimumPayout === undefined || dto.minimumPayout === null ? current.minimumPayout : Number(dto.minimumPayout),
      maxDistanceKm:
        dto.maxDistanceKm === undefined || dto.maxDistanceKm === null ? current.maxDistanceKm : Number(dto.maxDistanceKm),
      sameDayEnabled: dto.sameDayEnabled === undefined ? current.sameDayEnabled : Boolean(dto.sameDayEnabled),
      reservationEnabled:
        dto.reservationEnabled === undefined ? current.reservationEnabled : Boolean(dto.reservationEnabled),
    };
    try {
      const { error } = await this.db().from('technician_dispatch_preferences').upsert(
        {
          technician_id: technician.id,
          regions: next.regions,
          service_types: next.serviceTypes,
          aircon_types: next.airconTypes,
          availability_codes: next.availabilityCodes,
          minimum_payout: next.minimumPayout,
          max_distance_km: next.maxDistanceKm,
          same_day_enabled: next.sameDayEnabled,
          reservation_enabled: next.reservationEnabled,
        },
        { onConflict: 'technician_id' },
      );
      if (error) throw new BadRequestException(error.message);
      return next;
    } catch (error) {
      if (missingOptionalRelation(error)) {
        throw new BadRequestException('sql/acnow_partner_dispatch.sql 적용 후 선호 배차 설정을 저장할 수 있습니다.');
      }
      throw error;
    }
  }

  private async isOrderEligibleForTechnician(
    order: CustomerOrderRow,
    technician: TechnicianEntity,
    preferences?: TechnicianDispatchPreferences,
  ): Promise<boolean> {
    if (order.orderStatus !== 'matching') return false;
    if (order.paymentStatus !== 'paid' && order.scheduleType !== 'same_day') return false;
    if (order.assignedTechnicianId) return false;
    if (technician.workStatus === 'offline') return false;
    const pref = preferences ?? (await this.technicianGetDispatchPreferences(technician));
    if (order.scheduleType === 'same_day' && !pref.sameDayEnabled) return false;
    if (order.scheduleType === 'reservation' && !pref.reservationEnabled) return false;
    if (pref.serviceTypes.length > 0 && !pref.serviceTypes.includes(order.serviceType)) return false;
    if (pref.airconTypes.length > 0 && !pref.airconTypes.includes(order.airconType)) return false;
    if (pref.minimumPayout != null && expectedTechnicianPayout(order) < pref.minimumPayout) return false;
    if (pref.regions.length > 0) {
      const regionText = [order.sido, order.sigungu, order.dong, order.addressSummary]
        .map((x) => x?.trim())
        .filter(Boolean)
        .join(' ');
      if (!pref.regions.some((region) => regionText.includes(region))) return false;
    }
    return true;
  }

  async technicianListDispatchOffers(
    technician: TechnicianEntity,
    query: { type?: 'same_day' | 'reservation'; range?: 'today' | 'tomorrow' | 'week' | 'next_week' },
  ): Promise<TechnicianDispatchOffer[]> {
    const prefs = await this.technicianGetDispatchPreferences(technician);
    const rejected = await this.technicianRejectedOfferIds(technician.id);
    const all = await this.store.listNewestFirst();
    const range = dateRange(query.range);
    const filtered: CustomerOrderRow[] = [];
    for (const order of all) {
      if (rejected.has(order.id)) continue;
      if (query.type && order.scheduleType !== query.type) continue;
      if (order.scheduleType === 'reservation' && range) {
        const date = order.desiredDate ?? order.createdAt.slice(0, 10);
        if (date < range.start || date >= range.end) continue;
      }
      if (await this.isOrderEligibleForTechnician(order, technician, prefs)) filtered.push(order);
    }
    return filtered.map(dispatchOfferFromOrder);
  }

  private async technicianRejectedOfferIds(technicianId: string): Promise<Set<string>> {
    const { data, error } = await this.db()
      .from('dispatch_notifications')
      .select('order_id')
      .eq('technician_id', technicianId)
      .eq('status', 'rejected');
    if (error) {
      if (missingOptionalRelation(error)) return new Set();
      throw new BadRequestException(error.message);
    }
    return new Set((data ?? []).map((r) => String((r as { order_id?: string }).order_id ?? '')).filter(Boolean));
  }

  async technicianAcceptDispatchOffer(technician: TechnicianEntity, orderId: string): Promise<CustomerOrderRow> {
    const row = await this.getOrder(orderId);
    if (!(await this.isOrderEligibleForTechnician(row, technician))) {
      throw new BadRequestException('수락할 수 없는 배차입니다. 이미 배정됐거나 조건에 맞지 않습니다.');
    }
    const { data, error } = await this.db()
      .from('orders')
      .update({
        assigned_technician_id: technician.id,
        order_status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .eq('order_status', 'matching')
      .is('assigned_technician_id', null)
      .select('id')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new BadRequestException('이미 다른 파트너가 수락했거나 배차가 마감됐습니다.');
    await this.recordDispatchNotification(orderId, technician.id, 'accepted');
    return this.getOrder(orderId);
  }

  async technicianRejectDispatchOffer(
    technician: TechnicianEntity,
    orderId: string,
  ): Promise<{ orderId: string; status: 'rejected' }> {
    const row = await this.getOrder(orderId);
    if (row.orderStatus !== 'matching' || (row.paymentStatus !== 'paid' && row.scheduleType !== 'same_day')) {
      throw new BadRequestException('거절할 수 없는 배차입니다.');
    }
    await this.recordDispatchNotification(orderId, technician.id, 'rejected');
    return { orderId, status: 'rejected' };
  }

  private async recordDispatchNotification(
    orderId: string,
    technicianId: string,
    status: 'sent' | 'accepted' | 'rejected',
  ): Promise<void> {
    const now = new Date().toISOString();
    const row: Record<string, unknown> = {
      order_id: orderId,
      technician_id: technicianId,
      notification_group: 'general',
      sent_at: now,
      status,
    };
    if (status === 'accepted') {
      row.opened_at = now;
      row.accepted_at = now;
    } else if (status === 'rejected') {
      row.opened_at = now;
      row.rejected_at = now;
    }
    const { error } = await this.db().from('dispatch_notifications').insert(row);
    if (error && !missingOptionalRelation(error)) throw new BadRequestException(error.message);
  }

  private async notifyDispatchableOrder(order: CustomerOrderRow): Promise<void> {
    if (order.orderStatus !== 'matching') return;
    const technicians = await this.approvedTechniciansForDispatch();
    const eligible: TechnicianEntity[] = [];
    for (const tech of technicians) {
      if (await this.isOrderEligibleForTechnician(order, tech)) eligible.push(tech);
    }
    await Promise.all(eligible.map((tech) => this.recordDispatchNotification(order.id, tech.id, 'sent')));
    await this.notifications.notifyOwners({
      ownerType: 'technician',
      ownerIds: eligible.map((tech) => tech.id),
      eventType: 'dispatch_offer',
      targetTable: 'orders',
      targetId: order.id,
      title: '새 배차 콜이 도착했습니다',
      body: `${airconTypeLabel(order.airconType)} ${serviceTypeLabel(order.serviceType)} · ${orderRegionLabel(order, false)}`,
      payload: {
        orderId: order.id,
        orderNo: order.orderNo,
        scheduleType: order.scheduleType,
        serviceType: order.serviceType,
        airconType: order.airconType,
      },
    });
  }

  private async approvedTechniciansForDispatch(): Promise<TechnicianEntity[]> {
    const sb = this.db();
    const { data, error } = await sb
      .from('technicians')
      .select('*')
      .eq('status', 'approved')
      .neq('work_status', 'offline');
    if (error) throw new BadRequestException(error.message);
    const rows = (data ?? []) as Record<string, unknown>[];
    const ids = rows.map((row) => String(row.id));
    const capabilities = await fetchCapabilitiesBulk(sb, ids).catch(() => new Map<string, TechnicianEntity['capabilities']>());
    const regions = await this.fetchTechnicianStringChildMap('technician_regions', 'region', ids);
    const availability = await this.fetchTechnicianStringChildMap('technician_availability', 'availability_code', ids);
    return rows.map((row) => {
      const id = String(row.id);
      const fallbackAvailability: TechnicianEntity['availability'] = [];
      if (row.available_same_day !== false) fallbackAvailability.push('same_day');
      if (row.available_reservation !== false) fallbackAvailability.push('reservation');
      if (row.available_weekend === true) fallbackAvailability.push('weekend');
      if (row.available_night === true) fallbackAvailability.push('night');
      const avList = availability.get(id) ?? [];
      const av = (avList.length > 0 ? avList : fallbackAvailability) as TechnicianEntity['availability'];
      return technicianFromRow(row, capabilities.get(id) ?? [], regions.get(id) ?? [], av, []);
    });
  }

  private async fetchTechnicianStringChildMap(
    tableName: string,
    columnName: string,
    technicianIds: string[],
  ): Promise<Map<string, string[]>> {
    const out = new Map<string, string[]>();
    technicianIds.forEach((id) => out.set(id, []));
    if (technicianIds.length === 0) return out;
    const { data, error } = await this.db()
      .from(tableName)
      .select(`technician_id,${columnName}`)
      .in('technician_id', technicianIds);
    if (error) {
      if (missingOptionalRelation(error)) return out;
      throw new BadRequestException(error.message);
    }
    for (const rec of data ?? []) {
      const row = rec as unknown as Record<string, unknown>;
      const id = String(row.technician_id ?? '');
      const value = str(row[columnName]);
      if (!id || !value) continue;
      const list = out.get(id) ?? [];
      list.push(value);
      out.set(id, list);
    }
    return out;
  }

  async technicianListReviews(technicianId: string): Promise<TechnicianReviewSummary> {
    try {
      const { data, error } = await this.db()
        .from('technician_reviews')
        .select('id,order_id,rating,comment,created_at')
        .eq('technician_id', technicianId)
        .order('created_at', { ascending: false });
      if (error) throw new BadRequestException(error.message);
      const rows = (data ?? []) as Record<string, unknown>[];
      const ratings = rows.map((r) => Number(r.rating ?? 0)).filter((n) => Number.isFinite(n) && n > 0);
      const averageRating =
        ratings.length > 0 ? Math.round((ratings.reduce((sum, n) => sum + n, 0) / ratings.length) * 10) / 10 : null;
      return {
        averageRating,
        reviewCount: ratings.length,
        recent: rows.slice(0, 10).map((r) => ({
          id: String(r.id),
          orderId: String(r.order_id),
          rating: Number(r.rating ?? 0),
          comment: str(r.comment),
          createdAt: String(r.created_at ?? new Date().toISOString()),
        })),
      };
    } catch (error) {
      if (missingOptionalRelation(error)) return { averageRating: null, reviewCount: 0, recent: [] };
      throw error;
    }
  }

  private async partnerNotices() {
    try {
      const { data, error } = await this.db()
        .from('partner_notices')
        .select('id,title,body,created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw new BadRequestException(error.message);
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        title: String(r.title ?? ''),
        body: String(r.body ?? ''),
        createdAt: String(r.created_at ?? new Date().toISOString()),
      }));
    } catch (error) {
      if (!missingOptionalRelation(error)) throw error;
      return [
        {
          id: 'default-weekly-priority',
          title: '이번 주 우수 파트너 우선 배차 기준 안내',
          body: '수락률, 작업 완료율, 리뷰 점수를 함께 반영합니다.',
          createdAt: new Date().toISOString(),
        },
      ];
    }
  }

  async technicianPartnerHome(technician: TechnicianEntity): Promise<TechnicianPartnerHome> {
    const [jobs, sameDayOffers, settlements, reviews, notices] = await Promise.all([
      this.technicianListJobs(technician.id),
      this.technicianListDispatchOffers(technician, { type: 'same_day', range: 'today' }),
      this.technicianListSettlements(technician.id),
      this.technicianListReviews(technician.id),
      this.partnerNotices(),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndText = weekEnd.toISOString().slice(0, 10);
    const todayReservations = jobs.filter(
      (job) => job.scheduleType === 'reservation' && (job.desiredDate ?? today) === today,
    ).length;
    const weeklyJobs = jobs.filter((job) => {
      const date = job.desiredDate ?? job.createdAt.slice(0, 10);
      return date >= today && date <= weekEndText && job.orderStatus !== 'completed';
    });
    const weeklyExpectedPayout = weeklyJobs.reduce((sum, job) => sum + expectedTechnicianPayout(job), 0);
    const pendingPayout = settlements
      .filter((s) => ['pending', 'held', 'confirmed'].includes(s.status))
      .reduce((sum, s) => sum + Number(s.technicianPayout ?? 0), 0);
    const completedCount = jobs.filter((job) => job.orderStatus === 'completed').length;
    const grade =
      (reviews.averageRating ?? 0) >= 4.8 && completedCount >= 20
        ? 'VIP 파트너'
        : completedCount >= 10
          ? '우수 파트너'
          : '파트너';
    const materialAlerts = this.materialAlertsForJobs(weeklyJobs);
    return {
      technician: {
        id: technician.id,
        name: technician.name,
        workStatus: technician.workStatus,
        baseRegion: technician.baseRegion,
        grade,
        benefitText: grade === 'VIP 파트너' ? '우선 배차와 수수료 혜택 대상' : '완료율과 리뷰가 쌓이면 더 좋은 콜을 받을 수 있습니다.',
      },
      summary: {
        todayReservations,
        sameDayOffers: sameDayOffers.length,
        weeklyExpectedPayout,
        pendingPayout,
      },
      quickOffers: sameDayOffers.slice(0, 3),
      todayJobs: jobs.slice(0, 5).map((job) => ({
        id: job.id,
        orderNo: job.orderNo,
        productName: job.productName,
        scheduleText: scheduleText(job),
        regionLabel: orderRegionLabel(job, true),
        orderStatus: job.orderStatus,
        expectedPayout: expectedTechnicianPayout(job),
      })),
      materialAlerts,
      notices,
      reviewSummary: reviews,
    };
  }

  private materialAlertsForJobs(jobs: CustomerOrderRow[]): string[] {
    const installJobs = jobs.filter((job) => job.serviceType === 'install');
    const twoInOne = installJobs.filter((job) => job.airconType === 'two_in_one').length;
    const cleaning = jobs.filter((job) => job.serviceType === 'cleaning').length;
    const alerts: string[] = [];
    if (installJobs.length > 0) alerts.push(`배관 5m 이상 작업 ${installJobs.length}건 예정`);
    if (twoInOne > 0) alerts.push(`냉매 보충 포함 작업 ${twoInOne}건 예정`);
    if (cleaning > 0) alerts.push(`청소 자재 확인 작업 ${cleaning}건 예정`);
    return alerts.length > 0 ? alerts : ['이번 주 확정 작업 기준 자재 부족 알림 없음'];
  }

  async technicianListJobs(technicianId: string): Promise<CustomerOrderRow[]> {
    const all = await this.store.listNewestFirst();
    return all.filter(
      (o) =>
        o.assignedTechnicianId === technicianId &&
        this.canTechnicianWorkAssignedOrder(o) &&
        [
          'assigned',
          'accepted',
          'on_the_way',
          'arrived',
          'diagnosed',
          'extra_payment_pending',
          'working',
          'completed',
          'settlement_pending',
        ].includes(o.orderStatus),
    );
  }

  private assertTechnicianAccess(row: CustomerOrderRow, technicianId: string): void {
    if (row.assignedTechnicianId !== technicianId) {
      throw new ForbiddenException('not assigned to this order');
    }
    if (!this.canTechnicianWorkAssignedOrder(row)) {
      throw new ForbiddenException('payment not completed');
    }
  }

  private canTechnicianWorkAssignedOrder(row: CustomerOrderRow): boolean {
    return row.paymentStatus === 'paid' || row.scheduleType === 'same_day';
  }

  async technicianGetJob(technicianId: string, orderId: string): Promise<CustomerOrderRow> {
    const row = await this.getOrder(orderId);
    this.assertTechnicianAccess(row, technicianId);
    return row;
  }

  async technicianAcceptJob(technicianId: string, orderId: string): Promise<CustomerOrderRow> {
    const row = await this.getOrder(orderId);
    this.assertTechnicianAccess(row, technicianId);
    if (row.orderStatus !== 'assigned') throw new BadRequestException('only assigned orders can be accepted');
    row.orderStatus = 'accepted';
    row.updatedAt = new Date().toISOString();
    await this.store.replace(row);
    return row;
  }

  /** 수락 후 출발(명세 on_the_way) */
  async technicianDepartJob(technicianId: string, orderId: string): Promise<CustomerOrderRow> {
    const row = await this.getOrder(orderId);
    this.assertTechnicianAccess(row, technicianId);
    if (row.orderStatus !== 'accepted') throw new BadRequestException('must be accepted before depart');
    row.orderStatus = 'on_the_way';
    row.updatedAt = new Date().toISOString();
    await this.store.replace(row);
    return row;
  }

  async technicianStartWork(technicianId: string, orderId: string): Promise<CustomerOrderRow> {
    const row = await this.getOrder(orderId);
    this.assertTechnicianAccess(row, technicianId);
    if (row.orderStatus !== 'accepted' && row.orderStatus !== 'on_the_way')
      throw new BadRequestException('start work requires accepted dispatch');
    row.orderStatus = 'working';
    row.updatedAt = new Date().toISOString();
    await this.store.replace(row);
    return row;
  }

  async technicianCompleteJob(technicianId: string, orderId: string): Promise<CustomerOrderRow> {
    const row = await this.getOrder(orderId);
    this.assertTechnicianAccess(row, technicianId);
    if (row.orderStatus !== 'working') throw new BadRequestException('order must be in working state');
    await this.assertRequiredWorkPhotos(orderId);
    row.orderStatus = 'completed';
    row.updatedAt = new Date().toISOString();
    await this.store.replace(row);
    await this.upsertSettlementForCompletedJob(row, technicianId);
    await this.notifyOrderCustomer(row, 'job_completed', '작업 완료 안내', `${row.productName} 작업이 완료되었습니다.`);
    return row;
  }

  async markExtraPaymentPending(orderId: string): Promise<CustomerOrderRow> {
    const row = await this.getOrder(orderId);
    row.orderStatus = 'extra_payment_pending';
    row.updatedAt = new Date().toISOString();
    await this.store.replace(row);
    return row;
  }

  async applyPaidExtraQuote(orderId: string, amount: number): Promise<CustomerOrderRow> {
    const row = await this.getOrder(orderId);
    row.extraTotalPrice = Math.max(0, Number(row.extraTotalPrice ?? 0)) + Math.max(0, Math.round(Number(amount) || 0));
    row.totalPrice = Math.max(0, Number(row.productTotalPrice ?? 0)) + row.extraTotalPrice - Math.max(0, Number(row.discountAmount ?? 0));
    if (row.orderStatus === 'extra_payment_pending') row.orderStatus = 'working';
    row.updatedAt = new Date().toISOString();
    await this.store.replace(row);
    return row;
  }

  async notifyOrderCustomer(
    order: CustomerOrderRow,
    eventType: string,
    title: string,
    body: string,
    payload: Record<string, unknown> = {},
  ): Promise<void> {
    if (!order.userId) return;
    await this.notifications.notifyOwners({
      ownerType: 'member',
      ownerIds: [order.userId],
      eventType,
      targetTable: 'orders',
      targetId: order.id,
      title,
      body,
      payload: {
        orderId: order.id,
        orderNo: order.orderNo,
        ...payload,
      },
    });
  }

  private async assertRequiredWorkPhotos(orderId: string): Promise<void> {
    const { data, error } = await this.db()
      .from('order_photos')
      .select('kind')
      .eq('order_id', orderId)
      .in('kind', ['before_work', 'after_work']);
    if (error) throw new BadRequestException(error.message);
    const kinds = new Set((data ?? []).map((r) => String((r as { kind?: string }).kind ?? '')));
    if (!kinds.has('before_work') || !kinds.has('after_work')) {
      throw new BadRequestException('작업 완료 전 작업 전/작업 후 사진을 각각 1장 이상 등록해야 합니다.');
    }
  }

  /** 작업 완료 시 건별 정산 행 생성/갱신(Supabase). 수수료는 technicians.platform_fee_rate(기본 20%) 기준. */
  private async upsertSettlementForCompletedJob(order: CustomerOrderRow, technicianId: string): Promise<void> {
    const sb = this.db();
    const gross = Math.max(0, Math.round(Number(order.totalPrice) || 0));
    let feeRatePercent = 20;
    const uuidTech = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      technicianId.trim(),
    );
    if (uuidTech) {
      const { data: tech, error } = await sb
        .from('technicians')
        .select('platform_fee_rate')
        .eq('id', technicianId)
        .maybeSingle();
      if (!error && tech?.platform_fee_rate != null) {
        const raw = Number(tech.platform_fee_rate);
        feeRatePercent = raw > 0 && raw <= 1 ? raw * 100 : raw;
      }
    }
    const materialAllowance = 0;
    const feeBase = Math.max(0, gross - materialAllowance);
    const platformFee = Math.round((feeBase * feeRatePercent) / 100);
    const technicianPayout = feeBase - platformFee;
    const { error: upErr } = await sb.from('order_settlements').upsert(
      {
        order_id: order.id,
        technician_id: technicianId,
        gross_amount: gross,
        material_allowance: materialAllowance,
        fee_base_amount: feeBase,
        platform_fee_rate: feeRatePercent,
        platform_fee: platformFee,
        technician_payout: technicianPayout,
        status: 'pending',
        payout_method: 'manual_bank_transfer',
        paid_at: null,
        memo: null,
      },
      { onConflict: 'order_id' },
    );
    if (upErr) throw new BadRequestException(upErr.message);
  }

  async technicianListSettlements(technicianId: string): Promise<TechnicianSettlementListItem[]> {
    const sb = this.db();
    const { data: rows, error } = await sb
      .from('order_settlements')
      .select('*')
      .eq('technician_id', technicianId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    const list = rows ?? [];
    const orderIds = [...new Set(list.map((x) => String((x as { order_id?: string }).order_id ?? '')))].filter(
      Boolean,
    );
    let orderNoById = new Map<string, string>();
    if (orderIds.length > 0) {
      const { data: ordRows, error: oErr } = await sb
        .from('orders')
        .select('id, order_no')
        .in('id', orderIds);
      if (!oErr && ordRows) {
        orderNoById = new Map(
          ordRows.map((o) => [String((o as { id: string }).id), String((o as { order_no: string }).order_no)]),
        );
      }
    }
    return list.map((r) => {
      const rec = r as Record<string, unknown>;
      const oid = String(rec.order_id ?? '');
      const base = settlementRowFromDb(rec);
      return { ...base, orderNo: orderNoById.get(oid) ?? null };
    });
  }

  async technicianRequestSettlementPayout(technicianId: string, settlementId: string): Promise<TechnicianSettlementListItem> {
    const sb = this.db();
    const { data: row, error } = await sb
      .from('order_settlements')
      .select('*')
      .eq('id', settlementId)
      .eq('technician_id', technicianId)
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!row) throw new NotFoundException('settlement not found');
    const rec = row as Record<string, unknown>;
    const status = String(rec.status ?? 'pending');
    if (!['pending', 'held'].includes(status)) {
      throw new BadRequestException('only pending or held settlements can request payout');
    }
    const { data: tech, error: techErr } = await sb
      .from('technicians')
      .select('bank_name,bank_account,bank_holder,bank_verification_status')
      .eq('id', technicianId)
      .maybeSingle();
    if (techErr) throw new BadRequestException(techErr.message);
    const techRec = (tech ?? {}) as Record<string, unknown>;
    if (!techRec.bank_name || !techRec.bank_account || !techRec.bank_holder) {
      throw new BadRequestException('정산 지급 요청 전 계좌 정보를 등록해야 합니다.');
    }
    if (String(techRec.bank_verification_status ?? 'unsubmitted') !== 'verified') {
      throw new BadRequestException('관리자 계좌 검증 완료 후 정산 지급을 요청할 수 있습니다.');
    }
    const prevMemo = rec.memo == null ? '' : String(rec.memo);
    const memo = [prevMemo, `technician payout requested at ${new Date().toISOString()}`].filter(Boolean).join('\n');
    const { data: updated, error: upErr } = await sb
      .from('order_settlements')
      .update({
        status: 'confirmed',
        memo,
        payout_requested_at: new Date().toISOString(),
        payout_account_snapshot: {
          bankName: String(techRec.bank_name),
          bankHolder: String(techRec.bank_holder),
          bankAccountMasked: maskAccount(techRec.bank_account),
        },
      })
      .eq('id', settlementId)
      .select('*')
      .single();
    if (upErr) throw new BadRequestException(upErr.message);
    const updatedRec = updated as Record<string, unknown>;
    let orderNo: string | null = null;
    const oid = String(updatedRec.order_id ?? '');
    if (oid) {
      const { data: orderRow } = await sb.from('orders').select('order_no').eq('id', oid).maybeSingle();
      orderNo = orderRow ? String((orderRow as { order_no?: string }).order_no ?? '') : null;
    }
    return { ...settlementRowFromDb(updatedRec), orderNo };
  }

  async technicianListMaterials(): Promise<TechnicianMaterialListItem[]> {
    const { data, error } = await this.db()
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .eq('market_status', 'active')
      .gt('stock_quantity', 0)
      .order('code');
    if (error) throw new BadRequestException(error.message);
    return (data ?? []).map((r) => materialRowFromDb(r as Record<string, unknown>));
  }

  async technicianListMaterialOrders(technicianId: string) {
    const { data, error } = await this.db()
      .from('material_purchase_orders')
      .select('*,items:material_purchase_order_items(*)')
      .eq('technician_id', technicianId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map(materialPurchaseOrderFromDb);
  }

  async technicianCreateMaterialOrder(
    technician: Pick<TechnicianEntity, 'id' | 'name' | 'phone'>,
    dto: CreateMaterialPurchaseOrderDto,
  ) {
    const requested = new Map<string, number>();
    for (const item of dto.items ?? []) {
      const materialId = String(item?.materialId ?? '').trim();
      const quantity = Math.floor(Number(item?.quantity ?? 0));
      if (!isUuid(materialId)) throw new BadRequestException('materialId must be a UUID');
      if (!Number.isFinite(quantity) || quantity <= 0) throw new BadRequestException('quantity must be greater than 0');
      requested.set(materialId, (requested.get(materialId) ?? 0) + quantity);
    }
    if (requested.size === 0) throw new BadRequestException('items required');

    const materialIds = [...requested.keys()];
    const { data: materialRows, error: materialError } = await this.db()
      .from('materials')
      .select('*')
      .in('id', materialIds);
    if (materialError) throw new BadRequestException(materialError.message);
    if ((materialRows ?? []).length !== materialIds.length) throw new NotFoundException('material not found');

    const materials = (materialRows ?? []).map((m) => materialRowFromDb(m as Record<string, unknown>));
    const sellerIds = new Set(materials.map((m) => m.sellerId ?? '').filter(Boolean));
    if (sellerIds.size > 1) throw new BadRequestException('한 번에 한 판매자 상품만 구매요청할 수 있습니다.');

    let totalAmount = 0;
    const orderItems = materials.map((m) => {
      const quantity = requested.get(m.id) ?? 0;
      if (!m.isActive || m.marketStatus !== 'active') throw new BadRequestException(`${m.name} 상품은 판매중이 아닙니다.`);
      if (m.customerPrice == null) throw new BadRequestException(`${m.name} 상품은 가격 확정 후 구매요청할 수 있습니다.`);
      if (quantity < m.minOrderQuantity) throw new BadRequestException(`${m.name} 최소 주문 수량은 ${m.minOrderQuantity}개입니다.`);
      if (m.stockQuantity < quantity) throw new BadRequestException(`${m.name} 재고가 부족합니다.`);
      const amount = m.customerPrice * quantity;
      totalAmount += amount;
      return {
        material: m,
        quantity,
        unitPrice: m.customerPrice,
        amount,
      };
    });
    const sellerId = orderItems[0]?.material.sellerId ?? null;
    const sellerName = orderItems[0]?.material.supplierName ?? null;
    const { data: created, error: createError } = await this.db()
      .from('material_purchase_orders')
      .insert({
        order_no: materialOrderNo(),
        technician_id: technician.id,
        technician_name: technician.name,
        technician_phone: technician.phone,
        seller_id: sellerId,
        seller_name: sellerName,
        status: 'requested',
        total_amount: totalAmount,
        delivery_address: dto.deliveryAddress?.trim() || '',
        recipient_name: dto.recipientName?.trim() || technician.name,
        recipient_phone: dto.recipientPhone?.trim() || technician.phone,
        request_memo: dto.requestMemo?.trim() || null,
      })
      .select('*')
      .single();
    if (createError) throw new BadRequestException(createError.message);
    const orderId = String((created as { id: string }).id);
    const { error: itemError } = await this.db().from('material_purchase_order_items').insert(
      orderItems.map(({ material, quantity, unitPrice, amount }) => ({
        purchase_order_id: orderId,
        material_id: material.id,
        seller_id: material.sellerId,
        name: material.name,
        code: material.code,
        unit: material.unit,
        supplier_name: material.supplierName,
        unit_price: unitPrice,
        quantity,
        amount,
      })),
    );
    if (itemError) throw new BadRequestException(itemError.message);
    for (const { material, quantity } of orderItems) {
      const nextStock = Math.max(0, material.stockQuantity - quantity);
      const { error } = await this.db()
        .from('materials')
        .update({
          stock_quantity: nextStock,
          market_status: nextStock <= 0 ? 'sold_out' : material.marketStatus,
        })
        .eq('id', material.id);
      if (error) throw new BadRequestException(error.message);
    }
    await this.audit('technician_create_material_order', 'material_purchase_orders', orderId, {
      technicianId: technician.id,
      sellerId,
      totalAmount,
    });
    const { data, error } = await this.db()
      .from('material_purchase_orders')
      .select('*,items:material_purchase_order_items(*)')
      .eq('id', orderId)
      .single();
    if (error) throw new BadRequestException(error.message);
    return materialPurchaseOrderFromDb(data as Record<string, unknown>);
  }

  private async audit(action: string, targetTable: string, targetId: string, payload?: unknown): Promise<void> {
    const { error } = await this.db().from('admin_logs').insert({
      action,
      target_table: targetTable,
      target_id: targetId,
      payload: payload ?? {},
    });
    if (error && !/schema cache|could not find the table|relation .* does not exist/i.test(error.message)) {
      throw new BadRequestException(error.message);
    }
  }

  /** Supabase 전용 — signed PUT URL + path(token). 버킷: SUPABASE_STORAGE_ORDER_PHOTOS_BUCKET */
  async technicianPresignOrderPhoto(
    technicianId: string,
    orderId: string,
    dto: TechnicianPhotoPresignDto,
  ): Promise<{ signedUrl: string; token: string; path: string; bucket: string; expiresInHours: number }> {
    const sb = this.db();
    const row = await this.getOrder(orderId);
    this.assertTechnicianAccess(row, technicianId);
    const bucket = orderPhotosBucketName();
    const ext = extFromMime(dto.mimeType ?? 'image/jpeg');
    const photoId = randomUUID().replace(/-/g, '');
    const path = `orders/${orderId}/${photoId}.${ext}`;
    const { data, error } = await sb.storage.from(bucket).createSignedUploadUrl(path, { upsert: true });
    if (error || !data) throw new BadRequestException(error?.message ?? 'presign failed');
    return {
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      bucket,
      expiresInHours: 2,
    };
  }

  async technicianConfirmStoragePhoto(
    technicianId: string,
    orderId: string,
    dto: TechnicianPhotoConfirmDto,
  ): Promise<OrderPhotoRow> {
    const sb = this.db();
    const row = await this.getOrder(orderId);
    this.assertTechnicianAccess(row, technicianId);
    assertOrderPhotoStoragePath(dto.path, orderId);
    const bucket = orderPhotosBucketName();
    const objectPath = dto.path.trim();
    const { data: pub } = sb.storage.from(bucket).getPublicUrl(objectPath);
    const publicUrl = pub?.publicUrl?.trim() ?? '';
    const url = this.photoRowUrlForStorage(publicUrl, bucket, objectPath);
    return this.insertPhotoRecord(
      orderId,
      technicianId,
      dto.kind as OrderPhotoKind,
      url,
      dto.caption ?? null,
      bucket,
      objectPath,
    );
  }

  /** 서버 멀티파트 → Storage 업로드 + order_photos (CORS·클라이언트 업로드 실패 시 폴백). */
  async technicianUploadMultipartPhoto(
    technicianId: string,
    orderId: string,
    kind: OrderPhotoKind,
    file: Express.Multer.File,
    caption?: string | null,
  ): Promise<OrderPhotoRow> {
    const sb = this.db();
    if (!file?.buffer?.length) throw new BadRequestException('file required');
    const mime = String(file.mimetype || '').split(';')[0].toLowerCase() || 'application/octet-stream';
    if (!mime.startsWith('image/')) throw new BadRequestException('only image uploads allowed');
    const row = await this.getOrder(orderId);
    this.assertTechnicianAccess(row, technicianId);
    const bucket = orderPhotosBucketName();
    const ext = extFromMime(mime);
    const photoId = randomUUID().replace(/-/g, '');
    const path = `orders/${orderId}/${photoId}.${ext}`;
    const { error: upErr } = await sb.storage
      .from(bucket)
      .upload(path, file.buffer, { contentType: mime, upsert: true });
    if (upErr) throw new BadRequestException(upErr.message);
    const { data: pub } = sb.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub?.publicUrl?.trim() ?? '';
    const url = this.photoRowUrlForStorage(publicUrl, bucket, path);
    return this.insertPhotoRecord(orderId, technicianId, kind, url, caption ?? null, bucket, path);
  }

  /** ORDER_PHOTOS_SIGNED_URL_TTL_SEC>0 이면 비공개 버킷 가정: DB에는 placeholder, 목록에서 signed URL 생성 */
  private photoSignedReadTtlSec(): number {
    const n = parseInt(process.env.ORDER_PHOTOS_SIGNED_URL_TTL_SEC ?? '900', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  private photoRowUrlForStorage(publicUrl: string, bucket: string, objectPath: string): string {
    if (this.photoSignedReadTtlSec() > 0) {
      return `signed-read:${bucket}:${objectPath}`;
    }
    if (!publicUrl) throw new BadRequestException('cannot resolve public URL for uploaded object');
    return publicUrl;
  }

  private async insertPhotoRecord(
    orderId: string,
    technicianId: string,
    kind: OrderPhotoKind,
    url: string,
    caption: string | null,
    storageBucket?: string | null,
    storageObjectPath?: string | null,
  ): Promise<OrderPhotoRow> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const fk = technicianIdForPhotosForeignKey(technicianId);
    const rec: OrderPhotoRow = {
      id,
      orderId,
      technicianId,
      kind,
      url,
      caption,
      createdAt: now,
    };
    {
      const sb = this.db();
      const row: Record<string, unknown> = {
        id: rec.id,
        order_id: rec.orderId,
        technician_id: fk,
        kind: rec.kind,
        url: rec.url,
        caption: rec.caption,
      };
      if (storageBucket && storageObjectPath) {
        row.storage_bucket = storageBucket;
        row.storage_object_path = storageObjectPath;
      }
      const { error } = await sb.from('order_photos').insert(row as never);
      if (error) throw new BadRequestException(error.message);
      return rec;
    }
  }

  async technicianListOrderPhotos(technicianId: string, orderId: string): Promise<OrderPhotoRow[]> {
    const row = await this.getOrder(orderId);
    this.assertTechnicianAccess(row, technicianId);
    {
      const sb = this.db();
      const { data, error } = await sb
        .from('order_photos')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at');
      if (error) throw new BadRequestException(error.message);
      const ttl = this.photoSignedReadTtlSec();
      const out: OrderPhotoRow[] = [];
      for (const rec of data ?? []) {
        const row = rec as Record<string, unknown>;
        let url = String(row.url ?? '');
        const b = row.storage_bucket == null ? null : String(row.storage_bucket);
        const p = row.storage_object_path == null ? null : String(row.storage_object_path);
        if (ttl > 0 && b && p) {
          const { data: signed, error: se } = await sb.storage.from(b).createSignedUrl(p, ttl);
          if (!se && signed?.signedUrl) url = signed.signedUrl;
        }
        out.push({
          ...photoRowFromDb({ ...row, url }),
          url,
        });
      }
      return out;
    }
  }

  async technicianAddOrderPhoto(
    technicianId: string,
    orderId: string,
    dto: TechnicianOrderPhotoDto,
  ): Promise<OrderPhotoRow> {
    const row = await this.getOrder(orderId);
    this.assertTechnicianAccess(row, technicianId);
    const url = dto.url.trim();
    if (!url) throw new BadRequestException('url required');
    const caption = dto.caption?.trim() ?? null;
    return this.insertPhotoRecord(orderId, technicianId, dto.kind as OrderPhotoKind, url, caption);
  }

  private static makeOrderNo(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const suf = randomUUID().replace(/-/g, '').slice(0, 8);
    return `OC${y}${m}${day}-${suf}`;
  }
}
