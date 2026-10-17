import { z } from "zod";

export const TOPICS = [
  { id: "world", label: "World" },
  { id: "pakistan", label: "Pakistan" },
  { id: "technology", label: "Technology" },
  { id: "science", label: "Science" },
  { id: "space", label: "Space" },
  { id: "security", label: "Cybersecurity" },
  { id: "disasters", label: "Disaster alerts" },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];

const topicIds = TOPICS.map((t) => t.id) as [TopicId, ...TopicId[]];
export const topicIdSchema = z.enum(topicIds);

export const MAX_PROFILE_TOPICS = TOPICS.length;

export const profileTopicsSchema = z
  .array(topicIdSchema)
  .min(1, "Choose at least one topic")
  .max(MAX_PROFILE_TOPICS, `Choose at most ${MAX_PROFILE_TOPICS} topics`)
  .transform((topics) => [...new Set(topics)]);

export function topicLabel(id: TopicId): string {
  return TOPICS.find((t) => t.id === id)?.label ?? id;
}
