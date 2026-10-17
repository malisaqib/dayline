import { z } from "zod";
import type { Edition } from "@/domain/editions/edition";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { findEditionById } from "@/server/repositories/editions";

const editionIdSchema = z.uuid();

/**
 * Loads an edition for the current reader. Returns null when the id is invalid,
 * there is no session, or RLS hides it (another reader's edition), so callers
 * respond with the same 404 in every case and reveal nothing about other readers.
 */
export async function readOwnEdition(rawId: string): Promise<Edition | null> {
  const id = editionIdSchema.safeParse(rawId);
  if (!id.success) {
    return null;
  }
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  if (!reader) {
    return null;
  }
  return findEditionById(db, id.data);
}
