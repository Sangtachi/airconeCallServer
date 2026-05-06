import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SUPABASE_ADMIN } from '../../database/database.tokens';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CreateServiceAddonDto, CreateServiceProductDto, PatchServiceAddonDto, PatchServiceProductDto } from './catalog-admin.dto';
import {
  insertAddonRow,
  insertProductRow,
  loadCatalogFromSupabase,
  replaceAddonRow,
  replaceProductRow,
  upsertFixtureSeed,
} from './catalog-db';
import { CATALOG_FIXTURE_ADDONS, CATALOG_FIXTURE_CATEGORIES, CATALOG_FIXTURE_PRODUCTS } from './catalog.fixture';
import type { CatalogAirconType, CatalogServiceType, ServiceAddonRow, ServiceCategoryRow, ServiceProductRow } from './service-catalog.types';

function cloneRows<T>(rows: T[]): T[] {
  return typeof structuredClone === 'function'
    ? structuredClone(rows)
    : (JSON.parse(JSON.stringify(rows)) as T[]);
}

@Injectable()
export class ServiceCatalogService implements OnModuleInit {
  private readonly logger = new Logger(ServiceCatalogService.name);

  /** Supabase 카탈로그 모드일 때 관리 변경을 DB로 반영 */
  private persistCatalog = false;

  private categories: ServiceCategoryRow[];
  private products: ServiceProductRow[];
  private addons: ServiceAddonRow[];

  constructor(@Inject(SUPABASE_ADMIN) private readonly sb: SupabaseClient | null) {
    this.categories = cloneRows(CATALOG_FIXTURE_CATEGORIES);
    this.products = cloneRows(CATALOG_FIXTURE_PRODUCTS);
    this.addons = cloneRows(CATALOG_FIXTURE_ADDONS);
  }

  async onModuleInit(): Promise<void> {
    if (!this.sb) {
      this.logger.warn(
        'Service catalog: Supabase 미설정 — 공개 카탈로그는 fixture로 표시하고, 운영 쓰기 API는 503을 반환합니다.',
      );
      return;
    }
    try {
      let { categories, products, addons } = await loadCatalogFromSupabase(this.sb);

      if (products.length === 0) {
        this.logger.warn('service_products 비어 있음 — fixture 로 DB 시드 후 재로드');
        await upsertFixtureSeed(this.sb, {
          categories: cloneRows(CATALOG_FIXTURE_CATEGORIES),
          products: cloneRows(CATALOG_FIXTURE_PRODUCTS),
          addons: cloneRows(CATALOG_FIXTURE_ADDONS),
        });
        ({ categories, products, addons } = await loadCatalogFromSupabase(this.sb));
      }

      this.categories = categories;
      this.products = products;
      this.addons = addons;
      this.persistCatalog = true;
      this.logger.log(
        `Service catalog: Supabase 로드 ${categories.length} 카테고리 / ${products.length} 상품 / ${addons.length} 추가항목`,
      );
    } catch (e) {
      this.logger.error(
        `Service catalog DB 로드 실패 — ${e instanceof Error ? e.message : String(e)}`,
      );
      throw e;
    }
  }

  private async persist(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (e) {
      throw new BadRequestException(e instanceof Error ? e.message : String(e));
    }
  }

  private ensureCatalogWritable(): void {
    if (!this.sb || !this.persistCatalog) {
      throw new ServiceUnavailableException(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for catalog write APIs',
      );
    }
  }

