import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminAccessGuard } from '../admin/admin-access.guard';
import { ExtraQuotesService } from './extra-quotes.service';

@ApiTags('admin-extra-quotes')
@ApiBearerAuth()
@ApiHeader({ name: 'x-admin-role', required: false, description: '레거시(ADMIN_LEGACY_X_ADMIN_ROLE=1 일 때만)' })
@UseGuards(AdminAccessGuard)
@Controller('admin/extra-quotes')
export class ExtraQuotesAdminController {
  constructor(private readonly quotes: ExtraQuotesService) {}

  @Get()
  @ApiOperation({ summary: '추가금 견적 목록(Supabase 또는 메모리)' })
  @ApiQuery({ name: 'orderId', required: false })
  list(@Query('orderId') orderId?: string) {
    return this.quotes.adminListQuotes(orderId);
  }

  @Post(':quoteId/customer-approved')
  @ApiOperation({ summary: '고객 승인 처리(별도 문자/전화 검증 미포함 MVP)' })
  approve(@Param('quoteId') quoteId: string) {
    return this.quotes.adminCustomerApprove(quoteId);
  }

  @Post(':quoteId/reject')
  reject(@Param('quoteId') quoteId: string) {
    return this.quotes.adminReject(quoteId);
  }

  @Post(':quoteId/cancel')
  cancel(@Param('quoteId') quoteId: string) {
    return this.quotes.adminCancel(quoteId);
  }

  @Post(':quoteId/mock-record-payment')
  @ApiOperation({ summary: '모의 추가 결제 행 작성 + 견적 paid' })
  mockPay(@Param('quoteId') quoteId: string) {
    return this.quotes.adminMockPay(quoteId);
  }
}
