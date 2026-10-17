import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canSummarize } from "@/domain/editions/build-edition";
import { MAX_STORIES_PER_SOURCE, rankArticles, type RankableArticle } from "@/domain/personalization/rank";
import { deriveTopicWeights } from "@/domain/personalization/weights";
import { SOURCES, sourceById, type FeedSource } from "@/server/sources/catalog";
import { parseKevCatalog } from "@/server/sources/cisa-kev";
import { parseGdacsRss } from "@/server/sources/gdacs";
import { HN_MAX_STORIES, selectHackerNewsStories } from "@/server/sources/hacker-news";
import { fetchArticlePool } from "@/server/sources/pool";

// Fixture data shaped like each official response; not live content.
const NOW = new Date("2026-10-17T06:00:00Z");
const source = (id: string): FeedSource => {
  const found = sourceById(id);
  assert.ok(found, `source ${id} in catalog`);
  return found;
};

const kevEntry = (cve: string, dateAdded: string) => ({
  cveID: cve,
  vendorProject: "ExampleVendor",
  product: "ExampleProduct",
  vulnerabilityName: `ExampleVendor ExampleProduct flaw ${cve}`,
  dateAdded,
  shortDescription: "ExampleProduct contains a flaw that allows remote code execution.",
  requiredAction: "Apply mitigations per vendor instructions. Additional guidance follows.",
  dueDate: "2026-11-06",
  knownRansomwareCampaignUse: "Known",
  notes: "ignored field",
});

describe("CISA KEV parsing", () => {
  it("keeps recent valid entries with official fields, attribution label and catalog link", () => {
    const json = { vulnerabilities: [kevEntry("CVE-2026-1111", "2026-10-16"), kevEntry("CVE-2020-0001", "2026-01-01")] };
    const { articles } = parseKevCatalog(json, source("cisa_kev"), NOW, NOW.toISOString());
    assert.equal(articles.length, 1, "old entry excluded by the age limit");
    const [a] = articles;
    assert.equal(a.sourceName, "CISA Known Exploited Vulnerabilities");
    assert.ok(a.url.startsWith("https://www.cisa.gov/known-exploited-vulnerabilities-catalog?"));
    assert.deepEqual(a.labels.slice(0, 2), ["Actively exploited vulnerability", "CVE-2026-1111"]);
    assert.ok(a.labels.includes("Known ransomware use"));
    assert.match(a.text, /required action: Apply mitigations per vendor instructions\. Federal remediation due date: 2026-11-06/);
    assert.doesNotMatch(a.text, /Additional guidance|ignored field/);
  });

  it("rejects malformed entries and throws on a malformed catalog", () => {
    const json = { vulnerabilities: [{ cveID: "not-a-cve" }, null, kevEntry("CVE-2026-2222", "2026-10-16")] };
    const result = parseKevCatalog(json, source("cisa_kev"), NOW, NOW.toISOString());
    assert.equal(result.articles.length, 1);
    assert.equal(result.rejected, 2);
    assert.throws(() => parseKevCatalog({ data: [] }, source("cisa_kev"), NOW, NOW.toISOString()), /no vulnerabilities array/);
  });
});

describe("Hacker News selection", () => {
  const t = (hoursAgo: number) => Math.floor(NOW.getTime() / 1000 - hoursAgo * 3600);
  const story = (id: number, extra: Record<string, unknown> = {}) => ({ id, type: "story", title: `Story ${id}`, url: `https://example.com/${id}`, time: t(2), score: 100, descendants: 10, ...extra });

  it("drops jobs, dead, deleted, text-only, malformed and stale items", () => {
    const items = [
      story(1),
      story(2, { type: "job" }),
      story(3, { dead: true }),
      story(4, { deleted: true }),
      story(5, { url: undefined }),
      story(6, { time: t(200) }),
      { id: 7 },
      null,
    ];
    assert.deepEqual(selectHackerNewsStories(items, NOW).map((s) => s.id), [1]);
  });

  it("keeps a bounded number, preferring points adjusted for age", () => {
    const items = Array.from({ length: 30 }, (_, i) => story(i + 1, { score: 10 * (i + 1) }));
    const selected = selectHackerNewsStories(items, NOW);
    assert.equal(selected.length, HN_MAX_STORIES);
    assert.equal(selected[0].id, 30);
  });
});

