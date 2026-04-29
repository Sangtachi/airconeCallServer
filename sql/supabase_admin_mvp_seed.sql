-- Aircone Admin MVP Seed Data
-- Run after: supabase_admin_mvp_schema.sql

-- Members
insert into public.members (id, name, phone, role, status, marketing_consent, memo)
values
  ('11111111-1111-1111-1111-111111111111', '홍길동', '01012345678', 'customer', 'active', true, '초기 샘플 회원'),
  ('22222222-2222-2222-2222-222222222222', '운영관리자', '01088889999', 'admin', 'active', false, '관리자 계정')
on conflict (id) do nothing;

-- Technicians
insert into public.technicians (
  id, name, phone, status, work_status, base_region, fee_rate
)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '김기사', '01099998888', 'approved', 'available', '경기 파주', 20.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '이기사', '01077776666', 'pending', 'offline', '경기 고양', 20.00)
on conflict (id) do nothing;

-- Technician onboarding
insert into public.technician_onboarding (
  id, name, phone, status, documents, reject_reason
)
values
  ('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1', '박신청', '01055557777', 'pending', array['id_card','business_license'], null),
  ('d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2', '최지원', '01033332222', 'reviewing', array['id_card'], null)
on conflict (id) do nothing;

-- Bookings
insert into public.bookings (
  id,
  booking_no,
  customer_name,
  customer_phone,
  region,
  symptom_code,
  urgency,
  status,
  assigned_technician_id,
  payment_status,
  admin_memo
)
values
  (
    'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1',
    'AC20260429-0001',
    '홍길동',
    '01012345678',
    '경기 파주시',
    'no_cold_air',
    'now',
    'matching',
    null,
    'paid',
    '우선 배차 필요'
  ),
  (
    'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
    'AC20260429-0002',
    '홍길동',
    '01012345678',
    '경기 고양시',
    'water_leak',
    'scheduled',
    'assigned',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'paid',
    null
  )
on conflict (id) do nothing;

-- Booking status history
insert into public.booking_status_events (booking_id, from_status, to_status, reason)
values
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'paid', 'matching', '결제 완료 후 배정 시작'),
  ('f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 'matching', 'assigned', '기사 배정 완료');

-- Payments
insert into public.payments (
  id, booking_id, amount, payment_type, provider, status
)
values
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 40000, 'deposit', 'manual', 'paid'),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', 40000, 'deposit', 'manual', 'paid')
on conflict (id) do nothing;

-- Settlements
insert into public.settlements (
  id,
  booking_id,
  technician_id,
  gross_amount,
  parts_amount,
  commission_base,
  platform_fee,
  technician_amount,
  adjustment_amount,
  status
)
values
  (
    '11111111-aaaa-bbbb-cccc-000000000001',
    'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    150000,
    40000,
    110000,
    22000,
    128000,
    0,
    'pending'
  )
on conflict (id) do nothing;

-- Coupons
insert into public.coupons (
  id, user_id, coupon_type, amount, status, expires_at, used_booking_id
)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'signup', 5000, 'active', now() + interval '30 days', null),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'manual', 7000, 'active', now() + interval '60 days', null)
on conflict (id) do nothing;

-- Admin logs
insert into public.admin_logs (action, target_table, target_id, payload)
values
  ('seed_init', 'system', 'seed_v1', '{"note":"initial seed complete"}'::jsonb);

