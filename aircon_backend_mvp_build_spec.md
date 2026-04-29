# 에어컨콜 백엔드 MVP 구현 명세서 v0.1

> 목적: 현재 배포된 프론트 서비스에 붙일 **백엔드 서버 / DB / 관리자 페이지 / 결제·정산 시스템**의 1차 구현 범위를 정의한다.  
> 핵심 목표는 자동매칭이 아니라, **접수 → 기사 배정 → 결제 → 작업완료 → 정산**이 운영 가능한 상태를 만드는 것이다.

---

## 0. 가장 중요한 전제: DB에 쌓인 데이터는 자동으로 화면에 보이지 않는다

맞다. **DB에 데이터가 저장되는 것과 화면에서 보이는 것은 별개**다.

DB는 데이터를 저장하는 창고이고, 화면은 그 데이터를 꺼내 보여주는 UI다. 따라서 아래 3개가 모두 있어야 한다.

```text
1. DB 테이블
   - 접수, 유저, 기사, 결제, 정산 데이터 저장

2. API 또는 서버 액션
   - DB에서 데이터를 조회/생성/수정
   - 예: /api/admin/bookings, /api/admin/technicians

3. 화면 UI
   - API로 가져온 데이터를 리스트/상세/버튼으로 표시
   - 예: /admin/bookings, /admin/bookings/[id]
```

### 운영 단계별 데이터 확인 방식

| 단계 | 데이터 확인 방식 | 설명 |
|---|---|---|
| 개발 직후 | Supabase Table Editor | DB에 잘 쌓이는지만 확인 가능 |
| MVP 운영 | `/admin` 관리자 화면 | 접수/기사/결제/정산을 서비스 내부에서 관리 |
| 고객 화면 | 내 접수내역 화면이 있을 때만 | 고객은 본인 데이터만 볼 수 있어야 함 |
| 기사 화면 | 기사 전용 링크/기사페이지가 있을 때만 | 기사는 배정된 건만 볼 수 있어야 함 |

즉, 백엔드 1차 목표는 단순히 DB를 만드는 것이 아니라 **관리자가 DB 데이터를 실제로 보고 조작할 수 있는 백오피스까지 만드는 것**이다.

---

## 1. MVP 백엔드의 한 줄 정의

> 고객이 에어컨 수리 접수를 하고 출장비를 결제하면, 관리자가 기사 DB에서 기사를 수동 배정하고, 작업 완료 후 기사 정산금이 자동 계산되는 운영 백엔드.

### 1차 목표

```text
접수 가능
결제 가능
기사 등록 가능
관리자 화면에서 접수 확인 가능
기사 수동 배정 가능
상태 변경 가능
정산금 계산 가능
```

### 1차에서 하지 않을 것

```text
완전 자동매칭
기사앱 정식 개발
실시간 위치추적
자동 지급대행
AI 가격추천
전국 서비스
포인트몰/복잡한 리워드 시스템
```

---

## 2. 추천 시스템 구조

현재 프론트가 Vercel에 배포되어 있으므로, MVP는 아래 구조가 가장 현실적이다.

```text
Vercel / Next.js App
├─ 고객 페이지
├─ 접수 페이지
├─ 관리자 페이지 /admin
└─ API Routes 또는 Server Actions

Supabase
├─ Auth
├─ PostgreSQL
├─ Storage
└─ RLS Policies

PG 결제
├─ Toss Payments 또는 PortOne
└─ Webhook

알림
├─ 초기: 관리자 수동 전화/문자/카톡
└─ 2차: 알림톡/SMS API 자동화
```

### 추천 기술 스택

| 영역 | 추천 |
|---|---|
| 프론트/서버 | Next.js on Vercel |
| DB | Supabase PostgreSQL |
| 인증 | Supabase Auth, 전화번호 OTP 또는 임시 전화번호 인증 |
| 파일 저장 | Supabase Storage |
| 결제 | Toss Payments 또는 PortOne |
| 관리자 화면 | 기존 프로젝트에 `/admin` 라우트 추가 |
| 정산 | MVP에서는 수동 송금 + 정산 장부 |
| 기사 알림 | 초기 수동 연락, 이후 기사 수락 링크 |

