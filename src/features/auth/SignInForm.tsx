"use client";

import Link from "next/link";
import { useActionState } from "react";
import { advanceSignIn, type SignInState } from "@/app/auth-actions";
import { PendingButton } from "@/features/shared/PendingButton";
import { ui } from "@/features/shared/ui";

type SignInFormProps = { upgrade: boolean; next: string };
type Dispatch = (form: FormData) => void;

const inputClass = "mt-1 block min-h-11 w-full rounded-md border border-ink/20 bg-paper px-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

function renderError(error: string | null) {
  if (!error) {
    return null;
  }
  return (
    <p role="alert" className="mt-3 rounded-md border border-accent/40 bg-accent/5 px-3 py-2 text-sm text-accent-strong">
      {error}
    </p>
  );
}

function renderEmailStep(state: Extract<SignInState, { step: "email" }>, props: SignInFormProps, dispatch: Dispatch) {
  const label = props.upgrade ? "Save my paper to this email" : "Email me a sign-in code";
  return (
    <form action={dispatch} className="mt-6" noValidate>
      <input type="hidden" name="op" value="request" />
      <input type="hidden" name="next" value={props.next} />
      <label htmlFor="signin-email" className="text-sm font-semibold">
        Email address
      </label>
      <input id="signin-email" name="email" type="email" autoComplete="email" required defaultValue={state.email} className={inputClass} />
      {renderError(state.error)}
      <PendingButton label={label} className={`${ui.primaryButton} mt-4 w-full sm:w-auto`} />
    </form>
  );
}

function renderRestart(email: string, dispatch: Dispatch) {
  return (
    <form action={dispatch}>
      <input type="hidden" name="op" value="restart" />
      <input type="hidden" name="email" value={email} />
      <PendingButton label="Use a different email" className={ui.ghostButton} />
    </form>
  );
}

function renderCodeStep(state: Extract<SignInState, { step: "code" }>, props: SignInFormProps, dispatch: Dispatch) {
  const label = state.mode === "upgrade" ? "Confirm and save my paper" : "Sign in";
  const intent = state.mode === "signin" ? "switch" : "upgrade";
  return (
    <div className="mt-6">
      <p className="text-[15px]">
        We sent an email to <strong>{state.email}</strong>. Enter the code from it, or open its link on this device. It can take a minute to
        arrive; check your spam folder too.
      </p>
      <form action={dispatch} className="mt-4">
        <input type="hidden" name="op" value="verify" />
        <input type="hidden" name="email" value={state.email} />
        <input type="hidden" name="mode" value={state.mode} />
        <input type="hidden" name="next" value={props.next} />
        <label htmlFor="signin-code" className="text-sm font-semibold">
          Code from the email
        </label>
        <input id="signin-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" required className={`${inputClass} max-w-48 tracking-[0.3em]`} />
        {renderError(state.error)}
        <PendingButton label={label} className={`${ui.primaryButton} mt-4`} />
      </form>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-rule pt-4">
        <form action={dispatch}>
          <input type="hidden" name="op" value="request" />
          <input type="hidden" name="intent" value={intent} />
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="next" value={props.next} />
          <PendingButton label="Send a new code" className={ui.secondaryButton} />
        </form>
        {renderRestart(state.email, dispatch)}
      </div>
    </div>
  );
}

function renderConflictStep(state: Extract<SignInState, { step: "conflict" }>, props: SignInFormProps, dispatch: Dispatch) {
  return (
    <div className="mt-6" role="status">
      <p className="font-semibold">{state.email} already has a Dayline account.</p>
      <p className="mt-2 text-[15px] text-muted">
        Dayline won&apos;t merge accounts. If you sign in to that account, this browser switches to its topics and papers. The papers you made
        here as a guest are kept, not deleted, but they won&apos;t appear in that account.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <form action={dispatch}>
          <input type="hidden" name="op" value="request" />
          <input type="hidden" name="intent" value="switch" />
          <input type="hidden" name="email" value={state.email} />
          <input type="hidden" name="next" value={props.next} />
          <PendingButton label="Sign in to that account" className={ui.primaryButton} />
        </form>
        <Link href="/today" className={ui.secondaryButton}>
          Keep reading as a guest
        </Link>
        {renderRestart(state.email, dispatch)}
      </div>
    </div>
  );
}

export function SignInForm(props: SignInFormProps) {
  const [state, dispatch] = useActionState(advanceSignIn, { step: "email", error: null, email: "" });
  if (state.step === "code") {
    return renderCodeStep(state, props, dispatch);
  }
  if (state.step === "conflict") {
    return renderConflictStep(state, props, dispatch);
  }
  return renderEmailStep(state, props, dispatch);
}
