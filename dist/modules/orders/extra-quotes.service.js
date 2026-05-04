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
exports.ExtraQuotesService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const database_tokens_1 = require("../../database/database.tokens");
const orders_service_1 = require("./orders.service");
let ExtraQuotesService = class ExtraQuotesService {
    constructor(sb, orders) {
        this.sb = sb;
        this.orders = orders;
    }
    db() {
        if (!this.sb) {
            throw new common_1.ServiceUnavailableException('Extra quote APIs require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        }
        return this.sb;
    }
    async technicianCreateQuote(technicianId, orderId, dto) {
        await this.orders.technicianGetJob(technicianId, orderId);
        if (!dto.items?.length)
            throw new common_1.BadRequestException('items required');
        const itemsIn = dto.items.map((it) => {
            const amount = Math.round(Number(it.quantity) * Number(it.unitPrice));
            if (amount < 0)
                throw new common_1.BadRequestException('invalid line amount');
            return {
                name: it.name.trim(),
                quantity: Number(it.quantity),
                unit: (it.unit ?? 'each').trim() || 'each',
                unitPrice: Math.round(Number(it.unitPrice)),
                amount,
                addonId: it.addonId?.trim() || null,
                materialId: it.materialId?.trim() || null,
            };
        });
        const totalAmount = itemsIn.reduce((s, r) => s + r.amount, 0);
        const sb = this.db();
        const qid = (0, node_crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const { error: e1 } = await sb.from('order_extra_quotes').insert({
            id: qid,
            order_id: orderId,
            technician_id: technicianId,
            status: 'requested',
            total_amount: totalAmount,
            customer_approved_at: null,
            paid_at: null,
            memo: dto.memo?.trim() ?? null,
            created_at: now,
            updated_at: now,
        });
        if (e1)
            throw new common_1.BadRequestException(e1.message);
        const itemRows = [];
        for (const r of itemsIn) {
            const iid = (0, node_crypto_1.randomUUID)();
            const { error: e2 } = await sb.from('order_extra_quote_items').insert({
                id: iid,
                quote_id: qid,
                addon_id: r.addonId,
                material_id: r.materialId,
                name: r.name,
                quantity: r.quantity,
                unit: r.unit,
                unit_price: r.unitPrice,
                amount: r.amount,
            });
            if (e2)
                throw new common_1.BadRequestException(e2.message);
            itemRows.push({
                id: iid,
                quoteId: qid,
                addonId: r.addonId,
                materialId: r.materialId,
                name: r.name,
                quantity: r.quantity,
                unit: r.unit,
                unitPrice: r.unitPrice,
                amount: r.amount,
            });
        }
        return {
            id: qid,
            orderId,
            technicianId,
            status: 'requested',
            totalAmount,
            customerApprovedAt: null,
            paidAt: null,
            memo: dto.memo?.trim() ?? null,
            createdAt: now,
            items: itemRows,
        };
    }
    async technicianListQuotes(technicianId, orderId) {
        await this.orders.technicianGetJob(technicianId, orderId);
        {
            const sb = this.db();
            const { data: quotes, error } = await sb
                .from('order_extra_quotes')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: false });
            if (error)
                throw new common_1.BadRequestException(error.message);
            const out = [];
            for (const q of quotes ?? []) {
                const rec = q;
                const qid = String(rec.id);
                const { data: items, error: ie } = await sb
                    .from('order_extra_quote_items')
                    .select('*')
                    .eq('quote_id', qid);
                if (ie)
                    throw new common_1.BadRequestException(ie.message);
                out.push(this.mapDbQuote(rec, (items ?? [])));
            }
            return out;
        }
    }
    async adminListQuotes(orderId) {
        {
            const sb = this.db();
            let q = sb.from('order_extra_quotes').select('*').order('created_at', { ascending: false });
            if (orderId)
                q = q.eq('order_id', orderId);
            const { data: quotes, error } = await q;
            if (error)
                throw new common_1.BadRequestException(error.message);
            const out = [];
            for (const qrow of quotes ?? []) {
                const rec = qrow;
                const qid = String(rec.id);
                const { data: items, error: ie } = await sb
                    .from('order_extra_quote_items')
                    .select('*')
                    .eq('quote_id', qid);
                if (ie)
                    throw new common_1.BadRequestException(ie.message);
                out.push(this.mapDbQuote(rec, (items ?? [])));
            }
            return out;
        }
    }
    async adminCustomerApprove(quoteId) {
        return this.transitionQuote(quoteId, 'approved', { setCustomerApprovedAt: true });
    }
    async adminReject(quoteId) {
        return this.transitionQuote(quoteId, 'rejected', {});
    }
    async adminCancel(quoteId) {
        return this.transitionQuote(quoteId, 'cancelled', {});
    }
    async adminMockPay(quoteId) {
        const row = await this.getQuoteById(quoteId);
        if (row.status !== 'approved') {
            throw new common_1.BadRequestException('견적이 고객 승인(approved) 상태일 때만 결제 기록을 남길 수 있습니다.');
        }
        {
            const sb = this.db();
            const paymentId = (0, node_crypto_1.randomUUID)();
            const paidAt = new Date().toISOString();
            const { error: pe } = await sb.from('payments').insert({
                id: paymentId,
                order_id: row.orderId,
                provider: 'manual',
                amount: row.totalAmount,
                status: 'paid',
                payment_type: 'extra',
                paid_at: paidAt,
                raw_response: { source: 'mock_extra_quote', quoteId },
            });
            if (pe)
                throw new common_1.BadRequestException(pe.message);
            const { error: qe } = await sb
                .from('order_extra_quotes')
                .update({ status: 'paid', paid_at: paidAt, updated_at: paidAt })
                .eq('id', quoteId);
            if (qe)
                throw new common_1.BadRequestException(qe.message);
            const fresh = await this.fetchOneDb(quoteId);
            return { quote: fresh, paymentId };
        }
    }
    async transitionQuote(quoteId, to, opts) {
        const cur = await this.getQuoteById(quoteId);
        if (cur.status === 'paid')
            throw new common_1.BadRequestException('이미 결제 완료된 견적입니다.');
        if (cur.status === 'rejected' || cur.status === 'cancelled') {
            throw new common_1.BadRequestException('종료된 견적은 변경할 수 없습니다.');
        }
        if (to === 'approved' && cur.status !== 'requested') {
            throw new common_1.BadRequestException('requested 상태에서만 고객 승인으로 넘길 수 있습니다.');
        }
        if (to === 'rejected' && cur.status !== 'requested') {
            throw new common_1.BadRequestException('requested 상태에서만 반려할 수 있습니다.');
        }
        const now = new Date().toISOString();
        {
            const patch = { status: to, updated_at: now };
            if (opts.setCustomerApprovedAt)
                patch.customer_approved_at = now;
            const { error } = await this.db().from('order_extra_quotes').update(patch).eq('id', quoteId);
            if (error)
                throw new common_1.BadRequestException(error.message);
            return this.fetchOneDb(quoteId);
        }
    }
    async getQuoteById(quoteId) {
        return this.fetchOneDb(quoteId);
    }
    async fetchOneDb(quoteId) {
        const sb = this.db();
        const { data: q, error } = await sb.from('order_extra_quotes').select('*').eq('id', quoteId).maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!q)
            throw new common_1.NotFoundException('quote not found');
        const { data: items, error: ie } = await sb
            .from('order_extra_quote_items')
            .select('*')
            .eq('quote_id', quoteId);
        if (ie)
            throw new common_1.BadRequestException(ie.message);
        return this.mapDbQuote(q, (items ?? []));
    }
    mapDbQuote(q, items) {
        const qid = String(q.id);
        return {
            id: qid,
            orderId: String(q.order_id),
            technicianId: q.technician_id == null ? null : String(q.technician_id),
            status: q.status,
            totalAmount: Number(q.total_amount ?? 0),
            customerApprovedAt: q.customer_approved_at == null ? null : String(q.customer_approved_at),
            paidAt: q.paid_at == null ? null : String(q.paid_at),
            memo: q.memo == null ? null : String(q.memo),
            createdAt: String(q.created_at ?? new Date().toISOString()),
            items: items.map((it) => ({
                id: String(it.id),
                quoteId: qid,
                addonId: it.addon_id == null ? null : String(it.addon_id),
                materialId: it.material_id == null ? null : String(it.material_id),
                name: String(it.name),
                quantity: Number(it.quantity ?? 1),
                unit: String(it.unit ?? 'each'),
                unitPrice: Number(it.unit_price ?? 0),
                amount: Number(it.amount ?? 0),
            })),
        };
    }
};
exports.ExtraQuotesService = ExtraQuotesService;
exports.ExtraQuotesService = ExtraQuotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_tokens_1.SUPABASE_ADMIN)),
    __metadata("design:paramtypes", [Object, orders_service_1.OrdersService])
], ExtraQuotesService);
//# sourceMappingURL=extra-quotes.service.js.map