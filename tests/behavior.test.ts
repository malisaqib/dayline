import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BEHAVIOR_POLICY, behaviorTopicShift, personalSignals, type ReadingEvent } from "@/domain/personalization/behavior";
import { rankArticles, type RankableArticle } from "@/domain/personalization/rank";
import { deriveTopicWeights, WEIGHT_POLICY } from "@/domain/personalization/weights";
import type { TopicId } from "@/domain/topics";

const NOW = new Date("2026-10-17T06:00:00Z");
const hash = (n: number) => n.toString(16).padStart(64, "0");

function event(n: number, kind: ReadingEvent["kind"], topics: TopicId[] = ["technology"], sourceId = "ars"): ReadingEvent {
  return { editionId: "e1", articleHash: hash(n), articleUrl: `https://example.org/${n}`, sourceId, topics, kind };
}

function article(n: number, sourceId: string, topics: TopicId[], hoursOld = 2): RankableArticle {
  return {
    sourceId,
    sourceName: sourceId.toUpperCase(),
    title: `Uniquestory${n}${sourceId}`,
    url: `https://example.org/${n}`,
    publishedAt: new Date(NOW.getTime() - hoursOld * 3_600_000).toISOString(),
    fetchedAt: NOW.toISOString(),
    text: "",
    coverage: "none",
    labels: [],
    contentHash: hash(n),
    topics,
  };
}

describe("behavioural learning", () => {
  it("treats an open as a weak positive and a skip as a negative for the story's topics", () => {
    const opened = deriveTopicWeights(["technology"], [], behaviorTopicShift([event(1, "open")]));
    const skipped = deriveTopicWeights(["technology"], [], behaviorTopicShift([event(1, "skip")]));
    assert.equal(opened.technology, WEIGHT_POLICY.baseline + BEHAVIOR_POLICY.openTopicStep);
    assert.equal(skipped.technology, WEIGHT_POLICY.baseline + BEHAVIOR_POLICY.skipTopicStep);
  });

  it("bounds behaviour so many clicks cannot overwhelm explicit preferences", () => {
    const manyOpens = Array.from({ length: 50 }, (_, i) => event(i, "open"));
    const weights = deriveTopicWeights(["technology"], [], behaviorTopicShift(manyOpens));
    assert.equal(weights.technology, WEIGHT_POLICY.baseline + BEHAVIOR_POLICY.maxTopicShift);
    const affinity = personalSignals([], manyOpens).sourceAffinity.ars;
    assert.equal(affinity, BEHAVIOR_POLICY.maxSourceAffinity);
  });

  it("learns source preference from opens and More, and lets it reorder the paper", () => {
    const pool = [article(1, "bbc", ["world"]), article(2, "npr", ["world"])];
    const weights = deriveTopicWeights(["world"], []);
    const before = rankArticles(pool, weights, NOW, 2);
    const personal = personalSignals(
      [{ editionId: "e0", articleHash: hash(9), topics: ["world"], signal: "more", sourceId: "npr" }],
      [event(8, "open", ["world"], "npr")],
    );
    const after = rankArticles(pool, weights, NOW, 2, personal);
    assert.equal(before[0].article.sourceId, "bbc");
    assert.equal(after[0].article.sourceId, "npr");
    assert.ok(after[0].reasons.some((r) => r.startsWith("You often read")));
  });

  it("does not select a skipped story again while alternatives exist, but still fills a sparse paper", () => {
    const pool = [article(1, "bbc", ["world"], 1), article(2, "npr", ["world"], 30)];
    const personal = personalSignals([], [event(1, "skip", ["world"], "bbc")]);
    const weights = deriveTopicWeights(["world"], []);
    assert.deepEqual(rankArticles(pool, weights, NOW, 1, personal).map((r) => r.article.contentHash), [hash(2)]);
    const sparse = rankArticles([article(1, "bbc", ["world"])], weights, NOW, 6, personal);
    assert.equal(sparse.length, 1, "the only candidate is still used");
  });
});
