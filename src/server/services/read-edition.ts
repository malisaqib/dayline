import { z } from "zod";
import type { Edition } from "@/domain/editions/edition";
import type { FeedbackSignal } from "@/domain/personalization/weights";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { findEditionById } from "@/server/repositories/editions";
import { signalsForEdition } from "@/server/repositories/feedback";
import { findProfile, type Profile } from "@/server/repositories/profiles";

const editionIdSchema = z.uuid();

/**
 * Loads an edition for the current reader. Returns null when the id is invalid,
 * there is no session, or RLS hides it (another reader's edition), so callers
 * respond with the same 404 in every case and reveal nothing about other readers.
 */
export async function readOwnEdition(rawId: string): Promise<Edition | null> {
  return (await readOwnEditionWithContext(rawId))?.edition ?? null;
}

export type EditionContext = { edition: Edition; profile: Profile | null; signals: Record<string, FeedbackSignal> };

/** The edition plus the reader's current profile weights and their signals on this edition. */
export async function readOwnEditionWithContext(rawId: string): Promise<EditionContext | null> {
  const id = editionIdSchema.safeParse(rawId);
  if (!id.success) {
    return null;
  }
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  if (!reader) {
    return null;
  }
  const edition = await findEditionById(db, id.data);
  if (!edition) {
    return null;
  }
  const [profile, signals] = await Promise.all([findProfile(db, reader.id), signalsForEdition(db, edition.id)]);
  return { edition, profile, signals };
}
