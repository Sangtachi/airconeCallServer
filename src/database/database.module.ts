import { Global, Module } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN, type SupabaseAdmin } from './database.tokens';

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_ADMIN,
      useFactory: (): SupabaseAdmin => {
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
