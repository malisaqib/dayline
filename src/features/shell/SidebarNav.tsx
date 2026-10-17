"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DURATION, EASE } from "@/features/shared/motion";

const LINKS = [
  { href: "/today", label: "Today's paper", match: (path: string) => path.startsWith("/today") || path.startsWith("/edition/") },
  { href: "/archive", label: "Past papers", match: (path: string) => path.startsWith("/archive") },
  { href: "/onboarding", label: "My interests", match: (path: string) => path.startsWith("/onboarding") },
];

const BASE = "flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors duration-[185ms]";
const ACTIVE = `${BASE} bg-accent/15 text-accent-strong`;
const IDLE = `${BASE} text-ink/80 hover:bg-ink/5 hover:text-ink`;

function linkClass(active: boolean): string {
  if (active) {
    return ACTIVE;
  }
  return IDLE;
}

function current(active: boolean): "page" | undefined {
  if (active) {
    return "page";
  }
  return undefined;
}

function Links({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {LINKS.map(({ href, label, match }) => (
        <li key={href}>
          <Link href={href} aria-current={current(match(pathname))} className={linkClass(match(pathname))} onClick={onNavigate}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Brand() {
  return (
    <Link href="/today" className="group flex min-h-11 items-center gap-2" aria-label="Dayline, today's paper">
      <span className="grid size-8 place-items-center rounded-md bg-ink font-serif text-lg font-bold text-paper transition-transform duration-[300ms] group-hover:-rotate-6" aria-hidden="true">
        D
      </span>
      <span className="font-serif text-xl font-bold tracking-wide">Dayline</span>
    </Link>
  );
}

export function SidebarNav({ account, dateLabel }: { account: ReactNode; dateLabel: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[232px] flex-col border-r border-rule bg-card/60 px-4 py-5 backdrop-blur-sm lg:flex" aria-label="Dayline">
      <Brand />
      <p className="mt-1 pl-1 text-xs text-muted">{dateLabel}</p>
      <nav aria-label="Main" className="mt-8">
        <Links />
      </nav>
      <div className="mt-auto border-t border-rule pt-4">{account}</div>
    </aside>
  );
}

export function MobileNav({ account, dateLabel }: { account: ReactNode; dateLabel: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const firstLink = panel.current?.querySelector<HTMLElement>("a, button");
    firstLink?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function renderDrawer() {
    if (!open) {
      return null;
    }
    return [
      <motion.div key="backdrop" className="fixed inset-0 z-40 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />,
      <motion.div
        key="drawer"
        id="mobile-menu"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-card px-4 py-5 shadow-raised"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: DURATION.blink, ease: EASE }}
      >
        <div className="flex items-center justify-between">
          <span className="font-serif text-xl font-bold">Dayline</span>
          <button type="button" onClick={close} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm font-semibold" aria-label="Close menu">
            Close
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">{dateLabel}</p>
        <nav aria-label="Main" className="mt-6">
          <Links onNavigate={close} />
        </nav>
        <div className="mt-auto border-t border-rule pt-4">{account}</div>
      </motion.div>,
    ];
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-rule bg-paper/85 px-4 py-2 backdrop-blur-md lg:hidden">
      <Brand />
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/20 px-4 text-sm font-semibold"
      >
        Menu
      </button>
      <AnimatePresence>{renderDrawer()}</AnimatePresence>
    </header>
  );
}
