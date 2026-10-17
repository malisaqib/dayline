import type { SupabaseClient } from "@supabase/supabase-js";
import { effectiveWeights, topicWeightsSchema, type TopicWeights } from "@/domain/personalization/weights";
import { topicIdSchema, type TopicId } from "@/domain/topics";

/** `weights` always covers every selected topic (baseline for profiles saved before Phase 2). */
export type Profile = { userId: string; topics: TopicId[]; weights: TopicWeights };

/** Reader-scoped: pass the reader's client so RLS limits access to their own row. */
export async function findProfile(db: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await db.from("profiles").select("user_id, topics, topic_weights").eq("user_id", userId).maybeSingle();
  if (error) {
    throw new Error(`load profile: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  const topics = topicIdSchema.array().parse(data.topics);
  const stored = topicWeightsSchema.safeParse(data.topic_weights);
  return { userId: data.user_id, topics, weights: effectiveWeights(topics, stored.success ? stored.data : null) };
}

export async function saveProfile(db: SupabaseClient, userId: string, topics: TopicId[], weights: TopicWeights): Promise<void> {
  const { error } = await db
    .from("profiles")
    .upsert({ user_id: userId, topics, topic_weights: weights, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
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
