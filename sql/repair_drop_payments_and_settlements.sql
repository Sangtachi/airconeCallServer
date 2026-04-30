-- payments / order_settlements 에 오래된·다른 DDL로 만든 빈 테이블이 붙어 있을 때(IF NOT EXISTS 가 스킵되는 경우).
-- ⚠ 해당 테이블에 유지해야 할 데이터가 없을 때만 실행(CASCADE 로 payments 를 참조하는 다른 테이블까지 드랍 가능).

BEGIN;

DROP TABLE IF EXISTS public.order_settlements CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;

COMMIT;

-- 다음: orders_payments_settlements.sql 을 처음부터 다시 실행 (orders 테이블은 유지)
