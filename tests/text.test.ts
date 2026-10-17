import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { htmlToText } from "@/shared/text";

describe("htmlToText", () => {
  it("decodes numeric, padded and double-encoded entities", () => {
    assert.equal(htmlToText("the body&#039;s cells"), "the body's cells");
    assert.equal(htmlToText("Germany&amp;#039;s reactor"), "Germany's reactor");
    assert.equal(htmlToText("caf&#xe9; &rsquo;quoted&rsquo;"), "caf\u00e9 \u2019quoted\u2019");
  });

  it("removes markup and scripts without letting decoded text form tags", () => {
    assert.equal(htmlToText("<p>Hi <b>there</b></p><script>alert(1)</script>"), "Hi there");
    assert.equal(htmlToText("a &lt;script&gt; b"), "a <script> b");
  });
});
