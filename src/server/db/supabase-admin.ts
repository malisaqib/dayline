import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/server/env";

let adminClient: SupabaseClient | null = null;

/**
 * Service-role client: bypasses row-level security. Use only in server code
 * for system jobs; user-facing reads must go through a user-scoped client.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const env = getSupabaseEnv();
    adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}
