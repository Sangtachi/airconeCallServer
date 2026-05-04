import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export type AdminRole =
  | 'admin'
  | 'dispatch_admin'
  | 'ops_admin'
  | 'finance_admin'
  | 'super_admin';

export const ADMIN_ROLES_KEY = 'admin_roles';
export const AdminRoles = (...roles: AdminRole[]) => SetMetadata(ADMIN_ROLES_KEY, roles);

export type RoleAwareRequest = {
  adminRole?: AdminRole | null;
};

function normalizeRole(role: AdminRole | null | undefined): AdminRole | null {
  if (!role) return null;
  if (role === 'admin') return 'dispatch_admin';
  return role;
}

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<RoleAwareRequest>();
    const role = normalizeRole(req.adminRole ?? null);
    if (!role) {
      throw new ForbiddenException('관리자 role 정보가 없습니다.');
    }
    if (role === 'super_admin' || required.includes(role)) return true;
    throw new ForbiddenException(`권한 부족: required=${required.join(',')} current=${role}`);
  }
}
