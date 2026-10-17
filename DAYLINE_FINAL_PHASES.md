# Dayline: final product phases and implementation prompts

Prepared: 17 October 2026, Asia/Karachi.

## Product direction agreed with the user

Build a useful personal morning paper that a reader could eventually consider paying for. The value hypothesis is consistent relevance, saved effort, trustworthy attribution, and improving selection over time. Willingness to pay has not been demonstrated; do not invent customer, retention, or time-saving claims.

The intended journey is:

**Public overview -> Supabase sign-in -> simple onboarding -> today's paper -> feedback -> a better future paper.**

Returning readers bypass onboarding when their profile is complete. They can edit their interests later.

Use an Inoreader-inspired application structure: a clear left sidebar, an uncluttered reading area, obvious navigation, and discoverable actions. Retain Dayline's own identity and its finite daily edition. The web interface can be modern; the downloadable PDF must remain newspaper-inspired.

Design priorities:

- Users understand where they are, what is happening, and what to do next.
- Download PDF, Read original, More like this, Less like this, Skip, and Undo are clear and usable.
- Warm off-white reading surface, dark text, restrained accent, serif editorial headings, sans-serif controls.
- Reuse the Aceternity-inspired components and Motion already implemented. Avoid another visual rewrite.
- Accessible mobile navigation, readable text, visible focus, reduced motion, and truthful loading states.
- Suggested topics plus optional specific interests; custom-interest matching must correspond to real content.
- The end result must be evaluated for useful news, not just passing builds and attractive screens.

## Requirements and current baseline

The supplied problem statement requires interest-capturing onboarding, a fresh personalized daily newspaper PDF, the same edition on the web, original-source links, previous papers, and learning that improves future papers. It leaves design and implementation open. It does not require exactly three topics, subscriptions, or a particular sign-in method. Permanent accounts and the sidebar experience are the user's additional product decisions.

Source document: `C:/Users/muham/OneDrive/Desktop/NaSCon'26 Problem Statement.pdf`.

Repository: https://github.com/malisaqib/dayline

Production: https://dayline-swart.vercel.app/

At the preparation checkpoint, the tree was clean and the latest commit was `d27ccff` (`feat: polish archive preview and responsive accessibility`). Motion and the recent UI improvements are already implemented. Confirm the latest state before changing anything.

Existing foundations to preserve:

- Supabase anonymous authentication, reader isolation, profiles and archives.
- RSS/API sources, ranked and deduplicated stories, cached OpenRouter/Gemini summaries.
- Signal Brief and saved Today in three highlights.
- More/Less, tracked original-link opens, persistent Skip/Undo and preview.
- Immutable article/edition snapshots and one edition per reader per Pakistan-local date.
- Supabase Cron at 06:00 Pakistan time, with on-demand generation as a fallback.
- A shared web/PDF story presentation and source attribution.

Gaps observed during the read-only audit, to recheck against current code:

1. Authentication is anonymous-only; durable sign-in and account recovery are missing.
2. The topic schema caps selection at three; profiles lack specific-interest input.
3. Some single-topic papers are thin, topics are often assigned per source, and structured Internet Pulse signals have a ranking advantage.
4. Summary validators check output structure/length; the highlight validator checks word overlap. Neither establishes semantic truth.
5. Today in three candidate selection does not enforce the same source AI permissions as story summaries. CISA/GDACS excerpt bodies can enter that secondary AI path despite their catalog policy.
6. Learning uses bounded accumulated events without age-based weighting; generation reads cached profile weights.
7. The PDF adapter omits Today in three, although individual story parity is tested.
8. Some homepage copy claims a paper is ready without checking for today's saved edition. Reading-time estimates round each short story separately.
9. Older documentation still mentions Anthropic, NASA-only summaries, and earlier learning limitations; reconcile it with the code.

## How to use this file

Run one phase prompt at a time in the existing coding session. Each prompt refers to the shared instructions below, so leave this file in the repository. Implement phases 1-7 sequentially. Phase 8 is the final verification prompt to run when implementation is complete and the user is ready to test and submit.

The last reported deadline was 3-4 hours away. Recheck remaining time before beginning; the allocations below are planning targets, not guarantees. Reserve at least 30 minutes for verification and submission. Use any extra hour for integration issues. If a phase exceeds its allocation, report exactly what remains and prioritize the required journey over optional additions.

