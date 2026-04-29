import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

export type AdminRole = 'admin' | 'super_admin';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const role = req.headers['x-admin-role'];
    if (role === 'admin' || role === 'super_admin') return true;
    throw new ForbiddenException('admin role required via x-admin-role header');
  }
}
