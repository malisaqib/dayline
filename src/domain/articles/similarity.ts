const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have", "in", "into", "is", "it", "its",
  "of", "on", "or", "over", "says", "say", "that", "the", "their", "this", "to", "was", "were", "will", "with",
]);

const BOILERPLATE = new Set(["live", "update", "updates", "watch", "video", "breaking", "exclusive", "show", "ask", "hn"]);

const DATE_WORDS = new Set([
  "today", "yesterday", "tomorrow", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
  "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
]);

const JACCARD_THRESHOLD = 0.7;
const CONTAINMENT_THRESHOLD = 0.8;
const CONTAINMENT_MIN_TOKENS = 4;

function isNoiseToken(token: string): boolean {
  if (STOP_WORDS.has(token) || BOILERPLATE.has(token) || DATE_WORDS.has(token)) {
    return true;
  }
  return /^\d{1,2}$/.test(token) || /^(19|20)\d{2}$/.test(token);
}

export function titleTokens(title: string): Set<string> {
  const words = title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").split(" ").filter(Boolean);
  return new Set(words.filter((word) => !isNoiseToken(word)));
}

export function tokenSimilarity(left: Set<string>, right: Set<string>): { jaccard: number; containment: number; smaller: number } {
  const shared = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  const smaller = Math.min(left.size, right.size);
  return { jaccard: union === 0 ? 0 : shared / union, containment: smaller === 0 ? 0 : shared / smaller, smaller };
}

export function areSameStory(left: Set<string>, right: Set<string>): boolean {
  const { jaccard, containment, smaller } = tokenSimilarity(left, right);
  if (jaccard >= JACCARD_THRESHOLD) {
    return true;
  }
  return smaller >= CONTAINMENT_MIN_TOKENS && containment >= CONTAINMENT_THRESHOLD;
}

export function isNearDuplicateTitle(a: string, b: string): boolean {
  return areSameStory(titleTokens(a), titleTokens(b));
}
