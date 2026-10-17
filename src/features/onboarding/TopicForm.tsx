"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useState } from "react";
import { completeOnboarding, type ActionState } from "@/app/actions";
import { GenerationProgress } from "@/features/shared/GenerationProgress";
import { fadeUp } from "@/features/shared/motion";
import { PendingButton } from "@/features/shared/PendingButton";
import { SpotlightCard } from "@/features/shared/SpotlightCard";
import { TopicIcon } from "./TopicIcon";
import { ui } from "@/features/shared/ui";
import { WHAT_YOU_GET } from "./topic-copy";

export type TopicOption = { id: string; label: string; description: string };

type TopicFormProps = { topics: TopicOption[]; selected: string[]; maxTopics: number; isReturning: boolean };

const INITIAL: ActionState = { error: null };
const TOTAL_STEPS = 2;

const CARD = "flex min-h-11 cursor-pointer gap-3 rounded-lg border p-4 transition-colors duration-[185ms] h-full";
const CARD_ON = `${CARD} border-accent bg-accent-soft`;
const CARD_OFF = `${CARD} border-rule bg-card hover:border-ink/40`;
const CARD_LOCKED = `${CARD} cursor-not-allowed border-rule bg-card opacity-50`;
const CHECKBOX =
  "mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded border-2 border-ink/40 bg-card checked:border-accent checked:bg-accent checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M6.2 11.2 3 8l1-1 2.2 2.2L12 3.4l1 1z'/%3E%3C/svg%3E\")] disabled:cursor-not-allowed";

function cardClass(checked: boolean, locked: boolean): string {
  if (checked) {
    return CARD_ON;
  }
  return locked ? CARD_LOCKED : CARD_OFF;
}

function renderProgress(step: number) {
  const width = `${(step / TOTAL_STEPS) * 100}%`;
  return (
    <div className="mb-6">
      <p className={ui.meta}>
        Step {step} of {TOTAL_STEPS}
      </p>
      <div className="mt-2 h-1 rounded-full bg-rule" aria-hidden="true">
        <div className="h-1 rounded-full bg-accent transition-[width] duration-[300ms]" style={{ width }} />
      </div>
    </div>
  );
}

function renderError(state: ActionState) {
  if (!state.error) {
    return null;
  }
  return (
    <div role="alert" className="animate-toast rounded-lg border border-accent/40 bg-accent-soft px-4 py-3 text-sm">
      <p className="font-semibold text-accent-strong">We couldn&apos;t make your paper</p>
      <p className="mt-1">{state.error}</p>
      <button type="submit" className={`${ui.secondaryButton} mt-3`}>
        Try again
      </button>
    </div>
  );
}

function renderSelectionHint(count: number, max: number) {
  if (count === 0) {
    return <p className={ui.meta}>Choose at least one topic to continue.</p>;
  }
  return (
    <p className={ui.meta}>
      {count} of {max} chosen
    </p>
  );
}

function renderChosen(topics: TopicOption[], chosen: string[]) {
  if (chosen.length === 0) {
    return null;
  }
  const labels = topics.filter((t) => chosen.includes(t.id)).map((t) => t.label);
  return (
    <p className="mt-3 text-sm">
      <span className="font-semibold">Your paper will cover:</span> {labels.join(", ")}
    </p>
  );
}

function renderReturningNote(isReturning: boolean) {
  if (!isReturning) {
    return null;
  }
  return <p className={ui.meta}>Today&apos;s paper stays as published. New topics shape your next paper.</p>;
}

export function TopicForm({ topics, selected, maxTopics, isReturning }: TopicFormProps) {
  const [state, action] = useActionState(completeOnboarding, INITIAL);
  const [step, setStep] = useState(1);
  const [chosen, setChosen] = useState<string[]>(selected);
  const submitLabel = isReturning ? "Save topics and open today's paper" : "Create my first paper";

  function toggle(id: string) {
    setChosen((current) => (current.includes(id) ? current.filter((t) => t !== id) : [...current, id]));
  }

  function renderTopicCard(topic: TopicOption) {
    const checked = chosen.includes(topic.id);
    const locked = !checked && chosen.length >= maxTopics;
    return (
      <SpotlightCard key={topic.id} className="rounded-lg">
        <label className={cardClass(checked, locked)}>
          <input type="checkbox" name="topics" value={topic.id} checked={checked} disabled={locked} onChange={() => toggle(topic.id)} className={CHECKBOX} />
          <span className="min-w-0">
            <span className="flex items-center gap-2 font-semibold">
              <TopicIcon topic={topic.id} />
              {topic.label}
            </span>
            <span className="mt-0.5 block text-[13px] leading-snug text-muted">{topic.description}</span>
          </span>
        </label>
      </SpotlightCard>
    );
  }

  function renderChooseStep() {
    return (
      <fieldset>
        <legend className="font-serif text-2xl font-bold">Pick up to {maxTopics} topics</legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{topics.map(renderTopicCard)}</div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="button" className={ui.primaryButton} disabled={chosen.length === 0} onClick={() => setStep(2)}>
            Continue
          </button>
          {renderSelectionHint(chosen.length, maxTopics)}
        </div>
        {renderChosen(topics, chosen)}
      </fieldset>
    );
  }

  function renderConfirmStep() {
    const labels = topics.filter((t) => chosen.includes(t.id));
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold">Here&apos;s your paper</h2>
        <p className="mt-2 text-sm text-muted">Every morning at 06:00 Pakistan time you&apos;ll get:</p>
        <ul className="mt-4 space-y-2 text-[15px]">
          {WHAT_YOU_GET.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-accent">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2" aria-label="Chosen topics">
          {labels.map((t) => (
            <span key={t.id} className={ui.chip}>
              <input type="hidden" name="topics" value={t.id} />
              {t.label}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <PendingButton label={submitLabel} />
          <button type="button" className={ui.secondaryButton} onClick={() => setStep(1)}>
            Back
          </button>
        </div>
        <GenerationProgress message="Gathering stories and preparing your paper…" />
      </div>
    );
  }

  function renderStep() {
    if (step === 1) {
      return renderChooseStep();
    }
    return renderConfirmStep();
  }

  return (
    <form action={action} className={`${ui.card} space-y-5 p-4 sm:p-6`}>
      {renderProgress(step)}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} variants={fadeUp} initial="initial" animate="animate" exit="exit">
          {renderStep()}
        </motion.div>
      </AnimatePresence>
      {renderError(state)}
      {renderReturningNote(isReturning)}
    </form>
  );
}