---

## 3. 핵심 도메인

| 도메인 | 설명 |
|---|---|
| 유저 | 고객 회원, 주소, 에어컨 정보, 쿠폰 |
| 기사 | 기사 등록, 검증, 기술태그, 활동지역, 정산정보 |
| 접수 | 고객의 에어컨 수리 요청 |
| 배차 | 접수 건에 기사 배정, 상태 변경 |
| 결제 | 출장비/예약금/추가금/최종금액/환불 |
| 정산 | 기사 지급금, 플랫폼 수수료, 지급상태 |
| 관리자 | 접수/기사/결제/정산/클레임 운영 |
| 리워드 | 가입쿠폰, 에어컨등록 쿠폰, 추천쿠폰 |

---

## 4. 권한 구조

```text
customer      고객
technician    기사
admin         운영자
super_admin   최고관리자
```

| 권한 | 가능 작업 |
|---|---|
| customer | 본인 접수 생성, 본인 접수 조회, 본인 결제 |
| technician | 본인에게 배정된 접수 확인, 상태 변경 일부 |
| admin | 접수/기사/결제/정산 관리 |
| super_admin | 관리자 권한, 수수료율, 환불 승인, 시스템 설정 |

### 보안 원칙

```text
고객은 다른 고객의 접수를 볼 수 없어야 한다.
기사는 자기에게 배정된 건만 볼 수 있어야 한다.
결제금액/환불/정산 변경은 관리자 권한이 필요하다.
PG Secret Key는 서버에서만 사용한다.
관리자 API는 반드시 권한 체크를 한다.
모든 상태 변경은 이벤트 로그를 남긴다.
```

---

## 5. 접수 상태값

접수는 `bookings.status` 하나로 운영 흐름을 관리한다.

```text
created                 접수 생성
payment_pending         결제 대기
paid                    출장비/예약금 결제 완료
matching                기사 배정 중
assigned                기사 배정 완료
accepted                기사 수락
on_the_way              기사 출발
arrived                 현장 도착
diagnosed               진단 완료
extra_payment_pending   추가금 승인/결제 대기
working                 작업 중
completed               작업 완료
cancelled               취소
refunded                환불
settlement_pending      정산 대기
settled                 정산 완료
```

### 기본 상태 흐름

```text
created
→ payment_pending
→ paid
→ matching
→ assigned
→ accepted
→ on_the_way
→ arrived
→ diagnosed
→ working
→ completed
→ settlement_pending
→ settled
```

### 취소/환불 흐름

```text
created/payment_pending → cancelled
paid/matching/assigned  → cancelled 또는 refunded
on_the_way 이후         → 취소수수료 가능
completed 이후          → 환불 또는 재방문 클레임 처리
```

---

## 6. DB 설계 초안

> Supabase Auth를 쓴다는 전제로 `auth.users`는 로그인 원본으로 두고, 서비스용 유저 데이터는 `public.profiles`에 저장한다.

---

### 6.1 profiles

고객/기사/관리자 공통 프로필.

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  phone varchar unique,
  name varchar,
  email varchar,
  role varchar not null default 'customer', -- customer, technician, admin, super_admin
  marketing_consent boolean not null default false,
  status varchar not null default 'active', -- active, inactive, banned
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

### 6.2 user_addresses

고객 주소.

```sql
create table public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  address text not null,
  detail_address text,
  sido varchar,
  sigungu varchar,
  dong varchar,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

### 6.3 aircon_assets

고객이 등록한 에어컨 정보.

```sql
create table public.aircon_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  address_id uuid references public.user_addresses(id) on delete set null,
  type varchar not null, -- wall, stand, two_in_one, system, unknown
  brand varchar, -- samsung, lg, carrier, winia, etc
  model_name varchar,
  installed_year int,
  indoor_photo_url text,
  outdoor_photo_url text,
  remote_photo_url text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

### 6.4 technicians

기사 기본 정보.

