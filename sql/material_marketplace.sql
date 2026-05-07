-- 판매자-기사 자재 마켓플레이스 MVP
-- 선행: supabase_operational_hardening.sql, extras_materials_dispatch.sql

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

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS seller_id uuid NULL REFERENCES public.seller_applications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description text NULL,
  ADD COLUMN IF NOT EXISTS image_url text NULL,
  ADD COLUMN IF NOT EXISTS stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  ADD COLUMN IF NOT EXISTS market_status text NOT NULL DEFAULT 'active' CHECK (market_status IN ('active','sold_out','hidden','draft')),
  ADD COLUMN IF NOT EXISTS delivery_note text NULL,
  ADD COLUMN IF NOT EXISTS min_order_quantity integer NOT NULL DEFAULT 1 CHECK (min_order_quantity >= 1);

UPDATE public.materials AS m
SET seller_id = s.id
FROM public.seller_applications AS s
WHERE m.seller_id IS NULL
  AND m.supplier_name IS NOT NULL
  AND m.supplier_name = s.company_name;

CREATE INDEX IF NOT EXISTS ix_materials_seller ON public.materials(seller_id);
CREATE INDEX IF NOT EXISTS ix_materials_market ON public.materials(is_active, market_status, stock_quantity);

DROP TRIGGER IF EXISTS tr_materials_updated ON public.materials;
CREATE TRIGGER tr_materials_updated
  BEFORE UPDATE ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.material_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no text NOT NULL UNIQUE,

  technician_id uuid NOT NULL REFERENCES public.technicians(id) ON DELETE RESTRICT,
  technician_name text NULL,
  technician_phone text NULL,

  seller_id uuid NULL REFERENCES public.seller_applications(id) ON DELETE SET NULL,
  seller_name text NULL,

  status text NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'
  )),
  total_amount bigint NOT NULL DEFAULT 0 CHECK (total_amount >= 0),

  delivery_address text NOT NULL DEFAULT '',
  recipient_name text NULL,
  recipient_phone text NULL,
  request_memo text NULL,
  seller_memo text NULL,
  admin_memo text NULL,

  confirmed_at timestamptz NULL,
  preparing_at timestamptz NULL,
  shipped_at timestamptz NULL,
  delivered_at timestamptz NULL,
  cancelled_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_material_purchase_orders_technician ON public.material_purchase_orders(technician_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_material_purchase_orders_seller ON public.material_purchase_orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_material_purchase_orders_status ON public.material_purchase_orders(status, created_at DESC);

DROP TRIGGER IF EXISTS tr_material_purchase_orders_updated ON public.material_purchase_orders;
CREATE TRIGGER tr_material_purchase_orders_updated
  BEFORE UPDATE ON public.material_purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.material_purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.material_purchase_orders(id) ON DELETE CASCADE,
  material_id uuid NULL REFERENCES public.materials(id) ON DELETE SET NULL,
  seller_id uuid NULL REFERENCES public.seller_applications(id) ON DELETE SET NULL,

  name text NOT NULL,
  code text NOT NULL,
  unit text NOT NULL DEFAULT 'each',
  supplier_name text NULL,
  unit_price bigint NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  amount bigint NOT NULL CHECK (amount >= 0),

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_material_purchase_order_items_order ON public.material_purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS ix_material_purchase_order_items_material ON public.material_purchase_order_items(material_id);
