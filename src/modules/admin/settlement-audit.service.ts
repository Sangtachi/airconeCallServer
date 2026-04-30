import { Injectable, Inject, Logger } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN } from '../../database/database.tokens';

export type SettlementAuditInput = {
  settlementId?: string | null;
  orderId?: string | null;
  actor: string;
  action: string;
  idempotencyKey?: string | null;
  payload?: unknown;
};

@Injectable()
export class SettlementAuditService {
  private readonly log = new Logger(SettlementAuditService.name);

  constructor(@Inject(SUPABASE_ADMIN) private readonly sb: SupabaseClient | null) {}

  async record(input: SettlementAuditInput): Promise<void> {
    if (!this.sb) return;
    const row = {
      settlement_id: input.settlementId ?? null,
      order_id: input.orderId ?? null,
      actor: input.actor,
      action: input.action,
      idempotency_key:
        input.idempotencyKey && input.idempotencyKey.trim().length > 0
          ? input.idempotencyKey.trim()
          : null,
      payload: input.payload == null ? null : (JSON.parse(JSON.stringify(input.payload)) as object),
    };
    const { error } = await this.sb.from('settlement_events').insert(row as never);
    if (
      error?.code === '23505' ||
      error?.message?.toLowerCase()?.includes('duplicate') ||
      error?.message?.toLowerCase()?.includes('unique')
    ) {
      this.log.debug(`settlement_events idempotent skip: ${input.idempotencyKey}`);
      return;
    }
    if (error) {
      this.log.warn(`settlement_events insert failed (non-blocking): ${error.message}`);
    }
  }
}
