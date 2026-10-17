# Progress

Read with CLAUDE.md. Repo: https://github.com/malisaqib/dayline. Production: https://dayline-swart.vercel.app/

## Phase 1: persisted newspaper flow. PASSES LOCALLY; production blocked on Vercel config

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
- `1e1e11e`: `/api/health` reports which config groups are valid (true/false only, never values).

### Production (https://dayline-swart.vercel.app/): BLOCKED
- `/api/health` reports `supabasePublic` invalid: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are missing or wrong on Vercel. `supabaseSecret` and `openRouter` are valid.
- Effect: `/` and `/onboarding` render the error page, and the edition PDF route returns 500. The sample PDF `/api/pdf/sample` returns 200.
- Fix (user): in Vercel → Settings → Environment Variables (Production), add both names exactly as in `.env.example`, then **Redeploy**. `NEXT_PUBLIC_` values are baked in at build time, so a redeploy is required.
- Then: `curl https://dayline-swart.vercel.app/api/health` should return `"ok":true`. Then run `BASE_URL=https://dayline-swart.vercel.app npm run check:journey` and `python -I scripts/inspect_pdf.py tmp/journey/dayline-swart.vercel.app`.

### Known risks
- Gemini sometimes returns invalid JSON even with a strict schema. There is one retry, then a fallback to the publisher excerpt.
- AI summaries only cover NASA (the only source with a known reuse basis). Other sources show the publisher's excerpt. Reuse terms for the other sources are unverified (`catalog.ts`).
- NASA APOD feed text contains site navigation; the AI summary handles it, but the raw excerpt would look messy.
- The edition page for an invalid id shows "Paper not found" but returns HTTP 200, because streaming starts before notFound runs.
- PDFs are rendered on request from the saved snapshot and not stored.

## Next milestone (after production passes)
Feedback learning: more/less like this per story, then stored topic weights, then ranking uses those weights for the next edition, plus a labelled preview. Then scheduled daily generation.

## Deferred
Scheduling, "Since your last read", elaborate styling.
