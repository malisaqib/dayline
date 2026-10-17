import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  applySignal,
  deriveTopicWeights,
  describeWeightChanges,
  feedbackSignalSchema,
  type TopicWeights,
  type WeightChange,
} from "@/domain/personalization/weights";
import type { TopicId } from "@/domain/topics";
import type { Reader } from "@/server/auth/session";
import { findEditionById } from "@/server/repositories/editions";
import { listSignals, upsertFeedback } from "@/server/repositories/feedback";
import { findProfile, saveTopicWeights } from "@/server/repositories/profiles";

export const feedbackInputSchema = z.object({
  editionId: z.uuid(),
  articleHash: z.string().regex(/^[0-9a-f]{64}$/),
  signal: feedbackSignalSchema,
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export class FeedbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeedbackError";
  }
}

export type FeedbackResult = { weights: TopicWeights; changes: WeightChange[] };

/**
 * Records one explicit signal through the reader's RLS-scoped client and
 * recomputes their weights from all stored signals. Story topics come from the
 * owned, immutable edition snapshot, never from the request. The edition itself
 * is not modified.
 */
export async function recordFeedback(readerDb: SupabaseClient, reader: Reader, input: FeedbackInput): Promise<FeedbackResult> {
  // RLS returns null for another reader's edition; respond exactly as for a missing one.
  const edition = await findEditionById(readerDb, input.editionId);
  const story = edition?.stories.find((s) => s.articleHash === input.articleHash);
  if (!edition || !story) {
    throw new FeedbackError("That story is not in one of your papers.");
  }
  const profile = await findProfile(readerDb, reader.id);
  if (!profile) {
    throw new FeedbackError("Choose your topics before giving feedback.");
  }

  const signal = { editionId: edition.id, articleHash: story.articleHash, topics: story.topics as TopicId[], signal: input.signal };
  await upsertFeedback(readerDb, reader.id, signal);

  // Derive from the stored history plus this signal, so a read lagging the write cannot drop it.
  const signals = applySignal(await listSignals(readerDb, reader.id), signal);
  const weights = deriveTopicWeights(profile.topics, signals);
  await saveTopicWeights(readerDb, reader.id, weights);
  return { weights, changes: describeWeightChanges(profile.weights, weights) };
}

/** Weights for a new topic selection, keeping the reader's existing feedback. */
export async function weightsForTopics(readerDb: SupabaseClient, reader: Reader, topics: TopicId[]): Promise<TopicWeights> {
  return deriveTopicWeights(topics, await listSignals(readerDb, reader.id));
}
