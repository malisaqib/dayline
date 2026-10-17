"use server";

import { redirect } from "next/navigation";
import { profileTopicsSchema } from "@/domain/topics";
import { ensureReader, getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { saveProfile } from "@/server/repositories/profiles";
import { supportedTopicIds } from "@/server/sources/catalog";
import { FeedbackError, feedbackInputSchema, recordFeedback, weightsForTopics } from "@/server/services/feedback";
import { GenerationError, getOrCreateDailyEdition, type GenerationResult } from "@/server/services/generate-edition";

export type ActionState = { error: string | null };

function editionPath(result: GenerationResult, fromOnboarding: boolean): string {
  const params = new URLSearchParams();
  if (fromOnboarding && !result.stats.reused) {
    params.set("welcome", "1");
  }
  if (!result.stats.reused && result.stats.failedSources.length > 0) {
    params.set("sources", "partial");
  }
  const query = params.toString();
  if (query) {
    return `/edition/${result.edition.id}?${query}`;
  }
  return `/edition/${result.edition.id}`;
}

async function generateAndOpen(fromOnboarding = false): Promise<ActionState> {
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  if (!reader) {
    return { error: "Your session expired. Please choose your topics again." };
  }
  let path: string;
  try {
    path = editionPath(await getOrCreateDailyEdition(db, reader), fromOnboarding);
  } catch (error) {
    if (error instanceof GenerationError) {
      return { error: error.message };
    }
    console.error("[generate] failed", error);
    return { error: "Something went wrong while making your paper. Please try again." };
  }
  redirect(path);
}

export async function completeOnboarding(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = profileTopicsSchema.safeParse(form.getAll("topics"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Choose between one and three topics." };
  }
  const supported = supportedTopicIds();
  if (!parsed.data.every((t) => supported.has(t))) {
    return { error: "One of the chosen topics is not available." };
  }

  const db = await createReaderSupabase();
  try {
    const reader = await ensureReader(db);
    await saveProfile(db, reader.id, parsed.data, await weightsForTopics(db, reader, parsed.data));
  } catch (error) {
    console.error("[onboarding] failed", error);
    return { error: "We couldn't save your topics. Please try again." };
  }
  return generateAndOpen(true);
}

export async function openTodaysEdition(): Promise<ActionState> {
  return generateAndOpen();
}

export type FeedbackActionResult =
  | { ok: true; changes: { label: string; direction: "stronger" | "weaker" }[] }
  | { ok: false; error: string };

export async function submitFeedback(input: unknown): Promise<FeedbackActionResult> {
  const parsed = feedbackInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "That feedback could not be read." };
  }
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  if (!reader) {
    return { ok: false, error: "Your session expired. Reload the page and try again." };
  }
  try {
    const result = await recordFeedback(db, reader, parsed.data);
    return { ok: true, changes: result.changes.map(({ label, direction }) => ({ label, direction })) };
  } catch (error) {
    if (error instanceof FeedbackError) {
      return { ok: false, error: error.message };
    }
    console.error("[feedback] failed", error);
    return { ok: false, error: "We couldn't save that. Please try again." };
  }
}
