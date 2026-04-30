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
exports.ServiceCatalogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const service_catalog_service_1 = require("./service-catalog.service");
let ServiceCatalogController = class ServiceCatalogController {
    constructor(catalog) {
        this.catalog = catalog;
    }
    listCategories() {
        return this.catalog.getCategories();
    }
    listProducts(serviceType, airconType, categoryCode) {
        return this.catalog.getProducts({
            serviceType: serviceType === 'install' || serviceType === 'cleaning' ? serviceType : undefined,
            airconType: airconType === 'wall' || airconType === 'stand' || airconType === 'two_in_one' || airconType === 'system'
                ? airconType
                : undefined,
            categoryCode: categoryCode || undefined,
        });
    }
    getProduct(id) {
        return this.catalog.getProduct(id);
    }
    listAddons() {
        return this.catalog.getAddons();
    }
};
exports.ServiceCatalogController = ServiceCatalogController;
__decorate([
    (0, common_1.Get)('service-categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Get)('service-products'),
    (0, swagger_1.ApiQuery)({ name: 'serviceType', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'airconType', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'categoryCode', required: false }),
    __param(0, (0, common_1.Query)('serviceType')),
    __param(1, (0, common_1.Query)('airconType')),
    __param(2, (0, common_1.Query)('categoryCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "listProducts", null);
__decorate([
    (0, common_1.Get)('service-products/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "getProduct", null);
__decorate([
    (0, common_1.Get)('service-addons'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "listAddons", null);
exports.ServiceCatalogController = ServiceCatalogController = __decorate([
    (0, swagger_1.ApiTags)('service-catalog'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [service_catalog_service_1.ServiceCatalogService])
], ServiceCatalogController);
//# sourceMappingURL=service-catalog.controller.js.map