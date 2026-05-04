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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const database_tokens_1 = require("../../database/database.tokens");
const service_catalog_service_1 = require("../service-catalog/service-catalog.service");
const orders_repository_port_1 = require("./orders.repository.port");
const create_order_draft_dto_1 = require("./dto/create-order-draft.dto");
const order_photo_storage_paths_1 = require("./order-photo-storage.paths");
function technicianIdForPhotosForeignKey(technicianId) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(technicianId.trim())
        ? technicianId.trim()
        : null;
}
function isUuid(v) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v.trim());
}
function settlementRowFromDb(r) {
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
        createdAt: String(r.created_at ?? new Date().toISOString()),
    };
}
function materialRowFromDb(r) {
    return {
        id: String(r.id),
        name: String(r.name),
        code: String(r.code),
        category: String(r.category ?? 'general'),
        unit: String(r.unit ?? 'each'),
        customerPrice: r.customer_price == null ? null : Number(r.customer_price),
        technicianCostAllowance: r.technician_cost_allowance == null ? null : Number(r.technician_cost_allowance),
        oemAvailable: Boolean(r.oem_available),
        supplierName: r.supplier_name == null ? null : String(r.supplier_name),
    };
}
function photoRowFromDb(r) {
    return {
        id: String(r.id),
        orderId: String(r.order_id),
        technicianId: r.technician_id == null ? null : String(r.technician_id),
        kind: r.kind,
        url: String(r.url),
        caption: r.caption == null ? null : String(r.caption),
        createdAt: String(r.created_at ?? new Date().toISOString()),
    };
}
let OrdersService = OrdersService_1 = class OrdersService {
    constructor(catalog, store, sb) {
        this.catalog = catalog;
        this.store = store;
        this.sb = sb;
    }
    db() {
        if (!this.sb) {
            throw new common_1.ServiceUnavailableException('OrdersService requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        }
        return this.sb;
    }
    async createEmergencyLeadDraft(lead, productId) {
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
        if (digits.length < 10)
            memoParts.push('실제 고객 전화 미확인 — placeholder 사용');
        const dto = Object.assign(new create_order_draft_dto_1.CreateOrderDraftDto(), {
            productId,
            scheduleType,
            customerName,
            customerPhone,
            addressSummary,
            customerMemo: memoParts.join(' | '),
        });
        return this.createDraft(dto);
    }
    async createDraft(dto) {
        const product = this.catalog.resolveProductPrice(dto.productId, dto.scheduleType);
        const productTotalPrice = dto.scheduleType === 'same_day' ? product.sameDayPrice : product.basePrice;
        const now = new Date().toISOString();
        const row = {
            id: (0, node_crypto_1.randomUUID)(),
            orderNo: OrdersService_1.makeOrderNo(),
            userId: null,
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
    async getOrder(id) {
        const row = await this.store.findById(id);
        if (!row)
            throw new common_1.NotFoundException('order not found');
        return row;
    }
    async listOrders() {
        return this.store.listNewestFirst();
    }
    async patchAdmin(id, dto) {
        const row = await this.getOrder(id);
        const now = new Date().toISOString();
        if (dto.adminMemo !== undefined)
            row.adminMemo = dto.adminMemo;
        if (dto.assignedTechnicianId !== undefined) {
            const v = dto.assignedTechnicianId;
            if (v === '' || v === null) {
                row.assignedTechnicianId = null;
            }
            else {
                row.assignedTechnicianId = await this.requireApprovedTechnicianId(v);
            }
        }
        if (dto.orderStatus !== undefined) {
            row.orderStatus = dto.orderStatus;
            if (dto.orderStatus === 'refunded')
                row.paymentStatus = 'refunded';
            else if (dto.orderStatus === 'cancelled')
                row.paymentStatus = 'failed';
            else if ((dto.orderStatus === 'matching' || dto.orderStatus === 'assigned') &&
                row.paymentStatus === 'pending') {
                row.paymentStatus = 'paid';
            }
        }
        row.updatedAt = now;
        await this.store.replace(row);
        return row;
    }
    async requireApprovedTechnicianId(technicianId) {
        const id = technicianId.trim();
        if (!isUuid(id))
            throw new common_1.BadRequestException('assignedTechnicianId must be an approved technician UUID');
        const { data, error } = await this.db()
            .from('technicians')
            .select('id, status')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data || String(data.status) !== 'approved') {
            throw new common_1.BadRequestException('assignedTechnicianId must reference an approved technician');
        }
        return id;
    }
    async mockConfirmPayment(orderId) {
        const row = await this.getOrder(orderId);
        if (row.paymentStatus === 'paid')
            return row;
        if (row.orderStatus !== 'created' || row.paymentStatus !== 'pending') {
            throw new common_1.BadRequestException('order cannot confirm in current state');
        }
        row.paymentStatus = 'paid';
        row.orderStatus = 'matching';
        row.updatedAt = new Date().toISOString();
        await this.store.replace(row);
        await this.store.appendMockProductPayment(row);
        return row;
    }
    async technicianListJobs(technicianId) {
        const all = await this.store.listNewestFirst();
        return all.filter((o) => o.assignedTechnicianId === technicianId &&
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
            ].includes(o.orderStatus));
    }
    assertTechnicianAccess(row, technicianId) {
        if (row.assignedTechnicianId !== technicianId) {
            throw new common_1.ForbiddenException('not assigned to this order');
        }
        if (row.paymentStatus !== 'paid') {
            throw new common_1.ForbiddenException('payment not completed');
        }
    }
    async technicianGetJob(technicianId, orderId) {
        const row = await this.getOrder(orderId);
        this.assertTechnicianAccess(row, technicianId);
        return row;
    }
    async technicianAcceptJob(technicianId, orderId) {
        const row = await this.getOrder(orderId);
        this.assertTechnicianAccess(row, technicianId);
        if (row.orderStatus !== 'assigned')
            throw new common_1.BadRequestException('only assigned orders can be accepted');
        row.orderStatus = 'accepted';
        row.updatedAt = new Date().toISOString();
        await this.store.replace(row);
        return row;
    }
    async technicianDepartJob(technicianId, orderId) {
        const row = await this.getOrder(orderId);
        this.assertTechnicianAccess(row, technicianId);
        if (row.orderStatus !== 'accepted')
            throw new common_1.BadRequestException('must be accepted before depart');
        row.orderStatus = 'on_the_way';
        row.updatedAt = new Date().toISOString();
        await this.store.replace(row);
        return row;
    }
    async technicianStartWork(technicianId, orderId) {
        const row = await this.getOrder(orderId);
        this.assertTechnicianAccess(row, technicianId);
        if (row.orderStatus !== 'accepted' && row.orderStatus !== 'on_the_way')
            throw new common_1.BadRequestException('start work requires accepted dispatch');
        row.orderStatus = 'working';
        row.updatedAt = new Date().toISOString();
        await this.store.replace(row);
        return row;
    }
    async technicianCompleteJob(technicianId, orderId) {
        const row = await this.getOrder(orderId);
        this.assertTechnicianAccess(row, technicianId);
        if (row.orderStatus !== 'working')
            throw new common_1.BadRequestException('order must be in working state');
        row.orderStatus = 'completed';
        row.updatedAt = new Date().toISOString();
        await this.store.replace(row);
        await this.upsertSettlementForCompletedJob(row, technicianId);
        return row;
    }
    async upsertSettlementForCompletedJob(order, technicianId) {
        const sb = this.db();
        const gross = Math.max(0, Math.round(Number(order.totalPrice) || 0));
        let feeRatePercent = 20;
        const uuidTech = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(technicianId.trim());
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
        const { error: upErr } = await sb.from('order_settlements').upsert({
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
        }, { onConflict: 'order_id' });
        if (upErr)
            throw new common_1.BadRequestException(upErr.message);
    }
    async technicianListSettlements(technicianId) {
        const sb = this.db();
        const { data: rows, error } = await sb
            .from('order_settlements')
            .select('*')
            .eq('technician_id', technicianId)
            .order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        const list = rows ?? [];
        const orderIds = [...new Set(list.map((x) => String(x.order_id ?? '')))].filter(Boolean);
        let orderNoById = new Map();
        if (orderIds.length > 0) {
            const { data: ordRows, error: oErr } = await sb
                .from('orders')
                .select('id, order_no')
                .in('id', orderIds);
            if (!oErr && ordRows) {
                orderNoById = new Map(ordRows.map((o) => [String(o.id), String(o.order_no)]));
            }
        }
        return list.map((r) => {
            const rec = r;
            const oid = String(rec.order_id ?? '');
            const base = settlementRowFromDb(rec);
            return { ...base, orderNo: orderNoById.get(oid) ?? null };
        });
    }
    async technicianListMaterials() {
        const { data, error } = await this.db()
            .from('materials')
            .select('*')
            .eq('is_active', true)
            .order('code');
        if (error)
            throw new common_1.BadRequestException(error.message);
        return (data ?? []).map((r) => materialRowFromDb(r));
    }
    async technicianPresignOrderPhoto(technicianId, orderId, dto) {
        const sb = this.db();
        const row = await this.getOrder(orderId);
        this.assertTechnicianAccess(row, technicianId);
        const bucket = (0, order_photo_storage_paths_1.orderPhotosBucketName)();
        const ext = (0, order_photo_storage_paths_1.extFromMime)(dto.mimeType ?? 'image/jpeg');
        const photoId = (0, node_crypto_1.randomUUID)().replace(/-/g, '');
        const path = `orders/${orderId}/${photoId}.${ext}`;
        const { data, error } = await sb.storage.from(bucket).createSignedUploadUrl(path, { upsert: true });
        if (error || !data)
            throw new common_1.BadRequestException(error?.message ?? 'presign failed');
        return {
            signedUrl: data.signedUrl,
            token: data.token,
            path: data.path,
            bucket,
            expiresInHours: 2,
        };
    }
    async technicianConfirmStoragePhoto(technicianId, orderId, dto) {
        const sb = this.db();
        const row = await this.getOrder(orderId);
        this.assertTechnicianAccess(row, technicianId);
        (0, order_photo_storage_paths_1.assertOrderPhotoStoragePath)(dto.path, orderId);
        const bucket = (0, order_photo_storage_paths_1.orderPhotosBucketName)();
        const objectPath = dto.path.trim();
        const { data: pub } = sb.storage.from(bucket).getPublicUrl(objectPath);
        const publicUrl = pub?.publicUrl?.trim() ?? '';
        const url = this.photoRowUrlForStorage(publicUrl, bucket, objectPath);
        return this.insertPhotoRecord(orderId, technicianId, dto.kind, url, dto.caption ?? null, bucket, objectPath);
    }
    async technicianUploadMultipartPhoto(technicianId, orderId, kind, file, caption) {
        const sb = this.db();
        if (!file?.buffer?.length)
            throw new common_1.BadRequestException('file required');
        const mime = String(file.mimetype || '').split(';')[0].toLowerCase() || 'application/octet-stream';
        if (!mime.startsWith('image/'))
            throw new common_1.BadRequestException('only image uploads allowed');
        const row = await this.getOrder(orderId);
        this.assertTechnicianAccess(row, technicianId);
        const bucket = (0, order_photo_storage_paths_1.orderPhotosBucketName)();
        const ext = (0, order_photo_storage_paths_1.extFromMime)(mime);
        const photoId = (0, node_crypto_1.randomUUID)().replace(/-/g, '');
        const path = `orders/${orderId}/${photoId}.${ext}`;
        const { error: upErr } = await sb.storage
            .from(bucket)
            .upload(path, file.buffer, { contentType: mime, upsert: true });
        if (upErr)
            throw new common_1.BadRequestException(upErr.message);
        const { data: pub } = sb.storage.from(bucket).getPublicUrl(path);
        const publicUrl = pub?.publicUrl?.trim() ?? '';
        const url = this.photoRowUrlForStorage(publicUrl, bucket, path);
        return this.insertPhotoRecord(orderId, technicianId, kind, url, caption ?? null, bucket, path);
    }
    photoSignedReadTtlSec() {
        const n = parseInt(process.env.ORDER_PHOTOS_SIGNED_URL_TTL_SEC ?? '900', 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
    }
    photoRowUrlForStorage(publicUrl, bucket, objectPath) {
        if (this.photoSignedReadTtlSec() > 0) {
            return `signed-read:${bucket}:${objectPath}`;
        }
        if (!publicUrl)
            throw new common_1.BadRequestException('cannot resolve public URL for uploaded object');
        return publicUrl;
    }
    async insertPhotoRecord(orderId, technicianId, kind, url, caption, storageBucket, storageObjectPath) {
        const id = (0, node_crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const fk = technicianIdForPhotosForeignKey(technicianId);
        const rec = {
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
            const row = {
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
            const { error } = await sb.from('order_photos').insert(row);
            if (error)
                throw new common_1.BadRequestException(error.message);
            return rec;
        }
    }
    async technicianListOrderPhotos(technicianId, orderId) {
        const row = await this.getOrder(orderId);
        this.assertTechnicianAccess(row, technicianId);
        {
            const sb = this.db();
            const { data, error } = await sb
                .from('order_photos')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at');
            if (error)
                throw new common_1.BadRequestException(error.message);
            const ttl = this.photoSignedReadTtlSec();
            const out = [];
            for (const rec of data ?? []) {
                const row = rec;
                let url = String(row.url ?? '');
                const b = row.storage_bucket == null ? null : String(row.storage_bucket);
                const p = row.storage_object_path == null ? null : String(row.storage_object_path);
                if (ttl > 0 && b && p) {
                    const { data: signed, error: se } = await sb.storage.from(b).createSignedUrl(p, ttl);
                    if (!se && signed?.signedUrl)
                        url = signed.signedUrl;
                }
                out.push({
                    ...photoRowFromDb({ ...row, url }),
                    url,
                });
            }
            return out;
        }
    }
    async technicianAddOrderPhoto(technicianId, orderId, dto) {
        const row = await this.getOrder(orderId);
        this.assertTechnicianAccess(row, technicianId);
        const url = dto.url.trim();
        if (!url)
            throw new common_1.BadRequestException('url required');
        const caption = dto.caption?.trim() ?? null;
        return this.insertPhotoRecord(orderId, technicianId, dto.kind, url, caption);
    }
    static makeOrderNo() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const suf = (0, node_crypto_1.randomUUID)().replace(/-/g, '').slice(0, 8);
        return `OC${y}${m}${day}-${suf}`;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(orders_repository_port_1.ORDERS_REPO)),
    __param(2, (0, common_1.Inject)(database_tokens_1.SUPABASE_ADMIN)),
    __metadata("design:paramtypes", [service_catalog_service_1.ServiceCatalogService, Object, Object])
], OrdersService);
//# sourceMappingURL=orders.service.js.map