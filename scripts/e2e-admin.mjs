#!/usr/bin/env node
/**
 * 실행 전: npm run dev (또는 start) 후
 *   npm run test:e2e-base
 *
 * 긴급 접수 자동 전환 검증에는 매칭 마감까지 대기(짧은 timeout) 후 PATCH /timeout 필요.
 */
const base = (process.argv[2] ?? 'http://127.0.0.1:4000').replace(/\/$/, '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function req(path, init = {}) {
  const res = await fetch(`${base}${path}`, {
    credentials: 'omit',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    ...init,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON ${res.status}: ${text.slice(0, 240)}`);
  }
  return { res, json };
}

async function main() {
  const metrics = await req('/api/metrics');
  console.log('[metrics]', metrics.res.status, Object.keys(metrics.json));

  // 이번 단계는 role-only 임시 모드이므로 x-admin-role 헤더로 검증한다.
  const hdr = { 'x-admin-role': 'super_admin' };

  const addons = await req('/api/admin/service-addons?includeInactive=1', { headers: hdr });
  if (!addons.json.ok) throw new Error('addons: ' + JSON.stringify(addons.json));
  console.log('[addons]', addons.res.status, 'count', Array.isArray(addons.json.data) ? addons.json.data.length : '?');

  const quotes = await req('/api/admin/extra-quotes', { headers: hdr });
  if (!quotes.json.ok) throw new Error('extra-quotes: ' + JSON.stringify(quotes.json));
  console.log('[extra-quotes]', quotes.res.status, Array.isArray(quotes.json.data) ? quotes.json.data.length : quotes.json.data);

  const leadPayload = {
    clientSessionId: `e2e_session_emergency_${Date.now()}`,
    location: 'e2e test region 한글',
    acType: '벽걸이',
    issue: 'smoke emergency dispatch',
    urgency: 'now',
    matchingTimeoutSeconds: 5,
  };
  const leadCreate = await req('/api/emergency-leads', {
    method: 'POST',
    body: JSON.stringify(leadPayload),
  });
  if (!leadCreate.json.ok || !leadCreate.json.data?.leadId) {
    throw new Error('emergency-leads create: ' + JSON.stringify(leadCreate.json));
  }
  const leadId = leadCreate.json.data.leadId;
  console.log('[emergency-leads POST]', leadCreate.res.status, 'leadId', leadId);

  await sleep(5200);

  const tout = await req(`/api/emergency-leads/${leadId}/timeout`, {
    method: 'PATCH',
    body: JSON.stringify({ clientSessionId: leadPayload.clientSessionId }),
  });
  if (!tout.json.ok) throw new Error('emergency-leads timeout: ' + JSON.stringify(tout.json));
  const converted = tout.json.data;
  if (!converted?.convertedOrderId) {
    throw new Error('expected converted order id after timeout: ' + JSON.stringify(converted));
  }
  if (converted.matchingStatus !== 'converted_to_order') {
    throw new Error('expected converted_to_order, got ' + JSON.stringify(converted.matchingStatus));
  }
  if (converted.convertedBookingId && converted.convertedBookingId !== converted.convertedOrderId) {
    throw new Error('deprecated convertedBookingId must match convertedOrderId: ' + JSON.stringify(converted));
  }
  console.log('[emergency-leads PATCH timeout]', 'order', converted.convertedOrderId);

  const orders = await req('/api/admin/customer-orders', { headers: hdr });
  if (!orders.json.ok) throw new Error('orders: ' + JSON.stringify(orders.json));
  const ol = orders.json.data;
  const ord = Array.isArray(ol) ? ol.find((o) => String(o.id) === String(converted.convertedOrderId)) : null;
  if (!ord) throw new Error(`order draft ${converted.convertedOrderId} not in admin list`);
  console.log('[customer-orders]', 'matched emergency order', ord.id);

  const tout2 = await req(`/api/emergency-leads/${leadId}/timeout`, {
    method: 'PATCH',
    body: JSON.stringify({ clientSessionId: leadPayload.clientSessionId }),
  });
  if (!tout2.json.ok) throw new Error('duplicate timeout failed: ' + JSON.stringify(tout2.json));
  const again = tout2.json.data;
  if (again.convertedOrderId !== converted.convertedOrderId) {
    throw new Error(`idempotency violated: ${JSON.stringify(again)} vs ${JSON.stringify(converted)}`);
  }
  console.log('[duplicate timeout] same order id OK');

  const leadList = await req('/api/admin/emergency-leads', { headers: hdr });
  if (!leadList.json.ok) throw new Error('emergency-leads list: ' + JSON.stringify(leadList.json));
  const leadRows = Array.isArray(leadList.json.data) ? leadList.json.data : [];
  if (!leadRows.some((r) => String(r?.id || '') === String(leadId))) {
    throw new Error(`emergency-leads admin list missing lead ${leadId}`);
  }
  console.log('[emergency-leads GET admin]', leadList.res.status, 'contains new lead');

  console.log('e2e-admin: OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
