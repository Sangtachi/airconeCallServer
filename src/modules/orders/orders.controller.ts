import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateOrderDraftDto } from './dto/create-order-draft.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  async createDraft(@Body() dto: CreateOrderDraftDto) {
    return this.orders.createDraft(dto);
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.orders.getOrder(id);
  }
}
