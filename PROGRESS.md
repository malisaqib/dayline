# Progress

## Phase 0: setup and feasibility (2026-10-17). Done, apart from the blocked checks below.

### Verified
- Repo: https://github.com/malisaqib/dayline (public). Node 24.21, npm 11.19.
- `npm run typecheck`, `npm run lint` and `npm run build` all pass (Next 15.5, `/api/pdf/sample` is dynamic).
- Production server: `/` returns HTTP 200.
- PDF: `GET /api/pdf/sample` returns HTTP 200 with `application/pdf` as an attachment (6.5 KB, about 0.14 s). Rendered with PyMuPDF: 1 A4 page, masthead, two columns, sample banner, 5 clickable source links, no clipping (text stays inside the margins).
- Feeds: `npm run check:feeds` returned 6 of 6 live feeds with valid titles, http(s) URLs, dates and usable text: NASA, NPR, Ars Technica, Dawn, BBC and ScienceDaily. Full text is available from NASA and occasionally Ars; the rest are excerpts.

### Implemented, not yet verified (no credentials)
- Supabase: the `integration_checks` migration, the repository, and `check:db` (insert, read back, then delete the test record).
- Migration runner: `npm run db:migrate` (needs `SUPABASE_DB_URL`).
- Anthropic: a structured-output probe (`messages.parse` + Zod) on one live NASA article via `check:ai`. The model comes from `ANTHROPIC_MODEL` and defaults to `claude-opus-5-5`.
- When credentials are missing, all three fail early with a clear message naming the missing variables.

### Blocked: user action needed
1. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` and `ANTHROPIC_API_KEY`. Optionally set `ANTHROPIC_MODEL`; `claude-haiku-5-5` is much cheaper for bulk summaries.
2. Run `npm run db:migrate && npm run check:db && npm run check:ai`.
3. Deployment: no Vercel or other hosting login found. A hosted PDF download is unverified. The PDF library is pure JS (no Chromium), so it should work on Vercel's Node runtime.
4. Supabase anonymous sign-ins must be enabled (Auth > Providers) for the next milestone.

### Unresolved source reuse questions
See `reuseNote` in `src/server/sources/catalog.ts`. Only NASA is plausibly clear. Treat BBC as headline + link only. NPR, Ars, Dawn and ScienceDaily: show a short brief plus a link out, and avoid republishing full text. Guardian and NewsAPI are excluded (see the plan).

## Next milestone (the 2-hour checkpoint)
Onboarding → real personalised edition → saved web view → matching PDF download → archive that survives a reload.
1. Migration: `profiles`, `articles` (immutable, unique `content_hash`), `editions` (owner, local_date, timezone, stories JSON snapshot, unique (owner, local_date)), RLS by `auth.uid()`.
2. Anonymous Supabase session (cookie-based `@supabase/ssr`).
3. `domain/personalization/rankArticles` (pure) and `domain/editions/buildEdition` (pure).
4. `server/services/generateEdition`: fetch the shared pool → upsert articles → rank → summarise the top N (cached by content hash) → insert the edition idempotently.
5. Pages: `/onboarding`, `/edition/[id]`, `/archive`. Route `/api/editions/[id]/pdf` renders the same snapshot through `EditionDocument`.
