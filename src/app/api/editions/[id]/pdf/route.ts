import { presentEdition } from "@/domain/editions/presentation";
import { toPrintEdition } from "@/server/pdf/edition-to-print";
import { renderEditionPdf } from "@/server/pdf/render-edition-pdf";
import { readOwnEdition } from "@/server/services/read-edition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const edition = await readOwnEdition(id);
  if (!edition) {
    return new Response("Not found", { status: 404 });
  }

  const pdf = await renderEditionPdf(toPrintEdition(presentEdition(edition)));
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dayline-${edition.localDate}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
