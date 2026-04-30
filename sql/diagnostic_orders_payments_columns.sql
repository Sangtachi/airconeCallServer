-- 42703 "column order_id does not exist" 등 스키마 꼬임 확인용 — 읽기 전용

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('orders', 'payments', 'order_settlements')
ORDER BY table_name, ordinal_position;