```sql
create table public.technicians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name varchar not null,
  phone varchar unique not null,
  business_type varchar not null default 'individual', -- individual, sole_business, company
  business_number varchar,
  career_years int,
  status varchar not null default 'pending', -- pending, reviewing, approved, rejected, suspended, inactive
  work_status varchar not null default 'offline', -- offline, available, busy, reserved_only
  base_region varchar,
  profile_photo_url text,
  bank_name varchar,
  bank_account varchar,
  bank_holder varchar,
  platform_fee_rate numeric(5,2) not null default 20.00,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

### 6.5 technician_documents

기사 검증 서류.

```sql
create table public.technician_documents (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  document_type varchar not null, -- id_card, business_license, career, insurance, etc
  file_url text not null,
  status varchar not null default 'pending', -- pending, approved, rejected
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now()
);
```

---

### 6.6 technician_skills

기사 기술 태그.

```sql
create table public.technician_skills (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  skill_code varchar not null, -- wall, stand, two_in_one, system, refrigerant, leak, pipe, cleaning
  level int not null default 1,
  created_at timestamptz not null default now(),
  unique (technician_id, skill_code)
);
```

---

### 6.7 technician_service_areas

기사 활동 지역.

```sql
create table public.technician_service_areas (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.technicians(id) on delete cascade,
  sido varchar,
  sigungu varchar,
  dong varchar,
  radius_km int,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
```

---

### 6.8 bookings

고객 접수의 중심 테이블.

```sql
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_no varchar unique not null,
  user_id uuid not null references public.profiles(id) on delete restrict,
  address_id uuid references public.user_addresses(id) on delete set null,
  aircon_asset_id uuid references public.aircon_assets(id) on delete set null,
  symptom_code varchar not null, -- no_cold_air, water_leak, smell, power_issue, outdoor_unit, refrigerant, etc
  symptom_detail text,
  desired_time timestamptz,
  urgency varchar not null default 'scheduled', -- now, within_1h, tonight, tomorrow, scheduled
  status varchar not null default 'created',
  estimated_price_min int,
  estimated_price_max int,
  assigned_technician_id uuid references public.technicians(id) on delete set null,
  coupon_id uuid,
  deposit_amount int not null default 0,
  extra_amount int not null default 0,
  final_price int,
  customer_memo text,
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

### 6.9 booking_photos

고객 접수 사진.

```sql
create table public.booking_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  photo_type varchar not null, -- indoor, outdoor, error_code, remote, etc
  file_url text not null,
  created_at timestamptz not null default now()
);
```

---

### 6.10 booking_status_events

접수 상태 변경 이력. 분쟁/CS 때문에 반드시 필요하다.

```sql
create table public.booking_status_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  from_status varchar,
  to_status varchar not null,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
```

---

### 6.11 payments

고객 결제 정보.

```sql
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  payment_type varchar not null, -- deposit, final, extra, cancellation_fee
  provider varchar not null, -- toss, portone, manual
  order_id varchar unique not null,
  payment_key varchar,
  amount int not null,
  status varchar not null default 'ready', -- ready, paid, failed, cancelled, partial_cancelled
  paid_at timestamptz,
  cancelled_at timestamptz,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

### 6.12 payment_events

PG 웹훅/응답 로그.

```sql
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete set null,
  provider varchar not null,
  event_type varchar not null,
  payload jsonb not null,
  received_at timestamptz not null default now()
);
```

---

### 6.13 settlements

기사 정산 장부.

```sql
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  technician_id uuid not null references public.technicians(id) on delete restrict,
  gross_amount int not null default 0,        -- 고객 최종 결제금액
  parts_amount int not null default 0,        -- 부품비
  commission_base int not null default 0,     -- 수수료 대상 금액
  platform_fee int not null default 0,        -- 플랫폼 수수료
  technician_amount int not null default 0,   -- 기사 정산금
  adjustment_amount int not null default 0,   -- 보정금액
  status varchar not null default 'pending',  -- pending, confirmed, paid, held, cancelled
  payout_method varchar not null default 'manual_bank_transfer',
  confirmed_by uuid references public.profiles(id) on delete set null,
  confirmed_at timestamptz,
  paid_at timestamptz,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

### 6.14 coupons

가입/에어컨등록/추천 쿠폰.

