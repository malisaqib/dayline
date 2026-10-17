import type { TopicId } from "@/domain/topics";

export const TOPIC_DESCRIPTIONS: Record<TopicId, string> = {
  world: "Major international news from NPR and the BBC.",
  pakistan: "National stories from Pakistani outlets.",
  technology: "Tech industry news, Ars Technica and the Hacker News front page.",
  science: "Research breakthroughs and discoveries.",
  space: "NASA missions, launches and astronomy.",
  security: "Actively exploited vulnerabilities from CISA.",
  disasters: "Earthquake, storm and flood alerts from GDACS.",
};

export const WHAT_YOU_GET = [
  "Up to six stories, ranked for you every morning",
  "Short AI summaries where publishers allow it, otherwise their own excerpt",
  "A link to every original article",
  "A newspaper-style PDF of the same paper",
  "A paper that learns from your More and Less choices",
] as const;
