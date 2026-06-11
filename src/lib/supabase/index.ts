import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Main Supabase browser/client instance
 */
export const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
