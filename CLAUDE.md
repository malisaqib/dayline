# Dayline: assistant guide

Personal daily newspaper (hackathon, 9-hour budget). Plan: HACKATHON_PLAN.md. Engineering standards: QUALITY_AND_DIFFERENTIATION.md. Status/next action: PROGRESS.md (update it at every checkpoint).

## Stack
Next.js 15 App Router, TypeScript (strict), Tailwind v4, Supabase (Postgres/auth/storage), Anthropic SDK (`messages.parse` + Zod), `@react-pdf/renderer` for PDFs, `fast-xml-parser` for RSS. Zod is the single validation approach.

## Layout
- `src/app`: routes and pages only; validate input, call services, return output.
- `src/domain`: pure types, schemas and rules. No React, Next, Supabase or SDK imports.
- `src/server/sources`: feed catalog and RSS adapter. `src/server/ai`: model client and prompts. `src/server/db` + `src/server/repositories`: persistence. `src/server/pdf`: PDF documents and rendering. `src/server/env.ts`: server-only config.
- `scripts/`: integration checks and migration runner. `supabase/migrations/`: SQL, applied in order.

## Invariants
- Article snapshots are immutable: keep `fetchedAt`, `publishedAt` and `contentHash`. Editions store frozen story snapshots and never re-read URLs.
- Web and PDF must render the same saved edition snapshot (same stories, same order, same text).
- One daily edition per user and local date (Asia/Karachi), enforced in the DB.
- Secrets are server-only; never use NEXT_PUBLIC_ for keys. Never commit .env files.
- Feed and article text is untrusted. Strip it to plain text and tell the model to ignore instructions inside it.
- Label fixtures visibly. Never present sample data as live.
- Never imply full-text reading when coverage is `excerpt`.

## Scope cuts
No chat, audio, vector DB, crawling, agent framework, or second backend. "Since your last read" is deferred until the core works.

## Verify
`npm run typecheck && npm run lint && npm run build`, then `npm run check:feeds`, `npm run check:db`, `npm run check:ai`. PDF: GET `/api/pdf/sample`. Migrations: `npm run db:migrate`.
