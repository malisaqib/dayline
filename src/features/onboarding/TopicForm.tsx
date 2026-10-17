"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useState } from "react";
import { completeOnboarding, type ActionState } from "@/app/actions";
import { GenerationProgress } from "@/features/shared/GenerationProgress";
import { fadeUp } from "@/features/shared/motion";
import { PendingButton } from "@/features/shared/PendingButton";
import { SpotlightCard } from "@/features/shared/SpotlightCard";
import { InterestChips, InterestPicker } from "./InterestPicker";
import { TopicIcon } from "./TopicIcon";
import { ui } from "@/features/shared/ui";
import { WHAT_YOU_GET } from "./topic-copy";

export type TopicOption = { id: string; label: string; description: string };

type TopicFormProps = { topics: TopicOption[]; selected: string[]; interests: string[]; maxTopics: number; isReturning: boolean };

const INITIAL: ActionState = { error: null };
const TOTAL_STEPS = 2;

const CARD = "flex min-h-11 cursor-pointer gap-3 rounded-lg border p-4 transition-colors duration-[185ms] h-full";
const CARD_ON = `${CARD} border-accent bg-accent-soft`;
const CARD_OFF = `${CARD} border-rule bg-card hover:border-ink/40`;
const CARD_LOCKED = `${CARD} cursor-not-allowed border-rule bg-card opacity-50`;
const CHECKBOX =
  "mt-0.5 size-5 shrink-0 cursor-pointer appearance-none rounded border-2 border-ink/40 bg-card checked:border-accent checked:bg-accent checked:bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%230b0f17'%3E%3Cpath d='M6.2 11.2 3 8l1-1 2.2 2.2L12 3.4l1 1z'/%3E%3C/svg%3E\")] disabled:cursor-not-allowed";

function cardClass(checked: boolean, locked: boolean): string {
  if (checked) {
    return CARD_ON;
  }
  return locked ? CARD_LOCKED : CARD_OFF;
}

const STEP_NAMES = ["What you follow", "Review and create"];

function stepClass(index: number, step: number): string {
  if (index + 1 === step) {
    return "border-accent bg-accent text-on-accent";
  }
  if (index + 1 < step) {
    return "border-accent text-accent";
  }
  return "border-rule text-muted";
}

function currentStep(index: number, step: number): "step" | undefined {
  if (index + 1 === step) {
    return "step";
  }
  return undefined;
}

function nameClass(index: number, step: number): string {
  if (index + 1 === step) {
    return "font-semibold";
  }
  return "text-muted";
}

function renderProgress(step: number) {
  const width = `${(step / TOTAL_STEPS) * 100}%`;
  return (
    <div className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label={`Step ${step} of ${TOTAL_STEPS}`}>
        {STEP_NAMES.map((name, index) => (
          <li key={name} className="flex items-center gap-2 text-sm" aria-current={currentStep(index, step)}>
            <span className={`grid size-7 place-items-center rounded-full border text-xs font-bold transition-colors duration-[300ms] ${stepClass(index, step)}`}>{index + 1}</span>
            <span className={nameClass(index, step)}>{name}</span>
          </li>
        ))}
      </ol>
      <div className="mt-3 h-1 rounded-full bg-rule" aria-hidden="true">
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

function renderSelectionHint(count: number) {
  if (count === 0) {
    return <p className={ui.meta}>Choose at least one topic to continue.</p>;
  }
  return <p className={ui.meta}>{count} chosen</p>;
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
  return <p className={ui.meta}>Today&apos;s paper stays as published. New topics and interests shape your next paper; preview it from today&apos;s paper.</p>;
}

export function TopicForm({ topics, selected, interests: savedInterests, maxTopics, isReturning }: TopicFormProps) {
  const [state, action] = useActionState(completeOnboarding, INITIAL);
  const [step, setStep] = useState(1);
  const [chosen, setChosen] = useState<string[]>(selected);
  const [interests, setInterests] = useState<string[]>(savedInterests);
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
            <span className="mt-0.5 block text-sm leading-snug text-muted">{topic.description}</span>
          </span>
        </label>
      </SpotlightCard>
    );
  }

  function renderChooseStep() {
    return (
      <fieldset>
        <legend className="font-serif text-2xl font-bold">What would you like to follow?</legend>
        <p className={`${ui.meta} mt-1`}>Choose any of the {maxTopics} topics. A paper has about six stories, so not every topic appears every day.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{topics.map(renderTopicCard)}</div>
        <div className="mt-5">
          <InterestPicker interests={interests} onChange={setInterests} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button type="button" className={ui.primaryButton} disabled={chosen.length === 0} onClick={() => setStep(2)}>
            Continue
          </button>
          {renderSelectionHint(chosen.length)}
        </div>
        {renderChosen(topics, chosen)}
      </fieldset>
    );
  }

  function renderInterestReview() {
    if (interests.length === 0) {
      return null;
    }
    return (
      <div className="mt-4">
        <InterestChips interests={interests} onRemove={(interest) => setInterests(interests.filter((i) => i !== interest))} />
        <p className={`${ui.meta} mt-2`}>
          Interests appear only when a fresh story actually mentions them. When none does, Dayline says so and fills the paper from your topics.
        </p>
      </div>
    );
  }

  function renderConfirmStep() {
    const labels = topics.filter((t) => chosen.includes(t.id));
    return (
      <div>
        <h2 className="font-serif text-2xl font-bold">Your morning paper</h2>
        <p className="mt-2 text-sm text-muted">Every morning at 06:00 Pakistan time you&apos;ll get:</p>
        <ul className="mt-4 space-y-2 text-base">
          {WHAT_YOU_GET.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="text-accent">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Chosen topics">
          {labels.map((t) => (
            <li key={t.id} className={`${ui.chip} py-0 pr-0`}>
              <input type="hidden" name="topics" value={t.id} />
              {t.label}
              <button type="button" onClick={() => toggle(t.id)} disabled={labels.length === 1} className="grid size-8 place-items-center rounded-full text-muted hover:text-ink disabled:opacity-30" aria-label={`Remove ${t.label}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
        {interests.map((interest) => (
          <input key={interest} type="hidden" name="interests" value={interest} />
        ))}
        {renderInterestReview()}
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
