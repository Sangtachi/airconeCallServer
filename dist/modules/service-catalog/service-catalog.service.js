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
var ServiceCatalogService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCatalogService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const database_tokens_1 = require("../../database/database.tokens");
const catalog_db_1 = require("./catalog-db");
const catalog_fixture_1 = require("./catalog.fixture");
function cloneRows(rows) {
    return typeof structuredClone === 'function'
        ? structuredClone(rows)
        : JSON.parse(JSON.stringify(rows));
}
let ServiceCatalogService = ServiceCatalogService_1 = class ServiceCatalogService {
    constructor(sb) {
        this.sb = sb;
        this.logger = new common_1.Logger(ServiceCatalogService_1.name);
        this.persistCatalog = false;
        this.categories = cloneRows(catalog_fixture_1.CATALOG_FIXTURE_CATEGORIES);
        this.products = cloneRows(catalog_fixture_1.CATALOG_FIXTURE_PRODUCTS);
        this.addons = cloneRows(catalog_fixture_1.CATALOG_FIXTURE_ADDONS);
    }
    async onModuleInit() {
        if (!this.sb) {
            this.logger.warn('Service catalog: Supabase 미설정 — 공개 카탈로그는 fixture로 표시하고, 운영 쓰기 API는 503을 반환합니다.');
            return;
        }
        try {
            let { categories, products, addons } = await (0, catalog_db_1.loadCatalogFromSupabase)(this.sb);
            if (products.length === 0) {
                this.logger.warn('service_products 비어 있음 — fixture 로 DB 시드 후 재로드');
                await (0, catalog_db_1.upsertFixtureSeed)(this.sb, {
                    categories: cloneRows(catalog_fixture_1.CATALOG_FIXTURE_CATEGORIES),
                    products: cloneRows(catalog_fixture_1.CATALOG_FIXTURE_PRODUCTS),
                    addons: cloneRows(catalog_fixture_1.CATALOG_FIXTURE_ADDONS),
                });
                ({ categories, products, addons } = await (0, catalog_db_1.loadCatalogFromSupabase)(this.sb));
            }
            this.categories = categories;
            this.products = products;
            this.addons = addons;
            this.persistCatalog = true;
            this.logger.log(`Service catalog: Supabase 로드 ${categories.length} 카테고리 / ${products.length} 상품 / ${addons.length} 추가항목`);
        }
        catch (e) {
            this.logger.error(`Service catalog DB 로드 실패 — ${e instanceof Error ? e.message : String(e)}`);
            throw e;
        }
    }
    async persist(fn) {
        try {
            await fn();
        }
        catch (e) {
            throw new common_1.BadRequestException(e instanceof Error ? e.message : String(e));
        }
    }
    ensureCatalogWritable() {
        if (!this.sb || !this.persistCatalog) {
            throw new common_1.ServiceUnavailableException('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for catalog write APIs');
        }
    }
    getCategories(includeInactive = false) {
        let rows = [...this.categories];
        if (!includeInactive)
            rows = rows.filter((c) => c.isActive);
        return rows.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    adminListProducts(includeInactive) {
        let rows = [...this.products];
        if (!includeInactive)
            rows = rows.filter((p) => p.isActive);
        return rows.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    getProducts(query, _includeInactive = false) {
        let rows = [...this.products].filter((p) => p.isActive);
        if (query?.serviceType)
            rows = rows.filter((p) => p.serviceType === query.serviceType);
        if (query?.airconType)
            rows = rows.filter((p) => p.airconType === query.airconType);
        if (query?.categoryCode) {
            const cat = this.categories.find((c) => c.code === query.categoryCode);
            if (cat)
                rows = rows.filter((p) => p.categoryId === cat.id);
        }
        return rows.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    getProduct(id) {
        const row = this.products.find((p) => p.id === id);
        if (!row || !row.isActive)
            throw new common_1.NotFoundException('service product not found');
        return row;
    }
    resolveProductPrice(id, scheduleType) {
        const row = this.products.find((p) => p.id === id);
        if (!row || !row.isActive)
            throw new common_1.NotFoundException('service product not found');
        return row;
    }
    resolveDefaultEmergencyProductId() {
        const raw = process.env.EMERGENCY_DEFAULT_PRODUCT_ID?.trim();
        if (raw) {
            const row = this.products.find((p) => p.id === raw && p.isActive);
            if (row)
                return row.id;
            this.logger.warn(`EMERGENCY_DEFAULT_PRODUCT_ID="${raw}" not found or inactive — using first active install product`);
        }
        const install = this.getProducts({ serviceType: 'install' });
        if (install.length === 0)
            throw new common_1.BadRequestException('No active install product for emergency order draft');
        return install[0].id;
    }
    getAddons(includeInactive = false) {
        let rows = [...this.addons];
        if (!includeInactive)
            rows = rows.filter((a) => a.isActive);
        return rows.sort((x, y) => x.sortOrder - y.sortOrder);
    }
    getAddon(id) {
        const row = this.addons.find((a) => a.id === id);
        if (!row)
            throw new common_1.NotFoundException('service addon not found');
        return row;
    }
    async createProduct(dto) {
        this.ensureCatalogWritable();
        const cat = this.categories.find((c) => c.id === dto.categoryId);
        if (!cat)
            throw new common_1.BadRequestException('category not found');
        if (this.products.some((p) => p.code === dto.code))
            throw new common_1.BadRequestException('product code exists');
        const row = {
            id: (0, node_crypto_1.randomUUID)(),
            categoryId: dto.categoryId,
            name: dto.name,
            code: dto.code,
            serviceType: dto.serviceType,
            airconType: dto.airconType,
            basePrice: dto.basePrice,
            sameDayExtraPrice: dto.sameDayExtraPrice,
            sameDayPrice: dto.sameDayPrice,
            includedPipeMeter: dto.includedPipeMeter ?? 5,
            includedRefrigerantCount: dto.includedRefrigerantCount ?? 1,
            includedHoleCount: dto.includedHoleCount ?? 1,
            description: dto.description,
            isActive: dto.isActive ?? true,
            sortOrder: dto.sortOrder ?? 0,
        };
        await this.persist(() => (0, catalog_db_1.insertProductRow)(this.sb, row));
        this.products.unshift(row);
        return row;
    }
    async patchProduct(id, dto) {
        this.ensureCatalogWritable();
        const row = this.products.find((p) => p.id === id);
        if (!row)
            throw new common_1.NotFoundException('service product not found');
        Object.assign(row, dto);
        await this.persist(() => (0, catalog_db_1.replaceProductRow)(this.sb, row));
        return row;
    }
    async deactivateProduct(id) {
        this.ensureCatalogWritable();
        const row = this.products.find((p) => p.id === id);
        if (!row)
            throw new common_1.NotFoundException('service product not found');
        row.isActive = false;
        await this.persist(() => (0, catalog_db_1.replaceProductRow)(this.sb, row));
        return row;
    }
    async createAddon(dto) {
        this.ensureCatalogWritable();
        if (this.addons.some((a) => a.code === dto.code))
            throw new common_1.BadRequestException('addon code exists');
        const row = {
            id: (0, node_crypto_1.randomUUID)(),
            name: dto.name,
            code: dto.code,
            unit: dto.unit ?? 'each',
            customerPrice: dto.customerPrice ?? null,
            technicianCostAllowance: null,
            platformFeeRate: null,
            description: dto.description,
            isActive: true,
            sortOrder: 0,
        };
        await this.persist(() => (0, catalog_db_1.insertAddonRow)(this.sb, row));
        this.addons.unshift(row);
        return row;
    }
    async patchAddon(id, dto) {
        this.ensureCatalogWritable();
        const row = this.addons.find((a) => a.id === id);
        if (!row)
            throw new common_1.NotFoundException('service addon not found');
        Object.assign(row, dto);
        await this.persist(() => (0, catalog_db_1.replaceAddonRow)(this.sb, row));
        return row;
    }
    async deactivateAddon(id) {
        this.ensureCatalogWritable();
        const row = this.addons.find((a) => a.id === id);
        if (!row)
            throw new common_1.NotFoundException('service addon not found');
        row.isActive = false;
        await this.persist(() => (0, catalog_db_1.replaceAddonRow)(this.sb, row));
        return row;
    }
};
exports.ServiceCatalogService = ServiceCatalogService;
exports.ServiceCatalogService = ServiceCatalogService = ServiceCatalogService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_tokens_1.SUPABASE_ADMIN)),
    __metadata("design:paramtypes", [Object])
], ServiceCatalogService);
//# sourceMappingURL=service-catalog.service.js.map