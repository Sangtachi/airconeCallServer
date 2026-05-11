-- Push devices/events + 추가비 카탈로그 보강.
-- 선행: service_catalog_schema.sql, extras_materials_dispatch.sql, material_marketplace.sql

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

CREATE TABLE IF NOT EXISTS public.notification_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('member', 'technician', 'admin')),
  owner_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('fcm', 'web_push')),
  platform TEXT NULL,
  device_label TEXT NULL,
  token TEXT NULL,
  endpoint TEXT NOT NULL,
  endpoint_hash TEXT NOT NULL,
  subscription JSONB NULL,
  user_agent TEXT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_notification_device_endpoint UNIQUE (owner_type, owner_id, channel, endpoint_hash)
);

CREATE INDEX IF NOT EXISTS ix_notification_devices_owner
  ON public.notification_devices(owner_type, owner_id, enabled);

DROP TRIGGER IF EXISTS tr_notification_devices_updated ON public.notification_devices;
CREATE TRIGGER tr_notification_devices_updated
  BEFORE UPDATE ON public.notification_devices
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type TEXT NOT NULL CHECK (owner_type IN ('member', 'technician', 'admin')),
  owner_id TEXT NOT NULL,
  device_id UUID NULL REFERENCES public.notification_devices(id) ON DELETE SET NULL,
  channel TEXT NULL CHECK (channel IS NULL OR channel IN ('fcm', 'web_push')),
  event_type TEXT NOT NULL,
  target_table TEXT NULL,
  target_id TEXT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  error_message TEXT NULL,
  sent_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_notification_events_owner_created
  ON public.notification_events(owner_type, owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_notification_events_target
  ON public.notification_events(target_table, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_notification_events_status
  ON public.notification_events(status, created_at DESC);

INSERT INTO public.service_addons (
  name, code, unit, customer_price, technician_cost_allowance,
  platform_fee_rate, description, is_active, sort_order
)
VALUES
  ('벽걸이 배관 연장', 'addon_install_pipe_wall_meter', 'meter', 21000, 15000, 0.20, '기본 5m 외 연장 필요 시 1m당', TRUE, 101),
  ('스탠드 배관 연장', 'addon_install_pipe_stand_meter', 'meter', 23000, 16000, 0.20, '기본 5m 외 연장 필요 시 1m당', TRUE, 102),
  ('주름관 배관 연장', 'addon_install_pipe_flexible_meter', 'meter', 28000, 20000, 0.20, '주름관 배관 연장 1m당', TRUE, 103),
  ('우레탄 배수호스 변경', 'addon_urethane_drain_meter', 'meter', 3000, 2000, 0.20, '일반 배수호스에서 우레탄 호스로 변경 시 1m당', TRUE, 104),
  ('용접', 'addon_welding_each', 'each', 20000, 14000, 0.20, '실내기 1대당 가정용 용접', TRUE, 105),
  ('알루미늄 실외기 앵글 1000mm 미만', 'addon_outdoor_angle_al_1000_under', 'each', 100000, 75000, 0.18, '실외기 가로 1000mm 미만', TRUE, 106),
  ('알루미늄 실외기 앵글 1000mm 이상', 'addon_outdoor_angle_al_1000_over', 'each', 120000, 90000, 0.18, '실외기 가로 1000mm 이상', TRUE, 107),
  ('함마톤 실외기 앵글', 'addon_outdoor_angle_hammertone', 'each', 250000, 190000, 0.18, '함마톤 실외기 앵글', TRUE, 108),
  ('실외기 받침대 1단', 'addon_outdoor_stand_1step', 'each', 70000, 50000, 0.18, '바닥 받침대 1단', TRUE, 109),
  ('실외기 받침대 2단', 'addon_outdoor_stand_2step', 'each', 130000, 95000, 0.18, '선반 겸용 2단 받침대', TRUE, 110),
  ('실외기 다리', 'addon_outdoor_leg', 'each', 60000, 42000, 0.18, '실외기 다리', TRUE, 111),
  ('실외기 에어가이드/바람막이', 'addon_outdoor_airguide', 'each', 40000, 28000, 0.18, '실외기 에어가이드 또는 바람막이', TRUE, 112),
  ('배수펌프 4~6m', 'addon_drain_pump_4_6m', 'each', 100000, 75000, 0.18, '기본 호스 6m 포함', TRUE, 113),
  ('배수펌프 8m', 'addon_drain_pump_8m', 'each', 130000, 98000, 0.18, '기본 호스 8m 포함', TRUE, 114),
  ('배수펌프 10~12m', 'addon_drain_pump_10_12m', 'each', 150000, 112000, 0.18, '기본 호스 12m 포함', TRUE, 115),
  ('배수펌프 호스', 'addon_drain_pump_hose_meter', 'meter', 3000, 2000, 0.20, '배수펌프 호스 1m당', TRUE, 116),
  ('매립배관 누설 테스트 1대', 'addon_buried_pipe_leak_test_1', 'each', 50000, 35000, 0.20, '실내기 1대 기준', TRUE, 117),
  ('매립배관 누설 테스트 2대', 'addon_buried_pipe_leak_test_2', 'each', 90000, 65000, 0.20, '실내기 2대 기준', TRUE, 118),
  ('매립배관 세척 1대', 'addon_buried_pipe_clean_1', 'each', 30000, 22000, 0.20, '실내기 1대 기준', TRUE, 119),
  ('매립배관 세척 2대', 'addon_buried_pipe_clean_2', 'each', 50000, 36000, 0.20, '실내기 2대 기준', TRUE, 120),
  ('냉매 R-410 보충', 'addon_refrigerant_r410_refill', 'charge', 10000, 7000, 0.20, '현장 사용량에 따라 보충가 시작', TRUE, 121),
  ('냉매 R-410 완충', 'addon_refrigerant_r410_full', 'charge', 80000, 60000, 0.18, 'R-410 완충', TRUE, 122),
  ('냉매 R-32 보충', 'addon_refrigerant_r32_refill', 'charge', 25000, 18000, 0.20, '22년도 이후 신형모델 보충가 시작', TRUE, 123),
  ('냉매 R-32 완충', 'addon_refrigerant_r32_full', 'charge', 100000, 75000, 0.18, 'R-32 완충', TRUE, 124),
  ('스마트링크', 'addon_smart_link', 'each', 20000, 14000, 0.20, '삼성 제품 기준 자재 사용 불가 시', TRUE, 125),
  ('고객 보유 앵글 설치', 'addon_customer_angle_install', 'each', 40000, 28000, 0.20, '고객 보유 앵글이 난간에 설치된 경우', TRUE, 126),
  ('외부 앵글 설치', 'addon_external_angle_install', 'each', 50000, 35000, 0.20, '고객 보유 앵글이 난간에 미설치된 경우', TRUE, 127),
  ('난간대/외벽 위험작업', 'addon_difficult_wall_work', 'job', 30000, 22000, 0.20, '지면에서 2m 이상 설치/철거 시', TRUE, 128),
  ('일반 타공', 'addon_normal_hole', 'hole', 20000, 14000, 0.20, '기본 제공 타공 외 1구당', TRUE, 129),
  ('난타공', 'addon_hard_hole', 'hole', 40000, 30000, 0.20, '두꺼운 벽, 철근 등', TRUE, 130),
  ('인양비', 'addon_lift_fee_floor', 'floor', 20000, 14000, 0.20, '엘리베이터 없는 2층 이상 층당', TRUE, 131),
  ('출장료', 'addon_visit_fee', 'job', 30000, 24000, 0.20, '긴급 방문 또는 현장 확인 출장료', TRUE, 132),
  ('기타 현장 추가비', 'addon_misc_extra', 'job', 0, 0, 0.20, '관리자와 고객 동의 후 금액 입력', TRUE, 199)
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
