import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { chromium, type Browser, type Page } from "playwright";
import { getSupabaseAdmin } from "@/server/db/supabase-admin";
import { getDatabaseEnv } from "@/server/env";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3101").replace(/\/$/, "");
const GENERATION_TIMEOUT_MS = 120_000;

let failures = 0;
const cleanupIds: string[] = [];
function check(ok: boolean, label: string): void {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  failures += ok ? 0 : 1;
}

function testEmail(label: string): string {
  return `dayline-${label}-${randomBytes(4).toString("hex")}@mailinator.com`;
}

async function inboxLinkFor(email: string): Promise<string> {
  const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data.properties) {
    throw new Error(`could not issue a sign-in token: ${error?.message}`);
  }
  return data.properties.hashed_token;
}

async function confirm(page: Page, tokenHash: string, type: string, next: string): Promise<string> {
  await page.goto(`${BASE_URL}/auth/confirm?token_hash=${tokenHash}&type=${type}&next=${encodeURIComponent(next)}`);
  return new URL(page.url()).pathname + new URL(page.url()).search;
}

async function sessionUser(page: Page): Promise<{ id: string; email: string | null; anonymous: boolean } | null> {
  const cookies = await page.context().cookies();
  const token = cookies.filter((c) => /auth-token(\.\d+)?$/.test(c.name)).sort((a, b) => a.name.localeCompare(b.name)).map((c) => c.value).join("");
  if (!token) {
    return null;
  }
  const raw = token.startsWith("base64-") ? Buffer.from(token.slice(7), "base64url").toString("utf8") : decodeURIComponent(token);
  const session = JSON.parse(raw) as { access_token: string };
  const { data } = await getSupabaseAdmin().auth.getUser(session.access_token);
  if (!data.user) {
    return null;
  }
  return { id: data.user.id, email: data.user.email ?? null, anonymous: data.user.is_anonymous ?? false };
}

let lastPage: Page | null = null;

async function onboard(page: Page, topics: string[]): Promise<string> {
  lastPage = page;
  page.on("pageerror", (error) => console.log(`page error: ${error.message}`));
  for (const topic of topics) {
    await page.locator(`input[name="topics"][value="${topic}"]`).check();
  }
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Create my first paper" }).click();
  await page.waitForURL(/\/edition\/[0-9a-f-]{36}(\?.*)?$/, { timeout: GENERATION_TIMEOUT_MS });
  return new URL(page.url()).pathname.split("/edition/")[1];
}

async function routing(browser: Browser): Promise<void> {
  const page = await (await browser.newContext()).newPage();
  const home = await page.goto(`${BASE_URL}/`);
  check(home?.status() === 200 && new URL(page.url()).pathname === "/", "public overview stays open without signing in");
  await page.goto(`${BASE_URL}/archive`);
  const url = new URL(page.url());
  check(url.pathname === "/signin" && url.searchParams.get("next") === "/archive" && url.searchParams.get("reason") === "signin", "signed-out /archive -> /signin?next=/archive");
  check(await page.getByText("Sign in to open your paper.").isVisible(), "sign-in page explains why");
  await page.goto(`${BASE_URL}/onboarding`);
  check(new URL(page.url()).pathname === "/signin", "signed-out /onboarding -> /signin (no anonymous papers)");
  await page.goto(`${BASE_URL}/signin?next=https://evil.example`);
  check((await page.locator('input[name="next"]').first().inputValue()) === "", "external return path is dropped");
  await page.goto(`${BASE_URL}/auth/confirm?token_hash=not-a-real-token&type=magiclink&next=/today`);
  check(new URL(page.url()).search === "?error=link_expired", "invalid link -> /signin?error=link_expired");
  check(await page.getByText("That sign-in link has expired or was already used.").isVisible(), "expired-link notice shown, no loop");
  await page.context().close();
}

