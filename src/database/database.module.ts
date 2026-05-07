import { Global, Module } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvFile } from 'node:process';
import { parseEnv } from 'node:util';
import { SUPABASE_ADMIN, type SupabaseAdmin } from './database.tokens';

let localEnvLoaded = false;

function loadLocalEnvIfPresent(): void {
  if (localEnvLoaded) return;
  localEnvLoaded = true;
  const env = process.env.NODE_ENV?.trim() || 'development';
  const candidates = ['.env', `.env.${env}`, '.env.local', `.env.${env}.local`];
  for (const name of candidates) {
    const envPath = join(process.cwd(), name);
    if (existsSync(envPath)) {
      if (env === 'production') {
        loadEnvFile(envPath);
      } else {
        const parsed = parseEnv(readFileSync(envPath, 'utf8'));
        for (const [key, value] of Object.entries(parsed)) {
          process.env[key] = value;
        }
      }
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
