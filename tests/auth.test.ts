import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPrivatePath, safeReturnPath } from "@/domain/auth/return-path";

describe("safe return paths", () => {
  it("accepts Dayline reader routes with their query", () => {
    assert.equal(safeReturnPath("/today"), "/today");
    assert.equal(safeReturnPath("/archive"), "/archive");
    assert.equal(safeReturnPath("/edition/abc?welcome=1"), "/edition/abc?welcome=1");
    assert.equal(safeReturnPath("/onboarding"), "/onboarding");
  });

  it("rejects external, protocol-relative, encoded and unknown destinations", () => {
    for (const raw of ["https://evil.example", "//evil.example", "/\\evil.example", "/signin", "/", "/api/editions/x/pdf", "javascript:alert(1)", "/todayevil", null, ""]) {
      assert.equal(safeReturnPath(raw), null, String(raw));
    }
  });

  it("marks only reader pages as private", () => {
    assert.ok(isPrivatePath("/today"));
    assert.ok(isPrivatePath("/edition/123"));
    assert.ok(isPrivatePath("/archive"));
    assert.ok(!isPrivatePath("/"));
    assert.ok(!isPrivatePath("/signin"));
    assert.ok(!isPrivatePath("/onboarding"));
  });
});
