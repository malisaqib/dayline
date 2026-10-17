"use client";

import { useState } from "react";

const INPUT =
  "block min-h-12 w-full rounded-xl border border-ink/20 bg-paper py-2 pl-4 pr-20 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

type PasswordFieldProps = { id: string; name: string; label: string; autoComplete: string; className?: string };

function toggleLabel(visible: boolean): string {
  if (visible) {
    return "Hide";
  }
  return "Show";
}

function inputType(visible: boolean): string {
  if (visible) {
    return "text";
  }
  return "password";
}

export function PasswordField({ id, name, label, autoComplete, className }: PasswordFieldProps) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={name}
          type={inputType(visible)}
          autoComplete={autoComplete}
          required
          minLength={8}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className={INPUT}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-controls={id}
          aria-label={`${toggleLabel(visible)} ${label.toLowerCase()}`}
          className="absolute inset-y-1 right-1 min-w-16 rounded-lg px-3 text-sm font-semibold text-accent-strong hover:bg-ink/5"
        >
          {toggleLabel(visible)}
        </button>
      </div>
    </div>
  );
}
