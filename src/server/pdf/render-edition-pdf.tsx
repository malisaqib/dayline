import { renderToBuffer } from "@react-pdf/renderer";
import { EditionDocument, type PrintEdition } from "./EditionDocument";

export async function renderEditionPdf(edition: PrintEdition): Promise<Buffer> {
  return renderToBuffer(<EditionDocument edition={edition} />);
}
