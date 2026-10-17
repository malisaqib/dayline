"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/today", label: "Today", match: (path: string) => path.startsWith("/today") || path.startsWith("/edition/") },
  { href: "/archive", label: "Archive", match: (path: string) => path.startsWith("/archive") },
  { href: "/onboarding", label: "Topics", match: (path: string) => path.startsWith("/onboarding") },
];

const BASE = "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors duration-[185ms]";
const ACTIVE = `${BASE} bg-ink text-paper`;
const IDLE = `${BASE} text-ink hover:bg-ink/5`;

export function NavLinks() {
  const pathname = usePathname();
  const items = LINKS.map(({ href, label, match }) => {
    const active = match(pathname);
    const current = active ? "page" : undefined;
    const className = active ? ACTIVE : IDLE;
    return (
      <li key={href}>
        <Link href={href} aria-current={current} className={className}>
          {label}
        </Link>
      </li>
    );
  });
  return <ul className="flex items-center gap-1">{items}</ul>;
}
