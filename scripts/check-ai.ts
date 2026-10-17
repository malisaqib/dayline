import { countWords } from "@/domain/articles/summary";
import { summarizeArticle, summaryModelId, SUMMARY_PROMPT_VERSION } from "@/server/ai/summarize";
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
