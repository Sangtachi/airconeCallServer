-- Phase 3: 기사 테이블 + 작업 사진(order_photos)
-- 선행: orders 테이블(orders_payments_settlements.sql)

CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NULL,
  password_updated_at TIMESTAMPTZ NULL,

  business_type TEXT NOT NULL DEFAULT 'individual' CHECK (business_type IN ('individual','sole_business','company')),
  business_number TEXT NULL,

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','approved','rejected','suspended')),
  work_status TEXT NOT NULL DEFAULT 'offline' CHECK (work_status IN ('offline','available','busy','reserved_only')),

  base_region TEXT NULL,
  bank_name TEXT NULL,
  bank_account TEXT NULL,
  bank_holder TEXT NULL,
  platform_fee_rate NUMERIC(7, 4) NOT NULL DEFAULT 20,

  profile_photo_url TEXT NULL,
  reject_reason TEXT NULL,
  memo TEXT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_technicians_phone ON technicians(phone);
CREATE INDEX IF NOT EXISTS ix_technicians_status ON technicians(status);

ALTER TABLE technicians
  ADD COLUMN IF NOT EXISTS password_hash TEXT NULL,
  ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ NULL;

DROP TRIGGER IF EXISTS tr_technicians_updated ON technicians;
CREATE TRIGGER tr_technicians_updated BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE IF NOT EXISTS technician_capabilities (
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('install','cleaning')),
  aircon_type TEXT NOT NULL CHECK (aircon_type IN ('wall','stand','two_in_one','system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (technician_id, service_type, aircon_type)
);

CREATE INDEX IF NOT EXISTS ix_capabilities_tech ON technician_capabilities(technician_id);

CREATE TABLE IF NOT EXISTS order_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  technician_id UUID NULL REFERENCES technicians(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('before_work','after_work','other')),
  url TEXT NOT NULL,
  caption TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_order_photos_order ON order_photos(order_id);