```sql
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  coupon_type varchar not null, -- signup, aircon_register, referral, technician_referral, manual
  amount int not null,
  min_order_amount int not null default 0,
  status varchar not null default 'active', -- active, used, expired, cancelled
  expires_at timestamptz,
  used_booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);
```

---

### 6.15 refunds

환불 기록.

```sql
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  amount int not null,
  reason text,
  status varchar not null default 'requested', -- requested, approved, completed, failed, rejected
  provider_refund_id varchar,
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
```

---

### 6.16 admin_logs

관리자 작업 로그.

```sql
create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action varchar not null,
  target_table varchar,
  target_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
```

---

## 7. Storage 버킷 설계

| 버킷 | 용도 | 접근 |
|---|---|---|
| `booking-photos` | 고객 접수 사진 | 본인/관리자만 |
| `aircon-assets` | 에어컨 등록 사진 | 본인/관리자만 |
| `technician-documents` | 기사 신분증/사업자/보험 | 관리자만 |
| `technician-profiles` | 기사 프로필 사진 | 관리자/고객 일부 공개 가능 |

### 파일 저장 원칙

```text
신분증/사업자등록증 같은 민감 파일은 public bucket에 두지 않는다.
사진 URL을 DB에 저장하되, 접근권한은 Storage 정책으로 제어한다.
관리자 화면에서는 signed URL 또는 서버 프록시로 보여준다.
```

---

## 8. API 설계

### 8.1 고객 API

```text
POST /api/auth/otp/send
POST /api/auth/otp/verify

GET  /api/me
PATCH /api/me

POST /api/addresses
GET  /api/addresses
PATCH /api/addresses/:id

POST /api/aircons
GET  /api/aircons
PATCH /api/aircons/:id

POST /api/bookings
GET  /api/bookings
GET  /api/bookings/:id
POST /api/bookings/:id/photos
POST /api/bookings/:id/cancel

POST /api/payments/prepare
POST /api/payments/confirm
POST /api/payments/webhook

GET  /api/coupons
```

---

### 8.2 기사 API

MVP 1차에서는 기사앱 없이 운영 가능하다. 단, 2차를 위해 API 구조는 미리 열어둔다.

```text
POST /api/technicians/apply
GET  /api/technician/me
PATCH /api/technician/me

GET  /api/technician/bookings
GET  /api/technician/bookings/:id
POST /api/technician/bookings/:id/accept
POST /api/technician/bookings/:id/reject
POST /api/technician/bookings/:id/on-the-way
POST /api/technician/bookings/:id/arrived
POST /api/technician/bookings/:id/complete
```

### 기사앱 없이 가능한 대체 흐름

```text
관리자가 기사에게 전화/카톡
→ 기사가 수락
→ 관리자가 /admin에서 상태 변경
→ 고객에게 문자/전화 안내
```

---

### 8.3 관리자 API

```text
GET  /api/admin/dashboard

GET  /api/admin/users
GET  /api/admin/users/:id

GET  /api/admin/technicians
POST /api/admin/technicians
GET  /api/admin/technicians/:id
PATCH /api/admin/technicians/:id
POST /api/admin/technicians/:id/approve
POST /api/admin/technicians/:id/reject
POST /api/admin/technicians/:id/suspend

GET  /api/admin/bookings
GET  /api/admin/bookings/:id
PATCH /api/admin/bookings/:id/status
POST /api/admin/bookings/:id/assign-technician
POST /api/admin/bookings/:id/unassign-technician
POST /api/admin/bookings/:id/request-extra-payment
POST /api/admin/bookings/:id/complete

GET  /api/admin/payments
GET  /api/admin/payments/:id
POST /api/admin/payments/:id/cancel

GET  /api/admin/refunds
POST /api/admin/refunds/:id/approve
POST /api/admin/refunds/:id/reject

GET  /api/admin/settlements
GET  /api/admin/settlements/:id
POST /api/admin/settlements/:id/confirm
POST /api/admin/settlements/:id/mark-paid
POST /api/admin/settlements/:id/hold

GET  /api/admin/coupons
POST /api/admin/coupons
PATCH /api/admin/coupons/:id
```

---

## 9. 관리자 화면 설계

DB 데이터가 실제 운영 화면에 보이려면 아래 `/admin` 화면들이 필요하다.

