import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { TechnicianEntity } from './technician.types';
import { TechniciansService } from './technicians.service';

export type TechnicianRequest = Request & { technician?: TechnicianEntity };

@Injectable()
export class TechnicianApprovedGuard implements CanActivate {
  constructor(private readonly technicians: TechniciansService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<TechnicianRequest>();
    const raw = req.headers['x-technician-id'];
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new UnauthorizedException('x-technician-id header required');
    }
    const row = this.technicians.getApprovedById(id.trim());
    if (!row) throw new ForbiddenException('not an approved technician');
    req.technician = row;
    return true;
  }
}
