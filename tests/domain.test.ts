import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildEditionStories, chooseStoryBody, type StoryBody } from "@/domain/editions/build-edition";
import type { Edition } from "@/domain/editions/edition";
import { presentEdition } from "@/domain/editions/presentation";
import { MAX_STORIES_PER_SOURCE, rankArticles, type RankableArticle } from "@/domain/personalization/rank";
import type { SourceUsage } from "@/domain/sources/usage";
import type { TopicId } from "@/domain/topics";
import { deriveTopicWeights } from "@/domain/personalization/weights";

const w = (topics: TopicId[]) => deriveTopicWeights(topics, []);
import { toPrintEdition } from "@/server/pdf/edition-to-print";

const NOW = new Date("2026-10-17T06:00:00Z");

// Fixture articles for deterministic tests only.
function article(id: number, sourceId: string, topics: TopicId[], hoursOld: number, text = "Fixture text long enough to be shown as an excerpt."): RankableArticle {
  return {
    sourceId,
    sourceName: sourceId.toUpperCase(),
    title: `Fixture story ${id}`,
    url: `https://example.org/${sourceId}/${id}`,
    publishedAt: new Date(NOW.getTime() - hoursOld * 3_600_000).toISOString(),
    fetchedAt: NOW.toISOString(),
    text,
    coverage: "excerpt",
    labels: [],
    contentHash: id.toString(16).padStart(64, "0"),
    topics,
  };
}

const POOL = [
  article(1, "nasa", ["space", "science"], 2),
  article(2, "nasa", ["space", "science"], 3),
  article(3, "nasa", ["space", "science"], 4),
  article(4, "ars", ["technology"], 1),
  article(5, "dawn", ["pakistan"], 1),
  article(6, "sd", ["science"], 500),
];

describe("rankArticles", () => {
  it("is deterministic and only returns topic matches", () => {
    const a = rankArticles(POOL, w(["space"]), NOW, 6);
    const b = rankArticles([...POOL].reverse(), w(["space"]), NOW, 6);
    assert.deepEqual(a.map((r) => r.article.contentHash), b.map((r) => r.article.contentHash));
    assert.ok(a.every((r) => r.matchedTopics.includes("space")));
  });

  it("caps stories per source and drops stale articles", () => {
    const ranked = rankArticles(POOL, w(["space", "science"]), NOW, 6);
    assert.ok(ranked.filter((r) => r.article.sourceId === "nasa").length <= MAX_STORIES_PER_SOURCE);
    assert.ok(!ranked.some((r) => r.article.sourceId === "sd"));
  });

  it("gives different profiles different front pages from the same pool", () => {
    const space = rankArticles(POOL, w(["space"]), NOW, 6);
    const pakistan = rankArticles(POOL, w(["pakistan"]), NOW, 6);
    assert.notEqual(space[0].article.contentHash, pakistan[0].article.contentHash);
  });
});

describe("chooseStoryBody", () => {
  const unverified: SourceUsage = { display: "excerpt", aiProcessing: false, aiExcerptSummary: false, basis: "unverified" };
  const summary = { brief: "A cached brief.", takeaways: ["A takeaway."], model: "m", promptVersion: "v" };

  it("never uses an AI summary for a source not cleared for AI processing", () => {
    assert.equal(chooseStoryBody(POOL[0], unverified, summary).kind, "publisher_excerpt");
  });

  it("falls back to headline only when there is no usable text", () => {
    assert.equal(chooseStoryBody(article(9, "x", ["world"], 1, ""), unverified, null).kind, "headline_only");
  });
});

describe("presentEdition", () => {
  it("gives web and PDF the same stories in the same order", () => {
    const ranked = rankArticles(POOL, w(["space", "technology", "pakistan"]), NOW, 6);
    const bodies = new Map<string, StoryBody>(
      ranked.map((r) => [r.article.contentHash, { kind: "publisher_excerpt", text: r.article.text, takeaways: [], model: null, promptVersion: null }]),
    );
    const edition: Edition = {
      id: "00000000-0000-4000-8000-000000000000",
      userId: "u",
      localDate: "2026-10-17",
      timezone: "Asia/Karachi",
      generatedAt: NOW.toISOString(),
      sourcesFetchedAt: NOW.toISOString(),
      profile: { topics: ["space"], interests: [] },
      stories: buildEditionStories(ranked, bodies),
      todayInThree: [],
    };
    const web = presentEdition(edition);
    const print = toPrintEdition(web);
    assert.deepEqual([print.lead, ...print.stories], web.stories);
    assert.deepEqual(web.stories.map((s) => s.headline), edition.stories.map((s) => s.title));
    assert.deepEqual(print.highlights, [], "an older edition without highlights still prints");

    const first = edition.stories[0];
    const withBrief: Edition = {
      ...edition,
      todayInThree: [
        { articleHash: first.articleHash, sentence: "A saved line about the first story.", kind: "ai" },
        { articleHash: "f".repeat(64), sentence: "Refers to no story in this paper.", kind: "quote" },
      ],
    };
    const briefWeb = presentEdition(withBrief);
    const briefPrint = toPrintEdition(briefWeb);
    assert.deepEqual(briefPrint.highlights, briefWeb.highlights, "web and PDF share the same saved highlights");
    assert.deepEqual(briefWeb.highlights, [{ position: 1, sentence: "A saved line about the first story.", kind: "ai", sourceName: first.sourceName, sourceUrl: first.url }]);
  });
});