---

### 9.1 `/admin/dashboard`

운영 현황 요약.

| 카드 | 내용 |
|---|---|
| 오늘 접수 | 오늘 생성된 booking 수 |
| 매칭중 | status = matching |
| 출동중 | assigned/accepted/on_the_way/arrived |
| 완료 | completed |
| 결제금액 | 오늘 paid payments 합계 |
| 정산대기 | settlements.status = pending |

---

### 9.2 `/admin/bookings`

접수 리스트. 가장 먼저 만들어야 하는 화면.

| 컬럼 | 내용 |
|---|---|
| 접수번호 | booking_no |
| 접수시간 | created_at |
| 고객명/전화 | profiles.name, profiles.phone |
| 지역 | 주소 sigungu/dong |
| 증상 | symptom_code |
| 희망시간 | desired_time |
| 상태 | status |
| 배정기사 | assigned_technician_id |
| 결제상태 | payments.status |
| 상세보기 | 버튼 |

### 필터

```text
상태별
날짜별
지역별
증상별
기사별
결제상태별
```

---

### 9.3 `/admin/bookings/[id]`

접수 상세.

보여줄 정보:

```text
고객 정보
주소
에어컨 정보
증상 상세
사진
예상금액
결제내역
쿠폰사용
배정기사
상태 변경 이력
관리자 메모
환불/클레임 메모
```

가능한 버튼:

```text
기사 배정
상태 변경
결제 확인
추가금 요청
작업 완료 처리
취소 처리
환불 요청
정산 생성
관리자 메모 저장
```

---

### 9.4 `/admin/technicians`

기사 리스트.

| 컬럼 | 내용 |
|---|---|
| 이름 | name |
| 전화번호 | phone |
| 상태 | status |
| 근무상태 | work_status |
| 활동지역 | technician_service_areas |
| 기술태그 | technician_skills |
| 완료건수 | completed bookings count |
| 클레임 | 추후 |
| 상세보기 | 버튼 |

---

### 9.5 `/admin/technicians/[id]`

기사 상세.

보여줄 정보:

```text
기본정보
사업자 여부
활동지역
기술태그
가능시간
검증서류
정산계좌
수수료율
완료 건수
배정 이력
관리자 메모
```

가능한 버튼:

```text
승인
반려
정지
비활성화
기술태그 추가/삭제
활동지역 추가/삭제
계좌 수정
메모 저장
```

---

### 9.6 `/admin/payments`

결제 관리.

| 컬럼 | 내용 |
|---|---|
| 결제ID | payment.id |
| 접수번호 | booking_no |
| 고객 | profile |
| 결제종류 | deposit/final/extra |
| 금액 | amount |
| 상태 | paid/failed/cancelled |
| PG | provider |
| 결제일시 | paid_at |
| 상세 | 버튼 |

---

### 9.7 `/admin/settlements`

기사 정산 관리.

| 컬럼 | 내용 |
|---|---|
| 접수번호 | booking_no |
| 기사 | technician.name |
| 고객 결제금액 | gross_amount |
| 부품비 | parts_amount |
| 수수료 대상 | commission_base |
| 플랫폼 수수료 | platform_fee |
| 기사 정산금 | technician_amount |
| 상태 | pending/confirmed/paid/held |
| 정산완료 처리 | 버튼 |

---

## 10. 결제/정산 정책

### 10.1 결제 방식

MVP에서는 **출장비 선결제**를 추천한다.

```text
고객 접수
→ 출장 진단비 선결제
→ 기사 배정
→ 현장 진단
→ 추가금 발생 시 고객 승인
→ 작업 완료
→ 최종금액 확정
→ 기사 정산
```

### 기본 정책 예시

```text
출장 진단비: 40,000원
야간 출장비: 50,000원 또는 기본 +20~40%
쿠폰: 출장비/작업비에만 적용
부품비: 쿠폰 적용 제외
현장 추가금: 고객 승인 전 청구 불가
```

---

### 10.2 정산 계산식

```text
gross_amount = 고객 최종 결제금액
parts_amount = 부품비
commission_base = gross_amount - parts_amount
platform_fee = commission_base * 기사별 수수료율
technician_amount = gross_amount - platform_fee + adjustment_amount
```

