-- Customer dashboard + technician operations hardening
-- 선행: orders_payments_settlements.sql, technicians_and_order_photos.sql,
--       settlement_audit_and_photo_paths.sql, supabase_operational_hardening.sql

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

-- 고객 주문 평가. 주문 1건당 1개 리뷰만 유지하고, 수정은 upsert로 처리한다.
CREATE TABLE IF NOT EXISTS public.technician_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  technician_id uuid NULL REFERENCES public.technicians(id) ON DELETE SET NULL,
  member_id uuid NULL REFERENCES public.members(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_technician_reviews_technician
  ON public.technician_reviews(technician_id);
CREATE INDEX IF NOT EXISTS idx_technician_reviews_member
  ON public.technician_reviews(member_id);
CREATE INDEX IF NOT EXISTS idx_technician_reviews_created
  ON public.technician_reviews(created_at DESC);

DROP TRIGGER IF EXISTS tr_technician_reviews_updated ON public.technician_reviews;
CREATE TRIGGER tr_technician_reviews_updated
  BEFORE UPDATE ON public.technician_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- 기사 계좌 검증 상태. 실제 외부 계좌 검증 API가 붙기 전까지 관리자가 검증/반려 상태를 관리한다.
ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS bank_verification_status text NOT NULL DEFAULT 'unsubmitted',
  ADD COLUMN IF NOT EXISTS bank_verified_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS bank_reject_reason text NULL;

ALTER TABLE public.technicians DROP CONSTRAINT IF EXISTS technicians_bank_verification_status_check;
ALTER TABLE public.technicians
  ADD CONSTRAINT technicians_bank_verification_status_check
  CHECK (bank_verification_status IN ('unsubmitted', 'pending', 'verified', 'rejected'));

UPDATE public.technicians
SET bank_verification_status = CASE
  WHEN coalesce(nullif(trim(bank_name), ''), nullif(trim(bank_account), ''), nullif(trim(bank_holder), '')) IS NULL
    THEN 'unsubmitted'
  WHEN bank_verification_status = 'verified'
    THEN 'verified'
  ELSE 'pending'
END
WHERE bank_verification_status IS NULL
   OR bank_verification_status = 'unsubmitted';

-- 기사 서류 Storage 경로 보존. file_url은 기존 호환용으로 계속 유지한다.
ALTER TABLE public.technician_documents
  ADD COLUMN IF NOT EXISTS storage_bucket text NULL,
  ADD COLUMN IF NOT EXISTS storage_object_path text NULL,
  ADD COLUMN IF NOT EXISTS uploaded_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_technician_documents_storage_path
  ON public.technician_documents(storage_bucket, storage_object_path);

-- 정산 지급 요청 상태와 계좌 스냅샷.
ALTER TABLE public.order_settlements
  ADD COLUMN IF NOT EXISTS payout_requested_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS payout_account_snapshot jsonb NULL;

CREATE INDEX IF NOT EXISTS idx_order_settlements_payout_requested
  ON public.order_settlements(payout_requested_at DESC);

-- 과거 Admin MVP 스키마에서 coupons.used_booking_id 가 legacy bookings FK를 바라보던 경우 보정.
-- 현재 canonical 모델은 orders 이므로 신규 쿠폰 사용은 orders.id를 저장한다.
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_used_booking_id_fkey;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_coupons_used_order'
      AND conrelid = 'public.coupons'::regclass
  ) THEN
    ALTER TABLE public.coupons
      ADD CONSTRAINT fk_coupons_used_order
      FOREIGN KEY (used_booking_id)
      REFERENCES public.orders(id)
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END $$;

-- Supabase Storage 버킷은 존재하지 않으면 생성한다. 권한 정책은 프로젝트 정책에 맞게 별도 조정 가능.
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
    VALUES (
      'order-photos',
      'order-photos',
      false,
      15728640,
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
    VALUES (
      'technician-documents',
      'technician-documents',
      false,
      15728640,
      ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']::text[]
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
