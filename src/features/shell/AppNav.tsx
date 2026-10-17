"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/today", label: "Today's paper", match: (path: string) => path.startsWith("/today") || path.startsWith("/edition/") },
  { href: "/archive", label: "Past papers", match: (path: string) => path.startsWith("/archive") },
  { href: "/onboarding", label: "My interests", match: (path: string) => path.startsWith("/onboarding") },
];

const BASE =
  "relative inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-medium transition-colors duration-[185ms]";
const ACTIVE = `${BASE} bg-accent text-night`;
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

export function AppNav() {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1 overflow-x-auto">
      {LINKS.map(({ href, label, match }) => (
        <li key={href}>
          <Link href={href} aria-current={current(match(pathname))} className={linkClass(match(pathname))}>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
