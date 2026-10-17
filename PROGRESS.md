# Progress

Read with CLAUDE.md. Repo: https://github.com/malisaqib/dayline. Production: https://dayline-swart.vercel.app/

## Phase 3: automatic daily generation. VERIFIED on production (deployment 339f8be)
- **Endpoint:** `POST /api/internal/daily-editions` checks `Bearer CRON_SECRET` in constant time. A missing or wrong token, or an unset server secret, gets 401. The response is counts only: `{localDate, examined, created, reused, failed, durationMs}`.
- **Job** (`src/server/services/daily-job.ts`):
  - Profiles in keyset pages of 100, 3 readers at a time, each through the existing `getOrCreateDailyEdition`, so ranking, weights, caching, source isolation and snapshots are unchanged.
  - The article pool is fetched once per run, and only if someone needs a new edition.
  - A failing reader is counted and logged with an id prefix only; the others continue.
  - Readers who sign up after the run still get their paper on demand.
- **Schedule:** Supabase Cron job `dayline-daily-editions` runs `0 1 * * *`, which is **01:00 UTC = 06:00 Asia/Karachi**. It is **active**. `internal.trigger_daily_editions()` (migration 0006) reads the URL and token from Vault. Setup and operation are in `docs/daily-schedule.md`; `npm run cron:setup` is idempotent.
- **Verified locally:**
  - `npm test`: 38 of 38 (auth 401/200, counts-only response, reuse, failure isolation, paging, one pool fetch, no id leakage).
  - `check:daily`: 6 of 6. The scheduled edition used the reader's saved weights. The second run gave created 0 / reused 33. The edition rejected an update even with the secret key.
  - `check:scheduled` against the local server: PASSED. Covers the 401s, run 1 creating the missing edition (created 1, reused 31), run 2 creating nothing (reused 32), and the reader opening that scheduled edition via "Open today's paper", the archive and the PDF (200).
- **Verified on production (deployment bf19931):** no token and wrong token get 401; GET gets 405. `/api/health` reports `cron.missingFields: ["CRON_SECRET"]` without ever showing a value, so health returns `ok:false` until the secret is set.
- **Production, after `CRON_SECRET` was added to Vercel:**
  - `/api/health` returns `ok:true` with `cron.valid:true`; no secret values appear in the body.
  - `npm run cron:setup -- --trigger`: the real pg_cron path (Vault → `internal.trigger_daily_editions()` → pg_net) got **HTTP 200** `{"examined":31,"created":0,"reused":31,"failed":0,"durationMs":8084}`.
  - `BASE_URL=https://dayline-swart.vercel.app npm run check:scheduled`: PASSED. The 401s held; run 1 got HTTP 200 (created 1, reused 31); run 2 got HTTP 200 (created 0, reused 32); counts only; the reader opened the scheduled edition via "Open today's paper", the archive and the PDF (200).
  - Database: 31 editions for 31 readers on 2026-10-17, **0 duplicates**. The cron job `dayline-daily-editions` is `0 1 * * *` and `active: true`.
- **Commits:** `c434290` (job and endpoint), `bf19931` (cron schedule and docs).
- **Limits:** a single run must fit in 300 s (about 5 s for 33 readers now). There is no automatic retry; on-demand generation covers gaps.

## Internet Pulse sources. VERIFIED locally and on production (deployment c8a6765)
- **CISA KEV** (`src/server/sources/cisa-kev.ts`): official JSON. Keeps entries added within the 96 h age limit (at most 8), validated with Zod; malformed entries are counted as rejected. Uses official fields only (name, CVE, vendor/product, description, first sentence of the required action, due date). Links to the CISA catalog search for the CVE. Topics: Cybersecurity and Technology.
- **Hacker News** (`hacker-news.ts`): top 20 ids, item details fetched 5 at a time (6 s timeout per item). Drops job, dead, deleted, text-only and stale items, and keeps 8 by points adjusted for age. Shown as headline and original link only, labelled with points and comments; linked pages are not fetched. Topic: Technology.
- **GDACS** (`gdacs.ts`): official RSS. Orange/Red alerts come first; Green alerts are used only as a fallback (at most 3). Labels carry event type, country, alert level and severity. Spaces before punctuation are tidied. Topics: Disaster alerts and World.
- Shared changes:
  - New topics: Cybersecurity and Disaster alerts.
  - `labels` on article and story snapshots, shown as a kicker identically on web and PDF (migration 0005, applied).
  - Canonical URLs (tracking parameters removed).
  - Ranking also drops duplicate normalized titles.
  - The adapter dispatcher in `pool.ts` lets each source fail independently.
