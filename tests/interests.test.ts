import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { interestReason, interestsSchema, interestsWithoutCoverage, matchInterests } from "@/domain/interests";
import { rankArticles, type RankableArticle } from "@/domain/personalization/rank";

const NOW = new Date("2026-10-17T03:00:00Z");

function article(id: string, title: string, text: string, topics: RankableArticle["topics"], sourceId = `src-${id}`): RankableArticle {
  return {
    sourceId,
    sourceName: sourceId,
    title,
    url: `https://example.org/${id}`,
    publishedAt: "2026-10-17T01:00:00Z",
    fetchedAt: "2026-10-17T02:00:00Z",
    text,
    coverage: "excerpt",
    labels: [],
    contentHash: id.padEnd(64, "0"),
    topics,
  };
}

describe("specific interests", () => {
  it("normalizes, dedupes and bounds phrases", () => {
    assert.deepEqual(interestsSchema.parse(["  AI   Agents ", "ai agents", "Startups!"]), ["ai agents", "startups"]);
    assert.equal(interestsSchema.safeParse(["a"]).success, false);
    assert.equal(interestsSchema.safeParse(["one", "two", "three", "four", "five", "six"]).success, false);
  });

  it("matches whole words and aliases, not substrings", () => {
    assert.deepEqual(matchInterests("New AI agent books flights on its own", ["ai agents"]), ["ai agents"]);
    assert.deepEqual(matchInterests("Rovers return to the Red Planet", ["mars"]), ["mars"]);
    assert.deepEqual(matchInterests("Paint maker reports quarterly results", ["ai"]), []);
    assert.deepEqual(matchInterests("Marshall Islands election", ["mars"]), []);
    assert.deepEqual(matchInterests("Two start-ups raise funds", ["startups"]), ["startups"]);
  });

  it("lets different interests pick different stories from the same pool", () => {
    const pool = [
      article("a", "Chip prices rise again", "Memory makers report demand.", ["technology"]),
      article("b", "AI agents now book travel", "An agentic AI assistant books flights.", ["technology"]),
      article("c", "Startup raises seed round", "A Karachi startup raised money.", ["pakistan"]),
      article("d", "Phone sales slow", "Handset market cools.", ["technology"]),
    ];
    const weights = { technology: 1 };
    const plain = rankArticles(pool, weights, NOW, 2);
    const agents = rankArticles(pool, weights, NOW, 2, undefined, ["ai agents"]);
    const startups = rankArticles(pool, weights, NOW, 2, undefined, ["startups"]);
    assert.ok(agents[0].article.title.startsWith("AI agents"));
    assert.ok(agents[0].reasons.includes(interestReason("ai agents")));
    assert.ok(startups.some((r) => r.article.title.startsWith("Startup")), "an interest can bring in a story outside the chosen topics");
    assert.ok(!plain.some((r) => r.reasons.some((reason) => reason.startsWith("Matches your interest"))));
  });

  it("reports interests with no matching story instead of claiming coverage", () => {
    const pool = [article("a", "Chip prices rise again", "Memory makers report demand.", ["technology"])];
    const ranked = rankArticles(pool, { technology: 1 }, NOW, 6, undefined, ["cricket"]);
    assert.deepEqual(interestsWithoutCoverage(["cricket"], ranked.map((r) => r.reasons)), ["cricket"]);
    assert.ok(!ranked[0].reasons.some((reason) => reason.includes("cricket")));
  });
});
