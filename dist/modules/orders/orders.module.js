"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersModule = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const database_module_1 = require("../../database/database.module");
const database_tokens_1 = require("../../database/database.tokens");
const service_catalog_module_1 = require("../service-catalog/service-catalog.module");
const customer_orders_admin_controller_1 = require("./customer-orders-admin.controller");
const orders_repository_port_1 = require("./orders.repository.port");
const extra_quotes_admin_controller_1 = require("./extra-quotes-admin.controller");
const extra_quotes_service_1 = require("./extra-quotes.service");
const payments_mock_controller_1 = require("./payments-mock.controller");
const orders_controller_1 = require("./orders.controller");
const orders_service_1 = require("./orders.service");
const supabase_orders_repository_1 = require("./supabase-orders.repository");
function unavailableOrdersRepository() {
    const fail = () => {
        throw new common_2.ServiceUnavailableException('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for order APIs');
    };
    return {
        insert: async () => fail(),
        replace: async () => fail(),
        findById: async () => fail(),
        listNewestFirst: async () => fail(),
        appendMockProductPayment: async () => fail(),
    };
}
let OrdersModule = class OrdersModule {
};
exports.OrdersModule = OrdersModule;
exports.OrdersModule = OrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [service_catalog_module_1.ServiceCatalogModule, database_module_1.DatabaseModule],
        controllers: [
            orders_controller_1.OrdersController,
            payments_mock_controller_1.PaymentsMockController,
            customer_orders_admin_controller_1.CustomerOrdersAdminController,
            extra_quotes_admin_controller_1.ExtraQuotesAdminController,
        ],
        providers: [
            orders_service_1.OrdersService,
            extra_quotes_service_1.ExtraQuotesService,
            {
                provide: orders_repository_port_1.ORDERS_REPO,
                useFactory: (sb) => {
                    if (!sb) {
                        return unavailableOrdersRepository();
                    }
                    return new supabase_orders_repository_1.SupabaseOrdersRepository(sb);
                },
                inject: [database_tokens_1.SUPABASE_ADMIN],
            },
        ],
        exports: [orders_service_1.OrdersService, extra_quotes_service_1.ExtraQuotesService],
    })
], OrdersModule);
//# sourceMappingURL=orders.module.js.map