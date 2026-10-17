import type { ReactNode } from "react";
import type { PresentedStory } from "@/domain/editions/presentation";
import { StoryShell } from "./StoryShell";

type ReadingState = { skipped: string[]; opened: string[] };

export function storyWrapper(editionId: string, reading: ReadingState) {
  return function wrap(story: PresentedStory, card: ReactNode) {
    return (
      <StoryShell
        editionId={editionId}
        articleHash={story.id}
        headline={story.headline}
        initiallySkipped={reading.skipped.includes(story.id)}
        initiallyOpened={reading.opened.includes(story.id)}
      >
        {card}
      </StoryShell>
    );
  };
}
