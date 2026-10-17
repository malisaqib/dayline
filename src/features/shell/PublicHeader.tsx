import Link from "next/link";
import { readReaderEntry } from "@/server/services/reader-entry";

const pill = "inline-flex min-h-11 items-center rounded-full bg-glow px-5 text-sm font-semibold text-night transition-colors duration-[185ms] hover:bg-white";
const quiet = "inline-flex min-h-11 items-center px-3 text-sm font-semibold text-white/90 transition-colors duration-[185ms] hover:text-white";

async function renderActions() {
  const entry = await readReaderEntry();
  if (entry.kind === "visitor") {
    return (
      <>
        <Link href="/signin" className={quiet}>
          Sign in
        </Link>
        <Link href="/signin" className={pill}>
          Create my paper
        </Link>
      </>
    );
  }
  return (
    <Link href="/today" className={pill}>
      Open my paper
    </Link>
  );
}

export async function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-night/85 text-white backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center gap-2" aria-label="Dayline overview">
          <span className="grid size-8 place-items-center rounded-md bg-white font-serif text-lg font-bold text-night" aria-hidden="true">
            D
          </span>
          <span className="font-serif text-xl font-bold tracking-wide">Dayline</span>
        </Link>
        <nav aria-label="Account" className="flex items-center gap-1">
          {await renderActions()}
        </nav>
      </div>
    </header>
  );
}
