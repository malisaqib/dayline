import type { SupabaseClient } from "@supabase/supabase-js";

export type Reader = { id: string; isAnonymous: boolean };

/** Verifies the session with the Supabase Auth server (getUser), not just the cookie contents. */
export async function getVerifiedReader(db: SupabaseClient): Promise<Reader | null> {
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return { id: data.user.id, isAnonymous: data.user.is_anonymous ?? false };
}

/** Returns the current reader, creating an anonymous session (stored in cookies) if there is none. */
export async function ensureReader(db: SupabaseClient): Promise<Reader> {
  const existing = await getVerifiedReader(db);
  if (existing) {
    return existing;
  }
  const { data, error } = await db.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(`anonymous sign-in failed: ${error?.message ?? "no user returned"}`);
  }
  return { id: data.user.id, isAnonymous: true };
}
