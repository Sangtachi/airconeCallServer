import { Module } from '@nestjs/common';
import { AdminRoleGuard } from '../../common/admin-role.guard';
import { OrdersModule } from '../orders/orders.module';
import { ServiceCatalogModule } from '../service-catalog/service-catalog.module';
import { TechniciansModule } from '../technicians/technicians.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminController } from './admin.controller';
import { AuthPublicController, MemberPublicController, SellerPublicController } from './member-public.controller';
import { AdminService } from './admin.service';
import { SettlementAuditService } from './settlement-audit.service';

@Module({
  imports: [TechniciansModule, OrdersModule, ServiceCatalogModule],
  controllers: [AdminController, AdminAuthController, AuthPublicController, MemberPublicController, SellerPublicController],
  providers: [AdminService, SettlementAuditService, AdminRoleGuard],
  exports: [AdminService],
})
export class AdminModule {}
