import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMPTY_PERSONAL_SIGNALS, personalSignals, type ReadingEvent } from "@/domain/personalization/behavior";
import { LEARNING_POLICY, learnedWeights, recencyFactor } from "@/domain/personalization/learning";
import { rankArticles, type RankableArticle } from "@/domain/personalization/rank";
import type { StoredSignal } from "@/domain/personalization/weights";

const DAY1 = new Date("2026-10-15T01:00:00Z");
const DAY2 = new Date("2026-10-16T01:00:00Z");
const DAY3 = new Date("2026-10-17T01:00:00Z");
const hash = (c: string) => c.repeat(64).slice(0, 64);

function signal(article: string, kind: "more" | "less", at: Date, topics: StoredSignal["topics"] = ["space"], edition = "e1"): StoredSignal {
  return { editionId: edition, articleHash: hash(article), topics, signal: kind, at: at.toISOString() };
}

function event(article: string, kind: "open" | "skip", at: Date, topics: ReadingEvent["topics"] = ["space"]): ReadingEvent {
  return { editionId: "e1", articleHash: hash(article), articleUrl: `https://x.example/${article}`, sourceId: "nasa", topics, kind, at: at.toISOString() };
}

function article(id: string, topics: RankableArticle["topics"], publishedAt: Date): RankableArticle {
  return {
    sourceId: `src-${id}`,
    sourceName: id,
    title: `Distinct headline number ${id} about ${topics.join(" ")}`,
    url: `https://x.example/${id}`,
    publishedAt: publishedAt.toISOString(),
    fetchedAt: publishedAt.toISOString(),
    text: "Enough reported text to be worth reading in a morning paper.",
    coverage: "excerpt",
    labels: [],
    contentHash: hash(id),
    topics,
  };
}

describe("learning across simulated days (injected clock, not production papers)", () => {
  it("day 1 starts from the reader's chosen topics at baseline", () => {
    assert.deepEqual(learnedWeights(["space", "world"], [], [], DAY1), { space: 1, world: 1 });
  });

  it("day 2 responds to explicit feedback more than to an open", () => {
    const explicit = learnedWeights(["space", "world"], [signal("a", "more", DAY1)], [], DAY2);
    const opened = learnedWeights(["space", "world"], [], [event("a", "open", DAY1)], DAY2);
    assert.ok((explicit.space ?? 0) > (opened.space ?? 0));
    assert.ok((opened.space ?? 0) > 1 && (opened.space ?? 0) < 1.06, "an open is weak evidence");
  });

  it("recent feedback matters more than old feedback, and old signals fade instead of locking in", () => {
    assert.ok(recencyFactor(DAY1.toISOString(), DAY2) > recencyFactor("2026-09-01T00:00:00Z", DAY2));
    const old = learnedWeights(["space"], [signal("a", "less", new Date("2026-08-01T00:00:00Z"))], [], DAY3);
    assert.ok((old.space ?? 0) > 0.95, "a less from months ago has almost no effect today");
  });

  it("counts the same article once even if it appeared in two papers", () => {
    const twice = learnedWeights(["space"], [signal("a", "more", DAY1, ["space"], "e1"), signal("a", "more", DAY2, ["space"], "e2")], [], DAY2);
    const once = learnedWeights(["space"], [signal("a", "more", DAY2)], [], DAY2);
    assert.equal(twice.space, once.space);
  });

  it("recovers from saturation: many Less signals clamp, then new More signals lift it again", () => {
    const many = Array.from({ length: 12 }, (_, i) => signal(`l${i}`, "less", DAY1));
    const saturated = learnedWeights(["space"], many, [], DAY1);
    assert.equal(saturated.space, 0.25);
    const recovered = learnedWeights(["space"], [...many, ...Array.from({ length: 4 }, (_, i) => signal(`m${i}`, "more", DAY3))], [], DAY3);
    assert.ok((recovered.space ?? 0) > (saturated.space ?? 0));
  });

  it("skip is bounded and forgotten after a month, never a permanent ban", () => {
    const skips = Array.from({ length: 10 }, (_, i) => event(`s${i}`, "skip", DAY1));
    assert.ok((learnedWeights(["space"], [], skips, DAY1).space ?? 0) >= 1 - LEARNING_POLICY.maxBehaviorShift);
    assert.equal(personalSignals([], skips, new Date("2026-12-01T00:00:00Z")).skipped.size, 0);
  });

  it("day 3 avoids repeating a story from a recent paper when a fresh alternative exists", () => {
    const pool = [article("old", ["space"], DAY2), article("new", ["space"], DAY2)];
    const recent = new Set([hash("old")]);
    const ranked = rankArticles(pool, { space: 1 }, DAY3, 1, { ...EMPTY_PERSONAL_SIGNALS, recent });
    assert.equal(ranked[0].article.contentHash, hash("new"));
    const onlyOld = rankArticles([pool[0]], { space: 1 }, DAY3, 1, { ...EMPTY_PERSONAL_SIGNALS, recent });
    assert.equal(onlyOld.length, 1, "with no alternative the repeat is still shown");
    assert.ok(onlyOld[0].reasons.some((r) => r.startsWith("Also in one of your recent papers")));
  });

  it("keeps explicit topic choices as the baseline: incidental clicks never remove a chosen topic", () => {
    const weights = learnedWeights(["space", "world"], [], [event("a", "open", DAY3, ["technology"])], DAY3);
    assert.deepEqual(Object.keys(weights).sort(), ["space", "world"]);
  });
});
