import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ServiceCatalogService } from './service-catalog.service';

/** Public catalog read API — SUPABASE 설정 시 시작 시점에 DB에서 hydrate (명세 Phase 2). */

@ApiTags('service-catalog')
@Controller()
export class ServiceCatalogController {
  constructor(private readonly catalog: ServiceCatalogService) {}

  @Get('service-categories')
  listCategories() {
    return this.catalog.getCategories();
  }

  @Get('service-products')
  @ApiQuery({ name: 'serviceType', required: false })
  @ApiQuery({ name: 'airconType', required: false })
  @ApiQuery({ name: 'categoryCode', required: false })
  listProducts(
    @Query('serviceType') serviceType?: string,
    @Query('airconType') airconType?: string,
    @Query('categoryCode') categoryCode?: string,
  ) {
    return this.catalog.getProducts({
      serviceType: serviceType === 'install' || serviceType === 'cleaning' ? serviceType : undefined,
      airconType:
        airconType === 'wall' || airconType === 'stand' || airconType === 'two_in_one' || airconType === 'system'
          ? airconType
          : undefined,
      categoryCode: categoryCode || undefined,
    });
  }

  @Get('service-products/:id')
  getProduct(@Param('id') id: string) {
    return this.catalog.getProduct(id);
  }

  @Get('service-addons')
  listAddons() {
    return this.catalog.getAddons();
  }
}
