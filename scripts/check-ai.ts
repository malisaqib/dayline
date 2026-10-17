import { summarizeArticle, SUMMARY_PROMPT_VERSION } from "@/server/ai/summarize";
import { getAnthropicEnv } from "@/server/env";
import { sourceById } from "@/server/sources/catalog";
import { fetchFeed } from "@/server/sources/rss";

const PROBE_SOURCE_ID = "nasa";

// Runs the production summariser on one live article from an AI-permitted source.
async function main() {
  const source = sourceById(PROBE_SOURCE_ID);
  if (!source?.usage.aiProcessing) {
    throw new Error(`source ${PROBE_SOURCE_ID} missing or not cleared for AI processing`);
  }
  const { articles } = await fetchFeed(source);
  const article = articles.find((a) => a.text.length > 200);
  if (!article) {
    throw new Error("no article with enough text for the probe");
  }

  const configured = getAnthropicEnv().ANTHROPIC_MODEL;
  console.log(`configured model: ${configured}  prompt: ${SUMMARY_PROMPT_VERSION}`);
  console.log(`input: "${article.title}" (${article.coverage}, ${article.text.length} chars)`);
  const started = Date.now();
  const result = await summarizeArticle(article);
  console.log(`responded model: ${result.model}  tokens in/out: ${result.inputTokens}/${result.outputTokens}  ${Date.now() - started} ms`);
  console.log(`brief (${result.brief.length} chars): ${result.brief}`);
  if (!result.model.startsWith(configured)) {
    throw new Error(`model mismatch: configured ${configured}, responded ${result.model}`);
  }
}

main().catch((error: Error) => {
  console.error(`AI check failed: ${error.message}`);
  process.exit(1);
});
