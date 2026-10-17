import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { StorySnapshot } from "@/domain/editions/edition";
import { previewStories } from "@/domain/editions/preview";
import { rankArticles, type RankableArticle } from "@/domain/personalization/rank";
import { applySignal, deriveTopicWeights, effectiveWeights, WEIGHT_POLICY, type StoredSignal } from "@/domain/personalization/weights";
import type { TopicId } from "@/domain/topics";

const NOW = new Date("2026-10-17T06:00:00Z");
const hash = (n: number) => n.toString(16).padStart(64, "0");
const signal = (n: number, topics: TopicId[], value: "more" | "less"): StoredSignal => ({ editionId: "e1", articleHash: hash(n), topics, signal: value });

// Fixture stories for deterministic tests only.
function story(n: number, topics: TopicId[], hoursOld: number): StorySnapshot {
  return {
    articleHash: hash(n),
    sourceId: `s${n}`,
    sourceName: `Source ${n}`,
    title: `Fixture story ${n}`,
    url: `https://example.org/${n}`,
    publishedAt: new Date(NOW.getTime() - hoursOld * 3_600_000).toISOString(),
    fetchedAt: NOW.toISOString(),
    topics,
    reasons: ["original reason"],
    body: `Body ${n}`,
    bodyKind: "publisher_excerpt",
    takeaways: [],
    coverage: "excerpt",
    labels: [],
    summaryModel: null,
    summaryPromptVersion: null,
  };
}

describe("topic weights", () => {
  it("counts the same signal submitted twice only once", () => {
    const once = applySignal([], signal(1, ["space"], "more"));
    const twice = applySignal(once, signal(1, ["space"], "more"));
    assert.equal(twice.length, 1);
    assert.equal(deriveTopicWeights(["space"], twice).space, WEIGHT_POLICY.baseline + WEIGHT_POLICY.step);
  });

  it("replaces the effect when a signal switches from more to less", () => {
    const more = applySignal([], signal(1, ["space"], "more"));
    const less = applySignal(more, signal(1, ["space"], "less"));
    assert.equal(deriveTopicWeights(["space"], less).space, WEIGHT_POLICY.baseline - WEIGHT_POLICY.step);
  });

  it("clamps weights to the documented range", () => {
    const many = (value: "more" | "less") => Array.from({ length: 20 }, (_, i) => signal(i, ["space"], value));
    assert.equal(deriveTopicWeights(["space"], many("more")).space, WEIGHT_POLICY.max);
    assert.equal(deriveTopicWeights(["space"], many("less")).space, WEIGHT_POLICY.min);
  });

  it("gives profiles without stored weights the baseline for each selected topic", () => {
    assert.deepEqual(effectiveWeights(["space", "world"], null), { space: 1, world: 1 });
    assert.deepEqual(effectiveWeights(["space"], { space: 99 }), { space: WEIGHT_POLICY.max });
  });

  it("ignores signals for topics the reader no longer follows", () => {
    assert.deepEqual(deriveTopicWeights(["space"], [signal(1, ["world"], "more")]), { space: 1 });
  });
});

describe("preview", () => {
  const saved = [story(1, ["space"], 2), story(2, ["world"], 2), story(3, ["science"], 2)];

  it("reorders with changed weights", () => {
    const base = previewStories(saved, deriveTopicWeights(["space", "world", "science"], []), NOW);
    const boosted = previewStories(saved, deriveTopicWeights(["space", "world", "science"], [signal(3, ["science"], "more")]), NOW);
    assert.equal(base[0].articleHash, hash(1));
    assert.equal(boosted[0].articleHash, hash(3));
    assert.match(boosted[0].reasons[0], /boosted by your feedback/);
  });

  it("does not mutate the saved edition stories", () => {
    const before = JSON.stringify(saved);
    previewStories(saved, deriveTopicWeights(["space", "world", "science"], [signal(1, ["space"], "less")]), NOW);
    assert.equal(JSON.stringify(saved), before);
  });
});

describe("future ranking", () => {
  const article = (n: number, sourceId: string, topics: TopicId[]): RankableArticle => ({
    sourceId,
    sourceName: sourceId,
    title: `Fixture article ${n}`,
    url: `https://example.org/a/${n}`,
    publishedAt: new Date(NOW.getTime() - 3_600_000).toISOString(),
    fetchedAt: NOW.toISOString(),
    text: "Fixture text long enough to be shown as an excerpt.",
    coverage: "excerpt",
    labels: [],
    contentHash: hash(n),
    topics,
  });
  const pool = [article(1, "a", ["space"]), article(2, "b", ["world"])];

  it("uses updated weights for the next edition's lead", () => {
    const topics: TopicId[] = ["space", "world"];
    const before = rankArticles(pool, deriveTopicWeights(topics, []), NOW, 2);
    const after = rankArticles(pool, deriveTopicWeights(topics, [signal(9, ["world"], "more")]), NOW, 2);
    assert.equal(before[0].article.contentHash, hash(1));
    assert.equal(after[0].article.contentHash, hash(2));
  });
});
