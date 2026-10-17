import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PresentedStory } from "@/domain/editions/presentation";
import { buildSignalBrief, firstSentence } from "@/domain/editions/signal-brief";
import type { TopicId } from "@/domain/topics";

function story(id: string, topics: TopicId[], options: { body?: string; kicker?: string; minutes?: number | null } = {}): PresentedStory {
  return {
    id,
    headline: `Fixture report ${id.repeat(3)} development`,
    kicker: options.kicker ?? "",
    body: options.body ?? "First sentence of the fixture. Second sentence.",
    takeaways: [],
    meta: "",
    bodyLabel: "Publisher's excerpt",
    publishedLabel: "17 Oct, 09:00",
    topicLabels: [],
    topics,
    readingMinutes: options.minutes === undefined ? 1 : options.minutes,
    reasons: [],
    sourceName: "Source",
    sourceUrl: `https://example.org/${id}`,
  };
}

const STORIES = [
  story("a", ["technology"]),
  story("b", ["space"], { minutes: 2 }),
  story("c", ["technology", "security"], { kicker: "Actively exploited vulnerability" }),
  story("d", ["disasters"], { kicker: "Disaster alert", body: "", minutes: null }),
];

describe("signal brief", () => {
  it("uses the highest-ranked story as the top signal with its first sentence only", () => {
    const brief = buildSignalBrief(STORIES, ["technology"], { technology: 1 });
    assert.equal(brief?.topSignal.story.id, "a");
    assert.equal(brief?.topSignal.sentence, "First sentence of the fixture.");
  });

  it("focuses on the strongest-weighted topic and avoids repeating the top signal", () => {
    const brief = buildSignalBrief(STORIES, ["technology", "space"], { technology: 1.5, space: 0.75 });
    assert.equal(brief?.focus?.story.id, "c");
    assert.equal(brief?.focus?.explanation, "Selected because it matches your Technology interest.");
  });

  it("follows learned weights: a boosted topic becomes the focus", () => {
    const brief = buildSignalBrief(STORIES, ["technology", "space"], { technology: 0.75, space: 1.5 });
    assert.equal(brief?.focus?.story.id, "b");
  });

  it("lists only labelled Internet Pulse items not already shown, and is empty when there are none", () => {
    assert.deepEqual(buildSignalBrief(STORIES, ["technology"], {})?.pulse.map((p) => p.story.id), ["d"]);
    assert.deepEqual(buildSignalBrief(STORIES.slice(0, 2), ["technology"], {})?.pulse, []);
  });

  it("does not repeat a near-duplicate of the top signal as the focus", () => {
    const dupes = [
      { ...story("x", ["technology"]), headline: "DeepSeek: DeepSeek v4.1 Flash 1017" },
      { ...story("y", ["technology"]), headline: "DeepSeek-v4.1-Flash-1017" },
      { ...story("z", ["technology"]), headline: "OpenAI models hacked a crypto wallet" },
    ];
    assert.equal(buildSignalBrief(dupes, ["technology"], {})?.focus?.story.id, "z");
  });

  it("links today-in-three items to their stories and skips unknown references", () => {
    const brief = buildSignalBrief(STORIES, [], {}, [
      { articleHash: "c", sentence: "A grounded line about story c." },
      { articleHash: "missing", sentence: "Refers to nothing in this paper." },
    ]);
    assert.deepEqual(brief?.todayInThree.map((i) => [i.position, i.story.id]), [[3, "c"]]);
  });

  it("sums reading time and counts headline-only stories as zero", () => {
    assert.equal(buildSignalBrief(STORIES, [], {})?.readingMinutes, 4);
  });

  it("never invents a summary: headline-only stories have no sentence and long sentences are only trimmed", () => {
    assert.equal(firstSentence(""), null);
    const long = `${"word ".repeat(80)}end.`;
    const trimmed = firstSentence(long) ?? "";
    assert.ok(long.startsWith(trimmed.replace("…", "")));
  });
});
