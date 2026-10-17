import { MAX_PROFILE_TOPICS, TOPICS } from "@/domain/topics";
import { TopicForm } from "@/features/onboarding/TopicForm";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { findProfile } from "@/server/repositories/profiles";
import { supportedTopicIds } from "@/server/sources/catalog";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  const profile = reader ? await findProfile(db, reader.id) : null;
  const supported = supportedTopicIds();
  const topics = TOPICS.filter((t) => supported.has(t.id)).map(({ id, label }) => ({ id, label }));

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="font-serif text-4xl font-bold">What should your paper cover?</h1>
      <p className="mt-3 text-sm">
        Dayline builds one short paper a day from these topics. It takes about ten seconds to set up; you can change it later.
      </p>
      <div className="mt-8">
        <TopicForm topics={topics} selected={profile?.topics ?? []} maxTopics={MAX_PROFILE_TOPICS} />
      </div>
    </main>
  );
}