describe("GDACS parsing", () => {
  const item = (level: string, country: string, type = "EQ", current = "true") => `
    <item>
      <title>${level} earthquake in ${country}</title>
      <description>Official description for ${country}.</description>
      <link>https://www.gdacs.org/report.aspx?eventtype=${type}&amp;eventid=${country.length}${level.length}</link>
      <pubDate>Sat, 17 Oct 2026 05:26:57 GMT</pubDate>
      <gdacs:iscurrent>${current}</gdacs:iscurrent>
      <gdacs:eventtype>${type}</gdacs:eventtype>
      <gdacs:alertlevel>${level}</gdacs:alertlevel>
      <gdacs:country>${country}</gdacs:country>
      <gdacs:severity unit="M" value="6.1">Magnitude 6.1M, Depth:10km</gdacs:severity>
    </item>`;
  const rss = (...items: string[]) => `<?xml version="1.0"?><rss xmlns:gdacs="http://www.gdacs.org"><channel>${items.join("")}</channel></rss>`;

  it("extracts event type, location, alert level and severity, preferring Orange/Red alerts", () => {
    const { alerts } = parseGdacsRss(rss(item("Green", "Chile"), item("Orange", "Japan", "TC"), item("Red", "Peru", "EQ", "false")));
    assert.equal(alerts.length, 1, "Green dropped when a serious alert exists; non-current dropped");
    assert.deepEqual(
      { type: alerts[0].eventType, country: alerts[0].country, level: alerts[0].alertLevel, severity: alerts[0].severity },
      { type: "Tropical cyclone", country: "Japan", level: "Orange", severity: "Magnitude 6.1M, Depth:10km" },
    );
  });

  it("falls back to a few Green alerts and skips malformed items", () => {
    const { alerts, rejected } = parseGdacsRss(rss(item("Green", "Chile"), "<item><title>broken</title></item>"));
    assert.equal(alerts.length, 1);
    assert.equal(rejected, 1);
  });
});

describe("source pool and policy", () => {
  it("keeps other sources when one fails", async () => {
    const ok = source("hacker_news");
    const failing = source("gdacs");
    const pool = await fetchArticlePool([failing, ok], async (s) => {
      if (s.id === failing.id) {
        throw new Error("gdacs: HTTP 403");
      }
      return { source: s, articles: [], rejected: 0 };
    });
    assert.deepEqual(pool.failedSources, [{ sourceId: "gdacs", reason: "gdacs: HTTP 403" }]);
  });

  it("never sends Internet Pulse sources to the AI summariser", () => {
    for (const id of ["cisa_kev", "hacker_news", "gdacs"]) {
      const s = source(id);
      assert.equal(s.usage.aiProcessing, false, id);
      const article = { sourceId: id, sourceName: s.name, title: "t", url: "https://example.org", publishedAt: null, fetchedAt: NOW.toISOString(), text: "long enough text", coverage: "full" as const, labels: [], contentHash: "0".repeat(64) };
      assert.equal(canSummarize(article, s.usage), false, id);
    }
    assert.ok(SOURCES.filter((s) => s.usage.aiProcessing).every((s) => s.id === "nasa"), "only NASA is AI-processed");
  });

  it("caps any one source even when it supplies many matching stories", () => {
    const article = (n: number, sourceId: string): RankableArticle => ({
      sourceId,
      sourceName: sourceId,
      title: `Fixture ${sourceId} ${n}`,
      url: `https://example.org/${sourceId}/${n}`,
      publishedAt: NOW.toISOString(),
      fetchedAt: NOW.toISOString(),
      text: "",
      coverage: "none",
      labels: [],
      contentHash: `${sourceId === "hacker_news" ? "a" : "b"}${n.toString(16).padStart(63, "0")}`,
      topics: ["technology"],
    });
    const pool = [...Array.from({ length: 10 }, (_, i) => article(i, "hacker_news")), article(1, "ars"), article(2, "ars")];
    const ranked = rankArticles(pool, deriveTopicWeights(["technology"], []), NOW, 6);
    assert.equal(ranked.filter((r) => r.article.sourceId === "hacker_news").length, MAX_STORIES_PER_SOURCE);
  });

  it("drops a second copy of the same headline from another feed", () => {
    const base = { publishedAt: NOW.toISOString(), fetchedAt: NOW.toISOString(), text: "", coverage: "none" as const, labels: [], topics: ["world" as const] };
    const pool: RankableArticle[] = [
      { ...base, sourceId: "a", sourceName: "A", title: "Quake hits coast!", url: "https://a.example/1", contentHash: "1".repeat(64) },
      { ...base, sourceId: "b", sourceName: "B", title: "quake hits coast", url: "https://b.example/1", contentHash: "2".repeat(64) },
    ];
    assert.equal(rankArticles(pool, deriveTopicWeights(["world"], []), NOW, 6).length, 1);
  });
});
