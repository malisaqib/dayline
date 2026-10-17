import path from "node:path";
import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PresentedHighlight } from "@/domain/editions/presentation";

const FONT_DIR = path.join(process.cwd(), "src", "server", "pdf", "fonts");

Font.register({
  family: "Playfair",
  fonts: [
    { src: path.join(FONT_DIR, "PlayfairDisplay-700.ttf"), fontWeight: 700 },
    { src: path.join(FONT_DIR, "PlayfairDisplay-900.ttf"), fontWeight: 900 },
  ],
});
Font.register({
  family: "Geist",
  fonts: [
    { src: path.join(FONT_DIR, "Geist-400.ttf"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "Geist-600.ttf"), fontWeight: 600 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

export type PrintStory = {
  headline: string;
  kicker: string;
  body: string;
  takeaways: string[];
  meta: string;
  sourceName: string;
  sourceUrl: string;
  topicLabels: string[];
  reasons: string[];
};

export type PrintEdition = {
  dateLabel: string;
  timezone: string;
  editionLabel: string;
  fixtureNotice: string | null;
  highlights: PresentedHighlight[];
  lead: PrintStory;
  stories: PrintStory[];
};

const PAPER = "#f8f4ec";
const CARD = "#fffdf8";
const INK = "#1d2433";
const MUTED = "#4d5769";
const ACCENT = "#d9573b";
const ACCENT_STRONG = "#a8331a";
const ACCENT_SOFT = "#fbe9e3";
const RULE = "#e2d8c7";

const styles = StyleSheet.create({
  page: { backgroundColor: PAPER, color: INK, paddingTop: 28, paddingBottom: 44, paddingHorizontal: 34, fontFamily: "Geist", fontSize: 10 },
  fixtureBanner: { backgroundColor: ACCENT, color: INK, fontWeight: 600, fontSize: 8, letterSpacing: 1, textAlign: "center", paddingVertical: 4, marginBottom: 10, borderRadius: 4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  mark: { width: 30, height: 30, borderRadius: 6, backgroundColor: INK, color: PAPER, fontFamily: "Playfair", fontWeight: 900, fontSize: 19, textAlign: "center", paddingTop: 3 },
  masthead: { fontFamily: "Playfair", fontWeight: 900, fontSize: 34, letterSpacing: 0.5 },
  headerMeta: { alignItems: "flex-end" },
  headerDate: { fontWeight: 600, fontSize: 10 },
  headerSub: { fontSize: 8, color: MUTED, marginTop: 2 },
  tagline: { fontSize: 9, color: MUTED, marginTop: 6 },
  accentRule: { height: 3, backgroundColor: ACCENT, borderRadius: 2, marginTop: 8, marginBottom: 14 },
  eyebrow: { fontWeight: 600, fontSize: 7.5, letterSpacing: 1.2, color: ACCENT_STRONG },
  brief: { backgroundColor: CARD, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: ACCENT, borderWidth: 0.5, borderColor: RULE, padding: 10, marginBottom: 14 },
  briefItem: { flexDirection: "row", marginTop: 5 },
  briefNumber: { fontFamily: "Playfair", fontWeight: 900, fontSize: 13, width: 16, color: ACCENT },
  briefText: { flex: 1, fontSize: 10, lineHeight: 1.4 },
  briefSource: { fontSize: 7.5, color: MUTED },
  briefNote: { fontSize: 7, color: MUTED, marginTop: 6 },
  lead: { backgroundColor: CARD, borderRadius: 10, borderTopWidth: 3, borderTopColor: ACCENT, borderWidth: 0.5, borderColor: RULE, padding: 14, marginBottom: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, alignItems: "center", marginBottom: 6 },
  badge: { backgroundColor: ACCENT, color: INK, fontWeight: 600, fontSize: 7, letterSpacing: 1, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3 },
  chip: { borderWidth: 0.5, borderColor: RULE, borderRadius: 8, paddingVertical: 1.5, paddingHorizontal: 6, fontSize: 7, color: INK },
  number: { fontFamily: "Playfair", fontWeight: 900, fontSize: 13, color: ACCENT },
  kicker: { fontWeight: 600, fontSize: 7, letterSpacing: 0.6, color: ACCENT_STRONG, marginBottom: 3 },
  leadHeadline: { fontFamily: "Playfair", fontWeight: 900, fontSize: 24, lineHeight: 1.15, marginBottom: 6 },
  leadBody: { fontSize: 11, lineHeight: 1.5 },
  takeawayBox: { marginTop: 7, borderLeftWidth: 2, borderLeftColor: ACCENT_SOFT, paddingLeft: 8 },
  takeawayTitle: { fontWeight: 600, fontSize: 7, letterSpacing: 1, color: MUTED, marginBottom: 2 },
  takeaway: { fontSize: 9.5, lineHeight: 1.4, marginTop: 1.5 },
  columns: { flexDirection: "row", gap: 12, marginBottom: 12 },
  column: { flex: 1 },
  story: { backgroundColor: CARD, borderRadius: 8, borderWidth: 0.5, borderColor: RULE, padding: 10, marginBottom: 12 },
  headline: { fontFamily: "Playfair", fontWeight: 700, fontSize: 13.5, lineHeight: 1.2, marginBottom: 4 },
  body: { fontSize: 9.5, lineHeight: 1.45 },
  footerRow: { marginTop: 7, borderTopWidth: 0.5, borderTopColor: RULE, paddingTop: 5 },
  why: { fontSize: 7.5, color: INK, marginBottom: 2 },
  meta: { fontSize: 7, color: MUTED },
  source: { fontSize: 7.5, color: ACCENT_STRONG, marginTop: 2 },
  footer: { position: "absolute", bottom: 18, left: 34, right: 34, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: MUTED },
});

function whyLine(story: PrintStory): string | null {
  const reason = story.reasons.find((r) => r.startsWith("Matches your"));
  if (!reason) {
    return null;
  }
  return reason.replace(/ \((boosted|reduced) by your feedback\)/g, "");
}

function renderWhy(story: PrintStory) {
  const why = whyLine(story);
  if (!why) {
    return null;
  }
  return <Text style={styles.why}>Why: {why}</Text>;
}

function renderKicker(story: PrintStory) {
  if (!story.kicker) {
    return null;
  }
  return <Text style={styles.kicker}>{story.kicker.toUpperCase()}</Text>;
}

function renderBody(story: PrintStory, style: (typeof styles)["body"]) {
  if (!story.body) {
    return <Text style={[style, { color: MUTED }]}>The publisher shares only the headline. Open the original to read it.</Text>;
  }
  return <Text style={style}>{story.body}</Text>;
}

function Chips({ story, badge }: { story: PrintStory; badge: string | null }) {
  return (
    <View style={styles.chipRow}>
      {renderBadge(badge)}
      {story.topicLabels.map((label) => (
        <Text key={label} style={styles.chip}>
          {label}
        </Text>
      ))}
    </View>
  );
}

function renderBadge(badge: string | null) {
  if (!badge) {
    return null;
  }
  if (badge === "TOP STORY") {
    return <Text style={styles.badge}>{badge}</Text>;
  }
  return <Text style={styles.number}>{badge}</Text>;
}

function Takeaways({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.takeawayBox}>
      <Text style={styles.takeawayTitle}>WHAT HAPPENED</Text>
      {items.map((item) => (
        <Text key={item} style={styles.takeaway}>
          {"• "}
          {item}
        </Text>
      ))}
    </View>
  );
}

function StoryFooter({ story }: { story: PrintStory }) {
  return (
    <View style={styles.footerRow}>
      {renderWhy(story)}
      <Text style={styles.meta}>{story.meta}</Text>
      <Text style={styles.source}>
        {story.sourceName} {"· "}
        <Link src={story.sourceUrl}>Read the original</Link>
      </Text>
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
      <Text style={styles.eyebrow}>TODAY IN THREE</Text>
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

function LeadStory({ story }: { story: PrintStory }) {
  return (
    <View style={styles.lead}>
      <Chips story={story} badge="TOP STORY" />
      {renderKicker(story)}
      <Text style={styles.leadHeadline}>{story.headline}</Text>
      {renderBody(story, styles.leadBody)}
      <Takeaways items={story.takeaways} />
      <StoryFooter story={story} />
    </View>
  );
}

function StoryBlock({ story, position }: { story: PrintStory; position: number }) {
  return (
    <View style={styles.story} wrap={false}>
      <Chips story={story} badge={String(position).padStart(2, "0")} />
      {renderKicker(story)}
      <Text style={styles.headline}>{story.headline}</Text>
      {renderBody(story, styles.body)}
      <Takeaways items={story.takeaways} />
      <StoryFooter story={story} />
    </View>
  );
}

function splitColumns<T>(items: T[]): [T[], T[]] {
  return [items.filter((_, index) => index % 2 === 0), items.filter((_, index) => index % 2 === 1)];
}

function renderFixture(notice: string | null) {
  if (!notice) {
    return null;
  }
  return <Text style={styles.fixtureBanner}>{notice}</Text>;
}

export function EditionDocument({ edition }: { edition: PrintEdition }) {
  const [left, right] = splitColumns(edition.stories.map((story, index) => ({ story, position: index + 2 })));

  return (
    <Document title={`Dayline · ${edition.dateLabel}`} author="Dayline">
      <Page size="A4" style={styles.page}>
        {renderFixture(edition.fixtureNotice)}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.mark}>D</Text>
            <Text style={styles.masthead}>Dayline</Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.headerDate}>{edition.dateLabel}</Text>
            <Text style={styles.headerSub}>
              {edition.editionLabel} · {edition.timezone}
            </Text>
          </View>
        </View>
        <Text style={styles.tagline}>Your interests. One morning paper. Five minutes well spent.</Text>
        <View style={styles.accentRule} />

        <TodayInThree items={edition.highlights} />
        <LeadStory story={edition.lead} />

        <View style={styles.columns}>
          {[left, right].map((column, index) => (
            <View key={`column-${index}`} style={styles.column}>
              {column.map(({ story, position }) => (
                <StoryBlock key={story.sourceUrl + story.headline} story={story} position={position} />
              ))}
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text>Dayline · every story links to its original publisher</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
