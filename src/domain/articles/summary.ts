import { z } from "zod";

export const SUMMARY_MIN_WORDS = 60;
export const SUMMARY_MAX_WORDS = 100;
export const MIN_TAKEAWAYS = 2;
export const MAX_TAKEAWAYS = 3;
const TAKEAWAY_MAX_CHARS = 220;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** The only shape a model summary may take. Unknown fields are rejected. */
export const articleSummarySchema = z.strictObject({
  summary: z
    .string()
    .trim()
    .refine((s) => countWords(s) >= SUMMARY_MIN_WORDS && countWords(s) <= SUMMARY_MAX_WORDS, {
      message: `summary must be ${SUMMARY_MIN_WORDS}-${SUMMARY_MAX_WORDS} words`,
    }),
  takeaways: z.array(z.string().trim().min(10).max(TAKEAWAY_MAX_CHARS)).min(MIN_TAKEAWAYS).max(MAX_TAKEAWAYS),
});

export type ArticleSummary = z.infer<typeof articleSummarySchema>;

export const EXCERPT_SUMMARY_MIN_WORDS = 12;
export const EXCERPT_SUMMARY_MAX_WORDS = 60;
export const EXCERPT_MAX_TAKEAWAYS = 2;

export const excerptSummarySchema = z.strictObject({
  summary: z
    .string()
    .trim()
    .refine((s) => countWords(s) >= EXCERPT_SUMMARY_MIN_WORDS && countWords(s) <= EXCERPT_SUMMARY_MAX_WORDS, {
      message: `summary must be ${EXCERPT_SUMMARY_MIN_WORDS}-${EXCERPT_SUMMARY_MAX_WORDS} words`,
    }),
  takeaways: z.array(z.string().trim().min(10).max(TAKEAWAY_MAX_CHARS)).max(EXCERPT_MAX_TAKEAWAYS),
});

export type SummaryParseResult = { ok: true; value: ArticleSummary } | { ok: false; reason: string };

export function parseExcerptSummary(raw: string): SummaryParseResult {
  return parseWith(raw, excerptSummarySchema);
}

/** Parses raw model text into a validated summary. Never throws. */
export function parseArticleSummary(raw: string): SummaryParseResult {
  return parseWith(raw, articleSummarySchema);
}

function parseWith(raw: string, schema: z.ZodType<ArticleSummary>): SummaryParseResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    const preview = raw.trim().slice(0, 40).replace(/\s+/g, " ");
    return { ok: false, reason: `output is not valid JSON (${raw.length} chars, starts ${JSON.stringify(preview)})` };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues.map((i) => `${i.path.join(".") || "root"}: ${i.message}`).join("; ") };
  }
  return { ok: true, value: parsed.data };
}
