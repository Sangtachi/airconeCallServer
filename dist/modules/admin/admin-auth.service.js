"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthService = void 0;
const common_1 = require("@nestjs/common");
const node_crypto_1 = require("node:crypto");
const jwt = __importStar(require("jsonwebtoken"));
let AdminAuthService = class AdminAuthService {
    issuanceSecret() {
        const s = process.env.ADMIN_JWT_SECRET?.trim();
        return s && s.length >= 16 ? s : null;
    }
    bootstrapPassword() {
        const p = process.env.ADMIN_BOOTSTRAP_PASSWORD;
        return p != null && String(p).length > 0 ? String(p) : null;
    }
    jwtTtlSeconds() {
        const raw = Number(process.env.ADMIN_JWT_TTL_SECONDS ?? '28800');
        return Number.isFinite(raw) && raw > 120 ? raw : 28800;
    }
    issueToken(role = 'super_admin') {
        const secret = this.issuanceSecret();
        if (!secret) {
            throw new common_1.ServiceUnavailableException('ADMIN_JWT_SECRET(16자 이상)이 설정되지 않아 토큰을 발급할 수 없습니다.');
        }
        const sub = process.env.ADMIN_BOOTSTRAP_SUBJECT?.trim() || 'bootstrap-admin';
        const payload = {
            sub,
            role,
            typ: 'admin_access',
            jti: (0, node_crypto_1.randomUUID)(),
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
    verifyBearerToken(rawAuth) {
        const secret = this.issuanceSecret();
        if (!secret)
            throw new common_1.UnauthorizedException('ADMIN_JWT_SECRET not configured');
        if (!rawAuth?.toLowerCase().startsWith('bearer '))
            throw new common_1.UnauthorizedException('Bearer 토큰 필요');
        const token = rawAuth.slice(7).trim();
        if (!token)
            throw new common_1.UnauthorizedException('Bearer 토큰 비어 있음');
        try {
            const decoded = jwt.verify(token, secret, {
                issuer: 'aircone-call-admin',
                audience: 'admin-ui',
                algorithms: ['HS256'],
            });
            const p = decoded;
            if (p.typ !== 'admin_access' ||
                !['admin', 'dispatch_admin', 'ops_admin', 'finance_admin', 'super_admin'].includes(String(p.role ?? ''))) {
                throw new common_1.UnauthorizedException('토큰이 관리 이슈 타입이 아닙니다.');
            }
            return {
                sub: String(p.sub),
                role: p.role,
                typ: 'admin_access',
                jti: String(p.jti ?? ''),
            };
        }
        catch {
            throw new common_1.UnauthorizedException('토큰 검증 실패');
        }
    }
    validateBootstrapPassword(candidate) {
        const expected = this.bootstrapPassword();
        if (!expected)
            return false;
        const a = Buffer.from(String(candidate), 'utf8');
        const b = Buffer.from(expected, 'utf8');
        if (a.length !== b.length)
            return false;
        return (0, node_crypto_1.timingSafeEqual)(a, b);
    }
};
exports.AdminAuthService = AdminAuthService;
exports.AdminAuthService = AdminAuthService = __decorate([
    (0, common_1.Injectable)()
], AdminAuthService);
//# sourceMappingURL=admin-auth.service.js.map