"use client";

import Link from "next/link";
import { useActionState } from "react";
import { openTodaysEdition, type ActionState } from "@/app/actions";
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
      <Link href="/onboarding" className="mt-2 inline-flex min-h-11 items-center font-semibold text-accent-strong underline-offset-4 hover:underline">
        Change your topics
      </Link>
    </div>
  );
}

export function TodayForm({ className = ui.primaryButton }: { className?: string }) {
  const [state, action] = useActionState(openTodaysEdition, INITIAL);
  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <PendingButton label="Open today's paper" pendingMessage="Preparing today's paper. This can take up to a minute." className={className} />
      {renderError(state)}
    </form>
  );
}
