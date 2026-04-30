-- 읽기 전용: 지금 DB에 무엇까지 적용됐는지 확인 (Supabase SQL Editor에서 실행)

-- 1) touch_updated_at 트리거 함수 존재 여부
SELECT n.nspname AS schema, p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'touch_updated_at'
ORDER BY n.nspname;

-- 2) 카탈로그·주문 관련 테이블
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'service_categories',
    'service_products',
    'service_addons',
    'orders',
    'payments',
    'order_settlements',
    'materials',
    'order_extra_quotes',
    'order_extra_quote_items',
    'dispatch_notifications'
  )
ORDER BY table_name;

-- 3) updated_at 트리거가 붙은지 (위 테이블 대상)
SELECT event_object_table AS table_name, trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'tr_orders_updated',
    'tr_payments_updated',
    'tr_settlements_updated',
    'tr_materials_updated',
    'tr_quote_updated',
    'tr_dispatch_updated'
  )
ORDER BY event_object_table, trigger_name;
