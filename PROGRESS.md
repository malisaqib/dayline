# Progress

Read with CLAUDE.md. Repo: https://github.com/malisaqib/dayline. Production: https://dayline-swart.vercel.app/

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
Internet Pulse sources (CISA KEV, Hacker News, GDACS), then scheduled daily generation.

## Deferred
Scheduling, "Since your last read", elaborate styling.