### 예시 1: 부품비 없는 경우

```text
고객 결제금액: 100,000원
부품비: 0원
수수료 대상: 100,000원
플랫폼 수수료율: 20%
플랫폼 수수료: 20,000원
기사 정산금: 80,000원
```

### 예시 2: 부품비 있는 경우

```text
고객 결제금액: 150,000원
부품비: 40,000원
수수료 대상: 110,000원
플랫폼 수수료율: 20%
플랫폼 수수료: 22,000원
기사 정산금: 128,000원
```

초기에는 기사 확보를 위해 **부품비에는 수수료를 붙이지 않는 정책**을 추천한다.

---

## 11. 쿠폰/리워드 MVP

### 쿠폰 종류

| 쿠폰 | 금액 | 지급 시점 |
|---|---:|---|
| 회원가입 쿠폰 | 5,000원 | 전화번호 인증 완료 |
| 에어컨 등록 쿠폰 | 5,000원 | 에어컨 정보 등록 완료 |
| 친구추천 쿠폰 | 10,000원 | 추천받은 고객 첫 방문 완료 후 |
| 기사추천 쿠폰 | 최대 50,000원 | 추천 기사 검증+첫 출동 완료 후 |

### 쿠폰 사용 조건

```text
최소 결제금액: 50,000원 이상
적용 가능: 출장비, 점검비, 작업비
적용 제외: 부품비, 고소작업비, 특수장비비
유효기간: 30일
중복사용: MVP에서는 1회 1장만
현금 환급: 불가
허위/중복가입: 지급 취소
```

---

## 12. 배차 방식

MVP는 수동 배차다.

### 수동 배차 흐름

```text
고객 접수/결제 완료
→ 관리자 /admin/bookings에서 확인
→ 접수 상세에서 기사 후보 확인
→ 기사에게 전화/카톡
→ 기사 수락
→ 관리자 기사 배정
→ booking.status = assigned
→ 고객에게 기사 정보 안내
```

### 기사 후보 필터

```text
활동지역 일치
기술태그 일치
근무상태 available
야간/주말 가능 여부
클레임/정지 상태 제외
```

### 2차 자동추천 점수식

```text
score =
  지역 일치 점수
+ 기술태그 일치 점수
+ 근무상태 점수
+ 평점 점수
+ 완료율 점수
- 취소율 패널티
- 클레임 패널티
```

---

## 13. 프론트 연동 데이터 예시

### 13.1 접수 생성 요청

```json
{
  "phone": "01012345678",
  "name": "홍길동",
  "address": "경기도 고양시 일산동구 ...",
  "detailAddress": "101동 1001호",
  "airconType": "wall",
  "brand": "lg",
  "symptomCode": "no_cold_air",
  "symptomDetail": "찬바람이 거의 안 나옵니다. 실외기는 도는 것 같습니다.",
  "urgency": "tonight",
  "desiredTime": "2026-04-29T22:30:00+09:00",
  "estimatedPriceMin": 55000,
  "estimatedPriceMax": 120000,
  "couponId": null
}
```

### 13.2 접수 생성 응답

```json
{
  "bookingId": "uuid",
  "bookingNo": "AC20260429-0001",
  "status": "payment_pending",
  "depositAmount": 40000,
  "message": "출장 진단비 결제 후 기사 매칭이 시작됩니다."
}
```

### 13.3 관리자 접수 리스트 응답

```json
{
  "items": [
    {
      "id": "uuid",
      "bookingNo": "AC20260429-0001",
      "createdAt": "2026-04-29T13:10:00Z",
      "customerName": "홍길동",
      "customerPhone": "01012345678",
      "region": "고양시 일산동구",
      "symptomCode": "no_cold_air",
      "urgency": "tonight",
      "status": "matching",
      "paymentStatus": "paid",
      "assignedTechnicianName": null
    }
  ],
  "total": 1
}
```

---

## 14. 개발 마일스톤

### Week 1: DB/Auth/접수 저장

