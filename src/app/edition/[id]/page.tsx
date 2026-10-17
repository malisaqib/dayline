import { notFound } from "next/navigation";
import { presentEdition } from "@/domain/editions/presentation";
import { EditionView } from "@/features/newspaper/EditionView";
import { readOwnEdition } from "@/server/services/read-edition";

export const dynamic = "force-dynamic";

export default async function EditionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const edition = await readOwnEdition(id);
  if (!edition) {
    notFound();
  }
  return <EditionView edition={presentEdition(edition)} pdfHref={`/api/editions/${edition.id}/pdf`} />;
}
