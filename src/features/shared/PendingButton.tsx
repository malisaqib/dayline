"use client";

import { useFormStatus } from "react-dom";

export function PendingButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="rounded border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
