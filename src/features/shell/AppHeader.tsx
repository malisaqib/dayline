import Link from "next/link";
import { EDITION_TIMEZONE, formatEditionDate, localEditionDate } from "@/domain/editions/edition";
import { AccountBlock } from "./AccountBlock";
import { AppNav } from "./AppNav";
import { ThemeToggle } from "./ThemeToggle";
import { ui } from "@/features/shared/ui";

export function AppHeader() {
  const dateLabel = `${formatEditionDate(localEditionDate(new Date()))} · ${EDITION_TIMEZONE}`;
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        <Link href="/today" className="group flex min-h-11 items-center gap-2" aria-label="Dayline, today's paper">
          <span className="grid size-8 place-items-center rounded-md bg-ink font-serif text-lg font-bold text-paper transition-transform duration-[300ms] group-hover:-rotate-6" aria-hidden="true">
            D
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-xl font-bold tracking-wide">Dayline</span>
            <span className="hidden text-xs text-muted sm:block">{dateLabel}</span>
          </span>
        </Link>
        <nav aria-label="Main" className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <AppNav />
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className={ui.ghostButton} />
          <AccountBlock />
        </div>
      </div>
    </header>
  );
}
