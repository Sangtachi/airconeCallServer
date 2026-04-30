import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { AdminAccessGuard } from '../admin/admin-access.guard';
import { PatchInstallOrderAdminDto } from './dto/patch-install-order-admin.dto';
import { OrdersService } from './orders.service';

@ApiTags('admin-customer-orders')
@ApiBearerAuth()
@ApiHeader({ name: 'x-admin-role', required: false })
@UseGuards(AdminAccessGuard)
@Controller('admin/customer-orders')
export class CustomerOrdersAdminController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  async list() {
    return this.orders.listOrders();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.orders.getOrder(id);
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() dto: PatchInstallOrderAdminDto) {
    return this.orders.patchAdmin(id, dto);
  }
}
