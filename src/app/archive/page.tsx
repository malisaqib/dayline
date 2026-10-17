import { formatEditionDate } from "@/domain/editions/edition";
import { TodayForm } from "@/features/newspaper/TodayForm";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { listEditions } from "@/server/repositories/editions";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  const editions = reader ? await listEditions(db) : [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-serif text-4xl font-bold">Your archive</h1>
      {editions.length === 0 ? (
        <div className="mt-8 rounded border border-rule p-6 text-center">
          <p className="text-sm">No saved papers yet.</p>
          <a href="/onboarding" className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
            Choose your topics to get your first paper
          </a>
        </div>
      ) : (
        <>
          <ul className="mt-8 divide-y divide-rule border-y border-rule">
            {editions.map((e) => (
              <li key={e.id}>
                <a href={`/edition/${e.id}`} className="block py-4 hover:bg-white/50">
                  <p className="text-xs uppercase tracking-wide text-ink/60">
                    {formatEditionDate(e.localDate)} · {e.storyCount} stories
                  </p>
                  <p className="mt-1 font-serif text-lg font-bold">{e.leadTitle}</p>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <TodayForm />
          </div>
        </>
      )}
    </main>
  );
}
