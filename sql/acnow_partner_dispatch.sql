-- ACNow 파트너 기사앱: 선호 배차 조건 + 파트너 공지
-- 선행: auth_password_patch_and_samples.sql, customer_technician_ops_patch.sql, material_marketplace.sql

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

CREATE TABLE IF NOT EXISTS public.technician_dispatch_preferences (
  technician_id uuid PRIMARY KEY REFERENCES public.technicians(id) ON DELETE CASCADE,
  regions text[] NOT NULL DEFAULT '{}',
  service_types text[] NOT NULL DEFAULT '{}',
  aircon_types text[] NOT NULL DEFAULT '{}',
  availability_codes text[] NOT NULL DEFAULT '{}',
  minimum_payout bigint NULL CHECK (minimum_payout IS NULL OR minimum_payout >= 0),
  max_distance_km numeric(8, 2) NULL CHECK (max_distance_km IS NULL OR max_distance_km > 0),
  same_day_enabled boolean NOT NULL DEFAULT true,
  reservation_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_technician_dispatch_preferences_updated
  ON public.technician_dispatch_preferences;
CREATE TRIGGER tr_technician_dispatch_preferences_updated
  BEFORE UPDATE ON public.technician_dispatch_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.partner_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_notices_active_created
  ON public.partner_notices(is_active, created_at DESC);

DROP TRIGGER IF EXISTS tr_partner_notices_updated ON public.partner_notices;
CREATE TRIGGER tr_partner_notices_updated
  BEFORE UPDATE ON public.partner_notices
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.partner_notices (title, body, is_active)
VALUES
  ('이번 주 우수 파트너 우선 배차 기준 안내', '수락률, 작업 완료율, 리뷰 점수를 함께 반영합니다.', true),
  ('작업 사진 등록 기준', '작업 전/후 사진은 정산과 고객 신뢰를 위해 필수로 확인합니다.', true)
ON CONFLICT DO NOTHING;
