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
exports.ServiceCatalogAdminAddonsController = exports.ServiceCatalogAdminProductsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_access_guard_1 = require("../admin/admin-access.guard");
const catalog_admin_dto_1 = require("./catalog-admin.dto");
const service_catalog_service_1 = require("./service-catalog.service");
let ServiceCatalogAdminProductsController = class ServiceCatalogAdminProductsController {
    constructor(catalog) {
        this.catalog = catalog;
    }
    list(includeInactive) {
        return this.catalog.adminListProducts(includeInactive === '1' || includeInactive === 'true');
    }
    async create(dto) {
        return this.catalog.createProduct(dto);
    }
    async patch(id, dto) {
        return this.catalog.patchProduct(id, dto);
    }
    async remove(id) {
        return this.catalog.deactivateProduct(id);
    }
};
exports.ServiceCatalogAdminProductsController = ServiceCatalogAdminProductsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false }),
    __param(0, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceCatalogAdminProductsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [catalog_admin_dto_1.CreateServiceProductDto]),
    __metadata("design:returntype", Promise)
], ServiceCatalogAdminProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, catalog_admin_dto_1.PatchServiceProductDto]),
    __metadata("design:returntype", Promise)
], ServiceCatalogAdminProductsController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceCatalogAdminProductsController.prototype, "remove", null);
exports.ServiceCatalogAdminProductsController = ServiceCatalogAdminProductsController = __decorate([
    (0, swagger_1.ApiTags)('admin-service-catalog'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiHeader)({ name: 'x-admin-role', required: false }),
    (0, common_1.UseGuards)(admin_access_guard_1.AdminAccessGuard),
    (0, common_1.Controller)('admin/service-products'),
    __metadata("design:paramtypes", [service_catalog_service_1.ServiceCatalogService])
], ServiceCatalogAdminProductsController);
let ServiceCatalogAdminAddonsController = class ServiceCatalogAdminAddonsController {
    constructor(catalog) {
        this.catalog = catalog;
    }
    list(includeInactive) {
        return this.catalog.getAddons(includeInactive === '1' || includeInactive === 'true');
    }
    async create(dto) {
        return this.catalog.createAddon(dto);
    }
    async patch(id, dto) {
        return this.catalog.patchAddon(id, dto);
    }
    async remove(id) {
        return this.catalog.deactivateAddon(id);
    }
};
exports.ServiceCatalogAdminAddonsController = ServiceCatalogAdminAddonsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiQuery)({ name: 'includeInactive', required: false }),
    __param(0, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServiceCatalogAdminAddonsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [catalog_admin_dto_1.CreateServiceAddonDto]),
    __metadata("design:returntype", Promise)
], ServiceCatalogAdminAddonsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, catalog_admin_dto_1.PatchServiceAddonDto]),
    __metadata("design:returntype", Promise)
], ServiceCatalogAdminAddonsController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServiceCatalogAdminAddonsController.prototype, "remove", null);
exports.ServiceCatalogAdminAddonsController = ServiceCatalogAdminAddonsController = __decorate([
    (0, swagger_1.ApiTags)('admin-service-catalog'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiHeader)({ name: 'x-admin-role', required: false }),
    (0, common_1.UseGuards)(admin_access_guard_1.AdminAccessGuard),
    (0, common_1.Controller)('admin/service-addons'),
    __metadata("design:paramtypes", [service_catalog_service_1.ServiceCatalogService])
], ServiceCatalogAdminAddonsController);
//# sourceMappingURL=service-catalog-admin.controller.js.map