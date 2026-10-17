import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PresentedHighlight } from "@/domain/editions/presentation";

// Never split words with hyphens: broken headlines read badly and the PDF text must match the web text.
Font.registerHyphenationCallback((word) => [word]);

export type PrintStory = {
  headline: string;
  kicker: string;
  body: string;
  takeaways: string[];
  /** Provenance line, e.g. "Publisher's excerpt · 17 Oct 2026". */
  meta: string;
  sourceName: string;
  sourceUrl: string;
};

export type PrintEdition = {
  dateLabel: string;
  timezone: string;
  editionLabel: string;
  /** Shown as a banner when the content is not a real generated edition. */
  fixtureNotice: string | null;
  highlights: PresentedHighlight[];
  lead: PrintStory;
  stories: PrintStory[];
};

const INK = "#1c1a17";
const PAPER = "#f7f3ea";
const ACCENT = "#9a2b1f";
const RULE = "#bdb5a6";
const MUTED = "#6b655b";

// Built-in PDF fonts (Times, Helvetica) avoid runtime font downloads on the host.
const styles = StyleSheet.create({
  page: { backgroundColor: PAPER, color: INK, paddingTop: 30, paddingBottom: 40, paddingHorizontal: 36, fontFamily: "Times-Roman" },
  fixtureBanner: {
    backgroundColor: ACCENT,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1,
    textAlign: "center",
    paddingVertical: 4,
    marginBottom: 10,
  },
  masthead: { fontFamily: "Times-Bold", fontSize: 46, textAlign: "center", letterSpacing: 3 },
  tagline: { fontFamily: "Times-Italic", fontSize: 10, textAlign: "center", marginTop: 2 },
  dateline: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1.5,
    borderBottomWidth: 0.5,
    borderColor: INK,
    paddingVertical: 4,
    marginTop: 8,
    marginBottom: 14,
    fontFamily: "Helvetica",
    fontSize: 8,
  },
  leadHeadline: { fontFamily: "Times-Bold", fontSize: 24, lineHeight: 1.15, marginBottom: 6 },
  leadBody: { fontSize: 11, lineHeight: 1.45, textAlign: "justify" },
  sectionRule: { borderBottomWidth: 0.5, borderColor: RULE, marginVertical: 12 },
  columns: { flexDirection: "row", gap: 18 },
  column: { flex: 1 },
  story: { marginBottom: 12 },
  headline: { fontFamily: "Times-Bold", fontSize: 14, lineHeight: 1.2, marginBottom: 4 },
  body: { fontSize: 10, lineHeight: 1.45, textAlign: "justify" },
  source: { fontFamily: "Helvetica", fontSize: 7.5, marginTop: 4, color: ACCENT },
  meta: { fontFamily: "Helvetica", fontSize: 7, marginTop: 3, color: MUTED },
  kicker: { fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 0.5, color: ACCENT, marginBottom: 2 },
  takeaway: { fontSize: 9.5, lineHeight: 1.35, marginTop: 2, paddingLeft: 8 },
  brief: { borderWidth: 0.75, borderColor: INK, padding: 8, marginBottom: 12 },
  briefTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, letterSpacing: 1, color: ACCENT, marginBottom: 4 },
  briefItem: { flexDirection: "row", marginTop: 3 },
  briefNumber: { fontFamily: "Times-Bold", fontSize: 11, width: 14, color: ACCENT },
  briefText: { flex: 1, fontSize: 10, lineHeight: 1.35 },
  briefSource: { fontFamily: "Helvetica", fontSize: 7, color: MUTED },
  briefNote: { fontFamily: "Helvetica", fontSize: 6.5, color: MUTED, marginTop: 5 },
  footer: { position: "absolute", bottom: 16, left: 36, right: 36, fontFamily: "Helvetica", fontSize: 7, textAlign: "center", color: MUTED },
});

function SourceLine({ story }: { story: PrintStory }) {
  return (
    <>
      <Text style={styles.meta}>{story.meta}</Text>
      <Text style={styles.source}>
      Source: {story.sourceName} {"— "}
        <Link src={story.sourceUrl}>Read the original</Link>
      </Text>
    </>
  );
}

function Takeaways({ items }: { items: string[] }) {
  return items.length === 0 ? null : (
    <View style={{ marginTop: 4 }}>
      {items.map((item) => (
        <Text key={item} style={styles.takeaway}>
          {"• "}
          {item}
        </Text>
      ))}
    </View>
  );
}

function highlightLabel(item: PresentedHighlight): string {
  if (item.kind === "quote") {
    return `${item.sourceName}, quoted · story ${item.position}`;
  }
  return `${item.sourceName} · story ${item.position}`;
}

function TodayInThree({ items }: { items: PresentedHighlight[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.brief} wrap={false}>
      <Text style={styles.briefTitle}>TODAY IN THREE</Text>
      {items.map((item, index) => (
        <View key={`${item.position}-${index}`} style={styles.briefItem}>
          <Text style={styles.briefNumber}>{index + 1}</Text>
          <Text style={styles.briefText}>
            {item.sentence}{" "}
            <Link src={item.sourceUrl} style={styles.briefSource}>
              ({highlightLabel(item)})
            </Link>
          </Text>
        </View>
      ))}
      <Text style={styles.briefNote}>Short lines written by AI and checked against each story&apos;s text, or quoted from the publisher where marked.</Text>
    </View>
  );
}

function StoryBlock({ story }: { story: PrintStory }) {
  return (
    <View style={styles.story} wrap={false}>
      {story.kicker && <Text style={styles.kicker}>{story.kicker.toUpperCase()}</Text>}
      <Text style={styles.headline}>{story.headline}</Text>
      {story.body && <Text style={styles.body}>{story.body}</Text>}
      <Takeaways items={story.takeaways} />
      <SourceLine story={story} />
    </View>
  );
}

// Rows of two keep reading order (left, right, next row) even when a row breaks onto the next page.
function pairIntoRows<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

export function EditionDocument({ edition }: { edition: PrintEdition }) {
  const rows = pairIntoRows(edition.stories);

  return (
    <Document title={`Dayline — ${edition.dateLabel}`} author="Dayline">
      <Page size="A4" style={styles.page}>
        {edition.fixtureNotice && <Text style={styles.fixtureBanner}>{edition.fixtureNotice}</Text>}
        <Text style={styles.masthead}>DAYLINE</Text>
        <Text style={styles.tagline}>Your interests. One morning paper. Five minutes well spent.</Text>
        <View style={styles.dateline}>
          <Text>{edition.dateLabel}</Text>
          <Text>{edition.editionLabel}</Text>
          <Text>{edition.timezone}</Text>
        </View>

        <TodayInThree items={edition.highlights} />

        {edition.lead.kicker && <Text style={styles.kicker}>{edition.lead.kicker.toUpperCase()}</Text>}
        <Text style={styles.leadHeadline}>{edition.lead.headline}</Text>
        {edition.lead.body && <Text style={styles.leadBody}>{edition.lead.body}</Text>}
        <Takeaways items={edition.lead.takeaways} />
        <SourceLine story={edition.lead} />

        <View style={styles.sectionRule} />

        {rows.map((row) => (
          <View key={row[0].sourceUrl} style={styles.columns} wrap={false}>
            {row.map((story) => (
              <View key={story.sourceUrl + story.headline} style={styles.column}>
                <StoryBlock story={story} />
              </View>
            ))}
            {row.length === 1 && <View style={styles.column} />}
          </View>
        ))}

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Dayline · page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
