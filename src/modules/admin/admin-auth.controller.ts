import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAccessGuard } from './admin-access.guard';
import type { AuthenticatedRoleRequest } from './admin-access.guard';

@ApiTags('admin-auth')
@Controller()
export class AdminAuthController {
  @Get('admin/auth/me')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: '현재 관리자 컨텍스트(role-only: x-admin-role)' })
  me(@Req() req: AuthenticatedRoleRequest) {
    return {
      subject: req.adminSubject ?? null,
      role: req.adminRole ?? null,
    };
  }
}
