import { runStructuredProbe } from "@/server/ai/probe";
import { CANDIDATE_SOURCES } from "@/server/sources/catalog";
import { fetchFeed } from "@/server/sources/rss";

const PROBE_SOURCE_ID = "nasa";

// Uses one live article so the probe exercises real feed text, not a fixture.
async function main() {
  const source = CANDIDATE_SOURCES.find((s) => s.id === PROBE_SOURCE_ID);
  if (!source) {
    throw new Error(`source ${PROBE_SOURCE_ID} not in catalog`);
  }
  const { articles } = await fetchFeed(source);
  const article = articles.find((a) => a.text.length > 200);
  if (!article) {
    throw new Error("no article with enough text for the probe");
  }

  console.log(`input: "${article.title}" (${article.coverage}, ${article.text.length} chars)`);
  const result = await runStructuredProbe(article.title, article.text);
  console.log(`model: ${result.model}  tokens in/out: ${result.inputTokens}/${result.outputTokens}  ${result.durationMs} ms`);
  console.log(JSON.stringify(result.output, null, 2));
}

main().catch((error: Error) => {
  console.error(`AI check failed: ${error.message}`);
  process.exit(1);
});
