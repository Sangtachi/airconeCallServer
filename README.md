# Living Bridge ACnow Management Server (Supabase 운영 기준)

Supabase를 운영 데이터 기준으로 사용하는 NestJS 백엔드 · 관리자·주문·기사·카탈로그 API.

**모노레포 전체 플로우·배포·CORS 체크리스트**: [`../doc/OPERATIONS.md`](../doc/OPERATIONS.md)

## 긴급 접수 자동 전환 (완료)

긴급 리드의 매칭 마감 시 서버가 멱등으로 Supabase `orders` 초안을 생성합니다. `bookings`는 호환 API로만 남고 신규 운영 상태의 기준은 `orders.order_status`와 `orders.payment_status`입니다.

- **핵심 동작**
  - 대상 상태: `pending`, `timed_out`, `contact_saved`
  - 마감 후 전환: `matching_status -> converted_to_order`
  - 리드 연결 필드: `converted_order_id`
  - 호환 필드: `converted_booking_id`에는 신규 전환 시 order id를 함께 기록
- **트리거**
  - `PATCH /api/emergency-leads/:id/timeout`
  - `PATCH /api/emergency-leads/:id/contact` 이후 마감 조건 충족 시
  - 주기 스윕(`EmergencyLeadsService` interval)
  - 관리자 `PATCH /api/admin/emergency-leads/:id`로 `converted_to_order` 지정 시 복구성 재시도
- **중복 방지(멱등)**
  - 같은 리드의 `timeout` 재호출에도 order를 중복 생성하지 않음

### 운영 주의사항

- **`EMERGENCY_DEFAULT_PRODUCT_ID`** 를 운영 설치 상품 UUID로 설정 권장
  - 누락/무효 시 첫 활성 설치 상품으로 폴백 + 경고 로그
- 핵심 운영 모듈은 Supabase 설정이 없으면 메모리 폴백하지 않습니다. 서버와 정적 페이지는 부팅되지만 운영 API는 503 설정 오류를 반환합니다.

## Run

```bash
npm install
cp .env.local.example .env.local   # Supabase URL/service role key 채우기
npm run supabase:check             # 로컬에서 Supabase 연결·주요 테이블 확인
npm run dev          # 기본 포트 :4000
npm run build && npm run start   # 프로덕션
npm run smoke-local http://127.0.0.1:4000   # 헬스 + admin/service-addons 점검
```

### URL

- REST base: **http://localhost:4000/api**
- 루트 **`/`** → 소개 랜딩 **`/index.html`** (302)
- 로그인/회원가입: **`/auth.html`** · 고객/기사/판매자만 공개 가입
- 관리자 SPA: **`/admin/index.html`** · 공개 첫 화면에는 노출하지 않음
- Swagger: 기본 비활성. 로컬에서만 필요할 때 `ENABLE_SWAGGER=true npm run dev` 후 `/api/docs`

### 헤더

- 관리 탭 요청마다 **`x-admin-role`** 임시 헤더 사용
  - 허용값: `dispatch_admin`, `ops_admin`, `finance_admin`, `super_admin`
  - 하위 호환: `admin` 전송 시 서버에서 `dispatch_admin`으로 취급
- 기사 포털: **`x-technician-id`** 임시 헤더 사용. 승인된 Supabase 기사 UUID만 유효합니다.

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

## 관리 인증(role-only)

이 서버는 이번 단계에서 관리자 인증을 `x-admin-role` 헤더 기반 role-only 모드로 임시 운영합니다.

1. 요청 헤더에 `x-admin-role`을 넣습니다.
2. `GET /api/admin/auth/me`로 현재 role 컨텍스트를 확인할 수 있습니다.
3. 엔드포인트별로 `dispatch_admin`, `ops_admin`, `finance_admin`, `super_admin` 권한이 분리되어 있습니다.

파트너 웹 배포·로그인 이슈: [`../doc/OPERATIONS.md`](../doc/OPERATIONS.md) §2–3.

운영 주의:

- role-only는 **개발/내부망 전용**으로 권장됩니다.
- `/auth.html`은 계정/비밀번호를 localStorage에 저장하지 않으며, 역할 선택 링크만 제공합니다.
- 외부 공개 환경에서는 리버스 프록시/IP 제한, 관리자 경로 접근 통제 등 네트워크 레이어 보완이 필요합니다.

### 관리 탭·역할·API 대조 (`public/admin/app.js`)

역할은 요청 헤더 `x-admin-role`와 동일. `super_admin`은 [`AdminRoleGuard`](src/common/admin-role.guard.ts)에서 모든 `@AdminRoles` 검사를 통과합니다.

