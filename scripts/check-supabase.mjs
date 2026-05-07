#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvFile } from 'node:process';
import { parseEnv } from 'node:util';
import { createClient } from '@supabase/supabase-js';

function loadEnvFiles() {
  const env = process.env.NODE_ENV?.trim() || 'development';
  const candidates = ['.env', `.env.${env}`, '.env.local', `.env.${env}.local`];
  for (const name of candidates) {
    const path = join(process.cwd(), name);
    if (!existsSync(path)) continue;
    if (env === 'production') {
      loadEnvFile(path);
    } else {
      const parsed = parseEnv(readFileSync(path, 'utf8'));
      for (const [key, value] of Object.entries(parsed)) {
        process.env[key] = value;
      }
    }
  }
}

function fail(message) {
  console.error(`[supabase:check] ${message}`);
  process.exit(1);
}

loadEnvFiles();

const url = process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  fail('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Put them in .env.local or export them in the shell.');
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tableChecks = [
  ['service_products', '*'],
  ['orders', '*'],
  ['members', '*'],
  ['technicians', '*'],
  ['technician_capabilities', 'technician_id, service_type, aircon_type'],
  ['technician_regions', 'technician_id, region'],
  ['technician_availability', 'technician_id, availability_code'],
  ['technician_documents', 'id, technician_id, document_type, file_url, status'],
  ['coupons', '*'],
  ['reward_logs', '*'],
  ['admin_logs', '*'],
  ['seller_applications', '*'],
  ['emergency_service_leads', '*'],
  ['dispatch_notifications', '*'],
];

console.log(`[supabase:check] project=${url}`);
const failures = [];
for (const [table, columns] of tableChecks) {
  const { data, error } = await sb.from(table).select(columns).limit(1);
  if (error) {
    failures.push(`${table}: ${error.message}`);
    console.error(`[supabase:check] ${table}: ${error.message}`);
    continue;
  }
  console.log(`[supabase:check] ${table}: ok (${data?.length ?? 0} sampled)`);
}

if (failures.length > 0) {
  fail(`missing or incompatible schema (${failures.length})\n${failures.map((x) => `  - ${x}`).join('\n')}`);
}

console.log('[supabase:check] OK');
