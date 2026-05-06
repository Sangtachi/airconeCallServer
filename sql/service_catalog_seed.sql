-- Seed data aligned with aircon_install_cleaning spec.
-- 청소/추가금은 운영 전 임시 가격이며 관리자 CRUD에서 DB 기준으로 조정합니다.
-- Run after service_catalog_schema.sql

INSERT INTO service_categories (id, name, code, sort_order, is_active)
VALUES
  ('a1000001-0000-4000-8000-000000000001', '설치', 'install', 10, TRUE),
  ('a1000001-0000-4000-8000-000000000002', '청소', 'cleaning', 20, TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO service_products (
  id, category_id, name, code, service_type, aircon_type,
  base_price, same_day_extra_price, same_day_price,
  included_pipe_meter, included_refrigerant_count, included_hole_count,
  description, is_active, sort_order
)
VALUES
  (
    'b2000001-0000-4000-8000-000000000001',
    'a1000001-0000-4000-8000-000000000001',
    '벽걸이 에어컨 설치',
    'install_wall_v1',
    'install',
    'wall',
    150000, 50000, 200000,
    5, 1, 1,
    '예약 설치 기본 포함: 배관 5m, 냉매 1회, 타공 1회',
    TRUE,
    10
  ),
  (
    'b2000001-0000-4000-8000-000000000002',
    'a1000001-0000-4000-8000-000000000001',
    '스탠드 에어컨 설치',
    'install_stand_v1',
    'install',
    'stand',
    250000, 50000, 300000,
    5, 1, 1,
    NULL,
    TRUE,
    20
  ),
  (
    'b2000001-0000-4000-8000-000000000003',
    'a1000001-0000-4000-8000-000000000001',
    '투인원 에어컨 설치',
    'install_two_in_one_v1',
    'install',
    'two_in_one',
    350000, 50000, 400000,
    5, 1, 1,
    NULL,
    TRUE,
    30
  ),
  (
    'b2000001-0000-4000-8000-000000000004',
    'a1000001-0000-4000-8000-000000000002',
    '벽걸이 에어컨 청소',
    'clean_wall_v1',
    'cleaning',
    'wall',
    70000, 20000, 90000,
    0, 0, 0,
    '분해 세척 기본가 — 임시 운영 가격',
    TRUE,
    40
  ),
  (
    'b2000001-0000-4000-8000-000000000005',
    'a1000001-0000-4000-8000-000000000002',
    '스탠드 에어컨 청소',
    'clean_stand_v1',
    'cleaning',
    'stand',
    110000, 20000, 130000,
    0, 0, 0,
    '스탠드 에어컨 분해 세척 — 임시 운영 가격',
    TRUE,
    50
  ),
  (
    'b2000001-0000-4000-8000-000000000006',
    'a1000001-0000-4000-8000-000000000002',
    '투인원 에어컨 청소',
    'clean_two_in_one_v1',
    'cleaning',
    'two_in_one',
    160000, 30000, 190000,
    0, 0, 0,
    '벽걸이+스탠드 세트 세척 — 임시 운영 가격',
    TRUE,
    60
  ),
  (
    'b2000001-0000-4000-8000-000000000007',
    'a1000001-0000-4000-8000-000000000002',
    '시스템 에어컨 청소',
    'clean_system_v1',
    'cleaning',
    'system',
    120000, 30000, 150000,
    0, 0, 0,
    '시스템 에어컨 1대 기준 세척 — 임시 운영 가격',
    TRUE,
    70
  )
ON CONFLICT (code) DO NOTHING;

INSERT INTO service_addons (id, name, code, unit, customer_price, technician_cost_allowance, platform_fee_rate, description, is_active, sort_order)
VALUES
  ('c3000001-0000-4000-8000-000000000001', '배관 추가', 'addon_pipe_meter', 'meter', 18000, 12000, 0.2, '1m당 임시 운영가', TRUE, 10),
  ('c3000001-0000-4000-8000-000000000002', '배수호스 추가', 'addon_drain_hose_meter', 'meter', 6000, 4000, 0.2, '1m당 임시 운영가', TRUE, 20),
  ('c3000001-0000-4000-8000-000000000003', '전선 추가', 'addon_wire_meter', 'meter', 7000, 5000, 0.2, '1m당 임시 운영가', TRUE, 30),
  ('c3000001-0000-4000-8000-000000000004', '타공 추가', 'addon_extra_hole', 'each', 30000, 20000, 0.2, '벽/콘크리트 상황별 추가 타공', TRUE, 40),
  ('c3000001-0000-4000-8000-000000000005', '앵글 설치', 'addon_angle_bracket', 'each', 80000, 60000, 0.18, '실외기 앵글 설치 임시 운영가', TRUE, 50),
  ('c3000001-0000-4000-8000-000000000006', '실외기 위험작업', 'addon_outdoor_hazard', 'job', 50000, 35000, 0.2, '난간/외벽 등 위험 작업 가산', TRUE, 60),
  ('c3000001-0000-4000-8000-000000000007', '고층/사다리 작업', 'addon_high_ladder', 'job', 70000, 50000, 0.18, '고층/사다리 필요 작업 가산', TRUE, 70)
ON CONFLICT (code) DO NOTHING;
