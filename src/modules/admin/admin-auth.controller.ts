import { Body, Controller, ForbiddenException, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAccessGuard } from './admin-access.guard';
import { AdminLoginDto } from './admin-auth.dto';
import { AdminAuthService } from './admin-auth.service';
import type { AuthenticatedRoleRequest } from './admin-access.guard';

@ApiTags('admin-auth')
@Controller()
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('admin/auth/login')
  @ApiOperation({
    summary: '관리자 부트스트랩 로그인(JWT)',
    description:
      'ADMIN_BOOTSTRAP_PASSWORD + ADMIN_JWT_SECRET(16자+) 설정 시 사용. 운영은 Supabase Auth 등으로 교체 권장.',
  })
  login(@Body() dto: AdminLoginDto) {
    if (!this.auth.bootstrapPassword()) {
      throw new ForbiddenException('ADMIN_BOOTSTRAP_PASSWORD 가 비어 있어 로그인을 비활성화했습니다.');
    }
    if (!this.auth.validateBootstrapPassword(dto.password)) {
      throw new ForbiddenException('비밀번호가 올바르지 않습니다.');
    }
    const role = dto.username === 'super_admin' ? 'super_admin' : 'admin';
    return this.auth.issueToken(role);
  }

  @Get('admin/auth/me')
  @UseGuards(AdminAccessGuard)
  @ApiOperation({ summary: '현재 관리자 컨텍스트(레거시 헤더 또는 JWT)' })
  me(@Req() req: AuthenticatedRoleRequest) {
    return {
      subject: req.adminSubject ?? null,
      role: req.adminRole ?? null,
    };
  }
}
