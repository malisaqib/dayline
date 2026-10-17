import type { SupabaseClient } from "@supabase/supabase-js";
import { effectiveWeights, topicWeightsSchema, type TopicWeights } from "@/domain/personalization/weights";
import { interestsSchema } from "@/domain/interests";
import { topicIdSchema, type TopicId } from "@/domain/topics";

/** `weights` always covers every selected topic (baseline for profiles saved before Phase 2). */
export type Profile = { userId: string; topics: TopicId[]; weights: TopicWeights; interests: string[] };

/** Reader-scoped: pass the reader's client so RLS limits access to their own row. */
export async function findProfile(db: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await db.from("profiles").select("user_id, topics, topic_weights, interests").eq("user_id", userId).maybeSingle();
  if (error) {
    throw new Error(`load profile: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  const topics = topicIdSchema.array().parse(data.topics);
  const stored = topicWeightsSchema.safeParse(data.topic_weights);
  const interests = interestsSchema.safeParse(data.interests);
  return { userId: data.user_id, topics, weights: effectiveWeights(topics, stored.success ? stored.data : null), interests: interests.success ? interests.data : [] };
}

export async function saveProfile(db: SupabaseClient, userId: string, topics: TopicId[], weights: TopicWeights, interests: string[] = []): Promise<void> {
  const { error } = await db
    .from("profiles")
    .upsert({ user_id: userId, topics, topic_weights: weights, interests, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) {
    throw new Error(`save profile: ${error.message}`);
  }
}

export async function saveTopicWeights(db: SupabaseClient, userId: string, weights: TopicWeights): Promise<void> {
  const { error } = await db
    .from("profiles")
    .update({ topic_weights: weights, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) {
    throw new Error(`save topic weights: ${error.message}`);
  }
}

/**
 * System-only (secret client): one page of reader ids for the daily job, keyset-paginated
 * by user_id so pages stay stable while editions are being written.
 */
export async function listProfileUserIds(db: SupabaseClient, afterUserId: string | null, limit: number): Promise<string[]> {
  let query = db.from("profiles").select("user_id").order("user_id").limit(limit);
  if (afterUserId) {
    query = query.gt("user_id", afterUserId);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`list profiles: ${error.message}`);
  }
  return data.map((row) => row.user_id as string);
}