| 작업 | 완료 기준 |
|---|---|
| Supabase 프로젝트 생성 | DB/Auth/Storage 사용 가능 |
| 테이블 마이그레이션 | 핵심 테이블 생성 완료 |
| 유저/프로필 생성 | 전화번호 기반 고객 식별 가능 |
| 접수 생성 API | 고객 접수 데이터가 bookings에 저장 |
| 사진 업로드 | booking_photos에 URL 저장 |
| 관리자 접수 리스트 | `/admin/bookings`에서 접수 확인 가능 |

### Week 1 산출물

```text
고객이 접수하면 DB에 booking이 쌓인다.
관리자는 /admin에서 접수를 볼 수 있다.
```

---

### Week 2: 기사 DB + 수동 배차

| 작업 | 완료 기준 |
|---|---|
| 기사 CRUD | 관리자에서 기사 생성/수정 가능 |
| 기술태그/활동지역 | 기사별 태그 관리 가능 |
| 기사 승인/정지 | status 변경 가능 |
| 수동 배차 | 접수에 기사 배정 가능 |
| 상태 이력 | booking_status_events 기록 |

### Week 2 산출물

```text
관리자가 접수 건을 보고 적합 기사를 배정할 수 있다.
상태 변경 이력이 DB에 남는다.
```

---

### Week 3: 결제 연동

| 작업 | 완료 기준 |
|---|---|
| PG 선택 | Toss 또는 PortOne 확정 |
| 결제 준비 API | order_id/payment 생성 |
| 결제 승인 API | payment 상태 paid 처리 |
| 결제 웹훅 | payment_events 기록 |
| 환불 기본 기능 | 관리자에서 취소/환불 요청 가능 |

### Week 3 산출물

```text
고객이 출장비를 선결제하고 접수할 수 있다.
관리자는 결제상태를 확인할 수 있다.
```

---

### Week 4: 정산/쿠폰/운영 고도화

| 작업 | 완료 기준 |
|---|---|
| 정산 생성 | completed booking 기준 settlement 생성 |
| 정산 계산 | 플랫폼 수수료/기사금액 자동 계산 |
| 정산 상태 변경 | confirmed/paid/held 처리 가능 |
| 가입쿠폰 | 신규 유저 쿠폰 발급 가능 |
| 에어컨등록 쿠폰 | asset 등록 후 쿠폰 발급 가능 |
| 대시보드 | 오늘 접수/매출/정산대기 확인 가능 |

### Week 4 산출물

```text
접수 → 결제 → 배차 → 완료 → 정산까지 한 바퀴 운영 가능하다.
```

---

## 15. 환경변수 체크리스트

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
TOSS_WEBHOOK_SECRET=

PORTONE_STORE_ID=
PORTONE_API_SECRET=
PORTONE_WEBHOOK_SECRET=

