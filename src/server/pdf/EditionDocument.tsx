import { Document, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export type PrintStory = {
  headline: string;
  body: string;
  sourceName: string;
  sourceUrl: string;
};

export type PrintEdition = {
  dateLabel: string;
  timezone: string;
  editionLabel: string;
  /** Shown as a banner when the content is not a real generated edition. */
  fixtureNotice: string | null;
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
  footer: { position: "absolute", bottom: 16, left: 36, right: 36, fontFamily: "Helvetica", fontSize: 7, textAlign: "center", color: MUTED },
});

function SourceLine({ story }: { story: PrintStory }) {
  return (
    <Text style={styles.source}>
      Source: {story.sourceName} {"— "}
      <Link src={story.sourceUrl}>Read the original</Link>
    </Text>
  );
}

function StoryBlock({ story }: { story: PrintStory }) {
  return (
    <View style={styles.story} wrap={false}>
      <Text style={styles.headline}>{story.headline}</Text>
      <Text style={styles.body}>{story.body}</Text>
      <SourceLine story={story} />
    </View>
  );
}

function splitIntoColumns<T>(items: T[]): [T[], T[]] {
  const half = Math.ceil(items.length / 2);
  return [items.slice(0, half), items.slice(half)];
}

export function EditionDocument({ edition }: { edition: PrintEdition }) {
  const [left, right] = splitIntoColumns(edition.stories);

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

        <Text style={styles.leadHeadline}>{edition.lead.headline}</Text>
        <Text style={styles.leadBody}>{edition.lead.body}</Text>
        <SourceLine story={edition.lead} />

        <View style={styles.sectionRule} />

        <View style={styles.columns}>
          <View style={styles.column}>
            {left.map((story) => (
              <StoryBlock key={story.sourceUrl + story.headline} story={story} />
            ))}
          </View>
          <View style={styles.column}>
            {right.map((story) => (
              <StoryBlock key={story.sourceUrl + story.headline} story={story} />
            ))}
          </View>
        </View>

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Dayline · page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
