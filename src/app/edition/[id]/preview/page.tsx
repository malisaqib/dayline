import { notFound } from "next/navigation";
import { PREVIEW_LABEL, previewStories } from "@/domain/editions/preview";
import { presentEdition } from "@/domain/editions/presentation";
import { PreferencesPanel } from "@/features/feedback/PreferencesPanel";
import { EditionView } from "@/features/newspaper/EditionView";
import { readOwnEditionWithContext } from "@/server/services/read-edition";

export const dynamic = "force-dynamic";

// Rendered on request and never stored: not a daily edition, not in the archive, no PDF.
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await readOwnEditionWithContext(id);
  if (!context?.profile) {
    notFound();
  }
  const { edition, profile } = context;
  const presented = presentEdition({ ...edition, stories: previewStories(edition.stories, profile.weights, new Date()) });

  return (
    <EditionView
      edition={{ ...presented, editionLabel: "Preview · not saved" }}
      pdfHref={null}
      notice={`${PREVIEW_LABEL} This is not tomorrow’s paper; it reorders today’s stories using your updated preferences.`}
    >
      <PreferencesPanel topics={profile.topics} weights={profile.weights} previewHref={`/edition/${edition.id}/preview`} />
      <p className="mt-4 text-center text-sm">
        <a href={`/edition/${edition.id}`} className="font-medium text-accent hover:underline">
          &larr; Back to today&apos;s saved paper
        </a>
      </p>
    </EditionView>
  );
}
