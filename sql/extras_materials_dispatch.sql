-- 추가금·자재·배차 알림 (명세 G·H 골격) — 행위/앱 로직은 Nest에서 단계별 연결
-- 선행 권장: orders 테이블(orders_payments_settlements.sql)·service_addons(seed).
-- 순서 실수 방지용: 같은 파일에서 touch_updated_at()도 정의(멱등).

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

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  unit TEXT NOT NULL DEFAULT 'each',
  customer_price BIGINT NULL,
  technician_cost_allowance BIGINT NULL,
  platform_fee_rate NUMERIC(10, 6) NULL,
  oem_available BOOLEAN NOT NULL DEFAULT FALSE,
  supplier_name TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_materials_updated ON materials;
CREATE TRIGGER tr_materials_updated BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS order_extra_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  technician_id TEXT NULL,
  status TEXT NOT NULL DEFAULT 'requested',

  total_amount BIGINT NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  customer_approved_at TIMESTAMPTZ NULL,
  paid_at TIMESTAMPTZ NULL,
  memo TEXT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_quote_status CHECK (status IN (
    'requested', 'approved', 'paid', 'rejected', 'cancelled'
  ))
);

CREATE INDEX IF NOT EXISTS ix_extra_quotes_order ON order_extra_quotes(order_id);

DROP TRIGGER IF EXISTS tr_quote_updated ON order_extra_quotes;
CREATE TRIGGER tr_quote_updated BEFORE UPDATE ON order_extra_quotes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS order_extra_quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES order_extra_quotes(id) ON DELETE CASCADE,
  addon_id UUID NULL REFERENCES service_addons(id) ON DELETE SET NULL,
  material_id UUID NULL REFERENCES materials(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  quantity NUMERIC(12, 3) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'each',
  unit_price BIGINT NOT NULL,
  amount BIGINT NOT NULL,
  technician_cost_allowance BIGINT NULL,
  platform_fee_rate NUMERIC(10, 6) NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_quote_items_quote ON order_extra_quote_items(quote_id);

CREATE TABLE IF NOT EXISTS dispatch_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  technician_id TEXT NOT NULL,

  notification_group TEXT NOT NULL DEFAULT 'general',

  sent_at TIMESTAMPTZ NULL,
  opened_at TIMESTAMPTZ NULL,
  accepted_at TIMESTAMPTZ NULL,
  rejected_at TIMESTAMPTZ NULL,
  status TEXT NOT NULL DEFAULT 'pending',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_dispatch_notification_group CHECK (notification_group IN ('priority','general','new')),
  CONSTRAINT chk_dispatch_notification_status CHECK (status IN ('pending','sent','opened','accepted','rejected','expired'))
);

CREATE INDEX IF NOT EXISTS ix_dispatch_order ON dispatch_notifications(order_id);
CREATE INDEX IF NOT EXISTS ix_dispatch_tech ON dispatch_notifications(technician_id);

DROP TRIGGER IF EXISTS tr_dispatch_updated ON dispatch_notifications;
CREATE TRIGGER tr_dispatch_updated BEFORE UPDATE ON dispatch_notifications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
