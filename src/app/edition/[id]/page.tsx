import { notFound } from "next/navigation";
import { presentEdition } from "@/domain/editions/presentation";
import { FeedbackControls } from "@/features/feedback/FeedbackControls";
import { PreferencesPanel } from "@/features/feedback/PreferencesPanel";
import { EditionView } from "@/features/newspaper/EditionView";
import { readOwnEditionWithContext } from "@/server/services/read-edition";

export const dynamic = "force-dynamic";

export default async function EditionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await readOwnEditionWithContext(id);
  if (!context) {
    notFound();
  }
  const { edition, profile, signals } = context;

  return (
    <EditionView
      edition={presentEdition(edition)}
      pdfHref={`/api/editions/${edition.id}/pdf`}
      storyFooter={(story) => <FeedbackControls editionId={edition.id} articleHash={story.id} initial={signals[story.id] ?? null} />}
    >
      {profile && <PreferencesPanel topics={profile.topics} weights={profile.weights} previewHref={`/edition/${edition.id}/preview`} />}
    </EditionView>
  );
}
