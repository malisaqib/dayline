import { MAX_PROFILE_TOPICS, TOPICS } from "@/domain/topics";
import { TopicForm } from "@/features/onboarding/TopicForm";
import { TOPIC_DESCRIPTIONS } from "@/features/onboarding/topic-copy";
import { ui } from "@/features/shared/ui";
import { getVerifiedReader } from "@/server/auth/session";
import { createReaderSupabase } from "@/server/db/supabase-server";
import { findProfile } from "@/server/repositories/profiles";
import { supportedTopicIds } from "@/server/sources/catalog";

export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  { title: "We gather", text: "Trusted feeds plus official alerts from CISA and GDACS, checked every morning." },
  { title: "We rank", text: "Stories that match your topics and are freshest rise to the top. At most two per source." },
  { title: "You steer", text: "Tell us More or Less on any story and your next paper adjusts." },
];

export default async function OnboardingPage() {
  const db = await createReaderSupabase();
  const reader = await getVerifiedReader(db);
  const profile = reader ? await findProfile(db, reader.id) : null;
  const selected = profile ? profile.topics : [];
  const supported = supportedTopicIds();
  const topics = TOPICS.filter((t) => supported.has(t.id)).map(({ id, label }) => ({ id, label, description: TOPIC_DESCRIPTIONS[id] }));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
      <section className="animate-fade-up lg:pt-4">
        <p className={ui.eyebrow}>Set up your paper</p>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">Choose what you want in your five-minute morning paper.</h1>
        <p className="mt-4 text-[15px] text-muted">Pick the topics you care about. It takes about ten seconds, and you can change them any time.</p>
        <ol className="mt-8 space-y-4 border-t border-rule pt-6">
          {HOW_IT_WORKS.map((item, index) => (
            <li key={item.title} className="flex gap-4">
              <span className="w-6 shrink-0 font-serif text-2xl font-bold text-accent" aria-hidden="true">
                {index + 1}
              </span>
              <span>
                <span className="block font-semibold">{item.title}</span>
                <span className="block text-sm text-muted">{item.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <section aria-label="Choose topics" className="animate-fade-up" style={{ animationDelay: "60ms" }}>
        <TopicForm topics={topics} selected={selected} maxTopics={MAX_PROFILE_TOPICS} isReturning={profile !== null} />
      </section>
    </div>
  );
}
