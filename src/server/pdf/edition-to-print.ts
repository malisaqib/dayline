import type { PresentedEdition } from "@/domain/editions/presentation";
import type { PrintEdition } from "./EditionDocument";

export function toPrintEdition(presented: PresentedEdition): PrintEdition {
  const [lead, ...rest] = presented.stories;
  return {
    dateLabel: presented.dateLabel,
    timezone: presented.timezone,
    editionLabel: presented.editionLabel,
    fixtureNotice: null,
    highlights: presented.highlights,
    lead,
    stories: rest,
  };
}
