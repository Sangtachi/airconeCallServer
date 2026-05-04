import { Global, Module } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvFile } from 'node:process';
import { SUPABASE_ADMIN, type SupabaseAdmin } from './database.tokens';

let localEnvLoaded = false;

function loadLocalEnvIfPresent(): void {
  if (localEnvLoaded) return;
  localEnvLoaded = true;
  const env = process.env.NODE_ENV?.trim() || 'development';
  const candidates = [
    `.env.${env}.local`,
    '.env.local',
    `.env.${env}`,
    '.env',
  ];
  for (const name of candidates) {
    const envPath = join(process.cwd(), name);
    if (existsSync(envPath)) {
      loadEnvFile(envPath);
    }
  }
}

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_ADMIN,
      useFactory: (): SupabaseAdmin => {
        loadLocalEnvIfPresent();
        const url = process.env.SUPABASE_URL?.trim();
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
        if (!url || !key) return null;
        return createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      },
    },
  ],
  exports: [SUPABASE_ADMIN],
})
export class DatabaseModule {}
