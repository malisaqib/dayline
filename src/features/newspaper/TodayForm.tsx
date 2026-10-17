"use client";

import { useActionState } from "react";
import { openTodaysEdition, type ActionState } from "@/app/actions";
import { PendingButton } from "@/features/shared/PendingButton";

const INITIAL: ActionState = { error: null };

export function TodayForm() {
  const [state, action] = useActionState(openTodaysEdition, INITIAL);
  return (
    <form action={action} className="flex flex-col items-center gap-3">
      <PendingButton label="Open today's paper" pendingLabel="Preparing today's paper… (up to a minute)" />
      {state.error && (
        <p role="alert" className="text-sm text-accent">
          {state.error}
        </p>
      )}
    </form>
  );
}
