import { z } from "zod";
import { titleTokens } from "@/domain/articles/similarity";
import { checkClaim, extractiveSentence } from "@/domain/articles/evidence";
import { countWords } from "@/domain/articles/summary";
import type { StorySnapshot } from "./edition";

export const TODAY_IN_THREE_MAX = 3;
const SENTENCE_MIN_WORDS = 5;
const SENTENCE_MAX_WORDS = 35;
const MIN_GROUNDED_SHARE = 0.5;

export const highlightSchema = z.object({ articleHash: z.string().length(64), sentence: z.string().min(1), kind: z.enum(["ai", "quote"]).default("ai") });
export type Highlight = z.infer<typeof highlightSchema>;

export type HighlightCandidate = { number: number; articleHash: string; headline: string; text: string; evidence: string; sourceName: string };

export type HighlightSource = { text: string; modelAllowed: boolean };

const rawSchema = z.strictObject({
  items: z.array(z.strictObject({ story: z.number().int(), sentence: z.string().trim() })).max(TODAY_IN_THREE_MAX),
});

export function highlightCandidates(stories: StorySnapshot[], sources: Map<string, HighlightSource>): HighlightCandidate[] {
  return stories.flatMap((story, index) => {
    const source = sources.get(story.articleHash);
    if (!source || !source.modelAllowed || source.text.trim().length === 0) {
      return [];
    }
    return [{ number: index + 1, articleHash: story.articleHash, headline: story.title, text: source.text, evidence: source.text, sourceName: story.sourceName }];
  });
}

export function isGrounded(sentence: string, candidate: HighlightCandidate): boolean {
  const claimed = titleTokens(sentence);
  if (claimed.size === 0) {
    return false;
  }
  const available = titleTokens(`${candidate.headline} ${candidate.evidence}`);
  const supported = [...claimed].filter((token) => available.has(token)).length;
  return supported / claimed.size >= MIN_GROUNDED_SHARE;
}

export type HighlightParseResult = { ok: true; items: Highlight[]; dropped: number } | { ok: false; reason: string };

export function parseTodayInThree(raw: string, candidates: HighlightCandidate[]): HighlightParseResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "output is not valid JSON" };
  }
  const parsed = rawSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ") };
  }

  const used = new Set<number>();
  const items: Highlight[] = [];
  for (const item of parsed.data.items) {
    const candidate = candidates.find((c) => c.number === item.story);
    const words = countWords(item.sentence);
    if (!candidate || used.has(item.story)) {
      continue;
    }
    const shaped = words >= SENTENCE_MIN_WORDS && words <= SENTENCE_MAX_WORDS && isGrounded(item.sentence, candidate);
    if (shaped && checkClaim(item.sentence, `${candidate.headline} ${candidate.evidence}`).ok) {
      used.add(item.story);
      items.push({ articleHash: candidate.articleHash, sentence: item.sentence, kind: "ai" });
      continue;
    }
    const quote = extractiveSentence(candidate.evidence, SENTENCE_MIN_WORDS, SENTENCE_MAX_WORDS);
    if (quote) {
      used.add(item.story);
      items.push({ articleHash: candidate.articleHash, sentence: quote, kind: "quote" });
    }
  }
  return { ok: true, items, dropped: parsed.data.items.length - items.length };
}
