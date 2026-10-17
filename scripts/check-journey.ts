import { mkdir, writeFile } from "node:fs/promises";
import { chromium, type Browser, type Page } from "playwright";

/*
 * Browser journey against a running app (local or deployed):
 * onboarding -> edition -> reload -> home "open today" -> archive -> reopen -> PDF,
 * plus a second anonymous reader who must not see the first reader's paper.
 * Usage: BASE_URL=http://localhost:3100 npm run check:journey
 * Writes evidence (screenshot, PDF, story list) to tmp/journey/<host>/.
 */
const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const OUT_DIR = `tmp/journey/${new URL(BASE_URL).host.replace(/[^a-z0-9.-]/gi, "_")}`;
const GENERATION_TIMEOUT_MS = 120_000;

let failures = 0;
function check(ok: boolean, label: string): void {
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
  failures += ok ? 0 : 1;
}

type Story = { title: string; href: string };

// The edition streams in after the loading state, so wait for the first headline before reading.
async function readStories(page: Page): Promise<Story[]> {
  await page.locator("article h2 a").first().waitFor({ timeout: 30_000 });
  return page.locator("article h2 a").evaluateAll((links) =>
    links.map((a) => ({ title: (a.textContent ?? "").trim(), href: (a as HTMLAnchorElement).href })),
  );
}

async function onboard(page: Page, topics: string[]): Promise<string> {
  await page.goto(`${BASE_URL}/onboarding`);
  for (const topic of topics) {
    await page.locator(`input[name="topics"][value="${topic}"]`).check();
  }
  await page.getByRole("button", { name: "Make my paper" }).click();
  await page.waitForURL(/\/edition\/[0-9a-f-]{36}$/, { timeout: GENERATION_TIMEOUT_MS });
  return page.url().split("/edition/")[1];
}

async function readerJourney(browser: Browser): Promise<{ editionId: string; stories: Story[] }> {
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  const editionId = await onboard(page, ["space", "science"]);
  const stories = await readStories(page);
  check(stories.length > 0, `onboarding generated edition ${editionId} with ${stories.length} stories`);
  await page.screenshot({ path: `${OUT_DIR}/edition.png`, fullPage: true });

  await page.reload();
  const afterReload = await readStories(page);
  check(JSON.stringify(afterReload) === JSON.stringify(stories), "edition and session survive reload (same stories, same order)");

  await page.goto(BASE_URL);
  await page.getByRole("button", { name: "Open today's paper" }).click();
  await page.waitForURL(/\/edition\//, { timeout: GENERATION_TIMEOUT_MS });
  check(page.url().endsWith(editionId), "home 'Open today's paper' returns the same daily edition");

  await page.goto(`${BASE_URL}/archive`);
  const archiveLinks = await page.locator(`a[href="/edition/${editionId}"]`).count();
  check(archiveLinks === 1, "archive lists the saved edition once");
  await page.locator(`a[href="/edition/${editionId}"]`).click();
  await page.waitForURL(new RegExp(`/edition/${editionId}$`));
  check(JSON.stringify(await readStories(page)) === JSON.stringify(stories), "reopening from archive shows the same edition");

  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download PDF" }).click();
  const pdfPath = `${OUT_DIR}/edition.pdf`;
  await (await download).saveAs(pdfPath);
  check(true, `PDF downloaded to ${pdfPath}`);

  for (const story of stories) {
    const response = await context.request.get(story.href, { maxRedirects: 5, failOnStatusCode: false, timeout: 15_000 }).catch(() => null);
    const status = response?.status() ?? 0;
    check(status > 0 && status < 400, `source link ${status} ${story.href}`);
  }

  await writeFile(`${OUT_DIR}/stories.json`, JSON.stringify({ editionId, stories }, null, 2));
  await context.close();
  return { editionId, stories };
}

async function isolationCheck(browser: Browser, editionId: string): Promise<void> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const ownId = await onboard(page, ["pakistan"]);
  check(ownId !== editionId, "second anonymous reader gets their own edition");

  await page.goto(`${BASE_URL}/edition/${editionId}`);
  check((await page.getByRole("heading", { name: "Paper not found" }).count()) === 1, "second reader cannot open first reader's edition page");
  const pdf = await context.request.get(`${BASE_URL}/api/editions/${editionId}/pdf`, { failOnStatusCode: false });
  check(pdf.status() === 404, `second reader gets 404 for first reader's PDF (got ${pdf.status()})`);
  await context.close();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`journey against ${BASE_URL}`);
  const browser = await chromium.launch();
  try {
    const { editionId } = await readerJourney(browser);
    await isolationCheck(browser, editionId);
  } finally {
    await browser.close();
  }
  console.log(failures === 0 ? "\nJOURNEY PASSED" : `\nJOURNEY FAILED (${failures} checks)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error: Error) => {
  console.error(`journey crashed: ${error.message}`);
  process.exit(1);
});
