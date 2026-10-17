"use client";

import { useFormStatus } from "react-dom";
import { ui } from "./ui";

type PendingButtonProps = { label: string; className?: string };

function renderSpinner(pending: boolean) {
  if (!pending) {
    return null;
  }
  return (
    <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <span className="spinner size-4 rounded-full border-2 border-current border-r-transparent" />
    </span>
  );
}

export function PendingButton({ label, className = ui.primaryButton }: PendingButtonProps) {
  const { pending } = useFormStatus();
  const labelClass = pending ? "invisible" : undefined;
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={`relative ${className}`}>
      <span className={labelClass}>{label}</span>
      {renderSpinner(pending)}
    </button>
  );
}
