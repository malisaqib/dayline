# Dayline

**Your interests. One morning paper. Five minutes well spent.**

Production: **https://dayline-swart.vercel.app/** · Built for NaSCon'26 (Eynvision problem statement: *Build a personal morning paper*).

## The problem

News is scattered across dozens of sites, apps and newsletters. People jump from link to link and still can't name three things they learned. Social media has one feed; the news has nothing like it.

## What Dayline does

Dayline learns what a reader cares about, gathers relevant stories from trusted sources every day, and publishes **one finite personal paper**. Readers can read it on the web, open any original article, tell Dayline what they want more or less of, download the same edition as a newspaper-style PDF, and reopen past editions in the archive.

### Reader flow

1. **Onboarding:** pick 1–3 topics (World, Pakistan, Technology, Science, Space, Cybersecurity, Disaster alerts). The reader gets an anonymous Supabase session; there is no sign-up form.
2. **Source collection:** one shared pool is fetched from allowlisted feeds and APIs. A source that fails is skipped; the edition still generates.
3. **Ranking:** a pure, deterministic score combines the reader's topic weights (75%) with freshness (25%). The rules: at most 2 stories per source, nothing older than 96 hours, and duplicate URLs and headlines removed. Each story says *why* it was chosen ("Matches your Space interest (boosted by your feedback) · published 3h ago").
4. **Gemini summaries:** only for sources cleared for AI processing (currently NASA). The summary is 60–100 words with 2–3 takeaways, grounded only in the supplied text. It comes from OpenRouter `google/gemini-3.8-flash` as strict JSON, validated with Zod and cached by content hash, model and prompt version. Other stories show the publisher's own excerpt or headline, labelled as such.
5. **Saved edition:** up to 6 stories frozen as an immutable snapshot. There is one edition per reader per day (Asia/Karachi).
6. **Web, archive and PDF:** all three render the same snapshot through one presentation function, so stories, text and order are identical.

### Feedback learning

Every story has **More like this** and **Less like this**. Each signal is stored once per reader, edition and story. Topic weights are **recomputed from all stored signals**: baseline 1.0, ±0.25 per signal, clamped to 0.25–2.0. Double clicks and retries therefore can't compound. Today's paper never changes. **Preview next edition** reorders today's saved stories with the new weights, clearly labelled "Preview based on today's available stories." It makes no AI calls and isn't archived. The next real paper uses the new weights.

### Automatic daily generation

Supabase Cron runs every day at **06:00 Asia/Karachi (01:00 UTC)**. It calls `POST /api/internal/daily-editions` with a bearer `CRON_SECRET` held in Supabase Vault. The job walks readers in pages, 3 at a time, fetches the shared pool once, and reuses the same generation code. Existing editions are reused, so reruns create nothing new. Readers who open the site before the run, or sign up after it, get their paper on demand. Details: [docs/daily-schedule.md](docs/daily-schedule.md).

### Internet Pulse

Three official structured sources, never sent to the AI:

- **CISA Known Exploited Vulnerabilities:** recently added actively exploited CVEs, with the official description, required action and remediation date. Links to the CISA catalog.
- **Hacker News (official API):** top stories by points and age, shown as headline and original link with points and comments.
- **GDACS:** global disaster alerts (Orange/Red first) with event type, country, alert level and severity.

Their labels (e.g. "Actively exploited vulnerability · CVE-…", "Disaster alert · Tropical cyclone · Red alert") appear identically on the web and in the PDF.

## Sources and attribution policy

Being able to fetch a feed doesn't mean we may reuse it. Each source in `src/server/sources/catalog.ts` has an explicit usage policy:

| Source | Shown as | AI summary | Basis |
|---|---|---|---|
| NASA | AI summary or excerpt | yes | US government work |
| CISA KEV | official fields | no | US government work |
| NPR, Ars Technica, BBC, Dawn, Geo News, ScienceDaily | publisher's feed excerpt (≤600 chars) | no | unverified, prototype assumption |
| Hacker News | headline + link only | no | official API |
| GDACS | official alert description | no | unverified |

