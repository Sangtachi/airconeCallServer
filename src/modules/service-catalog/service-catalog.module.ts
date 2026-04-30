import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ServiceCatalogAdminAddonsController, ServiceCatalogAdminProductsController } from './service-catalog-admin.controller';
import { ServiceCatalogController } from './service-catalog.controller';
import { ServiceCatalogService } from './service-catalog.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    ServiceCatalogController,
    ServiceCatalogAdminProductsController,
    ServiceCatalogAdminAddonsController,
  ],
  providers: [ServiceCatalogService],
  exports: [ServiceCatalogService],
})
export class ServiceCatalogModule {}
