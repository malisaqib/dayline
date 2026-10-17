# Engineering standards and proposed differentiator

This updates the planning baseline following the user's emphasis on judged code quality. No application functionality has been implemented by these planning edits.

## Proposed product focus: Since your last read

Opportunity hypothesis: interest matching answers what a reader cares about, but it does not establish what they already read or what new reporting adds to it. A personal daily paper can preserve continuity between editions.

Promise: "A morning paper that remembers what you read and shows what changed."

This is a proposed hackathon differentiator, not a claim of global novelty or proof that competitors lack related capabilities. Existing products already cover adjacent needs: [Inoreader](https://www.inoreader.com/features/intelligence) offers summaries and scheduled reports, [Ground News](https://ground.news/product) compares coverage and exposes blindspots, [Readwise](https://readwise.io/) revisits highlights, and [Feedly](https://feedly.com/engineering/posts/reducing-clustering-latency) describes story clustering/deduplication. Our emphasis is continuity integrated into the user's daily web and PDF edition.

### Smallest useful experience

1. A reader explicitly marks a story as read. Store the exact edition-story snapshot ID and timestamp.
2. A later article reports a development in the same event.
3. The next edition includes a compact "Since your last read" box: previous reported state, new reported development, dates and both source links.
4. If a known story has no supported addition, avoid repeating it when sufficient other material exists.
5. If a story was merely delivered, opened, skipped or left in a tab, do not assume it was read.

Illustrative fictional example, not real news: an earlier article says a launch is scheduled for Friday; a later article says the launch has been postponed until Monday. The box explains that specific change and cites each report. Never invent sample news for a supposedly live result.

Present "new to your paper" for stories without a confirmed read baseline. Do not claim "new to you" or that a reader understands a story. An absence of detected changes is not proof that nothing happened in the world.

### Bounded implementation

- Retain immutable article inputs and per-edition summaries. An updated URL must not overwrite the text used in the reader's earlier baseline.
- Save explicit read events idempotently. Expose a way to undo a mistaken read mark.
- Use a small candidate shortlist based on entities, title similarity and time proximity. Shared topics alone do not establish the same event.
- Confirm a specific event match against both available texts. Ambiguous matches remain separate stories.
- Compare at most three likely pairs per edition. Use a validated output schema with previous/current evidence IDs and short supporting passages. One failed validation may retry once; otherwise omit the comparison.
- If the text is too thin, contradictory without clear attribution, or the match is uncertain, use the standard source-linked brief. Never guess a development.
- Cache comparison results by the old and new content hashes plus prompt/model version. Different readers may share the comparison while having separate read state.
- Freeze the comparison into the edition snapshot so web, PDF and archive stay consistent.
- Keep the reader-history query and model payload bounded. Do not send the entire reading history to the model.

Timebox the feature to 60 minutes only after the required core works. Stop at explicit read memory plus one reliable comparison. Do not add timelines, knowledge graphs, agents, embeddings, automatic fact verification or recall quizzes.

Demonstrate with two real, dated reports if available. Otherwise use an openly labeled fixture scenario to demonstrate behavior, alongside the functioning live news pipeline. Do not fabricate an earlier reading history or backdate a demo as genuine usage.

## Code structure

Use a modular monolith: one application and deployment, with clear module boundaries. A suggested structure, adapted to actual code rather than scaffolded with empty files:

```text
src/
  app/                     # routes, pages, request validation and composition
  features/
    onboarding/            # forms and preference input
    newspaper/             # reading components and print presentation
    feedback/              # reader feedback UI
  domain/
    articles/              # schemas and deduplication rules
    personalization/       # pure ranking and weight updates
    editions/              # edition types and assembly rules
    continuity/            # read baseline and comparison contracts
  server/
    services/              # generateEdition and other orchestration
    sources/               # external feed/API adapters
    ai/                    # model adapter, prompts, output validation
    repositories/          # focused persistence functions
    pdf/                   # PDF renderer
  shared/                  # genuinely shared small utilities
```

Keep domain logic independent of React, Next.js, Supabase and the model SDK. Pages and route handlers invoke services; services compose domain functions and adapters. UI consumes typed view data. Do not introduce a dependency-injection container, generic base repositories, microservices or abstractions for providers we do not use.

### Readability and maintainability gates

- Strict TypeScript; avoid unjustified `any`, non-null assertions and suppressed errors.
- Validate external feed data, model output and request input at their boundaries using one schema approach.
- Name business functions directly: `rankArticles`, `applyFeedback`, `buildEdition`, `compareStoryUpdates`.
- Give functions one clear responsibility. Extract code when it mixes responsibilities, not to meet an arbitrary line count.
- Keep prompts, ranking weights and provider configuration in identifiable modules rather than repeated literals.
- Separate loading/empty/error UI states and make failure handling explicit.
- Store schema migrations in Git; document environment variables without secret values.
- Comments explain decisions and non-obvious constraints. README explains data flow and how to run/verify the project.
- Use a formatter/linter consistently. Require type check, lint and production build before delivery.

### Scalability claims must be concrete

- Fetch a shared article pool rather than refetching identical content per reader.
- Cache shared summaries by content hash and prompt/model version.
- Bound model concurrency, retries, fetched payload sizes and per-edition candidate counts.
- Index actual query paths such as owner/date editions and owner/story read history.
- Enforce daily-edition uniqueness in the database and make job retries idempotent.
- Paginate archive reads and avoid loading full user history for each request.
- Record generation duration, model calls and cache hits without logging credentials or private article history.
- Describe a background worker/queue as a future extraction point when measured job limits require it. Do not claim horizontal scale has been tested.

### Tests that demonstrate engineering quality

Use a small focused suite for real invariants:

1. Explicit feedback affects a later ranking without mutating a saved edition.
2. Repeated daily generation returns the same edition under concurrent/retried requests.
3. Different users cannot fetch each other's private editions or PDFs.
4. Web and PDF consume the same ordered story snapshot.
5. Delivered-but-unread stories are not classified as already read.
6. Ambiguous event matches do not generate a change claim.
7. A comparison cannot reference an article outside its supplied evidence set.

Use fixtures for deterministic domain tests and one deployed browser journey for integration. Citation validation checks provenance, not semantic truth; inspect actual demo comparison claims manually against both reports.

## Evidence for judges

### Required commit workflow

Every implementation prompt must require incremental commits after meaningful, verified units of work, rather than one final bulk commit. Review the diff, stage relevant files explicitly, run checks appropriate to the change, and write a descriptive commit message. Keep secrets, private data and generated build artifacts out of Git. Preserve the actual history without squashing, amending or backdating commits. Keep PROGRESS.md current and include commit hashes/messages in milestone reports. Local commits and GitHub pushes are distinct; report push success or any blocker accurately.

Show the architecture diagram and point to the pure ranking module, provider adapter, immutable edition contract and a meaningful passing test. Demonstrate a failure fallback and shared caching using actual observations. Explain current scale limits candidly. Clean architecture with measured behavior supports a stronger claim than an untested "production-ready" label.