| Phase | Outcome | Target allocation |
|---|---|---:|
| 1 | Public overview and route structure | 15 min |
| 2 | Durable Supabase sign-in | 35 min |
| 3 | Simple, meaningful onboarding | 25 min |
| 4 | Inoreader-inspired reading workspace | 20 min |
| 5 | Content usefulness and trust corrections | 25 min |
| 6 | Improvement across days | 15 min |
| 7 | Complete newspaper PDF | 15 min |
| 8 | Final product verification and submission preparation | 30 min minimum |

Reading-budget choices, automatic web-wide discovery, additional sign-in providers, semantic event-update comparisons, payment integration, and extra sources are stretch work. Do not let them displace the working core or final verification. Never hide incomplete required work behind a completed status.

## Shared instructions for every phase

- Read `CLAUDE.md`, `QUALITY_AND_DIFFERENTIATION.md`, relevant `PROGRESS.md` entries, this file, and current git status/history. New user decisions in this file supersede conflicting older planning suggestions. Preserve security and snapshot invariants.
- Work as one coding assistant. No subagents, repeated whole-repository exploration, unnecessary live AI calls, or unrelated refactoring. Reuse context and components to conserve coding-assistant credits.
- Keep business rules in `src/domain`, integrations/services in `src/server`, and presentation in feature components. Routes validate and compose. Use strict TypeScript and existing Zod patterns.
- Keep reader operations scoped to authenticated ownership and RLS. Do not solve access failures by disabling RLS or using an admin client everywhere.
- Preserve edition IDs, historical content and the one-edition-per-local-date constraint. New preferences affect future editions; preview is explicitly temporary.
- Never print, paste into documentation, or commit secret values. Never ask the user to send secrets in chat. Record required dashboard configuration by field name only.
- Use official documentation when an integration needs verification. Do not upgrade the framework or add paid UI packages for this task.
- Keep controls honest: no fake progress percentages, fictitious source coverage, unsupported summaries, decorative buttons, or fabricated reading history.
- Prefer existing checks and focused tests for meaningful changed behavior. Do not run the entire live integration/cron suite after every visual change. Run targeted checks at checkpoints and the complete final suite once in phase 8, unless failures justify another run.
- Every phase must include incremental, descriptive commits after coherent verified units. Review the diff; stage relevant files explicitly. Preserve others' work; never squash, amend or backdate history.
- Push completed commits to the existing branch's remote and accurately report success/blockers. A push may trigger Vercel deployment; distinguish local checks from production checks.
- Update `PROGRESS.md` with changes, checks, migrations/configuration, blockers and next step. Report actual commit hashes. Do not claim done if the phase's critical acceptance criteria are unverified.
- At the end of each prompt, stop at that phase. Do not start the next phase automatically.

## Phase 1 prompt: public overview and route structure

```text
Implement Phase 1 from DAYLINE_FINAL_PHASES.md. Follow its shared instructions.

Goal: first-time visitors understand Dayline before creating an account.

Inspect the current root page and navigation. Keep `/` as the public overview. Reuse or introduce a minimal `/today` entry point for the signed-in reader; preserve all existing edition, PDF, preview and archive URLs. Use route groups/layouts if helpful without changing public URLs unnecessarily.

Overview content:
- Dayline branding; headline "Your interests. One morning paper."
- Short explanation of personalized selection, source-linked briefs, daily learning and PDF.
- Primary "Create my paper" action leading to `/signin`.
- "See a sample" using a clearly labelled sample, without leaking a real reader's edition.
- Header "Sign in"; authenticated readers instead have "Open my paper".
- Show a small product preview, three benefits, and a simple explanation of how it works.
- Use existing design tokens and motion components. The overview has a public header, not the app sidebar.
- Do not add pricing, fabricated testimonials, paid-user counts or unsupported time-saving statistics.

Prepare the route boundary for authentication in Phase 2. Until that phase is complete, clearly report the sign-in dependency instead of presenting a fake login flow.

Correct readiness claims: a saved profile alone does not prove today's edition exists. The signed-in entry should offer "Create today's paper" or "Open today's paper" according to actual state. Label the morning schedule as Pakistan time.

Check links, public access, mobile layout and changed-code type/lint checks. Avoid a full live AI journey here.

Commit and push focused changes, for example `feat: clarify dayline overview and reader entry`. Update PROGRESS.md with the pending authentication dependency and stop.
```

