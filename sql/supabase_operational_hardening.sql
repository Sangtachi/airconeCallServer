-- Supabase operational hardening
-- 목적: 메모리 운영 데이터를 Supabase 기준으로 전환하기 위한 보강 DDL.
-- 선행: service_catalog_schema.sql, orders_payments_settlements.sql,
--       extras_materials_dispatch.sql, technicians_and_order_photos.sql,
--       emergency_service_leads.sql

BEGIN;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 고객/회원
CREATE TABLE IF NOT EXISTS public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  password_hash text NULL,
  password_updated_at timestamptz NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
  marketing_consent boolean NOT NULL DEFAULT false,
  memo text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_phone ON public.members(phone);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(status);

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS password_hash text NULL,
  ADD COLUMN IF NOT EXISTS password_updated_at timestamptz NULL;

DROP TRIGGER IF EXISTS tr_members_updated ON public.members;
CREATE TRIGGER tr_members_updated
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  address text NOT NULL,
  detail_address text NULL,
  sido text NULL,
  sigungu text NULL,
  dong text NULL,
  latitude numeric(10, 7) NULL,
  longitude numeric(10, 7) NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON public.user_addresses(user_id);

DROP TRIGGER IF EXISTS tr_user_addresses_updated ON public.user_addresses;
CREATE TRIGGER tr_user_addresses_updated
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.aircon_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  address_id uuid NULL REFERENCES public.user_addresses(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('wall', 'stand', 'two_in_one', 'system', 'unknown')),
  brand text NULL,
  model_name text NULL,
  installed_year integer NULL,
  indoor_photo_url text NULL,
  outdoor_photo_url text NULL,
  remote_photo_url text NULL,
  memo text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aircon_assets_user ON public.aircon_assets(user_id);

DROP TRIGGER IF EXISTS tr_aircon_assets_updated ON public.aircon_assets;
CREATE TRIGGER tr_aircon_assets_updated
  BEFORE UPDATE ON public.aircon_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  coupon_type text NOT NULL CHECK (coupon_type IN ('signup', 'aircon_register', 'referral', 'manual')),
  amount integer NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  min_order_amount integer NOT NULL DEFAULT 0,
  expires_at timestamptz NULL,
  used_booking_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_user ON public.coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_coupons_signup_once
  ON public.coupons(user_id, coupon_type)
  WHERE coupon_type = 'signup';

DROP TRIGGER IF EXISTS tr_coupons_updated ON public.coupons;
CREATE TRIGGER tr_coupons_updated
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.reward_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  reward_type text NOT NULL,
  amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'created',
  reference_id text NULL,
  payload jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reward_logs_user ON public.reward_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_logs_reference ON public.reward_logs(reference_id);

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_table text NOT NULL,
  target_id text NOT NULL,
  payload jsonb NULL,
  actor text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);

ALTER TABLE public.admin_logs
  ADD COLUMN IF NOT EXISTS actor text NULL;

ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS password_hash text NULL,
  ADD COLUMN IF NOT EXISTS password_updated_at timestamptz NULL;

CREATE TABLE IF NOT EXISTS public.seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_name text NOT NULL,
  phone text NOT NULL UNIQUE,
  password_hash text NULL,
  password_updated_at timestamptz NULL,
  company_name text NOT NULL,
  business_number text NULL,
  product_category text NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'suspended')),
  memo text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_applications_phone ON public.seller_applications(phone);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON public.seller_applications(status);

ALTER TABLE public.seller_applications
  ADD COLUMN IF NOT EXISTS password_hash text NULL,
  ADD COLUMN IF NOT EXISTS password_updated_at timestamptz NULL;

DROP TRIGGER IF EXISTS tr_seller_applications_updated ON public.seller_applications;
CREATE TRIGGER tr_seller_applications_updated
  BEFORE UPDATE ON public.seller_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS min_order_amount integer NOT NULL DEFAULT 0;

