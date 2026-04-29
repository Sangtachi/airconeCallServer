-- Aircone Admin MVP Schema (for Supabase Postgres)
-- Created for: members / technicians / onboarding / bookings / payments / settlements / coupons / admin_logs

create extension if not exists pgcrypto;

-- 1) Members
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  role text not null default 'customer' check (role in ('customer', 'admin', 'super_admin')),
  status text not null default 'active' check (status in ('active', 'inactive', 'banned')),
  marketing_consent boolean not null default false,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_members_status on public.members(status);
create index if not exists idx_members_role on public.members(role);

-- 2) Technicians
create table if not exists public.technicians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  work_status text not null default 'offline' check (work_status in ('offline', 'available', 'busy')),
  base_region text,
  fee_rate numeric(5,2) not null default 20.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_technicians_status on public.technicians(status);
create index if not exists idx_technicians_work_status on public.technicians(work_status);

-- 3) Technician Onboarding
create table if not exists public.technician_onboarding (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'approved', 'rejected')),
  documents text[] not null default '{}',
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tech_onboarding_status on public.technician_onboarding(status);

-- 4) Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_no text not null unique,
  customer_name text not null,
  customer_phone text not null,
  region text not null,
  symptom_code text not null,
  urgency text not null default 'scheduled',
  status text not null default 'created' check (
    status in (
      'created',
      'payment_pending',
      'paid',
      'matching',
      'assigned',
      'accepted',
      'on_the_way',
      'arrived',
      'diagnosed',
      'extra_payment_pending',
      'working',
      'completed',
      'cancelled',
      'refunded',
      'settlement_pending',
      'settled'
    )
  ),
  assigned_technician_id uuid references public.technicians(id) on delete set null,
  payment_status text not null default 'ready' check (payment_status in ('ready', 'paid', 'failed', 'cancelled', 'partial_cancelled')),
  admin_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_region on public.bookings(region);
create index if not exists idx_bookings_assigned_technician on public.bookings(assigned_technician_id);

-- 5) Booking status events (audit trail for transitions)
create table if not exists public.booking_status_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  changed_at timestamptz not null default now()
);

create index if not exists idx_booking_status_events_booking on public.booking_status_events(booking_id);

-- 6) Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  amount integer not null check (amount >= 0),
  payment_type text not null check (payment_type in ('deposit', 'final', 'extra', 'cancellation_fee')),
  provider text not null default 'manual' check (provider in ('manual', 'toss', 'portone')),
  status text not null default 'ready' check (status in ('ready', 'paid', 'failed', 'cancelled', 'partial_cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_booking on public.payments(booking_id);
create index if not exists idx_payments_status on public.payments(status);

-- 7) Settlements
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  technician_id uuid not null references public.technicians(id) on delete restrict,
  gross_amount integer not null default 0 check (gross_amount >= 0),
  parts_amount integer not null default 0 check (parts_amount >= 0),
  commission_base integer not null default 0 check (commission_base >= 0),
  platform_fee integer not null default 0 check (platform_fee >= 0),
  technician_amount integer not null default 0 check (technician_amount >= 0),
  adjustment_amount integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'paid', 'held', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_settlements_booking on public.settlements(booking_id);
create index if not exists idx_settlements_technician on public.settlements(technician_id);
create index if not exists idx_settlements_status on public.settlements(status);

-- 8) Coupons
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.members(id) on delete cascade,
  coupon_type text not null check (coupon_type in ('signup', 'aircon_register', 'referral', 'manual')),
  amount integer not null check (amount >= 0),
  status text not null default 'active' check (status in ('active', 'used', 'expired', 'cancelled')),
  expires_at timestamptz,
  used_booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coupons_user on public.coupons(user_id);
create index if not exists idx_coupons_status on public.coupons(status);

-- 9) Admin logs
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  target_table text not null,
  target_id text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_logs_action on public.admin_logs(action);
create index if not exists idx_admin_logs_target on public.admin_logs(target_table, target_id);

-- 10) Idempotency keys (for payment/settlement actions)
create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  scope text not null, -- e.g. payment_cancel, settlement_confirm
  key text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  unique(scope, key)
);