## Phase 2 prompt: durable Supabase authentication

```text
Implement Phase 2 from DAYLINE_FINAL_PHASES.md. Follow its shared instructions.

Goal: readers can sign in again and recover the same interests, feedback and archive across devices.

The app already has Supabase anonymous auth. Extend it; do not replace the data model or weaken ownership rules.

Implement one production-working provider first. Prefer Google via Supabase if its provider configuration is available. If email delivery is already configured instead, use email OTP. Do not implement both solely for appearance or render a nonfunctional provider button. Read current official Supabase docs for the selected flow.

If provider credentials/dashboard settings are missing, report the exact setup fields and callback URLs without secret values. Finish independent UI and callback handling while waiting. Do not invent configuration or declare authentication verified from mocks alone. Email OTP needs actual delivery to an external test address; the default Supabase mail service is not a general production mail service.

Build `/signin`, the appropriate callback/confirmation handling, and sign-out. Validate any return path against local allowed destinations. Handle cancellation, expired/invalid tokens, delivery/provider failure and retry without redirect loops.

Routing:
- New permanent account without a completed profile -> onboarding.
- Existing permanent account with a complete profile -> today's paper entry.
- Unauthenticated visits to private reader routes -> sign-in with a safe return destination.
- Public overview remains accessible.
- Expired sessions explain that sign-in restores access; do not tell readers to recreate their interests.

Existing anonymous readers:
- Offer upgrade using identity linking so the same user ID retains its history where supported.
- Handle identity-already-exists conflicts explicitly. Do not silently overwrite accounts, delete history, bulk rewrite immutable editions or merge accounts without a safe ownership-verified design.
- Preserve current guest data and document any deferred conflict-resolution case.

Verify login, logout, refresh, return routing, a second browser accessing the same account, guest upgrade, and two-reader isolation. Adapt tests that assumed anonymous-only onboarding; retain meaningful guest-upgrade coverage. Do not use admin bypasses to make tests pass.

Commit and push verified units, for example `feat: add recoverable supabase reader accounts`. Update PROGRESS.md with provider setup and what was actually verified. Stop.
```

## Phase 3 prompt: simple and meaningful onboarding

```text
Implement Phase 3 from DAYLINE_FINAL_PHASES.md. Follow its shared instructions.

Goal: a short onboarding flow captures interests that actually change story selection.

Use two clear steps:
1. "What would you like to follow?" Suggested topic cards with selected states and optional specific interests.
2. "Your morning paper" Review removable selections, explain availability and the Pakistan morning schedule, and "Create my paper".

Remove the arbitrary three-topic restriction consistently from UI, domain validation and any database constraints. Inspect existing migrations first. Allow the supported topic set; do not promise every topic appears in every six-story edition. Preserve topic balance as far as available slots and candidates allow.

Add an optional "Search or add an interest" input with examples such as AI agents and startups. This searches/suggests interests and stores preferences; it is not web-wide article search. Store bounded, normalized, deduplicated phrases (for example up to five short phrases), with clear validation and removable chips. Keep broad-topic selection usable without this field.

Implement specific-interest matching end to end:
- Add the smallest backward-compatible profile migration and typed snapshot fields needed.
- Match supplied phrases and carefully defined aliases against actual article titles/excerpts with word boundaries; avoid naive substring matches.
- Apply a bounded relevance boost without defeating freshness, diversity or duplicate removal.
- Only show "Matches your interest in X" when matching evidence exists.
- If no fresh article matches an interest, explain coverage is unavailable and use the reader's other selected interests. Do not fabricate stories or claim a broad topic satisfied a precise interest.
- Preserve old profiles/editions. Saving preferences must not regenerate or rewrite today's saved paper. Offer the existing labelled preview and explain when changes take effect.

Keep generation loading honest: show activity and an approximate observed wait, not fabricated completed steps. Errors retain selections and offer a retry. Returning readers can edit interests without repeating account setup.

Reading-budget choices are stretch work: show them only if selection, content length and saved presentation actually support them. Otherwise retain an honest estimated reading time.

Verify preference persistence, old-profile compatibility, keyword relevance, no-match handling, ownership and onboarding/back navigation. Use fixtures to prove different preferences can produce different results from the same pool.

Commit and push coherent units, for example `feat: capture specific reader interests`. Apply required migrations before dependent live verification. Update PROGRESS.md and stop.
```