-- 과거 Admin MVP payments 테이블이 있으면 order 기반 결제가 들어갈 수 있도록 보강.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS pg_order_id text NULL,
  ADD COLUMN IF NOT EXISTS payment_key text NULL,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS raw_response jsonb NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payments'
      AND column_name = 'booking_id'
  ) THEN
    ALTER TABLE public.payments ALTER COLUMN booking_id DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_payment_type_check
  CHECK (payment_type IN ('deposit', 'final', 'product', 'extra', 'cancellation_fee'));

-- orders를 canonical dispatch model로 사용: legacy non-UUID 기사 ID 제거 후 FK 부여.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'assigned_technician_id'
      AND data_type <> 'uuid'
  ) THEN
    UPDATE public.orders
    SET assigned_technician_id = NULL
    WHERE assigned_technician_id IS NOT NULL
      AND assigned_technician_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

    ALTER TABLE public.orders
      ALTER COLUMN assigned_technician_id TYPE uuid
      USING assigned_technician_id::uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_orders_assigned_technician'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT fk_orders_assigned_technician
      FOREIGN KEY (assigned_technician_id)
      REFERENCES public.technicians(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_orders_assigned_technician ON public.orders(assigned_technician_id);

-- 기사 온보딩 보강
ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS business_type text NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS business_number text NULL,
  ADD COLUMN IF NOT EXISTS career_years integer NULL,
  ADD COLUMN IF NOT EXISTS bank_name text NULL,
  ADD COLUMN IF NOT EXISTS bank_account text NULL,
  ADD COLUMN IF NOT EXISTS bank_holder text NULL,
  ADD COLUMN IF NOT EXISTS platform_fee_rate numeric(7, 4) NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS profile_photo_url text NULL,
  ADD COLUMN IF NOT EXISTS reject_reason text NULL,
  ADD COLUMN IF NOT EXISTS memo text NULL,
  ADD COLUMN IF NOT EXISTS available_weekend boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS available_night boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS available_same_day boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS available_reservation boolean NOT NULL DEFAULT true;

ALTER TABLE public.technicians DROP CONSTRAINT IF EXISTS technicians_business_type_check;
ALTER TABLE public.technicians
  ADD CONSTRAINT technicians_business_type_check
  CHECK (business_type IN ('individual', 'sole_business', 'company'));

ALTER TABLE public.technicians DROP CONSTRAINT IF EXISTS technicians_status_check;
ALTER TABLE public.technicians
  ADD CONSTRAINT technicians_status_check
  CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'suspended'));

ALTER TABLE public.technicians DROP CONSTRAINT IF EXISTS technicians_work_status_check;
ALTER TABLE public.technicians
  ADD CONSTRAINT technicians_work_status_check
  CHECK (work_status IN ('offline', 'available', 'busy', 'reserved_only'));

CREATE TABLE IF NOT EXISTS public.technician_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  region text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (technician_id, region)
);

CREATE INDEX IF NOT EXISTS idx_technician_regions_tech ON public.technician_regions(technician_id);

CREATE TABLE IF NOT EXISTS public.technician_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  availability_code text NOT NULL CHECK (
    availability_code IN ('same_day', 'reservation', 'weekend', 'night')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (technician_id, availability_code)
);

CREATE INDEX IF NOT EXISTS idx_technician_availability_tech ON public.technician_availability(technician_id);

CREATE TABLE IF NOT EXISTS public.technician_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by text NULL,
  reviewed_at timestamptz NULL,
  reject_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_technician_documents_tech ON public.technician_documents(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_documents_status ON public.technician_documents(status);

-- dispatch_notifications는 orders/technicians FK 기준으로 보강.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dispatch_notifications'
      AND column_name = 'technician_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.dispatch_notifications
      ALTER COLUMN technician_id DROP NOT NULL;

    UPDATE public.dispatch_notifications
    SET technician_id = NULL
    WHERE technician_id IS NOT NULL
      AND technician_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

    ALTER TABLE public.dispatch_notifications
      ALTER COLUMN technician_id TYPE uuid
      USING technician_id::uuid;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  key text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, key)
);

COMMIT;
