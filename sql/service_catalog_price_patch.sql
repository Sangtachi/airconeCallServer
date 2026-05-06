-- Existing DB price patch.
-- service_catalog_seed.sql uses ON CONFLICT DO NOTHING, so already seeded rows need explicit updates.
-- Run after service_catalog_seed.sql and extras_materials_dispatch.sql.

BEGIN;

UPDATE service_products
SET
  base_price = v.base_price,
  same_day_extra_price = v.same_day_extra_price,
  same_day_price = v.same_day_price,
  description = v.description,
  is_active = TRUE,
  updated_at = NOW()
FROM (
  VALUES
    ('clean_wall_v1', 70000, 20000, 90000, '분해 세척 기본가 - 임시 운영 가격'),
    ('clean_stand_v1', 110000, 20000, 130000, '스탠드 에어컨 분해 세척 - 임시 운영 가격'),
    ('clean_two_in_one_v1', 160000, 30000, 190000, '벽걸이+스탠드 세트 세척 - 임시 운영 가격'),
    ('clean_system_v1', 120000, 30000, 150000, '시스템 에어컨 1대 기준 세척 - 임시 운영 가격')
) AS v(code, base_price, same_day_extra_price, same_day_price, description)
WHERE service_products.code = v.code;

INSERT INTO service_addons (
  id, name, code, unit, customer_price, technician_cost_allowance,
  platform_fee_rate, description, is_active, sort_order
)
VALUES
  ('c3000001-0000-4000-8000-000000000001', '배관 추가', 'addon_pipe_meter', 'meter', 18000, 12000, 0.2, '1m당 임시 운영가', TRUE, 10),
  ('c3000001-0000-4000-8000-000000000002', '배수호스 추가', 'addon_drain_hose_meter', 'meter', 6000, 4000, 0.2, '1m당 임시 운영가', TRUE, 20),
  ('c3000001-0000-4000-8000-000000000003', '전선 추가', 'addon_wire_meter', 'meter', 7000, 5000, 0.2, '1m당 임시 운영가', TRUE, 30),
  ('c3000001-0000-4000-8000-000000000004', '타공 추가', 'addon_extra_hole', 'each', 30000, 20000, 0.2, '벽/콘크리트 상황별 추가 타공', TRUE, 40),
  ('c3000001-0000-4000-8000-000000000005', '앵글 설치', 'addon_angle_bracket', 'each', 80000, 60000, 0.18, '실외기 앵글 설치 임시 운영가', TRUE, 50),
  ('c3000001-0000-4000-8000-000000000006', '실외기 위험작업', 'addon_outdoor_hazard', 'job', 50000, 35000, 0.2, '난간/외벽 등 위험 작업 가산', TRUE, 60),
  ('c3000001-0000-4000-8000-000000000007', '고층/사다리 작업', 'addon_high_ladder', 'job', 70000, 50000, 0.18, '고층/사다리 필요 작업 가산', TRUE, 70)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  unit = EXCLUDED.unit,
  customer_price = EXCLUDED.customer_price,
  technician_cost_allowance = EXCLUDED.technician_cost_allowance,
  platform_fee_rate = EXCLUDED.platform_fee_rate,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO materials (
  name, code, category, unit, customer_price, technician_cost_allowance,
  platform_fee_rate, oem_available, supplier_name, is_active
)
VALUES
  ('동배관 1m', 'mat_copper_pipe_meter', 'pipe', 'meter', 18000, 12000, 0.20, TRUE, '임시 공급가', TRUE),
  ('배수호스 1m', 'mat_drain_hose_meter', 'pipe', 'meter', 6000, 4000, 0.20, TRUE, '임시 공급가', TRUE),
  ('전원선 1m', 'mat_power_wire_meter', 'electric', 'meter', 7000, 5000, 0.20, TRUE, '임시 공급가', TRUE),
  ('냉매 보충 1회', 'mat_refrigerant_charge', 'refrigerant', 'charge', 35000, 25000, 0.18, FALSE, '임시 공급가', TRUE),
  ('실외기 앵글', 'mat_outdoor_bracket', 'bracket', 'each', 80000, 60000, 0.18, TRUE, '임시 공급가', TRUE),
  ('기본 철거 작업', 'mat_basic_removal', 'labor', 'job', 50000, 35000, 0.20, FALSE, '임시 운영가', TRUE)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  unit = EXCLUDED.unit,
  customer_price = EXCLUDED.customer_price,
  technician_cost_allowance = EXCLUDED.technician_cost_allowance,
  platform_fee_rate = EXCLUDED.platform_fee_rate,
  oem_available = EXCLUDED.oem_available,
  supplier_name = EXCLUDED.supplier_name,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

COMMIT;
