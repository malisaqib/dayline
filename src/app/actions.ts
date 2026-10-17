"use server";

import { redirect } from "next/navigation";
import { profileTopicsSchema } from "@/domain/topics";
import { ensureReader, getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { saveProfile } from "@/server/repositories/profiles";
import { supportedTopicIds } from "@/server/sources/catalog";
import { weightsForTopics } from "@/server/services/feedback";
import { GenerationError, getOrCreateDailyEdition } from "@/server/services/generate-edition";

export type ActionState = { error: string | null };

async function generateAndOpen(): Promise<ActionState> {
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  if (!reader) {
    return { error: "Your session expired. Please choose your topics again." };
  }
  let editionId: string;
  try {
    editionId = (await getOrCreateDailyEdition(db, reader)).edition.id;
  } catch (error) {
    if (error instanceof GenerationError) {
      return { error: error.message };
    }
    console.error("[generate] failed", error);
    return { error: "Something went wrong while making your paper. Please try again." };
  }
  redirect(`/edition/${editionId}`);
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
  return generateAndOpen();
}

export async function openTodaysEdition(): Promise<ActionState> {
  return generateAndOpen();
}