- **No AI:** all three sources have `aiProcessing: false` (tested). The production generation log showed `modelCalls: 0`.
- **Reachability:**

  | Source | Local | Vercel |
  |---|---|---|
  | CISA KEV | 7 items | 7 items |
  | Hacker News | 8 items | 8 items |
  | GDACS | 4 items | 4 items |
  | Dawn | works | still HTTP 403; generation continues without it |

- **Checks:**
  - `npm test`: 31 of 31 (KEV parsing and malformed data, HN filtering and bounds, GDACS fields, fallback and punctuation, independent failure, no AI, source cap, title de-duplication).
  - `typecheck`, `lint`, `build` and `check:feeds` pass.
  - `JOURNEY_TOPICS=security,disasters,technology npm run check:journey`: PASSED locally and on production. The editions contained CISA, GDACS and Hacker News stories, and the PDF matched the web in order, links and margins.
- **Commits:** `c52bebe` (sources), `c8a6765` (GDACS tidy and journey options).
- **Limitations:**
  - CISA links go to the catalog search page, not a per-CVE page.
  - Hacker News destination links are third-party: some block automated checks (WARN) and one (llmspeed.dev) refused connections from this machine.
  - GDACS reuse terms have not been reviewed.
  - The source's topics are applied to all of its items; there is no per-item tagging.

## Phase 2: feedback learning and preview. VERIFIED locally and on production (deployment 6793a10)
- Policy (`domain/personalization/weights.ts`): each selected topic starts at 1.0; More adds 0.25 and Less subtracts 0.25 per story topic; weights are clamped to 0.25–2.0. Weights are re-derived from all stored signals, so repeats and retries can't compound. `profiles.topic_weights` caches the result.
- `feedback_events`: one current signal per user + edition + story, enforced by a unique key. The story's topics are copied from the owned edition snapshot. RLS lets readers read their own rows only, and inserts and updates must reference an edition the reader owns.
- Ranking: `scoreItem` = 0.75 × (strongest matched weight ÷ 2.0) + 0.25 × freshness. The source cap, age filter and deterministic tie-break are unchanged. Reasons say "(boosted/reduced by your feedback)".
- Preview at `/edition/[id]/preview`: today's saved stories reordered with current weights and labelled "Preview based on today's available stories." It isn't stored, archived or downloadable as a PDF, and it makes no model calls.
- UI: More/Less buttons under each story (aria-pressed, pending and error states, repeat and in-flight clicks ignored), a confirmation such as "Saved: Space weaker", and a preferences panel. The PDF has no controls.
- Migration 0004 was applied with `npm run db:migrate`.
- Checks:
  - `npm test`: 21 of 21. Covers same signal twice, more→less, clamping, default weights, ignoring unfollowed topics, preview reordering and immutability, and future ranking using the new weights.
  - `check:flow`: 13 of 13. Covers live idempotency, more→less, saved weights, one row per story, edition unchanged, and cross-reader feedback rejected both by the service and by RLS (42501).
  - `check:journey`: passes locally and on production.
  - `inspect_pdf.py`: PDF text identical before and after feedback.
  - `typecheck`, `lint` and `build` pass.
- Commits: `7532079` (migration and learning logic), `d0ffdc0` (feedback persistence and UI), `6793a10` (preview and journey).
- Limitations: weights are per topic only (no entities); topics come from the source, not per article; Ars Technica blocks automated link checks (reported as WARN).

## Phase 1: persisted newspaper flow. VERIFIED locally and on production

