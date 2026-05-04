import { Inject, Injectable, Logger } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ServiceCatalogService } from '../service-catalog/service-catalog.service';
import { EMERGENCY_LEADS_REPO } from './emergency-leads.repository.port';
import type { EmergencyLeadsRepositoryPort } from './emergency-leads.repository.port';
import type { EmergencyLeadRow } from './emergency-leads.types';

class Mutex {
  private tail = Promise.resolve();

  runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.tail.then(fn);
    this.tail = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
}

/** 긴급 리드 매칭 마감 후 Supabase 주문 초안 자동 생성(멱등). */
@Injectable()
export class EmergencyLeadDispatchBridge {
  private readonly logger = new Logger(EmergencyLeadDispatchBridge.name);
  private readonly mutexByLead = new Map<string, Mutex>();

  constructor(
    @Inject(EMERGENCY_LEADS_REPO)
    private readonly repo: EmergencyLeadsRepositoryPort,
    private readonly orders: OrdersService,
    private readonly catalog: ServiceCatalogService,
  ) {}

  private mutex(leadId: string): Mutex {
    let m = this.mutexByLead.get(leadId);
    if (!m) {
      m = new Mutex();
      this.mutexByLead.set(leadId, m);
    }
    return m;
  }

  /** 타이머·연락처 저장·마감 스윕·관리 패치 등 공통 진입점 */
  async tryFinalizeLead(initial: EmergencyLeadRow, opts?: { forceBeforeDeadline?: boolean }): Promise<void> {
    return this.mutex(initial.id).runExclusive(async () => {
      const id = initial.id;
      const row = await this.repo.findById(id);
      if (!row) return;
      try {
        await this.finalizeLeadBody(row, opts ?? {});
      } catch (e) {
        this.logger.warn(
          `tryFinalizeLead failed lead=${id} — ${e instanceof Error ? e.message : String(e)}`,
        );
        throw e;
      }
    });
  }

  /** 관리자가 `converted_to_order` 로 표시했을 때(마감 전 포함) 같은 파이프라인 재시도 */
  async tryFinalizeLeadForced(leadRow: EmergencyLeadRow): Promise<void> {
    return this.tryFinalizeLead(leadRow, { forceBeforeDeadline: true });
  }

  private async finalizeLeadBody(
    fresh: EmergencyLeadRow,
    opts: { forceBeforeDeadline?: boolean },
  ): Promise<void> {
    if (fresh.convertedOrderId && fresh.matchingStatus === 'converted_to_order') {
      return;
    }

    if (fresh.convertedOrderId) {
      if (fresh.matchingStatus !== 'converted_to_order') {
        await this.repo.updatePartial(fresh.id, {
          convertedBookingId: fresh.convertedBookingId ?? fresh.convertedOrderId,
          matchingStatus: 'converted_to_order',
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }

    const deadlineMs = Date.parse(fresh.matchingDeadlineAt);
    const pastDeadline = Number.isFinite(deadlineMs) && Date.now() >= deadlineMs;
    const needsRepair =
      fresh.matchingStatus === 'converted_to_order' &&
      !fresh.convertedOrderId;
    const allow = opts.forceBeforeDeadline === true || pastDeadline || needsRepair;

    if (!allow) return;

    const eligible: EmergencyLeadRow['matchingStatus'][] = [
      'pending',
      'timed_out',
      'contact_saved',
      'converted_to_order',
    ];
    if (!eligible.includes(fresh.matchingStatus)) return;

    let row = fresh;
    const nowIso = () => new Date().toISOString();

    if (row.matchingStatus === 'pending' && pastDeadline) {
      await this.repo.updatePartial(row.id, {
        matchingStatus: 'timed_out',
        updatedAt: nowIso(),
      });
      const r2 = await this.repo.findById(row.id);
      if (!r2) return;
      row = r2;
    }

    let productId: string;
    productId = this.catalog.resolveDefaultEmergencyProductId();

    if (!row.convertedOrderId) {
      const orderRow = await this.orders.createEmergencyLeadDraft(row, productId);
      await this.repo.updatePartial(row.id, {
        convertedOrderId: orderRow.id,
        convertedBookingId: orderRow.id,
        matchingStatus: 'converted_to_order',
        updatedAt: nowIso(),
      });
    } else if (row.matchingStatus !== 'converted_to_order') {
      await this.repo.updatePartial(row.id, {
        matchingStatus: 'converted_to_order',
        updatedAt: nowIso(),
      });
    }

    const done = await this.repo.findById(row.id);
    if (done?.convertedOrderId && done.matchingStatus !== 'converted_to_order') {
      await this.repo.updatePartial(done.id, {
        convertedBookingId: done.convertedBookingId ?? done.convertedOrderId,
        matchingStatus: 'converted_to_order',
        updatedAt: nowIso(),
      });
    }
  }
}
