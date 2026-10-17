export type FeedSource = {
  id: string;
  name: string;
  url: string;
  topics: string[];
  /** What we know about reuse rights. Nothing here is cleared for production use yet. */
  reuseNote: string;
};

/** Candidate feeds checked in Phase 0. Enabling one for real editions requires reviewing its terms. */
export const CANDIDATE_SOURCES: FeedSource[] = [
  {
    id: "nasa",
    name: "NASA",
    url: "https://www.nasa.gov/news-release/feed/",
    topics: ["space", "science"],
    reuseNote: "US government work, generally public domain; NASA media guidelines and third-party images still apply.",
  },
  {
    id: "npr",
    name: "NPR News",
    url: "https://feeds.npr.org/1001/rss.xml",
    topics: ["world", "politics"],
    reuseNote: "RSS offered for personal, non-commercial use; AI summarisation not explicitly permitted. Unresolved.",
  },
  {
    id: "ars",
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    topics: ["technology"],
    reuseNote: "Condé Nast terms; RSS for personal use. AI processing of full text unresolved.",
  },
  {
    id: "dawn",
    name: "Dawn",
    url: "https://www.dawn.com/feeds/home",
    topics: ["pakistan", "world"],
    reuseNote: "Feed includes long article text; republication rights unclear. Link-out plus short brief only until checked.",
  },
  {
    id: "bbc",
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    topics: ["world"],
    reuseNote: "BBC RSS terms allow headline/link display for personal use; restrict AI reuse. Treat as headline + link only.",
  },
  {
    id: "sciencedaily",
    name: "ScienceDaily",
    url: "https://www.sciencedaily.com/rss/all.xml",
    topics: ["science", "health"],
    reuseNote: "Releases come from institutions; ScienceDaily terms on reuse of its summaries unresolved.",
  },
];
