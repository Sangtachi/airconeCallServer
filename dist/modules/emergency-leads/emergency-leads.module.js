"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyLeadsModule = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const database_tokens_1 = require("../../database/database.tokens");
const orders_module_1 = require("../orders/orders.module");
const service_catalog_module_1 = require("../service-catalog/service-catalog.module");
const emergency_lead_dispatch_bridge_1 = require("./emergency-lead-dispatch.bridge");
const emergency_leads_admin_controller_1 = require("./emergency-leads-admin.controller");
const emergency_leads_public_controller_1 = require("./emergency-leads.public.controller");
const emergency_leads_repository_port_1 = require("./emergency-leads.repository.port");
const emergency_leads_service_1 = require("./emergency-leads.service");
const supabase_emergency_leads_repository_1 = require("./supabase-emergency-leads.repository");
function unavailableEmergencyLeadsRepository() {
    const fail = () => {
        throw new common_2.ServiceUnavailableException('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for emergency lead APIs');
    };
    return {
        insert: async () => fail(),
        findById: async () => fail(),
        list: async () => fail(),
        updatePartial: async () => fail(),
    };
}
let EmergencyLeadsModule = class EmergencyLeadsModule {
};
exports.EmergencyLeadsModule = EmergencyLeadsModule;
exports.EmergencyLeadsModule = EmergencyLeadsModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, orders_module_1.OrdersModule, service_catalog_module_1.ServiceCatalogModule],
        controllers: [emergency_leads_public_controller_1.EmergencyLeadsPublicController, emergency_leads_admin_controller_1.EmergencyLeadsAdminController],
        providers: [
            emergency_lead_dispatch_bridge_1.EmergencyLeadDispatchBridge,
            emergency_leads_service_1.EmergencyLeadsService,
            {
                provide: emergency_leads_repository_port_1.EMERGENCY_LEADS_REPO,
                useFactory: (sb) => {
                    if (!sb) {
                        return unavailableEmergencyLeadsRepository();
                    }
                    return new supabase_emergency_leads_repository_1.SupabaseEmergencyLeadsRepository(sb);
                },
                inject: [database_tokens_1.SUPABASE_ADMIN],
            },
        ],
        exports: [emergency_leads_service_1.EmergencyLeadsService],
    })
], EmergencyLeadsModule);
//# sourceMappingURL=emergency-leads.module.js.map