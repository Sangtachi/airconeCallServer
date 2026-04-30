import { Module } from '@nestjs/common';
import { TechniciansModule } from '../technicians/technicians.module';
import { AdminAuthController } from './admin-auth.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SettlementAuditService } from './settlement-audit.service';

@Module({
  imports: [TechniciansModule],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, SettlementAuditService],
  exports: [AdminService],
})
export class AdminModule {}