Every story keeps the publisher name and the original URL as its primary link. Labels say whether text is an AI summary of the full text, an AI summary of an excerpt, a publisher's excerpt, or headline only. Article text is treated as untrusted: HTML is stripped, and the model is told to ignore any instructions inside it.

## Security model

- **Supabase RLS:** readers can read only their own profile, editions and feedback. Feedback can only reference an edition the reader owns, and this is enforced in the database (tested: a cross-reader insert is rejected with 42501). Shared tables (articles, summaries) have RLS with no policies, so only the server can write them.
- **Immutable records:** update triggers reject changes to editions, article snapshots and cached summaries, even from the secret key.
- **Server-only secrets:** `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL`, `OPENROUTER_API_KEY` and `CRON_SECRET` never use `NEXT_PUBLIC_`. The browser only receives the Supabase URL and publishable key. The secret client is used only for shared tables and the daily job.
- **Uniform 404s:** a bad id, a missing session and another reader's edition all return the same 404.
- **Health without secrets:** `/api/health` reports configuration validity and the deployed commit only.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the diagram. In short, it's a modular monolith:

```
src/app            routes and pages (thin)
src/domain         pure rules: ranking, weights, preview, edition and summary schemas
src/server         adapters: sources/, ai/ (OpenRouter), db/ + repositories/ (Supabase), pdf/ (react-pdf), services/
supabase/migrations  SQL schema, RLS, triggers, cron function
```

Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Supabase (Postgres, Auth, Vault, pg_cron, pg_net), OpenRouter (Gemini), `@react-pdf/renderer`, Vercel.

## Local setup

```bash
npm install
cp .env.example .env.local     # fill in values (never commit .env.local)
npm run db:migrate             # applies supabase/migrations in order
npm run dev                    # http://localhost:3000
```

Supabase: enable **Anonymous sign-ins** (Authentication → Sign In / Providers).

Environment variables (names only; see `.env.example`):

| Name | Visibility |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public (RLS-protected) |
| `SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL` | server only |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | server only |
| `CRON_SECRET` | server only (also in Supabase Vault) |

Daily schedule setup: `npm run cron:setup` (see [docs/daily-schedule.md](docs/daily-schedule.md)).

## Verification

| Command | Checks |
|---|---|
| `npm test` | 38 domain and adapter tests: ranking, weights, preview, summaries, sources, daily job |
| `npm run typecheck` / `npm run lint` / `npm run build` | static checks and production build |
| `npm run check:feeds` | every enabled source returns valid, dated items |
| `npm run check:db` / `npm run check:ai` | Supabase write/read; one grounded OpenRouter summary |
| `npm run check:flow` | live DB: idempotent generation, profiles differ, RLS isolation, feedback rules |
| `npm run check:daily` | scheduled job: saved weights used, second run creates nothing, editions immutable |
| `BASE_URL=… npm run check:journey` | browser: onboarding → edition → reload → archive → PDF → feedback → preview → isolation |
| `python -I scripts/inspect_pdf.py tmp/journey/<host>` | PDF matches web order and links, no clipping, unchanged after feedback |
| `BASE_URL=… npm run check:scheduled` | cron endpoint: 401s, create then reuse, reader opens the scheduled paper |

All of the above have passed locally and against production. Evidence is in [PROGRESS.md](PROGRESS.md).

## Known limitations

See [docs/limitations.md](docs/limitations.md). In brief: Dawn blocks Vercel; Gemini sometimes falls back to excerpts; reuse rights for most feeds are unverified; Firecrawl was evaluated and rejected; topics are assigned per source, not per article.

## Status

Production at commit `09ec8b0` (Phase 4 evaluation) on Vercel, with Supabase Cron active at `0 1 * * *`. The submission documentation is in the commit that adds this README.