ADMIN_EMAILS=
NEXT_PUBLIC_APP_URL=
```

주의:

```text
SUPABASE_SERVICE_ROLE_KEY, PG SECRET KEY는 절대 브라우저에 노출하지 않는다.
NEXT_PUBLIC_ 접두사가 붙은 값만 클라이언트에 노출 가능하다.
관리자 API는 서버에서 service role을 사용하되, 요청자 권한을 먼저 검증한다.
```

---

## 16. RLS/권한 정책 기본 방향

MVP에서 최소한 아래 원칙은 지켜야 한다.

```text
profiles: 본인 프로필만 조회/수정 가능. admin은 전체 가능.
user_addresses: 본인 주소만 가능. admin은 전체 가능.
aircon_assets: 본인 에어컨만 가능. admin은 전체 가능.
bookings: 본인 접수만 가능. admin은 전체 가능. technician은 배정된 접수만 가능.
booking_photos: 본인 접수 사진만 가능. admin은 전체 가능.
technicians: approved 기사 기본정보 일부는 고객에게 공개 가능. 상세/계좌/문서는 admin만.
payments: 본인 결제만 가능. admin은 전체 가능.
settlements: 기사 본인 정산만 가능. admin은 전체 가능.
```

관리자 화면은 보통 서버 API에서 service role로 조회하되, API 진입 시 현재 로그인 사용자의 `role`이 `admin` 또는 `super_admin`인지 확인해야 한다.

---

## 17. 운영 정책 체크리스트

개발 전에 아래 정책을 정해야 한다.

### 고객 결제 정책

```text
접수 시 선결제 금액: 예) 출장비 40,000원
야간 출장비: 예) 50,000원 또는 기본 +20~40%
쿠폰 적용 범위: 출장비/작업비만
부품비 쿠폰 적용: 비추천
기사 출발 전 취소: 전액 또는 일부 환불
기사 출발 후 취소: 출장비 차감 가능
현장 추가금: 고객 승인 전 청구 금지
```

### 기사 정산 정책

```text
기본 수수료율: 10~20%
부품비 수수료: 초기 미적용 추천
정산 주기: 주 1회 추천
클레임 건: 정산 보류 가능
현장 현금결제: 원칙적으로 비추천, 예외만 관리자 기록
```

### 기사 검증 정책

```text
신분증 확인
사업자등록증 여부
경력 확인
활동지역 확인
야간출동 가능 여부
보험 가입 여부
클레임 누적 기준
정지/퇴출 기준
```

---

## 18. 개발 우선순위

### P0: 반드시 먼저 만들 것

```text
고객 접수 생성
사진 업로드
관리자 접수 리스트
관리자 접수 상세
기사 DB 등록/수정
기사 수동 배차
접수 상태 변경
상태 변경 로그
출장비/예약금 결제
결제 기록
기사 정산금 계산
관리자 정산 완료 처리
```

### P1: 다음 단계

```text
기사 전용 접수 확인 링크
기사 수락/거절 버튼
고객 알림톡/SMS
추가금 승인 결제
쿠폰/추천 리워드
리뷰/평점
관리자 대시보드 고도화
```

### P2: 나중 단계

```text
자동 기사 추천
기사앱
실시간 위치추적
지급대행 자동화
AI 가격추천
B2B 정기점검 관리
```

---

## 19. 개발자/LLM 작업 지시문

아래 문구를 다른 LLM이나 개발자에게 그대로 전달할 수 있다.

```text
현재 Vercel에 배포된 에어컨 기사 매칭 프론트가 있다.
이제 Supabase 기반 백엔드 MVP를 만들어야 한다.

목표는 자동매칭이 아니라, 접수/기사/결제/정산을 운영 가능한 백오피스로 만드는 것이다.

필수 구현:
1. Supabase PostgreSQL 테이블 생성
2. Supabase Auth 또는 전화번호 기반 유저 식별
3. 고객 접수 생성 API
4. 사진 업로드 Storage 연동
5. /admin/bookings 접수 리스트
6. /admin/bookings/[id] 접수 상세
7. 기사 DB CRUD
8. 기사 수동 배차
9. 접수 상태 변경과 상태 변경 로그
10. 출장비/예약금 결제 연동 준비
11. payments/payment_events 테이블 기록
12. 작업 완료 후 settlements 생성
13. 관리자 정산 확인/완료 처리

주의:
- DB에 저장된 데이터는 자동으로 화면에 보이지 않는다.
- 반드시 관리자 화면에서 조회하는 API와 UI를 함께 만들어야 한다.
- 고객은 본인 접수만 볼 수 있어야 한다.
- 기사는 본인 배정 건만 볼 수 있어야 한다.
- 관리자는 전체 접수/기사/결제/정산을 볼 수 있어야 한다.
- 모든 상태 변경은 booking_status_events에 기록한다.
- 결제/환불/정산 변경은 로그를 남긴다.
```

---

## 20. 최종 정리

이 백엔드의 핵심은 화려한 자동화가 아니다.

> **DB에 접수 데이터가 안전하게 쌓이고, 관리자가 그 데이터를 화면에서 보고, 적합 기사를 배정하고, 결제와 정산까지 추적할 수 있는 것.**

따라서 1차 개발의 성공 기준은 아래와 같다.

```text
고객이 접수한다.
관리자가 접수를 본다.
관리자가 기사를 배정한다.
고객이 결제한다.
작업이 완료된다.
기사 정산금이 계산된다.
관리자가 정산완료 처리한다.
```

이 흐름이 완성되면 그 다음에 기사 수락 링크, 알림톡, 자동매칭, 기사앱, 지급대행으로 확장한다.
