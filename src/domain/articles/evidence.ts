export type EvidenceCheck = { ok: true } | { ok: false; reason: string };

const SENTENCE_SPLIT = /(?<=[.!?])\s+(?=[A-Z0-9“"])/;

const NEGATIONS = ["not", "no", "never", "none", "without", "cannot", "can't", "won't", "didn't", "doesn't", "isn't", "wasn't", "aren't"];
const DENIALS = ["deny", "denies", "denied", "denial", "rejects", "rejected", "refutes", "refuted", "disputes", "disputed"];
const ALLEGATION_HEDGES = ["alleged", "allegedly", "allegation", "allegations", "accused", "suspected", "reportedly", "purportedly", "unconfirmed"];
const ATTRIBUTIONS = [...ALLEGATION_HEDGES, "said", "says", "say", "according", "claims", "claimed", "claim", "reported", "reports"];

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’']/g, "'")
    .split(/[^\p{L}\p{N}']+/u)
    .filter(Boolean);
}

function numbers(text: string): string[] {
  const found = text.match(/\d[\d,]*(?:\.\d+)?/g);
  if (!found) {
    return [];
  }
  return found.map((n) => n.replace(/,/g, ""));
}

function closestSentence(claim: string, source: string): string {
  const claimWords = new Set(words(claim));
  let best = source;
  let bestShared = -1;
  for (const sentence of source.split(SENTENCE_SPLIT)) {
    const shared = words(sentence).filter((word) => claimWords.has(word)).length;
    if (shared > bestShared) {
      best = sentence;
      bestShared = shared;
    }
  }
  return best;
}

function hasAny(tokens: Set<string>, list: string[]): boolean {
  return list.some((word) => tokens.has(word));
}

export function checkClaim(claim: string, source: string): EvidenceCheck {
  const sourceNumbers = new Set(numbers(source));
  const missing = numbers(claim).filter((n) => !sourceNumbers.has(n));
  if (missing.length > 0) {
    return { ok: false, reason: `numbers not in the source: ${missing.join(", ")}` };
  }
  const claimWords = new Set(words(claim));
  const sourceWords = new Set(words(closestSentence(claim, source)));
  if (hasAny(claimWords, NEGATIONS) && !hasAny(sourceWords, NEGATIONS) && !hasAny(sourceWords, DENIALS)) {
    return { ok: false, reason: "adds a negation the source does not contain" };
  }
  if (hasAny(claimWords, DENIALS) && !hasAny(sourceWords, DENIALS)) {
    return { ok: false, reason: "adds a denial the source does not contain" };
  }
  if (hasAny(sourceWords, DENIALS) && !hasAny(claimWords, DENIALS) && !hasAny(claimWords, NEGATIONS) && hasAny(claimWords, ALLEGATION_HEDGES)) {
    return { ok: false, reason: "drops the denial reported by the source" };
  }
  if (hasAny(sourceWords, ALLEGATION_HEDGES) && !hasAny(claimWords, ATTRIBUTIONS)) {
    return { ok: false, reason: "states an allegation as fact" };
  }
  return { ok: true };
}

export function extractiveSentence(source: string, minWords: number, maxWords: number): string | null {
  for (const sentence of source.split(SENTENCE_SPLIT)) {
    const trimmed = sentence.trim();
    const count = trimmed.split(/\s+/).filter(Boolean).length;
    if (/[.!?]$/.test(trimmed) && count >= minWords && count <= maxWords) {
      return trimmed;
    }
  }
  return null;
}
