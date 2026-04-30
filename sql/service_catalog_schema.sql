-- Service catalog per install/cleaning platform spec v0.1
-- Apply in Supabase SQL editor or via migration tooling.

CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL CHECK (service_type IN ('install', 'cleaning')),
  aircon_type TEXT NOT NULL CHECK (aircon_type IN ('wall', 'stand', 'two_in_one', 'system')),
  base_price BIGINT NOT NULL DEFAULT 0,
  same_day_extra_price BIGINT NOT NULL DEFAULT 0,
  same_day_price BIGINT NOT NULL DEFAULT 0,
  included_pipe_meter INTEGER NOT NULL DEFAULT 0,
  included_refrigerant_count INTEGER NOT NULL DEFAULT 0,
  included_hole_count INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_service_products_category ON service_products(category_id);
CREATE INDEX IF NOT EXISTS ix_service_products_type ON service_products(service_type, aircon_type);

CREATE TABLE IF NOT EXISTS service_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL DEFAULT 'each',
  customer_price BIGINT,
  technician_cost_allowance BIGINT,
  platform_fee_rate NUMERIC(7, 4),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional: sync updated_at on write (implement with trigger if desired)
