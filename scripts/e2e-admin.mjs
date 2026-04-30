#!/usr/bin/env node
/**
 * 실행 전: npm run dev (또는 start) 후
 *   ADMIN_BOOTSTRAP_PASSWORD=dev ADMIN_JWT_SECRET=0123456789abcdef npm run dev
 *   npm run test:e2e-base
 */
const base = (process.argv[2] ?? 'http://127.0.0.1:4000').replace(/\/$/, '');

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

  let token;
  try {
    const login = await req('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: process.env.ADMIN_BOOTSTRAP_PASSWORD || 'dev' }),
    });
    if (!login.json.ok || !login.json.data?.accessToken) {
      throw new Error('login failed (set ADMIN_BOOTSTRAP_PASSWORD + ADMIN_JWT_SECRET): ' + JSON.stringify(login.json));
    }
    token = login.json.data.accessToken;
    console.log('[login] ok, token length', token.length);
  } catch (e) {
    console.warn('[login] skip —', e.message);
  }

  const hdr = token
    ? { Authorization: `Bearer ${token}` }
    : { 'x-admin-role': 'admin' };

  const addons = await req('/api/admin/service-addons?includeInactive=1', { headers: hdr });
  if (!addons.json.ok) throw new Error('addons: ' + JSON.stringify(addons.json));
  console.log('[addons]', addons.res.status, 'count', Array.isArray(addons.json.data) ? addons.json.data.length : '?');

  const quotes = await req('/api/admin/extra-quotes', { headers: hdr });
  if (!quotes.json.ok) throw new Error('extra-quotes: ' + JSON.stringify(quotes.json));
  console.log('[extra-quotes]', quotes.res.status, Array.isArray(quotes.json.data) ? quotes.json.data.length : quotes.json.data);

  const leadPayload = {
    clientSessionId: 'e2e_session_emergency_xx',
    location: 'e2e region',
    acType: '벽걸이',
    issue: 'smoke test',
    urgency: 'now',
    matchingTimeoutSeconds: 40,
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
