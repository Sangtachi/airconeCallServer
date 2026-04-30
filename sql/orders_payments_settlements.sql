-- Install/cleaning platform — orders, payments, settlements (명세 C·F 참고)
-- 선행: service_catalog_schema.sql (service_products FK)
-- (선택) 00_touch_updated_at.sql 로 함수만 미리 깔아도 됨 — 아래 블록은 단독 실행 시에도 동작하도록 포함

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

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL UNIQUE,
  user_id UUID NULL,

  product_id UUID NOT NULL REFERENCES service_products(id) ON DELETE RESTRICT,
  service_type TEXT NOT NULL CHECK (service_type IN ('install','cleaning')),
  aircon_type TEXT NOT NULL,

  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('same_day','reservation')),
  desired_date DATE NULL,
  desired_time_slot TEXT NULL,

  address_summary TEXT NOT NULL,
  sido TEXT NULL,
  sigungu TEXT NULL,
  dong TEXT NULL,
  detail_address TEXT NULL,

  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  product_code_snap TEXT NOT NULL,
  product_name_snap TEXT NOT NULL,

  base_price BIGINT NOT NULL,
  same_day_extra_price BIGINT NOT NULL DEFAULT 0,
  product_total_price BIGINT NOT NULL,
  extra_total_price BIGINT NOT NULL DEFAULT 0,
  discount_amount BIGINT NOT NULL DEFAULT 0,
  total_price BIGINT NOT NULL,

  payment_status TEXT NOT NULL,
  order_status TEXT NOT NULL,

  assigned_technician_id TEXT NULL,
  customer_memo TEXT NULL,
  admin_memo TEXT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS ix_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS ix_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS ix_orders_created ON orders(created_at DESC);

DROP TRIGGER IF EXISTS tr_orders_updated ON orders;
CREATE TRIGGER tr_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'manual',
  pg_order_id TEXT NULL,
  payment_key TEXT NULL,
  amount BIGINT NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('product','extra','cancellation_fee')),
  paid_at TIMESTAMPTZ NULL,
  cancelled_at TIMESTAMPTZ NULL,
  raw_response JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 과거 버전 등으로 만들어진 public.payments가 있으면 IF NOT EXISTS가 스킵되어 order_id 없이 남음 → 다음 인덱스에서 42703
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS ix_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS ix_payments_status ON payments(status);

DROP TRIGGER IF EXISTS tr_payments_updated ON payments;
CREATE TRIGGER tr_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS order_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  technician_id TEXT NULL,

  gross_amount BIGINT NOT NULL DEFAULT 0,
  material_allowance BIGINT NOT NULL DEFAULT 0,
  fee_base_amount BIGINT NULL,
  platform_fee_rate NUMERIC(10, 6) NULL,
  platform_fee BIGINT NULL,
  technician_payout BIGINT NULL,

  status TEXT NOT NULL DEFAULT 'pending',

  payout_method TEXT NOT NULL DEFAULT 'manual_bank_transfer',
  paid_at TIMESTAMPTZ NULL,
  memo TEXT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.order_settlements
  ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS uq_settlement_order ON order_settlements(order_id);

CREATE INDEX IF NOT EXISTS ix_settlements_status ON order_settlements(status);

DROP TRIGGER IF EXISTS tr_settlements_updated ON order_settlements;
CREATE TRIGGER tr_settlements_updated BEFORE UPDATE ON order_settlements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
