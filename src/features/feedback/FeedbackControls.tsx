"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { submitFeedback, type FeedbackActionResult } from "@/app/actions";
import { fade, fadeUp } from "@/features/shared/motion";
import { WEIGHTS_EVENT } from "./LearningChips";
import { useStoryActions } from "./StoryShell";

type Signal = "more" | "less";

type FeedbackControlsProps = { editionId: string; articleHash: string; topicLabels: string[]; initial: Signal | null };

type Success = Extract<FeedbackActionResult, { ok: true }>;

const BUTTONS: { signal: Signal; label: string }[] = [
  { signal: "more", label: "More like this" },
  { signal: "less", label: "Less like this" },
];

const BUTTON =
  "inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors duration-[185ms] disabled:cursor-wait disabled:opacity-60 border-ink/20 bg-card text-ink hover:border-ink/50 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper";

const SKIP_BUTTON =
  "inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-muted underline-offset-4 transition-colors duration-[185ms] hover:text-ink hover:underline disabled:cursor-wait disabled:opacity-60";

function joinLabels(labels: string[]): string {
  if (labels.length <= 1) {
    return labels.join("");
  }
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

function describeResult(result: Success, signal: Signal, topicLabels: string[]): string {
  const stronger = result.changes.filter((c) => c.direction === "stronger").map((c) => c.label);
  const weaker = result.changes.filter((c) => c.direction === "weaker").map((c) => c.label);
  const parts: string[] = [];
  if (stronger.length > 0) {
    parts.push(`${joinLabels(stronger)} will appear more often.`);
  }
  if (weaker.length > 0) {
    parts.push(`${joinLabels(weaker)} will appear less often.`);
  }
  if (parts.length > 0) {
    return parts.join(" ");
  }
  const level = signal === "more" ? "highest" : "lowest";
  return `Saved. ${joinLabels(topicLabels)} is already at its ${level} level.`;
}

function renderSkip(story: ReturnType<typeof useStoryActions>) {
  if (!story) {
    return null;
  }
  return (
    <button type="button" onClick={story.skip} disabled={story.pending} className={SKIP_BUTTON}>
      Skip this story
    </button>
  );
}

function renderCheck(selected: boolean) {
  if (!selected) {
    return null;
  }
  return <span aria-hidden="true">✓</span>;
}

function renderStatus(pending: boolean, message: string | null, error: string | null, editionId: string) {
  if (pending) {
    return (
      <motion.p key="saving" variants={fade} initial="initial" animate="animate" exit="exit" className="text-sm text-muted">
        Saving…
      </motion.p>
    );
  }
  if (error) {
    return (
      <motion.p key="error" variants={fade} initial="initial" animate="animate" exit="exit" role="alert" className="text-sm font-medium text-accent-strong">
        {error}
      </motion.p>
    );
  }
  if (!message) {
    return null;
  }
  return (
    <motion.div key={message} variants={fadeUp} initial="initial" animate="animate" exit="exit" className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-accent-soft px-3 py-2 text-sm">
      <span>{message}</span>
      <a href={`/edition/${editionId}/preview`} className="inline-flex min-h-11 items-center font-semibold text-accent-strong underline-offset-4 hover:underline">
        Preview next edition
      </a>
    </motion.div>
  );
}

export function FeedbackControls({ editionId, articleHash, topicLabels, initial }: FeedbackControlsProps) {
  const [selected, setSelected] = useState<Signal | null>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const story = useStoryActions();

  async function send(signal: Signal) {
    if (pending || signal === selected) {
      return;
    }
    setError(null);
    setPending(true);
    const result = await submitFeedback({ editionId, articleHash, signal }).finally(() => setPending(false));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelected(signal);
    setMessage(describeResult(result, signal, topicLabels));
    window.dispatchEvent(new CustomEvent(WEIGHTS_EVENT, { detail: result.weights }));
  }

  const buttons = BUTTONS.map(({ signal, label }) => {
    const isSelected = selected === signal;
    return (
      <button key={signal} type="button" onClick={() => send(signal)} disabled={pending} aria-pressed={isSelected} className={BUTTON}>
        {renderCheck(isSelected)}
        {label}
      </button>
    );
  });

  return (
    <section className="mt-2 rounded-lg bg-paper p-3" aria-label="Train your paper">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Train your paper</h3>
          <p className="text-[13px] text-muted">These choices improve future papers. Today&apos;s paper stays unchanged.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {buttons}
          {renderSkip(story)}
        </div>
      </div>
      <div aria-live="polite" className="mt-2 empty:mt-0">
        <AnimatePresence mode="wait" initial={false}>
          {renderStatus(pending, message, error, editionId)}
        </AnimatePresence>
      </div>
    </section>
  );
}