async function permanentAccount(browser: Browser, email: string): Promise<{ id: string; editionId: string }> {
  const password = `pw-${randomBytes(9).toString("hex")}`;
  const created = await getSupabaseAdmin().auth.admin.createUser({ email, password, email_confirm: true });
  if (!created.data.user) {
    throw new Error(`could not create the test account: ${created.error?.message}`);
  }
  const id = created.data.user.id;
  cleanupIds.push(id);
  const first = await browser.newContext();
  const page = await first.newPage();
  await page.goto(`${BASE_URL}/signin?next=/archive`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("wrong-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.locator("form p[role=alert]").waitFor();
  check(/don't match/.test((await page.locator("form p[role=alert]").textContent()) ?? ""), "wrong password is refused with a clear message");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/onboarding/);
  check(true, "password sign-in for a new account without topics -> /onboarding");
  const link = await inboxLinkFor(email);
  const editionId = await onboard(page, ["space", "technology"]);
  check((await sessionUser(page))?.id === id, "edition made under the permanent account");
  await page.reload();
  check(new URL(page.url()).pathname === `/edition/${editionId}`, "refresh keeps the signed-in session");
  await confirm(page, link, "magiclink", "/today");
  check((await confirm(page, link, "magiclink", "/today")).startsWith("/signin?error=link_expired"), "a used link cannot be replayed");

  await page.goto(`${BASE_URL}/today`);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/signin\?signed_out=1/);
  check(await page.getByText("You've signed out.").isVisible(), "sign-out lands on sign-in with a notice");
  await page.goto(`${BASE_URL}/edition/${editionId}`);
  check(new URL(page.url()).pathname === "/signin", "after sign-out the paper needs sign-in again");
  await first.close();

  const second = await browser.newContext();
  const other = await second.newPage();
  const destination = await confirm(other, await inboxLinkFor(email), "magiclink", "/archive");
  check(destination === "/archive", `existing account with topics -> safe return path (${destination})`);
  check((await other.locator(`a[href="/edition/${editionId}"]`).count()) === 1, "second browser sees the same archive");
  await other.goto(`${BASE_URL}/signin`);
  check(await other.getByText(email).isVisible(), "sign-in page shows the signed-in email");
  await second.close();
  return { id, editionId };
}

async function secondReader(browser: Browser, takenEmail: string, otherEditionId: string): Promise<void> {
  const email = testEmail("second");
  const password = `pw-${randomBytes(9).toString("hex")}`;
  const created = await getSupabaseAdmin().auth.admin.createUser({ email, password, email_confirm: true });
  if (!created.data.user) {
    throw new Error(`could not create the second test account: ${created.error?.message}`);
  }
  cleanupIds.push(created.data.user.id);
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/signin?mode=create`);
  check((await page.locator('[role=tab][aria-selected=true]').textContent()) === "Create account", "Create my paper opens the Create account tab");
  await page.getByLabel("Email address").fill(takenEmail);
  await page.getByLabel("Password", { exact: true }).fill("another-password-123");
  await page.getByLabel("Confirm password", { exact: true }).fill("different-password-9");
  await page.getByRole("button", { name: "Create my account" }).click();
  check(await page.getByText("The two passwords don't match.").waitFor({ timeout: 15_000 }).then(() => true, () => false), "sign-up refuses a confirm password that differs");
  check((await page.getByLabel("Password", { exact: true }).inputValue()) === "another-password-123", "the typed password is kept after an error");
  await page.getByRole("button", { name: "Show password" }).click();
  check((await page.getByLabel("Password", { exact: true }).getAttribute("type")) === "text", "Show reveals the password");
  await page.getByLabel("Confirm password", { exact: true }).fill("another-password-123");
  await page.getByRole("button", { name: "Create my account" }).click();
  const taken = await page.getByText("already has a Dayline account").waitFor({ timeout: 15_000 }).then(() => true, () => false);
  check(taken, "creating an account with a taken email is refused clearly");

  await page.goto(`${BASE_URL}/signin`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/onboarding/);
  check(true, "a second account signs in with email and password");
  await page.goto(`${BASE_URL}/edition/${otherEditionId}`);
  const hidden = await page.getByRole("heading", { name: "Paper not found" }).waitFor({ timeout: 15_000 }).then(() => true, () => false);
  check(hidden && (await page.locator("article h2 a").count()) === 0, "the second reader cannot open the first reader's paper");
  const pdf = await context.request.get(`${BASE_URL}/api/editions/${otherEditionId}/pdf`);
  check(pdf.status() === 404, "nor download its PDF");
  await context.close();
}

async function passwordReset(browser: Browser, email: string): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/signin`);
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await page.waitForURL(/mode=reset/);
  check(await page.getByRole("heading", { name: "Forgot your password?" }).isVisible(), "Forgot password? opens the reset request form");

  const { data, error } = await getSupabaseAdmin().auth.admin.generateLink({ type: "recovery", email });
  if (error || !data.properties) {
    throw new Error(`could not issue a recovery token: ${error?.message}`);
  }
  await page.goto(`${BASE_URL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery`);
  check(new URL(page.url()).pathname === "/reset-password", "recovery link opens Set a new password");
  const fresh = `pw-${randomBytes(9).toString("hex")}`;
  await page.getByLabel("New password", { exact: true }).fill(fresh);
  await page.getByLabel("Repeat new password", { exact: true }).fill("does-not-match-1");
  await page.getByRole("button", { name: "Save new password" }).click();
  check(await page.getByText("The two passwords don't match.").waitFor({ timeout: 15_000 }).then(() => true, () => false), "mismatched passwords are refused");
  await page.getByLabel("Repeat new password", { exact: true }).fill(fresh);
  await page.getByRole("button", { name: "Save new password" }).click();
  await page.waitForURL(/\/(today|onboarding|archive)/);
  check(true, "saving the new password continues into the paper");
  await context.close();

  const later = await (await browser.newContext()).newPage();
  await later.goto(`${BASE_URL}/signin`);
  await later.getByLabel("Email address").fill(email);
  await later.getByLabel("Password", { exact: true }).fill(fresh);
  await later.getByRole("button", { name: "Sign in", exact: true }).click();
  await later.waitForURL(/\/(today|onboarding|archive)/);
  check(true, "the new password signs in on another browser");
  await later.context().close();

  const expired = await (await browser.newContext()).newPage();
  await expired.goto(`${BASE_URL}/reset-password`);
  check(await expired.getByRole("heading", { name: "This reset link has expired" }).isVisible(), "opening /reset-password without a valid link explains it expired");
  await expired.context().close();
}

async function main() {
  const admin = getSupabaseAdmin();
  const sql = postgres(getDatabaseEnv().SUPABASE_DB_URL, { max: 1, onnotice: () => {} });
  const browser = await chromium.launch();
  try {
    await routing(browser);
    const email = testEmail("account");
    const account = await permanentAccount(browser, email);
    await secondReader(browser, email, account.editionId);
    await passwordReset(browser, email);
  } catch (error) {
    console.log(`error: ${(error as Error).message}`);
    if (lastPage && !lastPage.isClosed()) {
      console.log(`last page: ${lastPage.url()}`);
      await lastPage.screenshot({ path: "tmp/auth-crash.png", fullPage: true });
    }
    throw error;
  } finally {
    await browser.close();
    await sql.end();
    for (const id of cleanupIds) {
      await admin.auth.admin.deleteUser(id);
    }
    console.log(`cleanup: deleted ${cleanupIds.length} test readers`);
  }
  console.log(failures === 0 ? "\nAUTH CHECK PASSED" : `\nAUTH CHECK FAILED (${failures})`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error: Error) => {
  console.error(`auth check crashed: ${error.message}`);
  process.exit(1);
});
