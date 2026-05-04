import { Body, Controller, Delete, Get, Headers, Patch, Post, Query, UseGuards, Param } from '@nestjs/common';
import { ApiHeader, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminRoleGuard, AdminRoles } from '../../common/admin-role.guard';
import { AdminAccessGuard } from '../admin/admin-access.guard';
import { CreateServiceAddonDto, CreateServiceProductDto, PatchServiceAddonDto, PatchServiceProductDto } from './catalog-admin.dto';
import { ServiceCatalogService } from './service-catalog.service';

@ApiTags('admin-service-catalog')
@ApiSecurity('admin-role')
@ApiHeader({ name: 'x-admin-role', required: false })
@UseGuards(AdminAccessGuard, AdminRoleGuard)
@Controller('admin/service-products')
export class ServiceCatalogAdminProductsController {
  constructor(private readonly catalog: ServiceCatalogService) {}

  @Get()
  @ApiQuery({ name: 'includeInactive', required: false })
  @AdminRoles('ops_admin')
  list(@Query('includeInactive') includeInactive?: string) {
    return this.catalog.adminListProducts(includeInactive === '1' || includeInactive === 'true');
  }

  @Post()
  @AdminRoles('ops_admin')
  async create(@Body() dto: CreateServiceProductDto) {
    return this.catalog.createProduct(dto);
  }

  @Patch(':id')
  @AdminRoles('ops_admin')
  async patch(@Param('id') id: string, @Body() dto: PatchServiceProductDto) {
    return this.catalog.patchProduct(id, dto);
  }

  @Delete(':id')
  @AdminRoles('ops_admin')
  async remove(@Param('id') id: string) {
    return this.catalog.deactivateProduct(id);
  }
}

@ApiTags('admin-service-catalog')
@ApiSecurity('admin-role')
@ApiHeader({ name: 'x-admin-role', required: false })
@UseGuards(AdminAccessGuard, AdminRoleGuard)
@Controller('admin/service-addons')
export class ServiceCatalogAdminAddonsController {
  constructor(private readonly catalog: ServiceCatalogService) {}

  @Get()
  @ApiQuery({ name: 'includeInactive', required: false })
  @AdminRoles('ops_admin')
  list(@Query('includeInactive') includeInactive?: string) {
    return this.catalog.getAddons(includeInactive === '1' || includeInactive === 'true');
  }

  @Post()
  @AdminRoles('ops_admin')
  async create(@Body() dto: CreateServiceAddonDto) {
    return this.catalog.createAddon(dto);
  }

  @Patch(':id')
  @AdminRoles('ops_admin')
  async patch(@Param('id') id: string, @Body() dto: PatchServiceAddonDto) {
    return this.catalog.patchAddon(id, dto);
  }

  @Delete(':id')
  @AdminRoles('ops_admin')
  async remove(@Param('id') id: string) {
    return this.catalog.deactivateAddon(id);
  }
}
