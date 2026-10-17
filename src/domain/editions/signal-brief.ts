import { isNearDuplicateTitle } from "@/domain/articles/similarity";
import { WEIGHT_POLICY, type TopicWeights } from "@/domain/personalization/weights";
import { topicLabel, type TopicId } from "@/domain/topics";
import { estimatedReadingMinutes, type PresentedStory } from "./presentation";
import type { Highlight } from "./today-in-three";

const MAX_PULSE_ITEMS = 3;
const MAX_SENTENCE_CHARS = 220;

export type BriefStory = { position: number; story: PresentedStory };

export type SignalBrief = {
  storyCount: number;
  readingMinutes: number;
  topSignal: BriefStory & { sentence: string | null };
  focus: (BriefStory & { topic: TopicId; explanation: string }) | null;
  pulse: BriefStory[];
  todayInThree: (BriefStory & { sentence: string })[];
};

export function firstSentence(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/^.+?[.!?](?=\s|$)/);
  const sentence = match ? match[0] : trimmed;
  if (sentence.length <= MAX_SENTENCE_CHARS) {
    return sentence;
  }
  const cut = sentence.slice(0, MAX_SENTENCE_CHARS);
  return `${cut.slice(0, cut.lastIndexOf(" ")).trimEnd()}…`;
}

function strongestTopic(topics: TopicId[], weights: TopicWeights): TopicId | null {
  let best: TopicId | null = null;
  let bestWeight = -Infinity;
  for (const topic of topics) {
    const weight = weights[topic] ?? WEIGHT_POLICY.baseline;
    if (weight > bestWeight) {
      best = topic;
      bestWeight = weight;
    }
  }
  return best;
}

function findFocus(stories: PresentedStory[], topic: TopicId): BriefStory | null {
  const top = stories[0];
  const matches = stories.map((story, index) => ({ position: index + 1, story })).filter(({ story }) => story.topics.includes(topic));
  if (matches.length === 0) {
    return null;
  }
  return matches.find((m) => m.position !== 1 && !isNearDuplicateTitle(m.story.headline, top.headline)) ?? matches[0];
}

export function resolveHighlights(stories: PresentedStory[], highlights: Highlight[]): (BriefStory & { sentence: string })[] {
  return highlights.flatMap((item) => {
    const index = stories.findIndex((story) => story.id === item.articleHash);
    if (index === -1) {
      return [];
    }
    return [{ position: index + 1, story: stories[index], sentence: item.sentence }];
  });
}

export function buildSignalBrief(stories: PresentedStory[], readerTopics: TopicId[], weights: TopicWeights, highlights: Highlight[] = []): SignalBrief | null {
  if (stories.length === 0) {
    return null;
  }
  const top = stories[0];
  const topic = strongestTopic(readerTopics, weights);
  const focusStory = topic ? findFocus(stories, topic) : null;
  const focus = focusStory && topic ? { ...focusStory, topic, explanation: `Selected because it matches your ${topicLabel(topic)} interest.` } : null;
  const shown = [top.headline, focus ? focus.story.headline : ""].filter(Boolean);
  const pulse = stories
    .map((story, index) => ({ position: index + 1, story }))
    .filter(({ story }) => story.kicker.length > 0 && !shown.some((headline) => isNearDuplicateTitle(headline, story.headline)))
    .slice(0, MAX_PULSE_ITEMS);
  const readingMinutes = estimatedReadingMinutes(stories);

  return {
    storyCount: stories.length,
    readingMinutes,
    topSignal: { position: 1, story: top, sentence: firstSentence(top.body) },
    focus,
    pulse,
    todayInThree: resolveHighlights(stories, highlights),
  };
}
