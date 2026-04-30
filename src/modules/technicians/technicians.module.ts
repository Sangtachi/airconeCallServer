import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { OrdersModule } from '../orders/orders.module';
import { TechnicianApprovedGuard } from './technician-approved.guard';
import { TechnicianPortalController } from './technician-portal.controller';
import { TechnicianPublicController } from './technician-public.controller';
import { TechniciansService } from './technicians.service';

@Module({
  imports: [DatabaseModule, OrdersModule],
  controllers: [TechnicianPublicController, TechnicianPortalController],
  providers: [TechniciansService, TechnicianApprovedGuard],
  exports: [TechniciansService],
})
export class TechniciansModule {}
