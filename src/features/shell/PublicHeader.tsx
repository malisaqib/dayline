import Link from "next/link";
import { readReaderEntry } from "@/server/services/reader-entry";
import { ScrollHeader } from "./ScrollHeader";

const pill =
  "group inline-flex min-h-11 items-center gap-1.5 rounded-full bg-glow px-5 text-sm font-semibold text-night transition-[background-color,transform] duration-[185ms] hover:bg-white active:scale-[0.97]";
const quiet = "hidden min-h-11 sm:inline-flex items-center px-3 text-sm font-semibold text-white/80 transition-colors duration-[185ms] hover:text-white";
const navLink =
  "relative inline-flex min-h-11 items-center px-3 text-sm font-medium text-white/70 transition-colors duration-[185ms] hover:text-white after:absolute after:inset-x-3 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-glow after:transition-transform after:duration-[300ms] hover:after:scale-x-100";

const SECTIONS = [
  { href: "/#sample", label: "Sample paper" },
  { href: "/#sources", label: "Sources" },
  { href: "/#how", label: "How it works" },
];

function renderArrow() {
  return (
    <span aria-hidden="true" className="transition-transform duration-[185ms] group-hover:translate-x-0.5">
      →
    </span>
  );
}

async function renderActions() {
  const entry = await readReaderEntry();
  if (entry.kind === "visitor") {
    return (
      <>
        <Link href="/signin" className={quiet}>
          Sign in
        </Link>
        <Link href="/signin" className={pill}>
          Create my paper {renderArrow()}
        </Link>
      </>
    );
  }
  return (
    <Link href="/today" className={pill}>
      Open my paper {renderArrow()}
    </Link>
  );
}

export async function PublicHeader() {
  return (
    <ScrollHeader>
      <Link href="/" className="group flex min-h-11 items-center gap-2" aria-label="Dayline overview">
        <span
          className="grid size-8 place-items-center rounded-md bg-white font-serif text-lg font-bold text-night transition-transform duration-[300ms] group-hover:-rotate-6 group-hover:scale-105"
          aria-hidden="true"
        >
          D
        </span>
        <span className="font-serif text-xl font-bold tracking-wide">Dayline</span>
      </Link>
      <nav aria-label="Overview sections" className="hidden items-center md:flex">
        {SECTIONS.map((section) => (
          <a key={section.href} href={section.href} className={navLink}>
            {section.label}
          </a>
        ))}
      </nav>
      <nav aria-label="Account" className="flex items-center gap-1">
        {await renderActions()}
      </nav>
    </ScrollHeader>
  );
}
