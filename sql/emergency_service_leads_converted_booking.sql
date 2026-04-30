-- 기존 DB에 converted_booking_id 컬럼 추가 (이미 있으면 스킵)
ALTER TABLE public.emergency_service_leads
  ADD COLUMN IF NOT EXISTS converted_booking_id text NULL;
