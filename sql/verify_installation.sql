-- 전체 실행 후 상태 점검: 행 단위 PASS / FAIL 로 보임 (수정 없음, 읽기 전용 개념)
-- 앱 사용자 DB에 붙여넣어 한 번 실행.

WITH expected AS (
  SELECT * FROM (VALUES
    ('public', 'touch_updated_at'),
    ('public', 'service_categories'),
    ('public', 'service_products'),
    ('public', 'service_addons'),
    ('public', 'orders'),
    ('public', 'payments'),
    ('public', 'order_settlements'),
    ('public', 'materials'),
    ('public', 'order_extra_quotes'),
    ('public', 'order_extra_quote_items'),
    ('public', 'dispatch_notifications'),
    ('public', 'technicians'),
    ('public', 'technician_capabilities'),
    ('public', 'order_photos'),
    ('public', 'settlement_events'),
    ('public', 'emergency_service_leads')
  ) AS t(schema_name, obj)
),
funcs AS (
  SELECT n.nspname AS schema_name, p.proname AS name
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
),
tabs AS (
  SELECT table_schema AS schema_name, table_name AS name
  FROM information_schema.tables
  WHERE table_type = 'BASE TABLE'
),
unioned AS (
  SELECT e.schema_name, e.obj AS name,
    CASE
      WHEN e.obj = 'touch_updated_at' THEN EXISTS (
        SELECT 1 FROM funcs f
        WHERE f.schema_name = e.schema_name AND f.name = e.obj
      )
      ELSE EXISTS (
        SELECT 1 FROM tabs t
        WHERE t.schema_name = e.schema_name AND t.name = e.obj
      )
    END AS ok
  FROM expected e
)
SELECT
  name AS object_expected,
  CASE WHEN ok THEN 'PASS' ELSE 'FAIL — 없음 또는 스키마/이름 불일치' END AS status
FROM unioned
ORDER BY name;

-- 핵심 컬럼 (각 테이블 1건이라도 있으면 스키마에 컬럼 존재)
SELECT
  'cols_payments_order_id' AS check_id,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'order_id'
  ) THEN 'PASS' ELSE 'FAIL' END AS status
UNION ALL
SELECT
  'cols_settlements_order_id',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'order_settlements' AND column_name = 'order_id'
  ) THEN 'PASS' ELSE 'FAIL' END;

-- FK: payments → orders (이름 자동이라 LIKE 로 느슨히)
SELECT
  'fk_payments_orders' AS check_id,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_catalog = kcu.constraint_catalog
      AND tc.constraint_schema = kcu.constraint_schema
      AND tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'payments'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'order_id'
  ) THEN 'PASS' ELSE 'FAIL (FK 없거나 컬럼명 변경됨)' END AS status;

-- 시드 존재(대표 SKU 1건)
SELECT
  'seed_install_wall_product' AS check_id,
  CASE WHEN EXISTS (
    SELECT 1 FROM public.service_products
    WHERE code = 'install_wall_v1'
      AND id = 'b2000001-0000-4000-8000-000000000001'::uuid
  ) THEN 'PASS' ELSE 'FAIL (seed 미적용 또는 id 불일치)' END AS status;
