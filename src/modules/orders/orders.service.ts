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
import { ServiceCatalogService } from '../service-catalog/service-catalog.service';
import type { TechnicianOrderPhotoDto } from '../technicians/technician.dto';
import type {
  TechnicianPhotoConfirmDto,
  TechnicianPhotoPresignDto,
} from './dto/technician-photo-upload.dto';
import type { OrderPhotoKind, OrderPhotoRow } from './order-photo.types';
import type { OrdersRepositoryPort } from './orders.repository.port';
import { ORDERS_REPO } from './orders.repository.port';
import type { EmergencyLeadRow } from '../emergency-leads/emergency-leads.types';
import type { CustomerOrderRow } from './orders.types';
import { CreateOrderDraftDto } from './dto/create-order-draft.dto';
import type { PatchInstallOrderAdminDto } from './dto/patch-install-order-admin.dto';
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
  name: string;
  code: string;
  category: string;
  unit: string;
  customerPrice: number | null;
  technicianCostAllowance: number | null;
  oemAvailable: boolean;
  supplierName: string | null;
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
    name: String(r.name),
    code: String(r.code),
    category: String(r.category ?? 'general'),
    unit: String(r.unit ?? 'each'),
    customerPrice: r.customer_price == null ? null : Number(r.customer_price),
    technicianCostAllowance:
      r.technician_cost_allowance == null ? null : Number(r.technician_cost_allowance),
    oemAvailable: Boolean(r.oem_available),
    supplierName: r.supplier_name == null ? null : String(r.supplier_name),
  };
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
    return this.createDraft(dto);
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
    return row;
  }

  async technicianListJobs(technicianId: string): Promise<CustomerOrderRow[]> {
    const all = await this.store.listNewestFirst();
    return all.filter(
      (o) =>
        o.assignedTechnicianId === technicianId &&
        o.paymentStatus === 'paid' &&
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
    if (row.paymentStatus !== 'paid') {
      throw new ForbiddenException('payment not completed');
    }
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
    return row;
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
      .order('code');
    if (error) throw new BadRequestException(error.message);
    return (data ?? []).map((r) => materialRowFromDb(r as Record<string, unknown>));
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
