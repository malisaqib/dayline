import { z } from "zod";

export const MAX_INTERESTS = 5;
export const MAX_INTEREST_CHARS = 40;

export const SUGGESTED_INTERESTS = ["AI agents", "Startups", "Climate", "Cricket", "Mars", "Ransomware", "Electric vehicles", "Earthquakes"];

const ALIASES: Record<string, string[]> = {
  ai: ["artificial intelligence"],
  "artificial intelligence": ["ai"],
  "ai agents": ["ai agent", "agentic ai"],
  startups: ["startup", "start-up", "start-ups"],
  "electric vehicles": ["electric vehicle", "ev", "evs"],
  climate: ["climate change", "global warming"],
  mars: ["red planet"],
  ransomware: ["ransomware attack"],
  earthquakes: ["earthquake", "quake", "quakes"],
  crypto: ["cryptocurrency", "bitcoin"],
};

export function normalizeInterest(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#.\- ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const interestSchema = z
  .string()
  .transform(normalizeInterest)
  .pipe(
    z
      .string()
      .min(2, "Each interest needs at least two characters.")
      .max(MAX_INTEREST_CHARS, `Keep each interest under ${MAX_INTEREST_CHARS} characters.`)
      .regex(/[\p{L}\p{N}]/u, "Each interest needs a letter or number."),
  );

export const interestsSchema = z
  .array(interestSchema)
  .transform((phrases) => [...new Set(phrases)])
  .pipe(z.array(z.string()).max(MAX_INTERESTS, `Add at most ${MAX_INTERESTS} interests.`));

function tokens(text: string): string[] {
  return normalizeInterest(text)
    .split(" ")
    .map((token) => token.replace(/^[.\-]+|[.\-]+$/g, ""))
    .filter(Boolean);
}

function aliasesFor(phrase: string): string[] {
  if (phrase in ALIASES) {
    return ALIASES[phrase];
  }
  return [];
}

function variants(phrase: string): string[][] {
  const forms = [phrase, ...aliasesFor(phrase)].map(tokens).filter((form) => form.length > 0);
  const plurals = forms.flatMap((form) => {
    const last = form[form.length - 1];
    if (last.length < 3) {
      return [];
    }
    if (last.endsWith("s") && last.length >= 5 && !last.endsWith("ss")) {
      return [[...form.slice(0, -1), last.slice(0, -1)]];
    }
    return [[...form.slice(0, -1), `${last}s`]];
  });
  return [...forms, ...plurals];
}

function containsSequence(haystack: string[], needle: string[]): boolean {
  for (let start = 0; start + needle.length <= haystack.length; start++) {
    if (needle.every((token, offset) => haystack[start + offset] === token)) {
      return true;
    }
  }
  return false;
}

export function matchInterests(text: string, interests: string[]): string[] {
  if (interests.length === 0) {
    return [];
  }
  const words = tokens(text);
  return interests.filter((interest) => variants(interest).some((form) => containsSequence(words, form)));
}

export function interestReason(interest: string): string {
  return `Matches your interest in "${interest}"`;
}

export function interestsWithoutCoverage(interests: string[], storyReasons: string[][]): string[] {
  const reasons = new Set(storyReasons.flat());
  return interests.filter((interest) => !reasons.has(interestReason(interest)));
}
