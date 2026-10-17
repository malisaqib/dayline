"use client";

import { AnimatePresence, motion } from "motion/react";
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
  create: { submit: "Create my account", autocomplete: "new-password", hint: "At least 8 characters. We'll email a link to confirm it's you." },
};

function tabClass(active: boolean): string {
  if (active) {
    return `${TAB} text-night`;
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

export function PasswordForm({ next }: { next: string }) {
  const [intent, setIntent] = useState<Intent>("signin");
  const [state, action] = useActionState(passwordAuth, { error: null, notice: null, email: "" });
  const copy = COPY[intent];
  return (
    <form action={action} className="mt-6" noValidate>
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
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="next" value={next} />
      <label htmlFor="pw-email" className="mt-5 block text-sm font-semibold">
        Email address
      </label>
      <input id="pw-email" name="email" type="email" autoComplete="email" required defaultValue={state.email} className={INPUT} />
      <label htmlFor="pw-password" className="mt-4 block text-sm font-semibold">
        Password
      </label>
      <input id="pw-password" name="password" type="password" autoComplete={copy.autocomplete} required minLength={8} className={INPUT} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={intent} variants={fadeUp} initial="initial" animate="animate" exit="exit" className={`${ui.meta} mt-2`}>
          {copy.hint}
        </motion.p>
      </AnimatePresence>
      {renderMessage(state)}
      <PendingButton label={copy.submit} className={`${ui.primaryButton} mt-5 w-full`} />
    </form>
  );
}
