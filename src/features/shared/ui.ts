const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors duration-[185ms] disabled:cursor-not-allowed disabled:opacity-60";

export const ui = {
  primaryButton: `${buttonBase} bg-accent text-white hover:bg-accent-strong`,
  secondaryButton: `${buttonBase} border border-ink/20 bg-card text-ink hover:border-ink/50`,
  ghostButton: `${buttonBase} text-ink hover:bg-ink/5`,
  card: "rounded-card border border-rule bg-card shadow-card",
  eyebrow: "text-xs font-semibold uppercase tracking-[0.12em] text-accent",
  meta: "text-[13px] text-muted",
  chip: "inline-flex items-center gap-1 rounded-full border border-rule bg-paper px-2.5 py-1 text-xs font-medium text-ink",
} as const;

