import { TodayForm } from "@/features/newspaper/TodayForm";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { findProfile } from "@/server/repositories/profiles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  const profile = reader ? await findProfile(db, reader.id) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif text-6xl font-bold tracking-wide">Dayline</h1>
      <p className="mt-3 font-serif text-lg italic">Your interests. One morning paper. Five minutes well spent.</p>
      <hr className="my-8 w-full border-rule" />
      {profile ? (
        <div className="space-y-4">
          <TodayForm />
          <nav className="flex justify-center gap-4 text-sm">
            <a href="/archive" className="hover:underline">
              Archive
            </a>
            <a href="/onboarding" className="hover:underline">
              Change topics
            </a>
          </nav>
        </div>
      ) : (
        <a href="/onboarding" className="rounded border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:opacity-90">
          Get started
        </a>
      )}
    </main>
  );
}
