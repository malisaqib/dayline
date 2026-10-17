import type { SupabaseClient } from "@supabase/supabase-js";
import { highlightSchema, type Highlight } from "@/domain/editions/today-in-three";
import {
  editionStoriesSchema,
  profileSnapshotSchema,
  type Edition,
  type EditionSummary,
  type ProfileSnapshot,
  type StorySnapshot,
} from "@/domain/editions/edition";

const EDITION_COLUMNS = "id, user_id, local_date, timezone, generated_at, sources_fetched_at, profile_snapshot, stories, today_in_three";
export const ARCHIVE_PAGE_SIZE = 30;

type EditionRow = {
  id: string;
  user_id: string;
  local_date: string;
  timezone: string;
  generated_at: string;
  sources_fetched_at: string;
  profile_snapshot: unknown;
  stories: unknown;
  today_in_three: unknown;
};

// Stored JSON is validated on the way out so a malformed row fails loudly instead of rendering garbage.
function toEdition(row: EditionRow): Edition {
  return {
    id: row.id,
    userId: row.user_id,
    localDate: row.local_date,
    timezone: row.timezone,
    generatedAt: row.generated_at,
    sourcesFetchedAt: row.sources_fetched_at,
    profile: profileSnapshotSchema.parse(row.profile_snapshot),
    stories: editionStoriesSchema.parse(row.stories),
    todayInThree: highlightSchema.array().catch([]).parse(row.today_in_three),
  };
}

/** Reader-scoped: RLS returns null for editions the reader does not own. */
export async function findEditionById(db: SupabaseClient, id: string): Promise<Edition | null> {
  const { data, error } = await db.from("editions").select(EDITION_COLUMNS).eq("id", id).maybeSingle<EditionRow>();
  if (error) {
    throw new Error(`load edition: ${error.message}`);
  }
  return data ? toEdition(data) : null;
}

export async function findEditionByDate(db: SupabaseClient, userId: string, localDate: string): Promise<Edition | null> {
  const { data, error } = await db
    .from("editions")
    .select(EDITION_COLUMNS)
    .eq("user_id", userId)
    .eq("local_date", localDate)
    .maybeSingle<EditionRow>();
  if (error) {
    throw new Error(`load edition by date: ${error.message}`);
  }
  return data ? toEdition(data) : null;
}

export async function recentStoryKeys(db: SupabaseClient, userId: string, sinceDate: string, beforeDate: string): Promise<Set<string>> {
  const { data, error } = await db.from("editions").select("stories").eq("user_id", userId).gte("local_date", sinceDate).lt("local_date", beforeDate);
  if (error) {
    throw new Error(`load recent editions: ${error.message}`);
  }
  const keys = new Set<string>();
  for (const row of data as { stories: { articleHash?: string; url?: string }[] }[]) {
    for (const story of row.stories) {
      if (story.articleHash) {
        keys.add(story.articleHash);
      }
      if (story.url) {
        keys.add(story.url);
      }
    }
  }
  return keys;
}

/** Reader-scoped archive page, newest first. */
export async function listEditions(db: SupabaseClient, page = 0): Promise<EditionSummary[]> {
  const from = page * ARCHIVE_PAGE_SIZE;
  const { data, error } = await db
    .from("editions")
    .select("id, local_date, generated_at, stories")
    .order("local_date", { ascending: false })
    .range(from, from + ARCHIVE_PAGE_SIZE - 1);
  if (error) {
    throw new Error(`list editions: ${error.message}`);
  }
  return data.map((row) => {
    const stories = editionStoriesSchema.parse(row.stories);
    const topics = [...new Set(stories.flatMap((s) => s.topics))];
    return { id: row.id, localDate: row.local_date, generatedAt: row.generated_at, leadTitle: stories[0].title, storyCount: stories.length, topics };
  });
}

export type NewEdition = {
  userId: string;
  localDate: string;
  timezone: string;
  sourcesFetchedAt: string;
  profile: ProfileSnapshot;
  stories: StorySnapshot[];
  todayInThree: Highlight[];
};

/**
 * System-only (secret client). ON CONFLICT DO NOTHING on (user_id, local_date):
 * a concurrent or repeated insert leaves the first edition in place.
 */
export async function insertEditionIfAbsent(db: SupabaseClient, edition: NewEdition): Promise<void> {
  const { error } = await db.from("editions").upsert(
    {
      user_id: edition.userId,
      local_date: edition.localDate,
      timezone: edition.timezone,
      sources_fetched_at: edition.sourcesFetchedAt,
      profile_snapshot: edition.profile,
      stories: editionStoriesSchema.parse(edition.stories),
      today_in_three: highlightSchema.array().parse(edition.todayInThree),
    },
    { onConflict: "user_id,local_date", ignoreDuplicates: true },
  );
  if (error) {
    throw new Error(`insert edition: ${error.message}`);
  }
}
