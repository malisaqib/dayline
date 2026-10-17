import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_RETURN_PATH } from "@/domain/auth/return-path";
import { getVerifiedReader } from "@/server/auth/session";
import { findProfile } from "@/server/repositories/profiles";

export async function destinationAfterSignIn(db: SupabaseClient, next: string | null): Promise<string> {
  const reader = await getVerifiedReader(db);
  if (!reader) {
    return "/signin?error=link_expired";
  }
  const profile = await findProfile(db, reader.id);
  if (!profile) {
    return "/onboarding";
  }
  return next ?? DEFAULT_RETURN_PATH;
}
