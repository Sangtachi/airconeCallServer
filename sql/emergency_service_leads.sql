-- 긴급 접수 리드(MVP-A): 무전화 폼 저장·관리 목록용
-- 선행: 00_touch_updated_at.sql (touch_updated_at 함수 존재)

BEGIN;

CREATE TABLE IF NOT EXISTS public.emergency_service_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_session_id text NOT NULL,
  location_text text NOT NULL,
  aircon_type text NOT NULL DEFAULT '',
  issue_text text NOT NULL DEFAULT '',
  urgency text NOT NULL CHECK (urgency IN ('now', 'scheduled')),
  quoted_fee_krw integer NOT NULL DEFAULT 30000,
  matching_timeout_seconds integer NOT NULL DEFAULT 40,
  matching_started_at timestamptz NOT NULL DEFAULT now(),
  matching_deadline_at timestamptz NOT NULL,
  matching_status text NOT NULL DEFAULT 'pending' CHECK (
    matching_status IN ('pending', 'timed_out', 'contact_saved', 'converted_to_order')
  ),
  customer_phone text NULL,
  customer_name text NULL,
  user_id text NULL,
  converted_order_id uuid NULL REFERENCES public.orders (id) ON DELETE SET NULL,
  converted_booking_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_service_leads_created_at ON public.emergency_service_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_service_leads_status ON public.emergency_service_leads (matching_status);
CREATE INDEX IF NOT EXISTS idx_emergency_service_leads_session ON public.emergency_service_leads (client_session_id);

DROP TRIGGER IF EXISTS tr_emergency_service_leads_updated_at ON public.emergency_service_leads;
CREATE TRIGGER tr_emergency_service_leads_updated_at
  BEFORE UPDATE ON public.emergency_service_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
