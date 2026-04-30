# Aircone Call Server (Admin MVP)

Supabase 선택 연동 가능한 NestJS 백엔드 · 관리자·주문·기사 카탈로그 API.

## Run

```bash
npm install
npm run dev          # 기본 포트 :4000
npm run build && npm run start   # 프로덕션
npm run smoke-local http://127.0.0.1:4000   # 헬스 + admin/service-addons 점검
```

### URL

- REST base: **http://localhost:4000/api**
- 관리자 SPA(번들 내장): **http://localhost:4000/admin/index.html** (루트 `/` 는 여기로 리다이렉트)
- Swagger: http://localhost:4000/api/docs

### 헤더

- 관리 탭 요청마다 **`x-admin-role: admin`** 또는 **`super_admin`**
- 기사 포털: **`x-technician-id`**

---

## 로컬 404(`/api/admin/...`) 발생 시

0. **`EADDRINUSE :4000` 없이 다른 프로세스가 이미 `:4000`을 쓰는 경우**(재시작했는데 코드가 안 바뀌는 것처럼 보일 때) — 이전 빌드/다른 앱의 Nest 가 붙어 있어 **`Cannot GET /api/...`** 가 납니다. 해당 프로세스를 종료하고 `npm run build && npm run dev`(또는 `npm run start`)로 다시 띄우세요. macOS: `lsof -i :4000` 로 확인.
1. **항상 Nest 가 뜬 포트(기본 4000)로 호출되는지 확인**합니다. 브라우저가 `localhost:5173`(Vite)만 보고 있다면 Vite 에는 `/api/*` 라우트가 없어 **404** 가 납니다.
2. 고객앱 **`airconeCall`** 을 `npm run dev` 로 띄울 경우, `vite.config` 가 **`/api` → Nest** 로 프록시합니다.
   - 대상 출처는 **`VITE_DEV_API_PROXY_TARGET`** 또는 **`VITE_API_BASE_URL`의 호스트**(경로까지 넣었다면 자동으로 origin 만 사용)입니다.
   - 기본값: `http://127.0.0.1:4000`
3. **관리 HTML 을 다른 서버에서 열었다면** `public/admin/index.html` 상단처럼 `window.__ADMIN_API_BASE__='http://127.0.0.1:4000'` 을 설정해 같은 방식으로 API 호스트를 맞춥니다.
4. **`npm run build` 가 오래된 `dist/`** 라면 새로 빌드한 뒤 `npm run start` 하세요.
5. `GET /api/admin/service-addons` 는 **라우트가 존재**합니다. 헤더 없으면 **403**(가드), 라우트가 아예 다른 호스트면 **404** 입니다.

---

## 추가금 견적 플로우 (order_extra_quotes)

1. 기사: **`POST /api/technician/jobs/:orderId/extra-quotes`** (line items) → `requested`  
2. 관리: **`POST /api/admin/extra-quotes/:id/customer-approved`** → `approved` (고객 승인 MVP)  
3. 관리·모의결제: **`POST /api/admin/extra-quotes/:id/mock-record-payment`** → `payments` 행(`extra`) + 견적 `paid`  
4. DDL: `extras_materials_dispatch.sql` 에 테이블 포함.

## 정산 감사·멱등

- DDL: **`sql/settlement_audit_and_photo_paths.sql`** → `settlement_events` + `order_photos` 스토리지 경로 컬럼.  
- 상태 변경·confirm·soft-delete 시 **`idempotency-key`** 헤더를 같이 보내면 DB 감사 레코드 멱등 처리(중복 무시).  
- 목록: **`GET /api/admin/settlement-events?orderId=`**

## 관리 인증(JWT 부트스트랩)

1. **`ADMIN_JWT_SECRET`** (≥16 chars) 및 **`ADMIN_BOOTSTRAP_PASSWORD`** 설정.  
2. **`POST /api/admin/auth/login`** `{ "password":"..." }` → `accessToken`.  
3. 이후 **`Authorization: Bearer …`** 또는(기본) **`x-admin-role`** (`ADMIN_LEGACY_X_ADMIN_ROLE=false` 로 헤더만 끊기 가능).  
4. **`GET /api/admin/auth/me`** 로 현재 주체 확인.

### 작업사진 비공개 버킷

- DDL 6 적용 후 서버 **`ORDER_PHOTOS_SIGNED_URL_TTL_SEC`** 예: `900` — 목록 API 가 **Signed URL** 반환(DB `storage_bucket`/`storage_object_path` 저장).

---

## 모니터링

- **`GET /api/metrics`** — 프로세스 메모리·uptime(JSON). 각 응답에 **`x-request-id`** 헤더 포함.

---

## 자동 스크립트

- `npm run smoke-local`
- 로그인+JWT 테스트: **`ADMIN_BOOTSTRAP_PASSWORD`** / **`ADMIN_JWT_SECRET`** 설정 후 `npm run test:e2e-base`

---

## 환경 변수

[`./.env.example`](./.env.example) 참고. 요약:

- **긴급 접수 자동 전환**: `EMERGENCY_DEFAULT_PRODUCT_ID`(선택) — 매칭 마감 후 긴급 리드가 접수/배차(booking)·설치 주문 초안(order)으로 멱등 전환될 때 기본 설치 상품 UUID. 미설정·무효면 서버가 첫 활성 **설치** 상품으로 폴백하며 로그 경고합니다. DDL: `sql/emergency_service_leads.sql` 또는 `sql/emergency_service_leads_converted_booking.sql`.
- **CORS**: `CORS_ORIGIN` — 쉼표로 여러 출처
- **Supabase**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 두 값 모두 설정 시 주문·결제·정산 등 DB 경로 활성화
- **작업사진 버킷**: `SUPABASE_STORAGE_ORDER_PHOTOS_BUCKET` (기본 `order-photos`)
- **Toss(추후 PG 연동)**: `TOSS_PAYMENTS_*` — 존재 여부만 노출 확인: **`GET /api/payments/config-status`**

관리 **`GET /admin/payments`·`settlements`** 목록도 Supabase 가 켜지면 각각 **`payments`**· **`order_settlements`** 테이블을 우선 표시합니다(미설정 시 기존 메모리 목업).

---

## DDL 적용 순서

`sql/APPLY_ORDER.txt` 순서대로 Supabase(SQL) 또는 Postgres 에 실행합니다.
