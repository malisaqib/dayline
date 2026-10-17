import type { ArticleSnapshot } from "@/domain/articles/article";
import type { RankedArticle } from "@/domain/personalization/rank";
import type { SourceUsage } from "@/domain/sources/usage";
import type { BodyKind, StorySnapshot } from "./edition";

export const MAX_EXCERPT_DISPLAY_CHARS = 600;
const MIN_EXCERPT_CHARS = 40;
export const MIN_EXCERPT_FOR_AI_CHARS = 120;
export const MAX_EXCERPT_FOR_AI_CHARS = 900;

export type SummaryMode = "full" | "excerpt";

export type CachedSummary = { brief: string; takeaways: string[]; model: string; promptVersion: string };

export type StoryBody = { kind: BodyKind; text: string; takeaways: string[]; model: string | null; promptVersion: string | null };

export function summaryMode(article: ArticleSnapshot, usage: SourceUsage): SummaryMode | null {
  if (usage.aiProcessing && article.coverage !== "none") {
    return "full";
  }
  if (usage.aiExcerptSummary && article.text.length >= MIN_EXCERPT_FOR_AI_CHARS) {
    return "excerpt";
  }
  return null;
}

export function canSummarize(article: ArticleSnapshot, usage: SourceUsage): boolean {
  return summaryMode(article, usage) !== null;
}

/** Cut at a word boundary so an excerpt never ends mid-word. */
export function trimExcerpt(text: string, maxChars = MAX_EXCERPT_DISPLAY_CHARS): string {
  if (text.length <= maxChars) {
    return text;
  }
  const cut = text.slice(0, maxChars);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 0)).trimEnd()}…`;
}

/** Pick the most informative body the source's usage policy allows. Never invents text. */
export function chooseStoryBody(article: ArticleSnapshot, usage: SourceUsage, summary: CachedSummary | null): StoryBody {
  if (summary && canSummarize(article, usage)) {
    return { kind: "ai_summary", text: summary.brief, takeaways: summary.takeaways, model: summary.model, promptVersion: summary.promptVersion };
  }
  if (usage.display === "excerpt" && article.text.length >= MIN_EXCERPT_CHARS) {
    return { kind: "publisher_excerpt", text: trimExcerpt(article.text), takeaways: [], model: null, promptVersion: null };
  }
  return { kind: "headline_only", text: "", takeaways: [], model: null, promptVersion: null };
}

export function buildEditionStories(ranked: RankedArticle[], bodies: Map<string, StoryBody>): StorySnapshot[] {
  return ranked.map(({ article, matchedTopics, reasons, sourceCount, importance }) => {
    const body = bodies.get(article.contentHash);
    if (!body) {
      throw new Error(`missing body for article ${article.contentHash}`);
    }
    return {
      articleHash: article.contentHash,
      sourceId: article.sourceId,
      sourceName: article.sourceName,
      title: article.title,
      url: article.url,
      publishedAt: article.publishedAt,
      fetchedAt: article.fetchedAt,
      topics: matchedTopics,
      reasons,
      body: body.text,
      bodyKind: body.kind,
      takeaways: body.takeaways,
      coverage: article.coverage,
      labels: article.labels,
      sourceCount,
      importance,
      summaryModel: body.model,
      summaryPromptVersion: body.promptVersion,
    };
  });
}
