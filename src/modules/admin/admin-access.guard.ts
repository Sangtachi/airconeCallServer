import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { AdminRole } from '../../common/admin-role.guard';

export type AuthenticatedRoleRequest = Request & {
  adminRole?: AdminRole | null;
  adminSubject?: string | null;
};

/** role-only 모드: x-admin-role 헤더 기반(개발/내부망 전용). */
@Injectable()
export class AdminAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRoleRequest>();
    const role = String(req.headers['x-admin-role'] ?? '').trim();
    if (
      role === 'admin' ||
      role === 'dispatch_admin' ||
      role === 'ops_admin' ||
      role === 'finance_admin' ||
      role === 'super_admin'
    ) {
      req.adminRole = role as AdminRole;
      req.adminSubject = 'x-admin-role';
      return true;
    }
    throw new UnauthorizedException(
      'x-admin-role 헤더가 필요합니다. (allowed: dispatch_admin|ops_admin|finance_admin|super_admin)',
    );
  }
}
