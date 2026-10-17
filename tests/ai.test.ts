import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ArticleSnapshot } from "@/domain/articles/article";
import { MAX_EXCERPT_FOR_AI_CHARS, summaryMode } from "@/domain/editions/build-edition";
import type { StorySnapshot } from "@/domain/editions/edition";
import type { JsonCompletion, JsonCompletionRequest } from "@/server/ai/openrouter-client";
import { summarizeExcerpt, SummaryUnavailableError } from "@/server/ai/summarize";
import { buildTodayInThree, TodayInThreeUnavailableError } from "@/server/ai/today-in-three";
import { sourceById } from "@/server/sources/catalog";

function completer(responses: { content: string; finishReason?: string }[]) {
  const requests: JsonCompletionRequest[] = [];
  const complete = async (request: JsonCompletionRequest): Promise<JsonCompletion> => {
    requests.push(request);
    const next = responses.shift();
    assert.ok(next, "unexpected extra model call");
    return { content: next.content, model: "mock", finishReason: next.finishReason ?? "stop", inputTokens: 1, outputTokens: 1, structured: true };
  };
  return { complete, requests };
}

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
const EXCERPT = `${"Officials confirmed the bridge reopened after repairs to its main span. ".repeat(30)}`;

function article(sourceId: string, text: string, coverage: ArticleSnapshot["coverage"] = "excerpt"): ArticleSnapshot {
  return { sourceId, sourceName: sourceId, title: "Bridge reopens after repairs", url: "https://example.org/bridge", publishedAt: "2026-10-17T05:00:00.000Z", fetchedAt: "2026-10-17T06:00:00.000Z", text, coverage, labels: [], contentHash: "a".repeat(64) };
}

describe("summary eligibility", () => {
  it("summarises trusted feed excerpts but never Internet Pulse or too-short excerpts", () => {
    const usage = (id: string) => {
      const source = sourceById(id);
      assert.ok(source);
      return source.usage;
    };
    assert.equal(summaryMode(article("npr", EXCERPT), usage("npr")), "excerpt");
    assert.equal(summaryMode(article("bbc", "Too short to summarise."), usage("bbc")), null);
    assert.equal(summaryMode(article("nasa", EXCERPT, "full"), usage("nasa")), "full");
    for (const id of ["cisa_kev", "hacker_news", "gdacs"]) {
      assert.equal(summaryMode(article(id, EXCERPT), usage(id)), null, id);
    }
  });
});

describe("excerpt summaries", () => {
  it("sends only the headline and a bounded excerpt, and accepts valid output", async () => {
    const { complete, requests } = completer([{ content: JSON.stringify({ summary: words(20), takeaways: [] }) }]);
    const result = await summarizeExcerpt(article("npr", EXCERPT), complete);
    assert.equal(result.attempts, 1);
    const excerpt = requests[0].user.match(/<excerpt>([\s\S]*)<\/excerpt>/)?.[1] ?? "";
    assert.ok(excerpt.length <= MAX_EXCERPT_FOR_AI_CHARS + 1, "excerpt is bounded");
    assert.match(requests[0].user, /<title>Bridge reopens after repairs<\/title>/);
  });

  it("retries once on invalid or truncated output, then gives up so the excerpt is used", async () => {
    const retried = completer([{ content: "{not json" }, { content: JSON.stringify({ summary: words(20), takeaways: [] }) }]);
    assert.equal((await summarizeExcerpt(article("npr", EXCERPT), retried.complete)).attempts, 2);

    const failing = completer([{ content: JSON.stringify({ summary: words(20), takeaways: [] }), finishReason: "length" }, { content: JSON.stringify({ summary: words(3), takeaways: [] }) }]);
    await assert.rejects(summarizeExcerpt(article("npr", EXCERPT), failing.complete), SummaryUnavailableError);
  });
});

function story(n: number, body: string, kind: StorySnapshot["bodyKind"] = "publisher_excerpt"): StorySnapshot {
  return {
    articleHash: n.toString(16).padStart(64, "0"),
    sourceId: `s${n}`,
    sourceName: `Source ${n}`,
    title: [`Bridge reopens after repairs`, `Council approves new library budget`, `Storm closes coastal schools`, `Team wins regional final`][n - 1],
    url: `https://example.org/${n}`,
    publishedAt: "2026-10-17T05:00:00.000Z",
    fetchedAt: "2026-10-17T06:00:00.000Z",
    topics: ["world"],
    reasons: [],
    body,
    bodyKind: kind,
    takeaways: [],
    coverage: "excerpt",
    labels: [],
    sourceCount: 1,
    importance: 0,
    summaryModel: null,
    summaryPromptVersion: null,
  };
}

const STORIES = [
  story(1, "Officials said the bridge reopened on Friday after repairs to its main span."),
  story(2, "The council approved a new library budget after a long debate."),
  story(3, "A storm forced coastal schools to close for two days."),
  story(4, "", "headline_only"),
];

describe("today in three", () => {
  it("keeps three distinct, grounded items that reference real stories", async () => {
    const { complete } = completer([
      {
        content: JSON.stringify({
          items: [
            { story: 1, sentence: "The bridge reopened after repairs to its main span." },
            { story: 2, sentence: "The council approved a new library budget." },
            { story: 3, sentence: "A storm forced coastal schools to close." },
          ],
        }),
      },
    ]);
    const items = await buildTodayInThree(STORIES, complete);
    assert.deepEqual(items.map((i) => i.articleHash), [STORIES[0], STORIES[1], STORIES[2]].map((s) => s.articleHash));
  });

  it("drops unknown story numbers, repeats, headline-only stories and unsupported claims instead of padding", async () => {
    const { complete } = completer([
      {
        content: JSON.stringify({
          items: [
            { story: 1, sentence: "The bridge reopened after repairs to its main span." },
            { story: 1, sentence: "The bridge reopened after repairs to its main span again." },
            { story: 9, sentence: "A story that does not exist in this paper at all." },
          ],
        }),
      },
    ]);
    const items = await buildTodayInThree(STORIES, complete);
    assert.equal(items.length, 1);

    const invented = completer([
      {
        content: JSON.stringify({
          items: [
            { story: 2, sentence: "Taxes will rise sharply next year across every province nationwide." },
            { story: 4, sentence: "The team won the regional final in extra time." },
          ],
        }),
      },
    ]);
    assert.deepEqual(await buildTodayInThree(STORIES, invented.complete), []);
  });

  it("makes no call without suitable stories and fails cleanly after one retry", async () => {
    const none = completer([]);
    assert.deepEqual(await buildTodayInThree([STORIES[3]], none.complete), []);
    assert.equal(none.requests.length, 0);

    const broken = completer([{ content: "nope" }, { content: "still nope" }]);
    await assert.rejects(buildTodayInThree(STORIES, broken.complete), TodayInThreeUnavailableError);
  });
});
