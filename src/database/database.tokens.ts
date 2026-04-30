import type { SupabaseClient } from '@supabase/supabase-js';

/** Non-null 클라이언트만 주입된다고 가정할 때 타입 헬프 */
export type SupabaseAdmin = SupabaseClient | null;

export const SUPABASE_ADMIN = Symbol('SUPABASE_ADMIN');