### Local verification (2026-10-17, against live Supabase and OpenRouter)
| Check | Result |
|---|---|
| `npm run db:migrate` | pass (0001 applied; 0002 and 0003 applied by hand in the SQL editor, then recorded after checking the schema) |
| `npm run check:db` | pass (write, read, delete) |
| `npm run check:ai` | pass on 5 of 5 runs. OpenRouter `google/gemini-3.8-flash`, strict JSON Schema used, Zod validation passed, summary 80–85 words, 3 takeaways, 7–10 s per run. One run needed its single retry after truncated JSON. The summary was checked by hand against the NASA source: no unsupported claims. |
| `npm run check:feeds` | pass in Phase 0 (6 of 6). During `check:flow` NASA failed once, and generation carried on without it. |
| `npm run check:flow` | 6 of 6 pass: concurrent and repeated generation give one edition; reuse works; two profiles get different leads; RLS isolation holds; no session means no access; exactly one row per reader per day. |
| `npm test` | 13 of 13 (ranking, body policy, web/PDF equality, summary schema, entity decoding) |
| `typecheck`, `lint`, `build` | pass |
| `BASE_URL=http://localhost:3100 npm run check:journey` | pass: onboarding → edition → reload → home "Open today's paper" (same id) → archive → reopen → PDF download → source links (HTTP 200) → second reader gets 404 / "Paper not found" |
| `python -I scripts/inspect_pdf.py tmp/journey/localhost_3100` | pass: 4 of 4 headlines in web order, links identical, no text outside margins on 2 pages. Visual check: AI summaries labelled "AI summary of the full article text", the others "Publisher's excerpt", no broken characters. |

### Fixes made during verification
- `0e9913e`: browser journey script; the PDF no longer splits words with hyphens.
- `1e9a3a8`: decode `&#039;` and double-encoded entities in feed text.
- `5f523dc`: switched from Anthropic to OpenRouter (Gemini). Grounded prompt, strict schema, takeaways stored in snapshots.
- `4e15c5b`: PDF lays out stories in rows of two, so reading order holds when stories spill onto page 2.
- `1e1e11e`, `26f2344`, `3d9a0a1`: `/api/health` (config valid/missing, deployed commit, `?sources=1`).
- `cedfe9d`, `8853360`: Geo News added, APP disabled (HTTP 403 from Vercel).

### Production (https://dayline-swart.vercel.app/): verified at deployment 8853360
- `GET /api/health` returns `"ok":true`. All three config groups are valid, and the response includes the deployed commit.
- `BASE_URL=https://dayline-swart.vercel.app npm run check:journey` reports JOURNEY PASSED:
  - anonymous onboarding, then generation (NASA items carry OpenRouter AI summaries);
  - reload keeps the session and the edition;
  - home "Open today's paper" returns the same id;
  - the archive lists it, and reopening it works;
  - the PDF downloads from the deployed route;
  - 4 source links return HTTP 200;
  - a second reader gets their own edition, "Paper not found" for the first reader's page, and 404 for the first reader's PDF.
- `inspect_pdf.py` on the deployed PDF: 4 of 4 headlines in web order, links identical, no clipping on 2 pages. 2 stories labelled "AI summary of the full article text", 2 "Publisher's excerpt", no `&#`, no sample banner.
- Fixed on the way:
  - Vercel's earlier build lacked the `NEXT_PUBLIC_` values; a fresh build from a push fixed it.
  - Dawn and APP return HTTP 403 to Vercel. Added Geo News (reachable, 20 items) for Pakistan coverage and disabled APP. Dawn stays enabled because it works locally; when it fails, generation continues without it.
- Diagnostics: `/api/health?sources=1` lists per-source item counts or the error, as seen from the host.

### Known risks
- Gemini sometimes returns invalid JSON even with a strict schema. There is one retry, then a fallback to the publisher excerpt.
- AI summaries only cover NASA (the only source with a known reuse basis). Other sources show the publisher's excerpt. Reuse terms for the other sources are unverified (`catalog.ts`).
- NASA APOD feed text contains site navigation; the AI summary handles it, but the raw excerpt would look messy.
- The edition page for an invalid id shows "Paper not found" but returns HTTP 200, because streaming starts before notFound runs.
- Dawn is blocked from Vercel, so production Pakistan coverage depends on Geo News alone.
- PDFs are rendered on request from the saved snapshot and not stored.

## Next milestone
After the authorized production run: the submission package (architecture diagram, README, Loom).

## Deferred
Scheduling, "Since your last read", elaborate styling.