  getCategories(includeInactive = false): ServiceCategoryRow[] {
    let rows = [...this.categories];
    if (!includeInactive) rows = rows.filter((c) => c.isActive);
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  adminListProducts(includeInactive: boolean): ServiceProductRow[] {
    let rows = [...this.products];
    if (!includeInactive) rows = rows.filter((p) => p.isActive);
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getProducts(
    query?: {
      serviceType?: CatalogServiceType;
      airconType?: CatalogAirconType;
      categoryCode?: string;
    },
    _includeInactive = false,
  ): ServiceProductRow[] {
    let rows = [...this.products].filter((p) => p.isActive);
    if (query?.serviceType) rows = rows.filter((p) => p.serviceType === query.serviceType);
    if (query?.airconType) rows = rows.filter((p) => p.airconType === query.airconType);
    if (query?.categoryCode) {
      const cat = this.categories.find((c) => c.code === query.categoryCode);
      if (cat) rows = rows.filter((p) => p.categoryId === cat.id);
    }
    return rows.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getProduct(id: string): ServiceProductRow {
    const row = this.products.find((p) => p.id === id);
    if (!row || !row.isActive) throw new NotFoundException('service product not found');
    return row;
  }

  resolveProductPrice(id: string, scheduleType: 'same_day' | 'reservation'): ServiceProductRow {
    const row = this.products.find((p) => p.id === id);
    if (!row || !row.isActive) throw new NotFoundException('service product not found');
    return row;
  }

  /**
   * 긴급 리드 자동 주문 초안용: EMERGENCY_DEFAULT_PRODUCT_ID 검증 후, 없거나 무효면 활성 설치 상품 첫 건 폴백.
   */
  resolveDefaultEmergencyProductId(): string {
    const raw = process.env.EMERGENCY_DEFAULT_PRODUCT_ID?.trim();
    if (raw) {
      const row = this.products.find((p) => p.id === raw && p.isActive);
      if (row) return row.id;
      this.logger.warn(
        `EMERGENCY_DEFAULT_PRODUCT_ID="${raw}" not found or inactive — using first active install product`,
      );
    }
    const install = this.getProducts({ serviceType: 'install' });
    if (install.length === 0) throw new BadRequestException('No active install product for emergency order draft');
    return install[0].id;
  }

  getAddons(includeInactive = false): ServiceAddonRow[] {
    let rows = [...this.addons];
    if (!includeInactive) rows = rows.filter((a) => a.isActive);
    return rows.sort((x, y) => x.sortOrder - y.sortOrder);
  }

  getAddon(id: string): ServiceAddonRow {
    const row = this.addons.find((a) => a.id === id);
    if (!row) throw new NotFoundException('service addon not found');
    return row;
  }

  async createProduct(dto: CreateServiceProductDto): Promise<ServiceProductRow> {
    this.ensureCatalogWritable();
    const cat = this.categories.find((c) => c.id === dto.categoryId);
    if (!cat) throw new BadRequestException('category not found');
    if (this.products.some((p) => p.code === dto.code)) throw new BadRequestException('product code exists');
    const row: ServiceProductRow = {
      id: randomUUID(),
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
    await this.persist(() => insertProductRow(this.sb!, row));
    this.products.unshift(row);
    return row;
  }

  async patchProduct(id: string, dto: PatchServiceProductDto): Promise<ServiceProductRow> {
    this.ensureCatalogWritable();
    const row = this.products.find((p) => p.id === id);
    if (!row) throw new NotFoundException('service product not found');
    Object.assign(row, dto);
    await this.persist(() => replaceProductRow(this.sb!, row));
    return row;
  }

  async deactivateProduct(id: string): Promise<ServiceProductRow> {
    this.ensureCatalogWritable();
    const row = this.products.find((p) => p.id === id);
    if (!row) throw new NotFoundException('service product not found');
    row.isActive = false;
    await this.persist(() => replaceProductRow(this.sb!, row));
    return row;
  }

  async createAddon(dto: CreateServiceAddonDto): Promise<ServiceAddonRow> {
    this.ensureCatalogWritable();
    if (this.addons.some((a) => a.code === dto.code)) throw new BadRequestException('addon code exists');
    const row: ServiceAddonRow = {
      id: randomUUID(),
      name: dto.name,
      code: dto.code,
      unit: dto.unit ?? 'each',
      customerPrice: dto.customerPrice,
      technicianCostAllowance: dto.technicianCostAllowance ?? null,
      platformFeeRate: dto.platformFeeRate ?? null,
      description: dto.description,
      isActive: true,
      sortOrder: 0,
    };
    await this.persist(() => insertAddonRow(this.sb!, row));
    this.addons.unshift(row);
    return row;
  }

  async patchAddon(id: string, dto: PatchServiceAddonDto): Promise<ServiceAddonRow> {
    this.ensureCatalogWritable();
    const row = this.addons.find((a) => a.id === id);
    if (!row) throw new NotFoundException('service addon not found');
    Object.assign(row, dto);
    await this.persist(() => replaceAddonRow(this.sb!, row));
    return row;
  }

  async deactivateAddon(id: string): Promise<ServiceAddonRow> {
    this.ensureCatalogWritable();
    const row = this.addons.find((a) => a.id === id);
    if (!row) throw new NotFoundException('service addon not found');
    row.isActive = false;
    await this.persist(() => replaceAddonRow(this.sb!, row));
    return row;
  }
}
