import Link from "next/link";
import { ui } from "@/features/shared/ui";

export default function EditionNotFound() {
  return (
    <section className={`${ui.card} mx-auto max-w-xl p-8 text-center`}>
      <p className={ui.eyebrow}>Missing paper</p>
      <h1 className="mt-3 font-serif text-3xl font-bold">Paper not found</h1>
      <p className="mt-3 text-muted">This paper doesn&apos;t exist, or it belongs to another reader. Your own papers are in your archive.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/archive" className={ui.primaryButton}>
          Go to your archive
        </Link>
        <Link href="/today" className={ui.secondaryButton}>
          Today&apos;s paper
        </Link>
      </div>
    </section>
  );
}
