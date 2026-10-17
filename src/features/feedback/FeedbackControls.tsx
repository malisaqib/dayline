"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitFeedback, type FeedbackActionResult } from "@/app/actions";

type Signal = "more" | "less";

const BUTTONS: { signal: Signal; label: string }[] = [
  { signal: "more", label: "More like this" },
  { signal: "less", label: "Less like this" },
];

function describe(result: Extract<FeedbackActionResult, { ok: true }>): string {
  if (result.changes.length === 0) {
    return "Saved. Your preferences are already at their limit for this topic.";
  }
  return `Saved: ${result.changes.map((c) => `${c.label} ${c.direction}`).join(", ")}.`;
}

export function FeedbackControls({ editionId, articleHash, initial }: { editionId: string; articleHash: string; initial: Signal | null }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Signal | null>(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send(signal: Signal) {
    // Ignore repeats and clicks while a request is in flight (double-click protection).
    if (pending || signal === selected) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitFeedback({ editionId, articleHash, signal });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSelected(signal);
      setMessage(describe(result));
      router.refresh();
    });
  }

  return (
    <div className="mt-3 text-xs" aria-live="polite">
      <div role="group" aria-label="Feedback for this story" className="flex flex-wrap gap-2">
        {BUTTONS.map(({ signal, label }) => (
          <button
            key={signal}
            type="button"
            onClick={() => send(signal)}
            disabled={pending}
            aria-pressed={selected === signal}
            className="rounded-full border border-rule px-3 py-1 transition hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-wait disabled:opacity-60 aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
          >
            {label}
          </button>
        ))}
        {pending && <span className="self-center text-ink/60">Saving…</span>}
      </div>
      {message && !error && (
        <p className="mt-1 text-ink/70">
          {message}{" "}
          <a href={`/edition/${editionId}/preview`} className="font-medium text-accent hover:underline">
            Preview next edition
          </a>
        </p>
      )}
      {error && (
        <p role="alert" className="mt-1 text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
