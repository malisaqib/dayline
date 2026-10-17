import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseArticleSummary } from "@/domain/articles/summary";

const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
const valid = { summary: words(70), takeaways: ["First supported takeaway.", "Second supported takeaway."] };

describe("parseArticleSummary", () => {
  it("accepts a 60-100 word summary with two or three takeaways", () => {
    assert.equal(parseArticleSummary(JSON.stringify(valid)).ok, true);
  });

  it("rejects malformed JSON", () => {
    assert.equal(parseArticleSummary('{"summary": "cut off').ok, false);
  });

  it("rejects unknown fields", () => {
    assert.equal(parseArticleSummary(JSON.stringify({ ...valid, sourceUrl: "https://elsewhere.example" })).ok, false);
  });

  it("rejects summaries outside 60-100 words", () => {
    assert.equal(parseArticleSummary(JSON.stringify({ ...valid, summary: words(59) })).ok, false);
    assert.equal(parseArticleSummary(JSON.stringify({ ...valid, summary: words(101) })).ok, false);
  });

  it("rejects too few or too many takeaways", () => {
    assert.equal(parseArticleSummary(JSON.stringify({ ...valid, takeaways: ["Only one takeaway here."] })).ok, false);
    assert.equal(parseArticleSummary(JSON.stringify({ ...valid, takeaways: Array(4).fill("A supported takeaway.") })).ok, false);
  });
});
