import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../database/database.tokens';
import type { TechnicianCreateQuoteDto } from './dto/extra-quotes.dto';
import { OrdersService } from './orders.service';

export type ExtraQuoteItemRow = {
  id: string;
  quoteId: string;
  addonId: string | null;
  materialId: string | null;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
};

export type ExtraQuoteRow = {
  id: string;
  orderId: string;
  technicianId: string | null;
  status: 'requested' | 'approved' | 'paid' | 'rejected' | 'cancelled';
  totalAmount: number;
  customerApprovedAt: string | null;
  paidAt: string | null;
  memo: string | null;
  createdAt: string;
  items: ExtraQuoteItemRow[];
};

@Injectable()
export class ExtraQuotesService {
  constructor(
    @Inject(SUPABASE_ADMIN) private readonly sb: SupabaseClient | null,
    private readonly orders: OrdersService,
  ) {}

  private db(): SupabaseClient {
    if (!this.sb) {
      throw new ServiceUnavailableException(
        'Extra quote APIs require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
      );
    }
    return this.sb;
  }

  async technicianCreateQuote(
    technicianId: string,
    orderId: string,
    dto: TechnicianCreateQuoteDto,
  ): Promise<ExtraQuoteRow> {
    const order = await this.orders.technicianGetJob(technicianId, orderId);
    if (!dto.items?.length) throw new BadRequestException('items required');

    const itemsIn = dto.items.map((it) => {
      const amount = Math.round(Number(it.quantity) * Number(it.unitPrice));
      if (amount < 0) throw new BadRequestException('invalid line amount');
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
    const qid = randomUUID();
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
    if (e1) throw new BadRequestException(e1.message);
    const itemRows: ExtraQuoteItemRow[] = [];
    for (const r of itemsIn) {
      const iid = randomUUID();
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
      if (e2) throw new BadRequestException(e2.message);
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
    const result = {
      id: qid,
      orderId,
      technicianId,
      status: 'requested' as const,
      totalAmount,
      customerApprovedAt: null,
      paidAt: null,
      memo: dto.memo?.trim() ?? null,
      createdAt: now,
      items: itemRows,
    };
    const pending = await this.orders.markExtraPaymentPending(orderId);
    await this.orders.notifyOrderCustomer(
      pending,
      'extra_quote_requested',
      '최종 명세서 확인이 필요합니다',
      `${order.productName} 작업의 추가금 ${totalAmount.toLocaleString('ko-KR')}원이 요청되었습니다.`,
      { quoteId: qid, totalAmount },
    );
    return result;
  }

  async technicianListQuotes(technicianId: string, orderId: string): Promise<ExtraQuoteRow[]> {
    await this.orders.technicianGetJob(technicianId, orderId);
    {
      const sb = this.db();
      const { data: quotes, error } = await sb
        .from('order_extra_quotes')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });
      if (error) throw new BadRequestException(error.message);
      const out: ExtraQuoteRow[] = [];
      for (const q of quotes ?? []) {
        const rec = q as Record<string, unknown>;
        const qid = String(rec.id);
        const { data: items, error: ie } = await sb
          .from('order_extra_quote_items')
          .select('*')
          .eq('quote_id', qid);
        if (ie) throw new BadRequestException(ie.message);
        out.push(this.mapDbQuote(rec, (items ?? []) as Record<string, unknown>[]));
      }
      return out;
    }
  }

  async adminListQuotes(orderId?: string): Promise<ExtraQuoteRow[]> {
    {
      const sb = this.db();
      let q = sb.from('order_extra_quotes').select('*').order('created_at', { ascending: false });
      if (orderId) q = q.eq('order_id', orderId);
      const { data: quotes, error } = await q;
      if (error) throw new BadRequestException(error.message);
      const out: ExtraQuoteRow[] = [];
      for (const qrow of quotes ?? []) {
        const rec = qrow as Record<string, unknown>;
        const qid = String(rec.id);
        const { data: items, error: ie } = await sb
          .from('order_extra_quote_items')
          .select('*')
          .eq('quote_id', qid);
        if (ie) throw new BadRequestException(ie.message);
        out.push(this.mapDbQuote(rec, (items ?? []) as Record<string, unknown>[]));
      }
      return out;
    }
  }

  async adminCustomerApprove(quoteId: string): Promise<ExtraQuoteRow> {
    return this.transitionQuote(quoteId, 'approved', { setCustomerApprovedAt: true });
  }

  async adminReject(quoteId: string): Promise<ExtraQuoteRow> {
    return this.transitionQuote(quoteId, 'rejected', {});
  }

  async adminCancel(quoteId: string): Promise<ExtraQuoteRow> {
    return this.transitionQuote(quoteId, 'cancelled', {});
  }

  /** 모의: 결제행 생성 + 견적 paid */
  async adminMockPay(quoteId: string): Promise<{ quote: ExtraQuoteRow; paymentId: string }> {
    const row = await this.getQuoteById(quoteId);
    if (row.status !== 'approved') {
      throw new BadRequestException('견적이 고객 승인(approved) 상태일 때만 결제 기록을 남길 수 있습니다.');
    }
    {
      const sb = this.db();
      const paymentId = randomUUID();
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
      if (pe) throw new BadRequestException(pe.message);
      const { error: qe } = await sb
        .from('order_extra_quotes')
        .update({ status: 'paid', paid_at: paidAt, updated_at: paidAt })
        .eq('id', quoteId);
      if (qe) throw new BadRequestException(qe.message);
      await this.orders.applyPaidExtraQuote(row.orderId, row.totalAmount);
      const fresh = await this.fetchOneDb(quoteId);
      return { quote: fresh, paymentId };
    }
  }

  private async transitionQuote(
    quoteId: string,
    to: ExtraQuoteRow['status'],
    opts: { setCustomerApprovedAt?: boolean },
  ): Promise<ExtraQuoteRow> {
    const cur = await this.getQuoteById(quoteId);
    if (cur.status === 'paid') throw new BadRequestException('이미 결제 완료된 견적입니다.');
    if (cur.status === 'rejected' || cur.status === 'cancelled') {
      throw new BadRequestException('종료된 견적은 변경할 수 없습니다.');
    }
    if (to === 'approved' && cur.status !== 'requested') {
      throw new BadRequestException('requested 상태에서만 고객 승인으로 넘길 수 있습니다.');
    }
    if (to === 'rejected' && cur.status !== 'requested') {
      throw new BadRequestException('requested 상태에서만 반려할 수 있습니다.');
    }
    const now = new Date().toISOString();
    {
      const patch: Record<string, unknown> = { status: to, updated_at: now };
      if (opts.setCustomerApprovedAt) patch.customer_approved_at = now;
      const { error } = await this.db().from('order_extra_quotes').update(patch).eq('id', quoteId);
      if (error) throw new BadRequestException(error.message);
      return this.fetchOneDb(quoteId);
    }
  }

  private async getQuoteById(quoteId: string): Promise<ExtraQuoteRow> {
    return this.fetchOneDb(quoteId);
  }

  private async fetchOneDb(quoteId: string): Promise<ExtraQuoteRow> {
    const sb = this.db();
    const { data: q, error } = await sb.from('order_extra_quotes').select('*').eq('id', quoteId).maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!q) throw new NotFoundException('quote not found');
    const { data: items, error: ie } = await sb
      .from('order_extra_quote_items')
      .select('*')
      .eq('quote_id', quoteId);
    if (ie) throw new BadRequestException(ie.message);
    return this.mapDbQuote(q as Record<string, unknown>, (items ?? []) as Record<string, unknown>[]);
  }

  private mapDbQuote(q: Record<string, unknown>, items: Record<string, unknown>[]): ExtraQuoteRow {
    const qid = String(q.id);
    return {
      id: qid,
      orderId: String(q.order_id),
      technicianId: q.technician_id == null ? null : String(q.technician_id),
      status: q.status as ExtraQuoteRow['status'],
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
}
