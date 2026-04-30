import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { AdminRole } from '../../common/admin-role.guard';
import { AdminAuthService } from './admin-auth.service';

export type AuthenticatedRoleRequest = Request & {
  adminRole?: AdminRole | null;
  adminSubject?: string | null;
};

/** Bearer JWT 또는(선택) 레거시 `x-admin-role`. `ADMIN_LEGACY_X_ADMIN_ROLE=false` 로 헤더만 끕니다. */
@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(private readonly auth: AdminAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRoleRequest>();
    const allowLegacyRaw = process.env.ADMIN_LEGACY_X_ADMIN_ROLE;
    const allowLegacy =
      allowLegacyRaw == null ||
      ['1', 'true', 'yes', 'on'].includes(String(allowLegacyRaw).trim().toLowerCase());

    const authHeader = String(req.headers['authorization'] ?? '');
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      const payload = this.auth.verifyBearerToken(authHeader);
      req.adminRole = payload.role;
      req.adminSubject = payload.sub;
      return true;
    }

    if (allowLegacy) {
      const role = req.headers['x-admin-role'];
      if (role === 'admin' || role === 'super_admin') {
        req.adminRole = role;
        req.adminSubject = 'legacy-header';
        return true;
      }
    }

    throw new UnauthorizedException('Authorization: Bearer <JWT> 또는 허용된 x-admin-role 이 필요합니다.');
  }
}
