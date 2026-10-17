import { localEditionDate, type Edition } from "@/domain/editions/edition";
import { getVerifiedReader, type Reader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { findEditionByDate } from "@/server/repositories/editions";
import { findProfile, type Profile } from "@/server/repositories/profiles";

export type ReaderEntry =
  | { kind: "visitor" }
  | { kind: "needs_topics"; account: Reader }
  | { kind: "reader"; account: Reader; profile: Profile; todayEditionId: string | null; todayEdition: Edition | null };

export async function readReaderEntry(now = new Date()): Promise<ReaderEntry> {
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  if (!reader) {
    return { kind: "visitor" };
  }
  const profile = await findProfile(db, reader.id);
  if (!profile) {
    return { kind: "needs_topics", account: reader };
  }
  const today = await findEditionByDate(db, reader.id, localEditionDate(now));
  return { kind: "reader", account: reader, profile, todayEditionId: today ? today.id : null, todayEdition: today };
}
