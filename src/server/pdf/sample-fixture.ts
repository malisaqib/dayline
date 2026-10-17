import type { PrintEdition } from "./EditionDocument";

const EDITION_TIMEZONE = "Asia/Karachi";

const FILLER =
  "This paragraph is placeholder text used to test the newspaper layout. It checks justified columns, line height, " +
  "page margins and how longer passages wrap without clipping at the edge of the page.";

function formatEditionDate(now: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: EDITION_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

/** Layout fixture for the Phase 0 PDF check. Every story is placeholder text, labelled as such. */
export function buildSamplePrintEdition(now = new Date()): PrintEdition {
  return {
    dateLabel: formatEditionDate(now),
    timezone: EDITION_TIMEZONE,
    editionLabel: "Sample edition",
    fixtureNotice: "SAMPLE CONTENT — LAYOUT TEST, NOT REAL NEWS",
    lead: {
      headline: "Sample lead story: a placeholder headline long enough to wrap across two lines of the front page",
      body: `${FILLER} ${FILLER} ${FILLER}`,
      takeaways: [],
      meta: "Placeholder text",
      sourceName: "NASA (link only)",
      sourceUrl: "https://www.nasa.gov/news/",
    },
    stories: [
      { headline: "Sample story one", body: `${FILLER} ${FILLER}`, takeaways: [], meta: "Placeholder text", sourceName: "NPR (link only)", sourceUrl: "https://www.npr.org/" },
      { headline: "Sample story two with a longer placeholder headline", body: FILLER, takeaways: [], meta: "Placeholder text", sourceName: "Ars Technica (link only)", sourceUrl: "https://arstechnica.com/" },
      { headline: "Sample story three", body: `${FILLER} ${FILLER}`, takeaways: [], meta: "Placeholder text", sourceName: "Dawn (link only)", sourceUrl: "https://www.dawn.com/" },
      { headline: "Sample story four", body: FILLER, takeaways: [], meta: "Placeholder text", sourceName: "ScienceDaily (link only)", sourceUrl: "https://www.sciencedaily.com/" },
    ],
  };
}