## Phase 4 prompt: Inoreader-inspired reading workspace

```text
Implement Phase 4 from DAYLINE_FINAL_PHASES.md. Follow its shared instructions.

Goal: adapt the current polished UI into a simple sidebar-based news reader centered on one saved daily paper.

Reuse current Motion, Aceternity-inspired components, story cards and shared visual tokens. Consult the official Inoreader interface reference for navigation patterns; retain Dayline's branding and original layout details. Do not add a large library, Motion+ package, or another animation system.

Desktop shell:
- Left sidebar about 220-240px: Dayline; Today's paper; Past papers; My interests; Account/sign-out.
- On edition pages, add "In this paper": All stories and topic filters with real counts from that edition. Clearly indicate the active filter.
- Main toolbar: edition date, actual story count, honest estimated reading time, prominent Download PDF.
- Main reading area: compact Today in three, restrained Signal Brief, lead story, then readable story cards.
- Avoid repeating the same headline/summary across several oversized briefing panels. If Top signal and Your focus have no distinct suitable stories, omit the redundant panel.

Filters are temporary view state. They do not fetch another paper, change ranking, or alter the PDF. When filtered, label the action "Download full paper" and offer "Show all stories". Briefing links must reveal and focus/scroll to their target even if filters or a skipped collapsed card obscure it, without silently undoing feedback.

Story actions:
- Publisher, publication date/time, topic, summary/excerpt label and original-source link.
- Expandable "Why this story?".
- "Was this relevant?" with More like this, Less like this, Skip this story.
- Visible pending/success/error states; Skip collapses to a row with Undo.
- Explain that preferences affect future papers and hiding a story does not remove it from the saved PDF.

Preserve preview banners, archive opening/download and all functional feedback behavior. Do not add folders, social feeds, rules builders, subscriptions, or read-later features for visual completeness.

Mobile: sidebar becomes an accessible menu drawer with focus management, Escape/close and focus restoration. Keep the paper title and PDF action discoverable. Use one content column, 44px touch targets, clear focus, no hover-only information and reduced-motion support.

Use Motion only for purposeful transitions: drawer, disclosures, feedback and skip/undo. At the end say "You've reached the end of today's paper"; scrolling is not proof of comprehension. Any progress label should describe stories reached, not stories definitively read.

Check desktop around 1440px, mobile around 390px, keyboard navigation, reduced motion, filters and deep links. Use existing UI journey checks where applicable; no live AI calls are needed to restyle an existing paper.

Commit and push verified units, for example `feat: organize reading in a sidebar workspace`. Update PROGRESS.md and stop.
```

## Phase 5 prompt: useful content and trustworthy summaries

```text
Implement Phase 5 from DAYLINE_FINAL_PHASES.md. Follow its shared instructions.

Goal: the paper earns the reader's time through relevant, distinct, accurately represented information.

Recheck the observed gaps first. Prioritize these concrete corrections:

1. Enforce per-source AI eligibility in every model-input path, including Today in three. CISA/HN/GDACS must not enter that path under their current no-AI policy. Use a shared explicit policy check with appropriate full-text/excerpt limits. Test actual payload inclusion/exclusion, not just catalog flags.
2. Stop treating schema validation or word overlap as proof of truth. Keep structured-output checks but preserve source evidence, numbers, dates, attribution, uncertainty and denials. Add focused adversarial fixtures that change a number, reverse a denial or strengthen an allegation. For Today in three, prefer a complete supported extractive sentence when an abstractive claim cannot be adequately supported; omit it if no safe sentence exists. Never pad. Do not claim this is an automated fact checker.
3. Keep source-to-summary provenance. Where a highlight derives from an AI summary, check against the available original snapshot as well rather than assuming a summary is ground truth. Respect source permissions. Bump relevant prompt/validation cache versions so rejected older output is not silently reused for new editions; do not rewrite existing editions.
4. Calibrate native importance signals so point counts and alert metadata do not automatically crowd out relevant editorial reporting. Preserve topic balance, near-duplicate removal and explicit user preferences. Use comparative fixtures and explain weight changes.
5. Improve candidate relevance using article text where possible. A publisher's broad category alone is weak evidence for a specific interest. Avoid low-value boilerplate or administrative items when stronger matching news exists.
6. Calculate edition reading time from total visible reading content with one final rounding step. Label it an estimate; do not claim measured minutes saved.

Use the available pool first. If a supported topic remains thin and time permits, evaluate at most one or two complementary RSS/API sources: verify freshness, topic relevance, source usage terms and Vercel reachability. Record unresolved permissions honestly; do not enable AI merely because a feed is accessible. This source expansion is optional and must not delay required fixes.

Aim for up to six useful distinct stories when available. A shorter honest edition is acceptable; do not weaken quality/freshness rules to fill space. Explain partial coverage and failed sources without technical clutter.

Run targeted ranking, policy and summary tests. Use a small representative live sample and manually compare its claims with supplied evidence; record the sample, not a blanket reliability claim.

Commit and push focused units, for example `fix: enforce source policy across briefing generation` and `fix: improve briefing relevance and evidence handling`. Update PROGRESS.md with remaining limitations and stop.
```

