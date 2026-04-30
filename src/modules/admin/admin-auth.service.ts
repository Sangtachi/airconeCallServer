import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import * as jwt from 'jsonwebtoken';

export type AdminJwtPayload = {
  sub: string;
  role: 'admin' | 'super_admin';
  typ: 'admin_access';
  jti: string;
};

@Injectable()
export class AdminAuthService {
  issuanceSecret(): string | null {
    const s = process.env.ADMIN_JWT_SECRET?.trim();
    return s && s.length >= 16 ? s : null;
  }

  bootstrapPassword(): string | null {
    const p = process.env.ADMIN_BOOTSTRAP_PASSWORD;
    return p != null && String(p).length > 0 ? String(p) : null;
  }

  jwtTtlSeconds(): number {
    const raw = Number(process.env.ADMIN_JWT_TTL_SECONDS ?? '28800');
    return Number.isFinite(raw) && raw > 120 ? raw : 28800;
  }

  issueToken(role: 'admin' | 'super_admin' = 'super_admin'): { accessToken: string; expiresIn: number } {
    const secret = this.issuanceSecret();
    if (!secret) {
      throw new ServiceUnavailableException(
        'ADMIN_JWT_SECRET(16자 이상)이 설정되지 않아 토큰을 발급할 수 없습니다.',
      );
    }
    const sub = process.env.ADMIN_BOOTSTRAP_SUBJECT?.trim() || 'bootstrap-admin';
    const payload: AdminJwtPayload = {
      sub,
      role,
      typ: 'admin_access',
      jti: randomUUID(),
    };
    const expiresIn = this.jwtTtlSeconds();
    const accessToken = jwt.sign(payload, secret, {
      expiresIn,
      issuer: 'aircone-call-admin',
      audience: 'admin-ui',
      algorithm: 'HS256',
    });
    return { accessToken, expiresIn };
  }

  verifyBearerToken(rawAuth: string | undefined): AdminJwtPayload {
    const secret = this.issuanceSecret();
    if (!secret) throw new UnauthorizedException('ADMIN_JWT_SECRET not configured');
    if (!rawAuth?.toLowerCase().startsWith('bearer ')) throw new UnauthorizedException('Bearer 토큰 필요');
    const token = rawAuth.slice(7).trim();
    if (!token) throw new UnauthorizedException('Bearer 토큰 비어 있음');
    try {
      const decoded = jwt.verify(token, secret, {
        issuer: 'aircone-call-admin',
        audience: 'admin-ui',
        algorithms: ['HS256'],
      });
      const p = decoded as jwt.JwtPayload & Partial<AdminJwtPayload>;
      if (p.typ !== 'admin_access' || (p.role !== 'admin' && p.role !== 'super_admin')) {
        throw new UnauthorizedException('토큰이 관리 이슈 타입이 아닙니다.');
      }
      return {
        sub: String(p.sub),
        role: p.role as 'admin' | 'super_admin',
        typ: 'admin_access',
        jti: String(p.jti ?? ''),
      };
    } catch {
      throw new UnauthorizedException('토큰 검증 실패');
    }
  }

  validateBootstrapPassword(candidate: string): boolean {
    const expected = this.bootstrapPassword();
    if (!expected) return false;
    const a = Buffer.from(String(candidate), 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }
}
