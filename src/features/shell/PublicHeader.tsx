import Link from "next/link";
import { ui } from "@/features/shared/ui";
import { readReaderEntry } from "@/server/services/reader-entry";

async function renderAction() {
  const entry = await readReaderEntry();
  if (entry.kind === "visitor") {
    return (
      <Link href="/signin" className={ui.secondaryButton}>
        Sign in
      </Link>
    );
  }
  return (
    <Link href="/today" className={ui.primaryButton}>
      Open my paper
    </Link>
  );
}

export async function PublicHeader() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center font-serif text-2xl font-bold tracking-wide" aria-label="Dayline overview">
          Dayline
        </Link>
        <nav aria-label="Account">{await renderAction()}</nav>
      </div>
    </header>
  );
}