## Phase 6 prompt: personalization that improves across days

```text
Implement Phase 6 from DAYLINE_FINAL_PHASES.md. Follow its shared instructions.

Goal: the next paper responds sensibly to recent preferences and reduces unchanged repetition.

Extend existing learning; do not create another AI system or model call per interaction.

- Include event timestamps in typed learning inputs and define a documented bounded policy in one pure domain module. Recent behavioral signals should matter more than much older ones. Keep explicit selected interests as a stable baseline; recent incidental clicks must not erase them.
- Recompute effective ranking preferences at generation/preview time from the relevant dated signals. Updating the formula alone while continuing to use stale cached profile weights is insufficient.
- Explicit More/Less should be stronger than an original-link open. Opens are weak evidence of interest, not proof of reading. Skip is reversible and must not act as a permanent topic ban.
- Avoid repeatedly counting the same content as fresh evidence merely because it appeared in multiple editions. Preserve idempotency and replacement behavior for More/Less and Undo.
- Downrank unchanged articles delivered in recent papers when valid alternatives exist. Start with reliable URL/content-hash comparisons and bounded history; do not assume similar topics are the same event.
- Preserve source/topic diversity. Store the reasons and preference snapshot used for each newly generated edition. Past papers remain unchanged.
- Explain changes using real evidence, such as recent explicit feedback. Do not infer comprehension or invent a learning percentage.

Use deterministic tests with an injected clock for three simulated days: initial selection, explicit feedback, changed preference/repeated-story avoidance. Test saturation recovery, weak clicks, Undo, sparse alternatives and reader isolation. Clearly label simulations; never backdate production papers.

If time permits, expose a reader-scoped "Reset learned preferences" action with confirmation, retaining explicit interests and saved editions. Do not show a reset button without implementing its effect.

Do not build semantic "what changed" claims in this phase. That needs separate event matching and evidence from both reports.

Commit and push, for example `feat: adapt future papers to recent reader signals`. Update PROGRESS.md with tested behavior versus unproven real-world retention. Stop.
```

## Phase 7 prompt: complete the personalized newspaper PDF

```text
Implement Phase 7 from DAYLINE_FINAL_PHASES.md. Follow its shared instructions.

Goal: downloading the paper includes the useful saved briefing and remains a readable newspaper.

Extend the shared edition presentation and PDF adapter to include the saved Today in three, with stable story references and source links. Reuse saved text exactly. Old editions lacking highlights must still render. No model calls or live URL re-reading during download.

Use the saved edition's topic labels and selection reasons to add compact reader context. Preserve the existing ordered stories. If introducing topic sections, define their order once in the shared presentation and show the same grouping/order on web and PDF; avoid PDF-only reordering. Prefer compact labels over a risky ordering change near the deadline.

Retain masthead, date, columns, readable body text and working links. Improve page breaks and spacing without forcing two pages, clipping stories, shrinking text excessively or adding filler. UI filters and skipped display states must not alter the saved full-paper export.

Render and visually inspect both a short edition and a longer one. Extend parity checks to cover saved highlights as well as stories and links. Verify an older edition and a failed-AI/excerpt fallback edition remain downloadable.

Commit and push, for example `feat: include saved briefing in newspaper pdf`. Update PROGRESS.md and stop. Hand the completed implementation back to the user before running the final submission phase.
```

## Phase 8 prompt: final value verification and submission preparation

