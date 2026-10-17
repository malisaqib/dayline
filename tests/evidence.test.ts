import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkClaim, extractiveSentence } from "@/domain/articles/evidence";

const SOURCE = "The ministry said 1,200 homes were damaged. Officials denied that the dam failed. The mayor was allegedly paid to approve the permit.";

describe("evidence checks (adversarial fixtures, not a fact checker)", () => {
  it("accepts faithful claims", () => {
    assert.deepEqual(checkClaim("The ministry said 1200 homes were damaged.", SOURCE), { ok: true });
    assert.equal(checkClaim("Officials denied the dam failed.", SOURCE).ok, true);
  });

  it("rejects a changed number", () => {
    assert.equal(checkClaim("The ministry said 2,100 homes were damaged.", SOURCE).ok, false);
  });

  it("rejects an invented denial or negation", () => {
    assert.equal(checkClaim("The ministry denied homes were damaged.", "The ministry said homes were damaged.").ok, false);
    assert.equal(checkClaim("No homes were damaged.", "The ministry said homes were damaged.").ok, false);
  });

  it("rejects an allegation stated as fact", () => {
    assert.equal(checkClaim("The mayor was paid to approve the permit.", SOURCE).ok, false);
    assert.equal(checkClaim("The mayor was allegedly paid to approve the permit.", SOURCE).ok, true);
  });

  it("quotes a complete sentence for the fallback", () => {
    assert.equal(extractiveSentence(SOURCE, 5, 35), "The ministry said 1,200 homes were damaged.");
    assert.equal(extractiveSentence("Too short.", 5, 35), null);
  });
});
