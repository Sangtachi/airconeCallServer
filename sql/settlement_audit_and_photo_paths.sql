-- 정산 변경 감사(멱등 키) + 작업사진 객체 경로(비공개 버킷 + signed 조회 시 사용)
-- 선행: orders_payments_settlements, technicians_and_order_photos, extras_materials_dispatch

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

ALTER TABLE IF EXISTS public.order_photos
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT NULL;

ALTER TABLE IF EXISTS public.order_photos
  ADD COLUMN IF NOT EXISTS storage_object_path TEXT NULL;

CREATE TABLE IF NOT EXISTS public.settlement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NULL REFERENCES public.order_settlements(id) ON DELETE SET NULL,
  order_id UUID NULL REFERENCES public.orders(id) ON DELETE SET NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  idempotency_key TEXT NULL,
  payload JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_settlement_events_settlement ON public.settlement_events(settlement_id);
CREATE INDEX IF NOT EXISTS ix_settlement_events_order ON public.settlement_events(order_id);
CREATE INDEX IF NOT EXISTS ix_settlement_events_created ON public.settlement_events(created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_settlement_events_idempotency
  ON public.settlement_events (idempotency_key)
  WHERE idempotency_key IS NOT NULL AND length(trim(idempotency_key)) > 0;
