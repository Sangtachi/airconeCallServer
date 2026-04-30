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
var EmergencyLeadDispatchBridge_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyLeadDispatchBridge = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("../admin/admin.service");
const orders_service_1 = require("../orders/orders.service");
const service_catalog_service_1 = require("../service-catalog/service-catalog.service");
const emergency_leads_repository_port_1 = require("./emergency-leads.repository.port");
class Mutex {
    constructor() {
        this.tail = Promise.resolve();
    }
    runExclusive(fn) {
        const run = this.tail.then(fn);
        this.tail = run.then(() => undefined, () => undefined);
        return run;
    }
}
let EmergencyLeadDispatchBridge = EmergencyLeadDispatchBridge_1 = class EmergencyLeadDispatchBridge {
    constructor(repo, admin, orders, catalog) {
        this.repo = repo;
        this.admin = admin;
        this.orders = orders;
        this.catalog = catalog;
        this.logger = new common_1.Logger(EmergencyLeadDispatchBridge_1.name);
        this.mutexByLead = new Map();
    }
    mutex(leadId) {
        let m = this.mutexByLead.get(leadId);
        if (!m) {
            m = new Mutex();
            this.mutexByLead.set(leadId, m);
        }
        return m;
    }
    async tryFinalizeLead(initial, opts) {
        return this.mutex(initial.id).runExclusive(async () => {
            const id = initial.id;
            const row = await this.repo.findById(id);
            if (!row)
                return;
            try {
                await this.finalizeLeadBody(row, opts ?? {});
            }
            catch (e) {
                this.logger.warn(`tryFinalizeLead failed lead=${id} — ${e instanceof Error ? e.message : String(e)}`);
                throw e;
            }
        });
    }
    async tryFinalizeLeadForced(leadRow) {
        return this.tryFinalizeLead(leadRow, { forceBeforeDeadline: true });
    }
    async finalizeLeadBody(fresh, opts) {
        if (fresh.convertedBookingId &&
            fresh.convertedOrderId &&
            fresh.matchingStatus === 'converted_to_order') {
            return;
        }
        if (fresh.convertedBookingId && fresh.convertedOrderId) {
            if (fresh.matchingStatus !== 'converted_to_order') {
                await this.repo.updatePartial(fresh.id, {
                    matchingStatus: 'converted_to_order',
                    updatedAt: new Date().toISOString(),
                });
            }
            return;
        }
        const deadlineMs = Date.parse(fresh.matchingDeadlineAt);
        const pastDeadline = Number.isFinite(deadlineMs) && Date.now() >= deadlineMs;
        const needsRepair = fresh.matchingStatus === 'converted_to_order' &&
            (!fresh.convertedBookingId || !fresh.convertedOrderId);
        const resumingPartial = Boolean(fresh.convertedBookingId) !== Boolean(fresh.convertedOrderId);
        const allow = opts.forceBeforeDeadline === true || pastDeadline || needsRepair || resumingPartial;
        if (!allow)
            return;
        const eligible = [
            'pending',
            'timed_out',
            'contact_saved',
            'converted_to_order',
        ];
        if (!eligible.includes(fresh.matchingStatus))
            return;
        let row = fresh;
        const nowIso = () => new Date().toISOString();
        if (row.matchingStatus === 'pending' && pastDeadline) {
            await this.repo.updatePartial(row.id, {
                matchingStatus: 'timed_out',
                updatedAt: nowIso(),
            });
            const r2 = await this.repo.findById(row.id);
            if (!r2)
                return;
            row = r2;
        }
        let productId;
        productId = this.catalog.resolveDefaultEmergencyProductId();
        if (!row.convertedBookingId) {
            const booking = this.admin.createBookingFromEmergencyLead(row);
            await this.repo.updatePartial(row.id, {
                convertedBookingId: booking.id,
                updatedAt: nowIso(),
            });
            const r3 = await this.repo.findById(row.id);
            if (!r3)
                return;
            row = r3;
        }
        if (!row.convertedOrderId) {
            const orderRow = await this.orders.createEmergencyLeadDraft(row, productId);
            await this.repo.updatePartial(row.id, {
                convertedOrderId: orderRow.id,
                matchingStatus: 'converted_to_order',
                updatedAt: nowIso(),
            });
        }
        else if (row.matchingStatus !== 'converted_to_order') {
            await this.repo.updatePartial(row.id, {
                matchingStatus: 'converted_to_order',
                updatedAt: nowIso(),
            });
        }
        const done = await this.repo.findById(row.id);
        if (done?.convertedBookingId && done?.convertedOrderId && done.matchingStatus !== 'converted_to_order') {
            await this.repo.updatePartial(done.id, { matchingStatus: 'converted_to_order', updatedAt: nowIso() });
        }
    }
};
exports.EmergencyLeadDispatchBridge = EmergencyLeadDispatchBridge;
exports.EmergencyLeadDispatchBridge = EmergencyLeadDispatchBridge = EmergencyLeadDispatchBridge_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(emergency_leads_repository_port_1.EMERGENCY_LEADS_REPO)),
    __metadata("design:paramtypes", [Object, admin_service_1.AdminService,
        orders_service_1.OrdersService,
        service_catalog_service_1.ServiceCatalogService])
], EmergencyLeadDispatchBridge);
//# sourceMappingURL=emergency-lead-dispatch.bridge.js.map