import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthError } from "@supabase/supabase-js";
import { isPrivatePath, safeReturnPath } from "@/domain/auth/return-path";
import { describeAuthError } from "@/server/auth/password-auth";

describe("safe return paths", () => {
  it("accepts Dayline reader routes with their query", () => {
    assert.equal(safeReturnPath("/today"), "/today");
    assert.equal(safeReturnPath("/archive"), "/archive");
    assert.equal(safeReturnPath("/edition/abc?welcome=1"), "/edition/abc?welcome=1");
    assert.equal(safeReturnPath("/onboarding"), "/onboarding");
    assert.equal(safeReturnPath("/reset-password"), "/reset-password");
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
    assert.ok(isPrivatePath("/onboarding"));
  });
});

describe("auth error mapping", () => {
  it("names the case the reader can act on", () => {
    assert.equal(describeAuthError(new AuthError("expired", 403, "otp_expired")).kind, "expired");
    assert.equal(describeAuthError(new AuthError("slow down", 429, "over_email_send_rate_limit")).kind, "rate_limited");
    assert.equal(describeAuthError(new AuthError("taken", 422, "email_exists")).kind, "email_taken");
    assert.equal(describeAuthError(new AuthError("smtp", 500, "unexpected_failure")).kind, "delivery");
    assert.equal(describeAuthError(new Error("boom")).kind, "unknown");
  });
});
