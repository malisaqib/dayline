const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-[color,background-color,border-color,transform] duration-[185ms] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60";

export const ui = {
  primaryButton: `${buttonBase} bg-accent text-night hover:bg-white`,
  secondaryButton: `${buttonBase} border border-ink/20 bg-transparent text-ink hover:border-ink/60`,
  ghostButton: `${buttonBase} text-ink hover:bg-ink/5`,
  card: "rounded-card border border-white/5 bg-card shadow-card",
  eyebrow: "text-xs font-semibold uppercase tracking-[0.12em] text-accent",
  meta: "text-sm text-muted",
  chip: "inline-flex items-center gap-1 rounded-full border border-rule bg-paper px-2.5 py-1 text-xs font-medium text-ink",
} as const;

