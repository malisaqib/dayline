"use client";

import Link from "next/link";
import { useActionState } from "react";
import { openTodaysEdition, type ActionState } from "@/app/actions";
import { GenerationProgress } from "@/features/shared/GenerationProgress";
import { PendingButton } from "@/features/shared/PendingButton";
import { ui } from "@/features/shared/ui";

const INITIAL: ActionState = { error: null };

function renderError(state: ActionState) {
  if (!state.error) {
    return null;
  }
  return (
    <div role="alert" className="animate-toast rounded-lg border border-accent/40 bg-accent-soft px-4 py-3 text-sm">
      <p className="font-semibold text-accent-strong">Today&apos;s paper isn&apos;t ready</p>
      <p className="mt-1">{state.error}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="submit" className={ui.secondaryButton}>
          Try again
        </button>
        <Link href="/onboarding" className={ui.ghostButton}>
          Change your topics
        </Link>
      </div>
    </div>
  );
}

export function TodayForm({ className = ui.primaryButton, label = "Open today's paper" }: { className?: string; label?: string }) {
  const [state, action] = useActionState(openTodaysEdition, INITIAL);
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <PendingButton label={label} className={className} />
      <GenerationProgress message="Gathering stories and preparing your paper…" />
      {renderError(state)}
    </form>
  );
}
