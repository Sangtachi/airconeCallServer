import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminRoleGuard, AdminRoles } from '../../common/admin-role.guard';
import { AdminAccessGuard } from '../admin/admin-access.guard';
import { ExtraQuotesService } from './extra-quotes.service';

@ApiTags('admin-extra-quotes')
@ApiSecurity('admin-role')
@ApiHeader({
  name: 'x-admin-role',
  required: false,
  description: 'role-only 모드: dispatch_admin | ops_admin | finance_admin | super_admin',
})
@UseGuards(AdminAccessGuard, AdminRoleGuard)
@Controller('admin/extra-quotes')
export class ExtraQuotesAdminController {
  constructor(private readonly quotes: ExtraQuotesService) {}

  @Get()
  @ApiOperation({ summary: '추가금 견적 목록(Supabase)' })
  @ApiQuery({ name: 'orderId', required: false })
  @AdminRoles('dispatch_admin', 'ops_admin', 'finance_admin')
  list(@Query('orderId') orderId?: string) {
    return this.quotes.adminListQuotes(orderId);
  }

  @Post(':quoteId/customer-approved')
  @ApiOperation({ summary: '고객 승인 처리(별도 문자/전화 검증 미포함 MVP)' })
  @AdminRoles('dispatch_admin', 'ops_admin', 'finance_admin')
  approve(@Param('quoteId') quoteId: string) {
    return this.quotes.adminCustomerApprove(quoteId);
  }

  @Post(':quoteId/reject')
  @AdminRoles('dispatch_admin', 'ops_admin', 'finance_admin')
  reject(@Param('quoteId') quoteId: string) {
    return this.quotes.adminReject(quoteId);
  }

  @Post(':quoteId/cancel')
  @AdminRoles('dispatch_admin', 'ops_admin', 'finance_admin')
  cancel(@Param('quoteId') quoteId: string) {
    return this.quotes.adminCancel(quoteId);
  }

  @Post(':quoteId/mock-record-payment')
  @ApiOperation({ summary: '모의 추가 결제 행 작성 + 견적 paid' })
  @AdminRoles('finance_admin')
  mockPay(@Param('quoteId') quoteId: string) {
    return this.quotes.adminMockPay(quoteId);
  }
}
