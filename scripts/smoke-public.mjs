#!/usr/bin/env node
/**
 * 공개 API 최소 스모크 (인증 헤더 없음).
 * 용도: airconeCall 이 기대하는 경로·봉투 `{ ok, data }` 회귀 확인.
 *
 * 사용: 서버 기동 후 `npm run smoke-public http://127.0.0.1:4000`
 */
const base = (process.argv[2] || 'http://127.0.0.1:4000').replace(/\/$/, '');

async function mustOk(label, res) {
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${label}: Non-JSON ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok || json?.ok === false) {
    throw new Error(`${label}: ${res.status} ${text.slice(0, 400)}`);
  }
  if (json?.data === undefined) throw new Error(`${label}: missing envelope data`);
  return json.data;
}

async function main() {
  const products = await mustOk(
    'GET /api/service-products?serviceType=install',
    await fetch(`${base}/api/service-products?serviceType=install`, { headers: { Accept: 'application/json' } }),
  );
  if (!Array.isArray(products)) throw new Error('service-products: data not array');

  const sessionId = `smoke_sess_${Date.now().toString(36)}`.slice(0, 120);
  const body = {
    clientSessionId: sessionId.length >= 8 ? sessionId : `${sessionId}_padding`,
    location: 'smoke-public 테스트 장소',
    matchingTimeoutSeconds: 5,
    urgency: 'now',
    acType: '벽걸이',
    issue: 'smoke',
  };

  const lead = await mustOk(
    'POST /api/emergency-leads',
    await fetch(`${base}/api/emergency-leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    }),
  );
  if (!lead?.leadId) throw new Error('emergency-leads: no leadId in data');

  // eslint-disable-next-line no-console
  console.log('smoke-public: OK', { products: products.length, leadId: lead.leadId });
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
