import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv, getSupabaseSecretEnv } from "@/server/env";

let adminClient: SupabaseClient | null = null;

/**
 * Secret-key client: bypasses row-level security. Only for system work that no
 * reader may do directly (shared article pool, summary cache, inserting an
 * edition for an already-verified user). Never use it to read reader data.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(getPublicSupabaseEnv().NEXT_PUBLIC_SUPABASE_URL, getSupabaseSecretEnv().SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}
