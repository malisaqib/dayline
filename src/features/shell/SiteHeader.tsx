import Link from "next/link";
import { EDITION_TIMEZONE, formatEditionDate, localEditionDate } from "@/domain/editions/edition";
import { AccountControls } from "./AccountControls";
import { NavLinks } from "./NavLinks";

export function SiteHeader() {
  const today = formatEditionDate(localEditionDate(new Date()));
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6">
        <Link href="/today" className="flex min-h-11 flex-col justify-center sm:flex-row sm:items-baseline sm:gap-3" aria-label="Dayline, today's paper">
          <span className="font-serif text-2xl font-bold leading-none tracking-wide">Dayline</span>
          <span className="text-[12px] text-muted sm:text-[13px]">
            {today} · {EDITION_TIMEZONE}
          </span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-2">
          <nav aria-label="Main">
            <NavLinks />
          </nav>
          <AccountControls />
        </div>
      </div>
    </header>
  );
}
