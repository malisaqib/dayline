import { renderEditionPdf } from "@/server/pdf/render-edition-pdf";
import { buildSamplePrintEdition } from "@/server/pdf/sample-fixture";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const pdf = await renderEditionPdf(buildSamplePrintEdition());

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="dayline-sample.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
