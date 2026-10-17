# Dayline

**Your interests. One morning paper. Five minutes well spent.**

Dayline learns what you care about, collects the articles that matter to you from across the web each day, and puts them into one personal morning paper. You can read it on the web, open any original article, skip stories you don't want, or download the whole edition as a newspaper-style PDF.

Built for the NaSCon'26 hackathon.

## Planned features

- Quick onboarding to capture your interests
- A personalised daily edition on the web
- A matching downloadable newspaper-style PDF
- An archive of past editions
- Learns from your reading, skips and feedback to improve future papers

## Status

Work in progress. Setup steps and the architecture diagram will be added here.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values; never commit
npm run db:migrate           # apply supabase/migrations
npm run dev                  # http://localhost:3000
```

Checks: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run check:feeds`, `npm run check:db`, `npm run check:ai`. Sample PDF: `/api/pdf/sample`.
