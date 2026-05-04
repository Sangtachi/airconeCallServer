import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminRoleGuard, AdminRoles } from '../../common/admin-role.guard';
import { AdminAccessGuard } from '../admin/admin-access.guard';
import { PatchInstallOrderAdminDto } from './dto/patch-install-order-admin.dto';
import { OrdersService } from './orders.service';

@ApiTags('admin-customer-orders')
@ApiSecurity('admin-role')
@ApiHeader({ name: 'x-admin-role', required: false })
@UseGuards(AdminAccessGuard, AdminRoleGuard)
@Controller('admin/customer-orders')
export class CustomerOrdersAdminController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @AdminRoles('dispatch_admin', 'ops_admin', 'finance_admin')
  async list() {
    return this.orders.listOrders();
  }

  @Get(':id')
  @AdminRoles('dispatch_admin', 'ops_admin', 'finance_admin')
  async getOne(@Param('id') id: string) {
    return this.orders.getOrder(id);
  }

  @Patch(':id')
  @AdminRoles('dispatch_admin', 'ops_admin', 'finance_admin')
  async patch(@Param('id') id: string, @Body() dto: PatchInstallOrderAdminDto) {
    return this.orders.patchAdmin(id, dto);
  }
}
