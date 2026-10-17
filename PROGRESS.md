# Progress

## Phase 1: persisted newspaper flow (2026-10-17). Code complete; live verification BLOCKED on credentials

### Built
- Migration `0002_newspaper_core.sql`:
  - `profiles` (RLS: owner only).
  - `articles`: immutable, keyed by content hash, update trigger rejects changes.
  - `article_summaries`: cache keyed by content_hash + model + prompt_version, immutable.
  - `editions`: `unique (user_id, local_date)`, RLS owner select, immutable, frozen `stories` JSON.
  - Shared tables have RLS with no policies, so only the secret key can write them.
- Anonymous session: `@supabase/ssr` cookies plus a middleware refresh. `ensureReader` signs in anonymously on onboarding. Every read verifies the reader with `auth.getUser()`.
- Onboarding `/onboarding`: 1–3 topics, limited to topics an enabled source covers.
- Pure ranking (`domain/personalization/rank.ts`): 75% topic match and 25% freshness (24 h half-life). Stories older than 96 h are dropped, at most 2 per source, ties broken by hash. Each story stores "Why this story" reasons.
- Generation (`server/services/getOrCreateDailyEdition`):
  - Returns the existing edition for (reader, Asia/Karachi date) if there is one.
  - Otherwise: fetch the shared pool once → rank top 6 → save article snapshots → AI summaries for permitted sources (cached, at most 3 in parallel; on failure, fall back to the publisher excerpt) → insert with ON CONFLICT DO NOTHING → re-read through the reader's own client.
- Source usage policy: kept separate from whether a feed can be fetched. Only NASA (public domain) is sent to the model. The others show the publisher's excerpt, cut to 600 characters at a word boundary, with a label. Every story is labelled `ai_summary`, `publisher_excerpt` or `headline_only`.
- `/edition/[id]`, `/archive` (30 per page, empty state), and `/api/editions/[id]/pdf`. These use the reader's client, so another reader's edition, a bad id and a missing session all return the same 404.
- Web and PDF both render `presentEdition()`. The PDF renderer only gained a provenance line under each story.
- Loading, error, empty and not-found states, plus pending buttons on generation.

### Verified (actual results)
- `npm run typecheck`, `npm run lint` and `npm run build` pass. There are 7 routes plus middleware.
- `npm test` passes 6 of 6 domain tests: ranking is deterministic and topic-only; the per-source cap and stale-story filter work; two profiles get different leads; a non-permitted source never gets an AI summary; headline-only fallback works; web and PDF get identical stories in the same order.
- Phase 0 checks still apply: 6 of 6 feeds are live and the sample PDF renders.

### Live verification attempt (commit 9dacd89)
- Renamed the secret key variable to `SUPABASE_SECRET_KEY` (an `sb_secret_` key, checked by format).
- Passed: `npm test` (6 of 6), `typecheck`, `lint`, `build`. The secret key works (admin `listUsers` returns ok). The URL and publishable key have the right format.
- BLOCKED, the user must fix these:
  1. `SUPABASE_DB_URL` holds an `https://` URL (the project URL), not a Postgres connection string, so `db:migrate` fails. `check:db` fails with "table not found" because the migrations never ran. Fix: Supabase → Connect → Session pooler → copy the `postgresql://postgres.<ref>:<password>@aws-…pooler.supabase.com:5432/postgres` string. Alternative: paste `supabase/migrations/0001_*.sql` and `0002_*.sql` into the SQL editor.
  2. `ANTHROPIC_API_KEY` is empty, so `check:ai` can't run. Without it, generation falls back to publisher excerpts, which is labelled honestly.
  3. Anonymous sign-ins are disabled ("Anonymous sign-ins are disabled"). Fix: Authentication → Sign In / Providers → Anonymous: on.
  4. The Vercel command-line tool isn't logged in here, so Vercel env var names can't be checked and nothing can be redeployed from this machine. Fix: run `npx vercel login` and `npx vercel link`, or check the env vars and redeploy in the dashboard.
- Not yet run: `check:flow`, the local browser journey, and the deployed journey.

### Exact next actions
1. User: create `.env.local` from `.env.example`. Enable Supabase anonymous sign-ins (Authentication > Sign In / Providers > Anonymous). Choose `ANTHROPIC_MODEL`; the default is `claude-opus-5-5`.
2. `npm run db:migrate && npm run check:db && npm run check:ai && npm run check:flow`
3. `npm run build && npm start`. In a browser: onboard → read the edition → reload → archive → download the PDF and open it to check layout and links.
4. Deploy to Vercel with the same env vars, then repeat step 3 on the live site.

### Known limits
- Topics come from the source (no per-article tagging). ScienceDaily and NASA overlap on science.
- The PDF is rendered when requested from the saved snapshot; it isn't stored. Content can't drift because the snapshot is immutable.
- Reuse permissions for NPR, Ars, Dawn, BBC and ScienceDaily are unverified (see `catalog.ts`).

## Phase 0 (done)
Next.js shell, RSS adapter, sample PDF, integration check scripts. Repo: https://github.com/malisaqib/dayline

## Deferred
Feedback learning, scheduling, "Since your last read", elaborate styling.
