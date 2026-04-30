import { Body, Controller, Delete, Get, Headers, Patch, Post, Query, UseGuards, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminAccessGuard } from '../admin/admin-access.guard';
import { CreateServiceAddonDto, CreateServiceProductDto, PatchServiceAddonDto, PatchServiceProductDto } from './catalog-admin.dto';
import { ServiceCatalogService } from './service-catalog.service';

@ApiTags('admin-service-catalog')
@ApiBearerAuth()
@ApiHeader({ name: 'x-admin-role', required: false })
@UseGuards(AdminAccessGuard)
@Controller('admin/service-products')
export class ServiceCatalogAdminProductsController {
  constructor(private readonly catalog: ServiceCatalogService) {}

  @Get()
  @ApiQuery({ name: 'includeInactive', required: false })
  list(@Query('includeInactive') includeInactive?: string) {
    return this.catalog.adminListProducts(includeInactive === '1' || includeInactive === 'true');
  }

  @Post()
  async create(@Body() dto: CreateServiceProductDto) {
    return this.catalog.createProduct(dto);
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() dto: PatchServiceProductDto) {
    return this.catalog.patchProduct(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.catalog.deactivateProduct(id);
  }
}

@ApiTags('admin-service-catalog')
@ApiBearerAuth()
@ApiHeader({ name: 'x-admin-role', required: false })
@UseGuards(AdminAccessGuard)
@Controller('admin/service-addons')
export class ServiceCatalogAdminAddonsController {
  constructor(private readonly catalog: ServiceCatalogService) {}

  @Get()
  @ApiQuery({ name: 'includeInactive', required: false })
  list(@Query('includeInactive') includeInactive?: string) {
    return this.catalog.getAddons(includeInactive === '1' || includeInactive === 'true');
  }

  @Post()
  async create(@Body() dto: CreateServiceAddonDto) {
    return this.catalog.createAddon(dto);
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() dto: PatchServiceAddonDto) {
    return this.catalog.patchAddon(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.catalog.deactivateAddon(id);
  }
}
