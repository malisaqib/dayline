import { SOURCES } from "@/server/sources/catalog";
import { fetchSource } from "@/server/sources/pool";

const USABLE_TEXT_CHARS = 80;

async function main() {
  const results = await Promise.allSettled(SOURCES.filter((s) => s.enabled).map(fetchSource));
  let passing = 0;

  results.forEach((result, index) => {
    const source = SOURCES.filter((s) => s.enabled)[index];
    if (result.status === "rejected") {
      console.log(`FAIL ${source.id}: ${(result.reason as Error).message}`);
      return;
    }

    const { articles, rejected } = result.value;
    const dated = articles.filter((a) => a.publishedAt).length;
    const usable = articles.filter((a) => a.text.length >= USABLE_TEXT_CHARS).length;
    const full = articles.filter((a) => a.coverage === "full").length;
    const headlineOnly = source.usage.display === "headline_only";
    const ok = articles.length > 0 && dated === articles.length && (usable > 0 || headlineOnly);
    passing += ok ? 1 : 0;

    console.log(
      `${ok ? "PASS" : "WEAK"} ${source.id}: ${articles.length} valid (${rejected} rejected), ${dated} dated, ${usable} usable text, ${full} full-text`,
    );
    const sample = articles[0];
    if (sample) {
      console.log(`  "${sample.title.slice(0, 90)}"`);
      console.log(`  ${sample.url}`);
      console.log(`  published ${sample.publishedAt} | ${sample.coverage} | ${sample.text.length} chars | hash ${sample.contentHash.slice(0, 12)}${sample.labels.length ? ` | labels: ${sample.labels.join(" · ")}` : ""}`);
    }
  });

  console.log(`\n${passing}/${SOURCES.length} feeds returned valid titles, URLs, dates and usable text.`);
  process.exit(passing >= 2 ? 0 : 1);
}

main();
