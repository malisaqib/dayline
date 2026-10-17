import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  applySignal,
  describeWeightChanges,
  feedbackSignalSchema,
  type TopicWeights,
  type WeightChange,
} from "@/domain/personalization/weights";
import { readingKindSchema, type ReadingEvent } from "@/domain/personalization/behavior";
import { learnedWeights } from "@/domain/personalization/learning";
import type { TopicId } from "@/domain/topics";
import type { Reader } from "@/server/auth/session";
import { findEditionById } from "@/server/repositories/editions";
import { listSignals, upsertFeedback } from "@/server/repositories/feedback";
import { deleteSkip, insertReadingEvent, listReadingEvents } from "@/server/repositories/reading-events";
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

  const signal = { editionId: edition.id, articleHash: story.articleHash, topics: story.topics as TopicId[], signal: input.signal, sourceId: story.sourceId };
  await upsertFeedback(readerDb, reader.id, signal);

  const signals = applySignal(await listSignals(readerDb, reader.id), signal);
  const events = await listReadingEvents(readerDb, reader.id);
  const weights = learnedWeights(profile.topics, signals, events, new Date());
  await saveTopicWeights(readerDb, reader.id, weights);
  return { weights, changes: describeWeightChanges(profile.weights, weights) };
}

export const readingInputSchema = z.object({
  editionId: z.uuid(),
  articleHash: z.string().regex(/^[0-9a-f]{64}$/),
  kind: readingKindSchema,
});

export type ReadingInput = z.infer<typeof readingInputSchema>;

async function ownedStory(readerDb: SupabaseClient, editionId: string, articleHash: string) {
  const edition = await findEditionById(readerDb, editionId);
  const story = edition?.stories.find((s) => s.articleHash === articleHash);
  if (!edition || !story) {
    throw new FeedbackError("That story is not in one of your papers.");
  }
  return { edition, story };
}

async function recomputeWeights(readerDb: SupabaseClient, reader: Reader): Promise<FeedbackResult> {
  const profile = await findProfile(readerDb, reader.id);
  if (!profile) {
    throw new FeedbackError("Choose your topics before giving feedback.");
  }
  const [signals, events] = await Promise.all([listSignals(readerDb, reader.id), listReadingEvents(readerDb, reader.id)]);
  const weights = learnedWeights(profile.topics, signals, events, new Date());
  await saveTopicWeights(readerDb, reader.id, weights);
  return { weights, changes: describeWeightChanges(profile.weights, weights) };
}

export async function recordReading(readerDb: SupabaseClient, reader: Reader, input: ReadingInput): Promise<FeedbackResult> {
  const { edition, story } = await ownedStory(readerDb, input.editionId, input.articleHash);
  const event: ReadingEvent = {
    editionId: edition.id,
    articleHash: story.articleHash,
    articleUrl: story.url,
    sourceId: story.sourceId,
    topics: story.topics as TopicId[],
    kind: input.kind,
  };
  await insertReadingEvent(readerDb, reader.id, event);
  return recomputeWeights(readerDb, reader);
}

export async function undoSkip(readerDb: SupabaseClient, reader: Reader, input: Omit<ReadingInput, "kind">): Promise<FeedbackResult> {
  await ownedStory(readerDb, input.editionId, input.articleHash);
  await deleteSkip(readerDb, reader.id, input.editionId, input.articleHash);
  return recomputeWeights(readerDb, reader);
}

/** Weights for a new topic selection, keeping the reader's existing feedback. */
export async function weightsForTopics(readerDb: SupabaseClient, reader: Reader, topics: TopicId[]): Promise<TopicWeights> {
  const [signals, events] = await Promise.all([listSignals(readerDb, reader.id), listReadingEvents(readerDb, reader.id)]);
  return learnedWeights(topics, signals, events, new Date());
}
