"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { PasswordField } from "./PasswordField";
import { useActionState, useState } from "react";
import { passwordAuth, type PasswordState } from "@/app/auth-actions";
import { fadeUp } from "@/features/shared/motion";
import { PendingButton } from "@/features/shared/PendingButton";
import { ui } from "@/features/shared/ui";

type Intent = "signin" | "create";

const INPUT = "mt-1 block min-h-11 w-full rounded-xl border border-ink/20 bg-paper px-4 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";
const TAB = "relative min-h-10 flex-1 rounded-full px-4 text-sm font-semibold transition-colors duration-[185ms]";

const COPY: Record<Intent, { submit: string; autocomplete: string; hint: string }> = {
  signin: { submit: "Sign in", autocomplete: "current-password", hint: "Welcome back. Your topics, feedback and archive are waiting." },
  create: { submit: "Create my account", autocomplete: "new-password", hint: "At least 8 characters." },
};

function tabClass(active: boolean): string {
  if (active) {
    return `${TAB} text-on-accent`;
  }
  return `${TAB} text-muted hover:text-ink`;
}

function renderPill(active: boolean) {
  if (!active) {
    return null;
  }
  return <motion.span layoutId="auth-tab" className="absolute inset-0 -z-10 rounded-full bg-accent" transition={{ duration: 0.3 }} />;
}

function renderMessage(state: PasswordState) {
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

function renderTabs(intent: Intent, setIntent: (next: Intent) => void) {
  return (
    <div className="relative isolate flex rounded-full border border-rule p-1" role="tablist" aria-label="Account">
      <button type="button" role="tab" aria-selected={intent === "signin"} className={tabClass(intent === "signin")} onClick={() => setIntent("signin")}>
        {renderPill(intent === "signin")}
        Sign in
      </button>
      <button type="button" role="tab" aria-selected={intent === "create"} className={tabClass(intent === "create")} onClick={() => setIntent("create")}>
        {renderPill(intent === "create")}
        Create account
      </button>
    </div>
  );
}

function renderConfirm(intent: Intent) {
  if (intent !== "create") {
    return null;
  }
  return <PasswordField id="pw-confirm" name="confirm" label="Confirm password" autoComplete="new-password" className="mt-4" />;
}

function renderForgot(intent: Intent) {
  if (intent !== "signin") {
    return null;
  }
  return (
    <p className="mt-3 text-center text-sm">
      <Link href="/signin?mode=reset" className="font-semibold text-accent-strong underline-offset-4 hover:underline">
        Forgot password?
      </Link>
    </p>
  );
}

export function PasswordForm({ next, initialIntent = "signin" }: { next: string; initialIntent?: Intent }) {
  const [intent, setIntent] = useState<Intent>(initialIntent);
  const [state, action] = useActionState(passwordAuth, { error: null, notice: null, email: "" });
  const copy = COPY[intent];
  return (
    <form action={action} className="mt-6" noValidate>
      {renderTabs(intent, setIntent)}
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="next" value={next} />
      <label htmlFor="pw-email" className="mt-5 block text-sm font-semibold">
        Email address
      </label>
      <input id="pw-email" name="email" type="email" autoComplete="email" required defaultValue={state.email} className={INPUT} />
      <PasswordField id="pw-password" name="password" label="Password" autoComplete={copy.autocomplete} className="mt-4" />
      {renderConfirm(intent)}
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={intent} variants={fadeUp} initial="initial" animate="animate" exit="exit" className={`${ui.meta} mt-2`}>
          {copy.hint}
        </motion.p>
      </AnimatePresence>
      {renderMessage(state)}
      <PendingButton label={copy.submit} className={`${ui.primaryButton} mt-5 w-full`} />
      {renderForgot(intent)}
    </form>
  );
}
