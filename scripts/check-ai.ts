import { countWords } from "@/domain/articles/summary";
import { summaryMode } from "@/domain/editions/build-edition";
import { EXCERPT_PROMPT_VERSION, summarizeArticle, summarizeExcerpt, summaryModelId, SUMMARY_PROMPT_VERSION } from "@/server/ai/summarize";
import { buildTodayInThree, TODAY_IN_THREE_PROMPT_VERSION } from "@/server/ai/today-in-three";
import { sourceById } from "@/server/sources/catalog";
import { fetchFeed } from "@/server/sources/rss";

const PROBE_SOURCE_ID = "nasa";
// Prefer a regular news release over APOD, whose feed text includes site navigation.
const SKIP_TITLE = /^APOD:/;

// Runs the production summariser on one live article from an AI-permitted source.
// Prints the source text and output for manual grounding review; never prints the key.
async function main() {
  const source = sourceById(PROBE_SOURCE_ID);
  if (!source?.usage.aiProcessing) {
    throw new Error(`source ${PROBE_SOURCE_ID} missing or not cleared for AI processing`);
  }
  const { articles } = await fetchFeed(source);
  const article = articles.find((a) => a.text.length > 400 && !SKIP_TITLE.test(a.title)) ?? articles.find((a) => a.text.length > 200);
  if (!article) {
    throw new Error("no article with enough text for the probe");
  }

  console.log(`provider: OpenRouter`);
  console.log(`requested model: ${summaryModelId()}  prompt version: ${SUMMARY_PROMPT_VERSION}`);
  console.log(`input: "${article.title}" (${article.coverage}, ${countWords(article.text)} words, hash ${article.contentHash.slice(0, 12)})`);

  const result = await summarizeArticle(article);
  console.log(`responded model: ${result.model}`);
  console.log(`structured output (strict JSON Schema): ${result.structured ? "yes" : "no, prompt-only JSON"}`);
  console.log(`validation: passed (attempts ${result.attempts}${result.retryReasons.length ? `; rejected earlier: ${result.retryReasons.join(" | ")}` : ""})`);
  console.log(`summary: ${countWords(result.summary)} words; takeaways: ${result.takeaways.length} (${result.takeaways.map((t) => countWords(t)).join(", ")} words)`);
  console.log(`tokens in/out: ${result.inputTokens}/${result.outputTokens}  latency: ${result.latencyMs} ms`);
  console.log(`\n--- source text (for grounding review) ---\n${article.text}`);
  console.log(`\n--- summary ---\n${result.summary}`);
  console.log(`\n--- takeaways ---\n${result.takeaways.map((t) => `- ${t}`).join("\n")}`);

  if (!result.model.includes(summaryModelId().split("/")[1] ?? summaryModelId())) {
    throw new Error(`model mismatch: requested ${summaryModelId()}, responded ${result.model}`);
  }
}

main().catch((error: Error) => {
  console.error(`AI check failed: ${error.message}`);
  process.exit(1);
});

async function checkExcerptAndHighlights() {
  const npr = sourceById("npr");
  if (!npr) {
    throw new Error("npr missing from catalog");
  }
  const { articles } = await fetchFeed(npr);
  const eligible = articles.filter((a) => summaryMode(a, npr.usage) === "excerpt").slice(0, 3);
  if (eligible.length === 0) {
    throw new Error("no NPR item long enough for an excerpt summary");
  }
  const first = eligible[0];
  console.log(`\n=== excerpt summary (${EXCERPT_PROMPT_VERSION}) ===\ninput: "${first.title}" (${first.text.length} chars)\nexcerpt: ${first.text.slice(0, 400)}`);
  const summary = await summarizeExcerpt(first);
  console.log(`output (${countWords(summary.summary)} words, attempts ${summary.attempts}): ${summary.summary}`);
  console.log(`takeaways: ${JSON.stringify(summary.takeaways)}`);

  const stories = eligible.map((a, i) => ({
    articleHash: a.contentHash,
    sourceId: a.sourceId,
    sourceName: a.sourceName,
    title: a.title,
    url: a.url,
    publishedAt: a.publishedAt,
    fetchedAt: a.fetchedAt,
    topics: ["world" as const],
    reasons: [],
    body: i === 0 ? summary.summary : a.text.slice(0, 600),
    bodyKind: "publisher_excerpt" as const,
    takeaways: [],
    coverage: a.coverage,
    labels: [],
    sourceCount: 1,
    importance: 0,
    summaryModel: null,
    summaryPromptVersion: null,
  }));
  const highlights = await buildTodayInThree(stories);
  console.log(`\n=== today in three (${TODAY_IN_THREE_PROMPT_VERSION}) from ${stories.length} live stories ===`);
  for (const h of highlights) {
    const n = stories.findIndex((s) => s.articleHash === h.articleHash) + 1;
    console.log(`- [story ${n}: ${stories[n - 1].title.slice(0, 60)}] ${h.sentence}`);
  }
}

checkExcerptAndHighlights().catch((error: Error) => {
  console.error(`excerpt/today-in-three check failed: ${error.message}`);
  process.exit(1);
});
