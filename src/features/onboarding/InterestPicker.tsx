"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type KeyboardEvent } from "react";
import { MAX_INTEREST_CHARS, MAX_INTERESTS, normalizeInterest, SUGGESTED_INTERESTS } from "@/domain/interests";
import { fadeUp } from "@/features/shared/motion";
import { ui } from "@/features/shared/ui";

type InterestPickerProps = { interests: string[]; onChange: (next: string[]) => void };

function validate(phrase: string, current: string[]): string | null {
  if (phrase.length < 2) {
    return "Type at least two characters.";
  }
  if (phrase.length > MAX_INTEREST_CHARS) {
    return `Keep it under ${MAX_INTEREST_CHARS} characters.`;
  }
  if (current.includes(phrase)) {
    return "Already added.";
  }
  if (current.length >= MAX_INTERESTS) {
    return `You can add up to ${MAX_INTERESTS} interests.`;
  }
  return null;
}

export function InterestChips({ interests, onRemove }: { interests: string[]; onRemove: (interest: string) => void }) {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Your interests">
      <AnimatePresence initial={false}>
        {interests.map((interest) => (
          <motion.li key={interest} layout variants={fadeUp} initial="initial" animate="animate" exit="exit" className={`${ui.chip} border-accent/40 py-0 pr-0`}>
            {interest}
            <button
              type="button"
              onClick={() => onRemove(interest)}
              className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:text-ink"
              aria-label={`Remove ${interest}`}
            >
              ×
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

export function InterestPicker({ interests, onChange }: InterestPickerProps) {
  const inputId = useId();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const typed = normalizeInterest(draft);
  const suggestions = SUGGESTED_INTERESTS.filter((s) => !interests.includes(normalizeInterest(s)) && normalizeInterest(s).includes(typed)).slice(0, 6);

  function add(raw: string) {
    const phrase = normalizeInterest(raw);
    const problem = validate(phrase, interests);
    setError(problem);
    if (problem) {
      return;
    }
    onChange([...interests, phrase]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      add(draft);
    }
  }

  function renderError() {
    if (!error) {
      return null;
    }
    return (
      <p role="alert" className="mt-2 text-sm text-accent-strong">
        {error}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-rule p-4">
      <label htmlFor={inputId} className="font-semibold">
        Search or add an interest <span className="font-normal text-muted">(optional)</span>
      </label>
      <p className={`${ui.meta} mt-1`}>
        Specific things you care about, like AI agents or startups. Dayline looks for them in the day&apos;s stories; it does not search the whole web.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          maxLength={MAX_INTEREST_CHARS + 10}
          placeholder="e.g. AI agents"
          className="min-h-11 w-full rounded-full border border-ink/20 bg-paper px-4 text-base focus:border-accent focus:outline-none"
        />
        <button type="button" className={ui.secondaryButton} onClick={() => add(draft)}>
          Add
        </button>
      </div>
      {renderError()}
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Suggestions">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => add(suggestion)}
            className="min-h-9 rounded-full border border-dashed border-ink/25 px-3 text-sm text-muted transition-[color,border-color,transform] duration-[185ms] hover:border-accent hover:text-ink active:scale-95"
          >
            + {suggestion}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <InterestChips interests={interests} onRemove={(interest) => onChange(interests.filter((i) => i !== interest))} />
      </div>
      <p className={`${ui.meta} mt-2`}>
        {interests.length} of {MAX_INTERESTS} added
      </p>
    </div>
  );
}