| 관리자 SPA 탭 (`?tab=`) | 주요 API | dispatch (기사) | 비고 |
|-------------------------|----------|-----------------|------|
| `bookings` 주문/배차 | `GET/PATCH /api/admin/customer-orders`, 호환 `GET /api/admin/bookings` | 읽기만 | 신규 상태 기준은 `orders` |
| `emergency_leads` 긴급접수 | `GET`, `PATCH …/admin/emergency-leads/:id` | 목록만 읽기 | PATCH는 `ops_admin` |
| `settlements` 결제/정산 | `GET …/settlements`, `PATCH …/settlements/:id/status` 등 | 목록·이벤트 읽기 | 확정·상태 변경·삭제는 `finance_admin` |
| `onboarding` 기사등록/승인 | `…/technician-onboarding` | **탭 숨김** | API는 `ops_admin`만 — 랜딩에서 `?tab=onboarding`으로 들어와도 기사 세션에는 탭이 없음 |
| `members`, `technicians`(쓰기), `service_*`, `rewards` 등 | 각 `/api/admin/…` | 탭 숨김 또는 미표시 | `ops_admin` / `finance_admin` 위주 |

**백엔드에만 있고 관리 SPA에 탭이 없는 예:**

- `GET /api/admin/payments` — `dispatch_admin`·`finance_admin` 허용이나 UI는 결제 **목록 화면 없음**(정산 탭과 별개).
- `GET /api/admin/dashboard` — 대시보드 전용 페이지 없음.
- `GET /api/admin/logs` — `super_admin` 전용.
- `GET /api/admin/settlement-events` — 감사 로그; UI 미연결.
- `GET/POST …/api/admin/extra-quotes` — 추가금 견적; 관리 SPA에 **전용 탭 없음**(API만 제공).

**고객앱 `airconeCall` ↔ 공개 API (필드명 계약):**

- 긴급 접수: [`airconeCall/src/lib/api.ts`](../airconeCall/src/lib/api.ts) 본문 ↔ [`CreateEmergencyLeadDto`](src/modules/emergency-leads/dto/create-emergency-lead.dto.ts) (`clientSessionId`, `location`, `matchingTimeoutSeconds` 최소 5 등).
- 카탈로그: [`catalogApi.ts`](../airconeCall/src/lib/catalogApi.ts) `ServiceProductDto` ↔ `GET /api/service-products?serviceType=install` 응답.
- 기사 포털: [`technicianApi.ts`](../airconeCall/src/lib/technicianApi.ts) 경로 ↔ [`technician-portal.controller.ts`](src/modules/technicians/technician-portal.controller.ts).

### 작업사진 비공개 버킷

- DDL 6 적용 후 서버 **`ORDER_PHOTOS_SIGNED_URL_TTL_SEC`** 예: `900` — 목록 API 가 **Signed URL** 반환(DB `storage_bucket`/`storage_object_path` 저장).

---

## 모니터링

- **`GET /api/metrics`** — 프로세스 메모리·uptime(JSON). 각 응답에 **`x-request-id`** 헤더 포함.

---

## 자동 스크립트

- `npm run smoke-local` — 헬스·메트릭·관리 샘플(`ops_admin`)
- `npm run smoke-public` — 인증 없는 공개 API: 카탈로그 `GET` + 긴급 접수 `POST` 최소 페이로드(서버 기동 후 실행)
- role-only 테스트: `x-admin-role` 헤더 기반으로 `npm run test:e2e-base`
- 긴급 자동 전환 e2e 검증 포함:
  - `POST /api/emergency-leads -> PATCH /timeout -> admin customer-orders 확인 -> timeout 재호출 멱등 확인`

---

## 환경 변수

[`./.env.example`](./.env.example) 참고. 요약:

- **로컬 env 로딩 순서**: `.env.development.local` → `.env.local` → `.env.development` → `.env`. 쉘에 이미 export된 값이 있으면 파일 값보다 우선합니다.
- **긴급 접수 자동 전환**: `EMERGENCY_DEFAULT_PRODUCT_ID`(선택) — 매칭 마감 후 긴급 리드가 설치 주문 초안(order)으로 멱등 전환될 때 기본 설치 상품 UUID. 미설정·무효면 서버가 첫 활성 **설치** 상품으로 폴백하며 로그 경고합니다. DDL: `sql/emergency_service_leads.sql`, `sql/emergency_service_leads_converted_booking.sql`, `sql/supabase_operational_hardening.sql`.
- **CORS**: `CORS_ORIGIN` — 쉼표로 여러 출처
- **Supabase**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 두 값 모두 필수. 로컬도 `.env.local`에 운영/스테이징 Supabase 값을 넣으면 배포 없이 같은 DB 기준으로 확인할 수 있습니다. 미설정 시 서버 부팅은 가능하지만 운영 저장소 API는 503을 반환하고 메모리 폴백하지 않습니다.
- **작업사진 버킷**: `SUPABASE_STORAGE_ORDER_PHOTOS_BUCKET` (기본 `order-photos`)
- **Toss(추후 PG 연동)**: `TOSS_PAYMENTS_*` — 존재 여부만 노출 확인: **`GET /api/payments/config-status`**

관리 **`GET /api/admin/payments`**·**`GET /api/admin/settlements`** 목록은 각각 **`payments`**· **`order_settlements`** 테이블을 표시합니다.

---

## DDL 적용 순서

`sql/APPLY_ORDER.txt` 순서대로 Supabase(SQL) 또는 Postgres 에 실행합니다.
