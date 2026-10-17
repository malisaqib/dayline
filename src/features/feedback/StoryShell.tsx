"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { submitReading, undoSkipStory, type ReadingActionResult } from "@/app/actions";
import { ui } from "@/features/shared/ui";
import { WEIGHTS_EVENT } from "./LearningChips";

type StoryActions = { skip: () => void; open: () => void; pending: boolean };

const StoryContext = createContext<StoryActions | null>(null);

export function useStoryActions(): StoryActions | null {
  return useContext(StoryContext);
}

type StoryShellProps = {
  editionId: string;
  articleHash: string;
  headline: string;
  initiallySkipped: boolean;
  initiallyOpened: boolean;
  children: ReactNode;
};

function broadcast(result: ReadingActionResult) {
  if (result.ok) {
    window.dispatchEvent(new CustomEvent(WEIGHTS_EVENT, { detail: result.weights }));
  }
}

function renderError(error: string | null) {
  if (!error) {
    return null;
  }
  return (
    <p role="alert" className="mt-2 text-sm font-medium text-accent-strong">
      {error}
    </p>
  );
}

export function StoryShell({ editionId, articleHash, headline, initiallySkipped, initiallyOpened, children }: StoryShellProps) {
  const [skipped, setSkipped] = useState(initiallySkipped);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opened = useRef(initiallyOpened);

  async function run(action: () => Promise<ReadingActionResult>, onSuccess: () => void) {
    if (pending) {
      return;
    }
    setPending(true);
    setError(null);
    const result = await action().finally(() => setPending(false));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSuccess();
    broadcast(result);
  }

  const actions: StoryActions = {
    pending,
    skip: () => run(() => submitReading({ editionId, articleHash, kind: "skip" }), () => setSkipped(true)),
    open: () => {
      if (opened.current) {
        return;
      }
      opened.current = true;
      submitReading({ editionId, articleHash, kind: "open" }).then(broadcast, () => {
        opened.current = false;
      });
    },
  };

  if (skipped) {
    return (
      <div role="status" className={`${ui.card} animate-toast flex flex-wrap items-center justify-between gap-3 p-4`}>
        <div className="min-w-0">
          <p className="font-semibold">This story was skipped.</p>
          <p className="text-sm text-muted">Your current paper is unchanged. Future papers will show fewer stories like it.</p>
          <p className="mt-1 line-clamp-1 text-sm text-muted line-through">{headline}</p>
          {renderError(error)}
        </div>
        <button type="button" disabled={pending} onClick={() => run(() => undoSkipStory({ editionId, articleHash, kind: "skip" }), () => setSkipped(false))} className={ui.secondaryButton}>
          Undo
        </button>
      </div>
    );
  }

  return (
    <StoryContext.Provider value={actions}>
      {children}
      {renderError(error)}
    </StoryContext.Provider>
  );
}
