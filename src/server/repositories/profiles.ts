import type { SupabaseClient } from "@supabase/supabase-js";
import { topicIdSchema, type TopicId } from "@/domain/topics";

export type Profile = { userId: string; topics: TopicId[] };

/** Reader-scoped: pass the reader's client so RLS limits access to their own row. */
export async function findProfile(db: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await db.from("profiles").select("user_id, topics").eq("user_id", userId).maybeSingle();
  if (error) {
    throw new Error(`load profile: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  return { userId: data.user_id, topics: topicIdSchema.array().parse(data.topics) };
}

export async function saveProfile(db: SupabaseClient, userId: string, topics: TopicId[]): Promise<void> {
  const { error } = await db
    .from("profiles")
    .upsert({ user_id: userId, topics, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) {
    throw new Error(`save profile: ${error.message}`);
  }
}
