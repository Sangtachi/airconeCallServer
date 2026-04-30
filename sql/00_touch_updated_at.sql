-- 항상 먼저 실행해도 안전 (CREATE OR REPLACE).
-- extras만 먼저 돌렸다가 42883 이 났다면: 이 파일 한 번 실행 후 extras를 다시 실행하세요.

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
