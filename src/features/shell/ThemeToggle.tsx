"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (document.documentElement.dataset.theme === "light") {
    return "light";
  }
  return "dark";
}

function nextTheme(theme: Theme): Theme {
  if (theme === "light") {
    return "dark";
  }
  return "light";
}

function label(theme: Theme): string {
  if (theme === "light") {
    return "Dark mode";
  }
  return "Light mode";
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  function toggle() {
    const next = nextTheme(theme);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("dayline-theme", next);
    } catch {}
    setTheme(next);
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={theme === "light"} className={className}>
      {label(theme)}
    </button>
  );
}