Run this after the user reports that the implementation phases are complete. This is a verification and repair phase, not permission to submit the entry or publish/send a video automatically.

```text
Run Phase 8 from DAYLINE_FINAL_PHASES.md. Follow its shared instructions. Verify the completed product, fix critical regressions, and prepare an honest submission report.

First record the current commit/deployment and any pending migrations/provider configuration. Do not mark blocked functionality as passing.

Technical checks:
- npm test
- npm run typecheck
- npm run lint
- npm run build
- Relevant existing database, feed, AI, flow and browser-journey checks, adapted to permanent sign-in without removing meaningful isolation coverage.
- Production overview -> sign-in -> onboarding -> paper -> feedback/skip/undo -> archive -> PDF.
- A returning account on a second browser, sign-out/session expiry, safe redirects and cross-reader denial.
- Mobile, keyboard, reduced motion, loading/error states, topic-filter clearing and briefing links.
- Full web/PDF parity including Today in three; inspect rendered pages for clipping and excess blank space.

Scheduling:
- Confirm the 06:00 Pakistan schedule still uses the same selection/learning code as on-demand generation.
- Check a bounded scheduled-generation case that creates a new paper and reuses it on rerun. A run that only reuses existing papers does not measure fresh-generation performance.
- Understand the existing script's production scope before triggering it; don't repeatedly generate for every real profile just to test UI. Keep test identities distinct and clean up only accounts/data created by the check.
- Report measured time and untested scaling limits. Do not claim the serverless deadline holds at arbitrary reader counts.

Content-value audit:
Use a small documented sample: one broad multi-topic profile, one specific-interest profile and one thin single-topic profile. Reuse evidence and caches where suitable. Label fixtures separately from live results.

For each paper record:
- Stories delivered versus the intended maximum; actual publication ages and source diversity.
- Which stories actually match the declared interests, and evidence for custom-interest matches.
- Duplicate/unchanged-repeat findings and any Internet Pulse dominance.
- Whether every AI summary/highlight preserves the available source's names, numbers, dates, uncertainty and denials. Report unsupported claims and fix/fallback before demo.
- Whether source attribution and excerpt/full-text labels are correct.
- Actual cold versus cached generation timings; estimated reading time methodology.

Use an explicit editorial judgement for each story: clearly useful / marginal / irrelevant, with one sentence explaining why. This is a small audit, not a statistical proof. Do not call source coverage independent fact confirmation.

User-value check:
Prepare a short task sheet for two human testers: create a paper, identify useful stories, explain a recommendation, change a preference, and download the PDF. Ask what they would remove and whether they would return tomorrow. Do not impersonate testers or fabricate responses. If testers are unavailable, mark this unverified and provide the task sheet.

Write docs/final-product-review.md containing actual results, limitations, remaining blockers and the difference between technical correctness and observed reader value. Functional and content gates must be assessed separately. No fabricated willingness-to-pay or time-saved claims.

Submission preparation:
- Reconcile README, CLAUDE.md, architecture and limitations with current OpenRouter, auth, source permissions and learning behavior.
- Export the architecture diagram as a legible PNG and inspect it.
- Update the demo script for a video of at most five minutes: overview, sign-in, interests, useful briefing, sources, feedback, archive/PDF, evidence of learning, architecture.
- Use real current papers or visibly labelled simulations. Never fabricate past cron mornings.
- Confirm the public repository link and production link work.
- List what the user must still do: record/review the Loom, confirm its access, and submit the required links/artifact. Do not submit the form or send messages on their behalf.

Commit and push coherent fixes and documentation as separate units. Report commit hashes, deployed revision, passes/failures, value findings, and submission blockers. Stop.
```

## Official references for the implementation assistant

- Inoreader public overview: https://www.inoreader.com/
- Inoreader navigation reference: https://us.inoreader.com/blog/2024/10/the-new-inoreader-experience-is-here.html
- Supabase anonymous-account conversion: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase Google sign-in: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase email OTP: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase production email configuration: https://supabase.com/docs/guides/auth/auth-smtp
- Motion for React: https://motion.dev/docs/react-installation
- Aceternity UI: https://ui.aceternity.com/

Use these as references, not as a reason to expand scope. The final experience should deliver a clear, useful morning paper with durable preferences, understandable controls, reliable attribution, and evidence that future selection responds to the reader.
