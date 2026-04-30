"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const node_path_1 = require("node:path");
const database_module_1 = require("./database/database.module");
const admin_auth_module_1 = require("./modules/admin/admin-auth.module");
const admin_module_1 = require("./modules/admin/admin.module");
const app_controller_1 = require("./app.controller");
const emergency_leads_module_1 = require("./modules/emergency-leads/emergency-leads.module");
const orders_module_1 = require("./modules/orders/orders.module");
const service_catalog_module_1 = require("./modules/service-catalog/service-catalog.module");
const technicians_module_1 = require("./modules/technicians/technicians.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [app_controller_1.AppController],
        imports: [
            database_module_1.DatabaseModule,
            admin_auth_module_1.AdminAuthModule,
            emergency_leads_module_1.EmergencyLeadsModule,
            orders_module_1.OrdersModule,
            service_catalog_module_1.ServiceCatalogModule,
            technicians_module_1.TechniciansModule,
            admin_module_1.AdminModule,
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, node_path_1.join)(process.cwd(), 'public'),
                serveRoot: '/',
                exclude: ['/api/{*path}'],
                serveStaticOptions: {
                    fallthrough: false,
                },
            }),
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map