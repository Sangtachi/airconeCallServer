# Aircone Call Server (Admin MVP)

Supabase 연동 전 단계에서 관리자 운영 API를 먼저 구축한 NestJS 서버입니다.

## Run

```bash
npm install
npm run dev
```

- Base URL: `http://localhost:4000/api`
- Swagger: `http://localhost:4000/api/docs`
- Required header: `x-admin-role: admin` (or `super_admin`)

## Implemented P0 endpoints

- `GET /api/admin/dashboard`
- `GET /api/admin/bookings`
- `GET /api/admin/bookings/:id`
- `POST /api/admin/bookings/:id/assign-technician`
- `PATCH /api/admin/bookings/:id/status`
- `GET /api/admin/technicians`
- `POST /api/admin/technicians`
- `PATCH /api/admin/technicians/:id`
- `GET /api/admin/payments`
- `POST /api/admin/payments/:id/cancel`
- `GET /api/admin/settlements`
- `POST /api/admin/settlements/:id/confirm`
- `GET /api/admin/coupons`
- `POST /api/admin/coupons`
- `GET /api/admin/logs`

## Hardening included

- 상태 전이 제한(`allowedTransitions`)
- 결제 취소 멱등성(`idempotency-key` 헤더)
- 정산 재계산(`commissionBase/platformFee/technicianAmount`)
- 관리자 감사 로그(`logs`)

## Supabase migration notes (later)

1. `admin.ports.ts` 인터페이스 유지
2. in-memory 로직을 `Supabase*Repository` 어댑터로 교체
3. `x-admin-role` 임시 가드를 Supabase Auth + `profiles.role` 검사로 대체
4. booking/payment/settlement/coupon 데이터를 실제 테이블로 매핑
