-- 부분 적용 후 42883(함수 없음) 복구용.
-- 순서: 1) 본 파일 실행 → 2) 실패했던 DDL(orders 또는 extras)을 다시 실행.

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

-- 테이블이 있을 때만 트리거 재부착 (IF EXISTS 패턴)

DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_orders_updated ON public.orders;
    CREATE TRIGGER tr_orders_updated
      BEFORE UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.touch_updated_at();
  END IF;

  IF to_regclass('public.payments') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_payments_updated ON public.payments;
    CREATE TRIGGER tr_payments_updated
      BEFORE UPDATE ON public.payments
      FOR EACH ROW
      EXECUTE FUNCTION public.touch_updated_at();
  END IF;

  IF to_regclass('public.order_settlements') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_settlements_updated ON public.order_settlements;
    CREATE TRIGGER tr_settlements_updated
      BEFORE UPDATE ON public.order_settlements
      FOR EACH ROW
      EXECUTE FUNCTION public.touch_updated_at();
  END IF;

  IF to_regclass('public.materials') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_materials_updated ON public.materials;
    CREATE TRIGGER tr_materials_updated
      BEFORE UPDATE ON public.materials
      FOR EACH ROW
      EXECUTE FUNCTION public.touch_updated_at();
  END IF;

  IF to_regclass('public.order_extra_quotes') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_quote_updated ON public.order_extra_quotes;
    CREATE TRIGGER tr_quote_updated
      BEFORE UPDATE ON public.order_extra_quotes
      FOR EACH ROW
      EXECUTE FUNCTION public.touch_updated_at();
  END IF;

  IF to_regclass('public.dispatch_notifications') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS tr_dispatch_updated ON public.dispatch_notifications;
    CREATE TRIGGER tr_dispatch_updated
      BEFORE UPDATE ON public.dispatch_notifications
      FOR EACH ROW
      EXECUTE FUNCTION public.touch_updated_at();
  END IF;
END $$;
