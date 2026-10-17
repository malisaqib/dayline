"use client";

import { useActionState } from "react";
import { chooseNewPassword, requestPasswordReset, type ResetState } from "@/app/auth-actions";
import { PendingButton } from "@/features/shared/PendingButton";
import { ui } from "@/features/shared/ui";
import { PasswordField } from "./PasswordField";

const INPUT = "mt-1 block min-h-11 w-full rounded-xl border border-ink/20 bg-paper px-4 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";
const INITIAL: ResetState = { error: null, notice: null };

function renderMessage(state: ResetState) {
  if (state.error) {
    return (
      <p role="alert" className="mt-3 rounded-xl border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-accent-strong">
        {state.error}
      </p>
    );
  }
  if (state.notice) {
    return (
      <p role="status" className="mt-3 rounded-xl border border-rule bg-paper px-3 py-2 text-sm">
        {state.notice}
      </p>
    );
  }
  return null;
}

export function ResetRequestForm() {
  const [state, action] = useActionState(requestPasswordReset, INITIAL);
  return (
    <form action={action} className="mt-6" noValidate>
      <label htmlFor="reset-email" className="block text-sm font-semibold">
        Email address
      </label>
      <input id="reset-email" name="email" type="email" autoComplete="email" required className={INPUT} />
      {renderMessage(state)}
      <PendingButton label="Email me a reset link" className={`${ui.primaryButton} mt-5 w-full`} />
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action] = useActionState(chooseNewPassword, INITIAL);
  return (
    <form action={action} className="mt-6" noValidate>
      <PasswordField id="new-password" name="password" label="New password" autoComplete="new-password" />
      <PasswordField id="confirm-password" name="confirm" label="Repeat new password" autoComplete="new-password" className="mt-4" />
      <p className={`${ui.meta} mt-2`}>At least 8 characters.</p>
      {renderMessage(state)}
      <PendingButton label="Save new password" className={`${ui.primaryButton} mt-5 w-full`} />
    </form>
  );
}
