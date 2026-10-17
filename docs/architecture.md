# Dayline architecture

One Next.js application on Vercel and one Supabase project. Pure domain logic lives in `src/domain`; external systems are reached only through adapters in `src/server`.

```mermaid
flowchart TD
    reader([Reader]) --> ui["Next.js UI<br/>onboarding · edition · archive · preview"]
    ui -->|"anonymous session (publishable key)"| auth["Supabase Auth"]
    ui --> actions["Server actions and routes<br/>(thin: validate, call services)"]

    actions --> profile["Profile and topic weights<br/>profiles · feedback_events (RLS: owner only)"]
    actions --> gen["getOrCreateDailyEdition<br/>one per reader per Asia/Karachi day"]

    subgraph sources["Source pool (shared per run)"]
        rss["RSS: NASA, NPR, Ars, BBC,<br/>Dawn, Geo, ScienceDaily"]
        pulse["Internet Pulse: CISA KEV,<br/>Hacker News API, GDACS"]
    end

    gen --> sources
    gen --> rank["Ranking (pure)<br/>topic weights 75% + freshness 25%<br/>≤2 per source · ≤96 h · dedupe"]
    profile --> rank
    rank --> policy{"Source usage policy<br/>aiProcessing?"}
    policy -->|"yes (NASA only)"| ai["OpenRouter → Gemini 3.8 Flash<br/>strict JSON · Zod · cached by<br/>content hash + model + prompt"]
    policy -->|no| excerpt["Publisher excerpt or<br/>headline-only, labelled"]
    ai --> snap
    excerpt --> snap
    sources --> snap["Immutable article snapshots<br/>articles (update trigger rejects)"]
    snap --> editions[("Supabase editions<br/>frozen story JSON · unique (user, date)<br/>RLS: owner reads · immutable")]
    editions --> present["presentEdition() (one content path)"]
    present --> web["Web edition + archive"]
    present --> pdf["PDF (react-pdf, server)"]
    web --> fb["More / Less feedback"]
    fb --> profile
    profile --> preview["Preview next edition<br/>(reorder only, not saved, no AI)"]

    subgraph cron["Scheduled path: 01:00 UTC = 06:00 PKT"]
        pgcron["Supabase Cron (pg_cron)"] --> trig["internal.trigger_daily_editions()<br/>reads URL + token from Vault"]
        trig -->|"pg_net POST · Bearer CRON_SECRET"| endpoint["/api/internal/daily-editions<br/>401 unless token matches"]
        endpoint --> job["runDailyEditionJob<br/>pages of 100 · 3 at a time<br/>pool fetched once"]
    end
    job --> gen

    classDef secret fill:#fde8e6,stroke:#9a2b1f,color:#1c1a17
    class ai,endpoint,trig,job secret
```

## Secrets (all server-only)

| Secret | Used by | Never |
|---|---|---|
| `SUPABASE_SECRET_KEY` | `getSupabaseAdmin()`: shared tables (articles, summaries), inserting a verified reader's edition, the daily job | in the browser; for reader reads |
| `SUPABASE_DB_URL` | `npm run db:migrate`, `npm run cron:setup` (local tooling only) | in the deployed app |
| `OPENROUTER_API_KEY` | `src/server/ai/openrouter-client.ts` | logged or returned |
| `CRON_SECRET` | daily endpoint (Vercel), Supabase Vault (`dayline_cron_secret`) | committed, logged or returned |

Public by design: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, with data protected by RLS. Highlighted nodes in the diagram handle server-only secrets.

## Data model

| Table | Purpose | Protection |
|---|---|---|
| `profiles` | topics (1–3) and derived topic weights | RLS owner select/insert/update |
| `feedback_events` | one current More/Less per reader + edition + story; topics copied from the snapshot | RLS owner; inserts must reference the reader's own edition |
| `articles` | immutable article snapshots keyed by content hash | server-only; update trigger rejects |
| `article_summaries` | cached grounded summaries keyed by (hash, model, prompt version) | server-only; immutable |
| `editions` | one per reader per local date; frozen story JSON | RLS owner read; immutable; unique (user_id, local_date) |

## Request paths

- **Reader request:** reader's cookie session → `auth.getUser()` → RLS-scoped reads → generation (shared writes through the secret client) → re-read through the reader client.
- **Scheduled run:** Vault token → endpoint → job loads reader ids itself (never from the caller) → the same generation with a shared pool → counts-only response.
- **Failure isolation:** each source is fetched independently; an AI failure falls back to the excerpt; one reader's failure in the job doesn't stop the others.
