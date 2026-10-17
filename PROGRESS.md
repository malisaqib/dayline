# Progress

Read with CLAUDE.md. Repo: https://github.com/malisaqib/dayline. Production: https://dayline-swart.vercel.app/

## Final phases 3 to 7 (2026-10-17). Committed locally; NOT yet pushed or verified on production
Production still runs commit `c164967`. Everything below passes `typecheck`, `lint`, `npm test` (87 of 87) and `build`, but browser checks on production wait for a push.

- **Accounts (change requested by the user):**
  - Email and password only. Google, email codes and guest ("try without an account") use were removed.
  - `/onboarding`, `/today`, `/archive` and `/edition/…` require a signed-in, non-anonymous account. Old anonymous sessions are treated as signed out.
  - The overview keeps the public sample: real paper captures plus `/api/pdf/sample`.
  - `/signin?mode=create` opens "Create account"; `/signin` opens "Sign in".
  - **Dashboard setting needed:** Authentication → Sign In / Providers → Email → turn off "Confirm email". Otherwise every sign-up sends an email, and the built-in mailer's ~2 per hour limit blocks it.
- **Phase 3 (onboarding):** done except the optional reading-budget choice, which is not shown because nothing supports it. Old-profile and old-edition compatibility are tested.
- **Phase 5 (content quality):**
  - Today in three only sends text from sources whose policy allows AI. CISA, Hacker News and GDACS text is excluded, and a test checks the actual model payload.
  - `src/domain/articles/evidence.ts` rejects a claim that changes a number, invents or drops a denial, or states an allegation as fact. It compares each claim with the closest source sentence. This is not a fact checker.
  - Today in three falls back to the publisher's own complete sentence (labelled "quoted") or omits the item, and never pads.
  - Summaries are checked against the original snapshot: a failing sentence rejects the summary (the story falls back to the publisher's excerpt), and failing takeaways are dropped.
  - Cache versions bumped: `brief-v3-evidence`, `excerpt-v3-evidence`, `today3-v3`. Existing editions are not rewritten.
  - Hacker News popularity is capped at 0.35 and CISA importance lowered (0.4, or 0.7 for ransomware). GDACS severity is kept, so a Red alert still beats a Green one.
  - Items with almost no text get −0.05.
  - Reading time is one estimate from all visible words, rounded once, and labelled "(estimate)".
  - **Live sample (check:ai, 1 article, 1 excerpt, 3 highlights):** numbers, dates and names matched the source. One overreach was found: the NASA summary attributes SLS and HLS to Cash's portfolio, where the source says they are Marshall's role. This is a sample, not a reliability claim.
- **Phase 6 (learning across days):**
  - `src/domain/personalization/learning.ts`: signals carry timestamps and lose half their effect every 14 days.
  - Each article counts once even across papers. Explicit More/Less (±0.25) count far more than opens (+0.05).
  - Weights are clamped after each signal in time order, so saturation recovers.
  - Skips are bounded and forgotten after 30 days.
  - Weights are recomputed at generation and preview, and the snapshot stores the weights used.
  - Stories from the last 3 days' papers get −0.3 and are labelled when shown again.
  - Deterministic tests use an injected clock over 3 simulated days. Not built: the "Reset learned preferences" button.
- **Phase 7 (PDF):** the saved Today in three, with story numbers and source links, is in the PDF through the shared `presentEdition`. A parity test covers web and PDF highlights, and an older edition without highlights still prints. **Not visually inspected yet:** `@react-pdf` won't load outside Next.js here, so this waits for a push.
- **Phase 4 (workspace):**
  - Desktop has a 232px sidebar: Today's paper, Past papers, My interests, account and sign-out. Mobile has a menu drawer that closes on Escape, moves focus into the drawer and restores it when closed.
  - "In this paper" has topic filters with real counts. They only change the view. When a filter is on, the download reads "Download full paper" with a "Show all stories" button, and "Story N" links clear the filter and focus the story.
  - The toolbar shows the story count and estimated minutes. The page ends with "You've reached the end of today's paper". Progress reads "stories reached".
  - "Why this story?" and "Was this relevant?" are in place. The skip row says the saved paper and PDF still include the story.
  - The focus panel is omitted when it would repeat the top story.
- **Mistake during this session:** a `git checkout -- .` discarded the uncommitted Phase 7 edits. They were reapplied from the session and committed as `1470e9d`.
- **Checks updated for no-guest mode:** `check:auth`, `check:journey` and `check:scheduled` now sign real test accounts in with email and password, created by admin and deleted afterwards.

## First-run flow, dark redesign and specific interests (2026-10-17). VERIFIED on production except where noted
- **Flow:** overview `/` → `/signin` (step 1 of 3) → `/onboarding` (named stepper: "What you follow", "Review and create") → first paper → `/today`.
- **Design:**
  - Dark theme tokens on every page.
  - Overview modelled on the structure of readwise.io/read: rotating hero word, real product captures of a Dayline paper, phone and PDF, a sources grid, alternating split sections and a closing call to action.
  - The captures in `public/overview/` come from a real production paper of 17 October 2026, captured with Playwright, and are labelled as such.
- **Motion:**
  - Scroll-triggered reveals for lists, grids and sections.
  - A product shot that tilts in.
  - A reading-progress bar.
  - A public navbar that tightens on scroll, with animated link underlines.
  - A live countdown to the next paper.
  - Everything respects reduced motion.
- **Today page:** shows the saved paper's Today in three with sources, the six headlines linking into the paper, the countdown, and the reader's topics and interests.
- **Specific interests (final Phase 3 core):**
  - Migration `0009_reader_interests.sql` (applied): topics allowed 1 to 7 (the three-topic cap is removed everywhere), plus `profiles.interests text[]` (at most 5). Old rows get `{}`.
  - `src/domain/interests.ts`: normalization, dedupe and bounds; whole-word matching with careful aliases and simple plurals. "mars" does not match "Marshall"; "ai" does not match "paint".
  - Ranking: an interest match makes a story eligible even outside the chosen topics, adds a bounded +0.15, and seeds one story per interest when a fresh match exists. The freshness, duplicate and source caps are unchanged.
  - Story cards show "Matches your interest in X" only with evidence. When nothing matches, the edition says "No fresh story mentioned X today" and fills from the other topics.
  - Saving interests never rewrites today's saved paper.
  - Onboarding has "Search or add an interest" with suggestions and removable chips, and step 2 reviews removable topics and interests.
- **Verified:**
  - `npm test` 69 of 69, including fixtures showing different interests choose different stories from the same pool.
  - Production guest flow with 4 topics plus "ai agents" and "cricket": the profile saved, the paper was created, and the no-match notice appeared truthfully. That run's sources were partial (Dawn, which carried today's only AI-agents story, was not in the paper). The same profile ranked against the live pool locally put that Dawn story first.
- **Accounts added on top of Phase 2:**
  - Email and password sign-in and "Create account" (sign-up needs the confirmation email).
  - "Continue with Google", rendered only when `/auth/v1/settings` reports Google enabled. It uses `linkIdentity` for guests, so their papers are kept.
  - Google is **not enabled** in the project yet; the button appears automatically once it is.

## Final Phase 2: recoverable reader accounts (Supabase email OTP). VERIFIED on production (except real inbox delivery)
- **Provider:** email via Supabase Auth (one-time code or link; password added later, see above). Google: see setup below.
- **Code:**
  - `src/domain/auth/return-path.ts`: `safeReturnPath` allows only `/today`, `/archive`, `/onboarding` and `/edition/…`. Rejects external, `//`, backslash and unknown paths.
  - `src/server/auth/email-otp.ts`: `signInWithOtp` (creates the account if new), guest upgrade via `updateUser({ email })` so the anonymous user id is kept, `verifyOtp` (`email` / `email_change`), and error mapping (expired or invalid, rate limited, email already has an account, address not allowed, delivery failure).
  - `src/app/auth-actions.ts` and `features/auth/SignInForm.tsx`: email → code steps, "Send a new code", "Use a different email", and the conflict step.
  - `/auth/confirm`: handles `token_hash` + `type` and PKCE `code`. Errors go to `/signin?error=link_expired`.
  - Sign out sits in the app header (with the account email). Guests see "Save to email".
- **Routing:**
  - Middleware sends signed-out visits to `/today`, `/archive` and `/edition/…` to `/signin?next=…&reason=signin|expired`. `/`, `/signin` and `/onboarding` stay public.
  - After sign-in: no profile → `/onboarding`; profile → the safe `next` or `/today`.
  - Expired-session copy says signing in restores topics and papers; it never asks the reader to choose topics again.
- **Guest upgrade:**
  - `/signin` for an anonymous reader offers "Save this paper to your email". The same user id keeps profile, feedback, reading events and editions; no rows are rewritten.
  - If the email already has an account, Dayline shows the conflict explicitly. It offers "Sign in to that account" (this browser switches account; the guest's rows are kept, not merged or deleted) or "Keep reading as a guest".
  - **Deferred:** merging a guest's history into an existing account. This needs an ownership-verified merge design and is not built.
- **Supabase dashboard setup required (field names only, no secrets):**
  - Authentication → URL Configuration:
    - Site URL `https://dayline-swart.vercel.app`.
    - Redirect URLs: `https://dayline-swart.vercel.app/auth/confirm**` and `http://localhost:3000/auth/confirm**`.
  - Authentication → Emails → Templates, for the code step to work:
    - "Magic Link" and "Confirm signup" must include `{{ .Token }}`.
    - "Change Email Address" (used by the guest upgrade) must include `{{ .Token }}`.
    - The default `{{ .ConfirmationURL }}` link still works in the same browser through `/auth/confirm?code=…`.
  - Authentication → Emails → SMTP Settings: custom SMTP (host, port, username, password, sender email, sender name) for real delivery. The built-in mailer hit its hourly send limit after two emails during verification.
  - Authentication → Rate Limits → "Rate limit for sending emails": raise it after custom SMTP is configured.
  - Google: in Google Cloud, create an OAuth client (Web). Authorized redirect URI = the Supabase "Callback URL" shown under Authentication → Sign In / Providers → Google; JavaScript origins = the production URL and `http://localhost:3000`. In Supabase, enable Google with that Client ID and Client Secret, and turn on "Allow manual linking" so guests can link Google.
- **Verification (`npm run check:auth`, Playwright against production):**
  - Passing:
    - The public overview is open.
    - Signed-out `/archive` → `/signin?next=/archive`, with an explanation.
    - External return paths are dropped.
    - An invalid link → `/signin?error=link_expired` with no loop.
    - A wrong password is refused with a clear message.
    - Password sign-in for a new account → `/onboarding`.
    - The edition is owned by the permanent account.
    - Refresh keeps the session.
    - A used link cannot be replayed.
    - Sign-out works and the paper then needs sign-in.
    - A second browser on the same account sees the same archive, with return to `/archive`.
    - Guest path; two-reader isolation (page and PDF).
    - Guest upgrade conflict shown, with the guest session kept.
    - Guest upgrade (one earlier run): same user id, `is_anonymous` false, archive survived.
  - **What stands in for the inbox:** the test reads Supabase-issued tokens (admin `generateLink`, and the `email_change` token hash from `auth.users`) instead of an inbox. Sign-in itself always goes through the app's own routes; no admin bypass.
  - **Not verified:** real inbox delivery and the 6-digit code step, which needs `{{ .Token }}` in the templates. The upgrade step can hit the built-in mailer's hourly limit; the latest run did.
  - The local `next start` never completes server-action redirects in this environment (the committed code behaves the same), so browser checks run against production.

## Final Phase 1: public overview and reader entry (DAYLINE_FINAL_PHASES.md). DONE, with sign-in pending Phase 2
- **Routes:** route groups keep every URL. `(public)` holds `/` and `/signin` with a public header; `(app)` holds `/today`, `/onboarding`, `/edition/[id]`, `/edition/[id]/preview` and `/archive` with the app header and navigation. PDF and API routes are unchanged.
- **Overview `/`:**
  - "Your interests. One morning paper.", three benefits, how it works, "Create my paper" → `/signin`.
  - "See a sample" jumps to a product preview labelled "Sample layout: placeholder text, not a real paper", plus the existing labelled sample PDF. No reader data, pricing, testimonials or statistics.
  - The header shows "Sign in" to visitors and "Open my paper" to readers.
- **`/today`:** reads the reader's actual state (`readReaderEntry`).
  - Visitor → `/signin`; no topics → `/onboarding`.
  - If today's edition exists: "Today's paper is ready." with an "Open today's paper" link. If not: "Today's paper hasn't been made yet." with "Create today's paper".
  - This replaces the old home copy that claimed readiness from the profile alone.
- **Schedule:** shown as "06:00 Pakistan time (PKT)".
- **PENDING (Phase 2):** durable sign-in. `/signin` honestly says email sign-in is not available yet and offers "Continue without an account" (the existing browser-only anonymous session), warning that clearing browser data loses access. Nothing fakes a login.
- **Checks:**
  - Local: typecheck, lint, `npm test` 61 of 61, build.
  - Production (`d7ad4b7`), 17 of 17: `/` public; headline; Sign in for visitors; sample labelled; no app navigation on the overview; Create my paper → /signin → Continue → /onboarding; /today redirects visitors; sample PDF 200; 0px overflow at 390px on `/` and `/signin`; Open my paper for readers; /today "hasn't been made yet" + Create today's paper → edition → /today "ready" → Open today's paper.
  - The journey and scheduled scripts now enter via `/today`.
- **Note:** a plugin hook now blocks starting a local server, so browser checks for this phase ran against production.

## Experience redesign with Motion and Aceternity patterns. VERIFIED (deployment d27ccff)
- **Dependency:** only `motion` (free, `motion/react`). Aceternity patterns were adapted from the official registry sources, not installed wholesale:
  - CardSpotlight: pointer-following radial mask only; dropped its three.js `CanvasRevealEffect` dependency.
  - Spotlight: SVG with a faint vermilion fill, animated with Motion.
  - BentoGrid: layout pattern only; dropped the `@tabler/icons-react` dependency.
- **System:**
  - Tokens for paper, ink, vermilion, muted blue-grey, card and raised shadows, card radius.
  - Shared Motion variants (`fadeUp`, `fade`, `stagger`, `collapse`) on one curve and duration scale.
  - `MotionRoot` (reducedMotion="user") plus a `template.tsx` page entrance. Entrances are instant under prefers-reduced-motion.
- **Shell:** masthead with date and timezone on every size, Today / Archive / Topics with `aria-current`, skip link, landmarks.
- **Onboarding:**
  - Hero "Your five-minute morning paper." over a subtle spotlight.
  - Spotlight topic cards with icons and descriptions; "Your paper will cover:" summary; step 1 of 2 / 2 of 2.
  - An honest generation panel: "Gathering stories and preparing your paper…", an indeterminate bar, what Dayline does, and a typical duration. It never claims steps are complete.
  - "Your paper is ready." on arrival. Errors offer Try again.
  - No keyword or reading-time inputs: the backend doesn't support them.
- **Edition:**
  - Bento Signal Brief: Today in five minutes, Today in three (now with the source named), Top signal, Your focus, Internet pulse, reading progress. Staggered.
  - Story cards stagger in. "Why you're seeing this" is a Motion disclosure (button with `aria-expanded`).
  - Feedback confirmations animate, with copy such as "Technology will appear less often." Skip cross-fades with a layout transition; the progress bar animates.
- **Learning card:** explains topic and source learning, ends "Your current paper is saved and will not change."
- **Preview:** "Preview only" banner with "This shows how your next paper may look. Your saved paper is unchanged."
- **Archive:** cards use the shared Motion stagger.
- **Verified:**
  - Locally: typecheck, lint, `npm test` 61 of 61, build, journey PASSED, PDF parity 5 of 5, `check:scheduled` PASSED.
  - Production: journey PASSED, PDF parity 5 of 5, `check:scheduled` PASSED (91 readers; 0 created on rerun).
  - Keyboard-only onboarding reaches the edition. Download PDF, Archive, Edit topics, Read the top signal, Read original, Why you're seeing this, More, Less and Skip are all reachable by Tab; 0 of 40 focused elements lacked a visible focus ring.
  - Reduced motion: content fully visible immediately. Slow network (1.5 s latency): the loading skeleton shows, then the edition.
  - 0px horizontal overflow at 390px on all four pages.
  - Rendering made no AI calls: generation was logged only for newly created readers.
- **Limits:**
  - Story-card headline links are inline text (WCAG-exempt), about 27px tall; each card also has a 44px "Read original article" button.
  - The scheduled run now takes about 30 s for 91 readers (limit 300 s).
- **Commits:**
  - `669a61a`: system and shell.
  - `7ffbc35`: onboarding. This commit did not type-check; `bedba32` fixed it immediately.
  - `d5f9fe1`: edition.
  - `d27ccff`: archive, preview and accessibility.

## Content quality: final verification (deployment 7a5dec9)
- **Local:**
  - `npm test` 61 of 61; typecheck, lint and build pass.
  - `check:feeds`: all enabled sources pass, including BBC/NPR world feeds.
  - `check:ai`: full, excerpt and Today in three all valid; hedges and denials preserved.
  - `check:flow` 19 of 19.
  - `check:journey` PASSED (onboarding, More/Less, preview, Skip, Undo, Read original, archive, PDF, isolation). PDF parity 5 of 5.
  - `check:scheduled` PASSED (76 readers: created 1, then 0 on rerun).
  - 0px overflow at 390px.
- **Production** (https://dayline-swart.vercel.app/):
  - `/api/health` ok. BBC World (27) and NPR World (10) reachable from Vercel; Dawn still 403 (non-fatal).
  - Journey PASSED; PDF parity 5 of 5.
  - `check:scheduled` PASSED: 78 readers, run 1 created 1 / reused 77, run 2 created 0 / reused 78, failed 0, durations 19.5 s and 11.8 s.

## Content quality 3: skip and behavioural learning (feat: learn from skips and reading behavior)
- **Migration 0008 (applied):**
  - `reading_events`: one row per reader + edition + story + kind (`open` or `skip`). It stores the URL, source and topics copied from the owned snapshot.
  - Owner-only RLS: select, insert (the edition must belong to the reader) and delete (Undo).
  - `feedback_events.source_id`, so More/Less also teach source preference.
- **Learning** (`src/domain/personalization/behavior.ts`, pure):
  - Topic shift: open +0.05, skip −0.1, capped at ±0.25 per topic before the normal 0.25-2.0 clamp.
  - Source affinity: More +0.05, Less −0.05, open +0.02, skip −0.04, capped at ±0.1 on the score.
  - A skipped article (by hash or URL) gets a −1 penalty, so it returns only when nothing else can fill the slot.
  - Reasons show "You often read <Source>".
  - More/Less behaviour is unchanged (once per story; switching replaces).
- **UI:**
  - "Train your paper" now has More / Less / **Skip this story**. Skip collapses the card to "This story was skipped. Your current paper is unchanged…" with Undo; it persists across reloads. Works on the edition and the preview.
  - "Read original article" (and the headline link) records an open once per story.
  - The learning card updates instantly from the action result.
- **Generation and preview:** both use the reader's personal signals (source affinity and skipped stories).
- **Verified:**
  - `npm test` 61 of 61 (open/skip effects, bounds, source affinity reordering, skipped excluded but still fills a sparse paper).
  - `check:flow` 19 of 19 (open recorded once, skip stored, Undo removes it, service and RLS (42501) reject skips on another reader's edition).
  - Journey PASSED with Read original, Skip, reload, Undo, More/Less. PDF parity 5 of 5.
  - 0px overflow at 390px, after fixing the button group's `shrink-0`.
- **Limits:** opens are recorded on click, not on actual reading. Source affinity only affects sources the reader has interacted with.

## Content quality 2: grounded summaries and Today in three (feat: add grounded summaries and today in three)
- **Policy:** each source has an explicit `aiExcerptSummary` flag. It's on for NPR, Ars, BBC, Dawn, Geo and ScienceDaily, and off for CISA, HN and GDACS (never AI-processed). NASA keeps full-text summaries (`brief-v2-openrouter`).
- **Excerpt summaries** (`summarizeExcerpt`, `excerpt-v2`):
  - Input: headline, the publisher's feed excerpt trimmed to 900 characters at a word boundary, source, publish time and URL. Never full text, never scraped.
  - Output: strict schema, 12-60 words, 0-2 takeaways. Excerpts under 120 characters aren't sent.
  - Only the edition's selected stories are summarised. The cache key is (hash, model, prompt version). One retry on invalid or truncated output, then the labelled publisher excerpt.
- **Today in three** (`buildTodayInThree`, `today3-v2`):
  - One call per new edition, using only stories with body text.
  - Strict JSON `{items:[{story,sentence}]}` with at most 3 items. Validation drops unknown story numbers, repeats, sentences outside 5-35 words, and sentences under 50% word overlap with that story's headline and text. It never pads.
  - Stored on the immutable edition (migration 0007 `editions.today_in_three`, applied) and shown first in the Signal Brief, linking to "Story n".
  - Failure means an empty list; generation never blocks.
- **Topic balance** (fix found during verification): source-native importance let Internet Pulse crowd out a reader's Pakistan topic. Ranking now reserves the best story for each chosen topic first (strongest weight first, within caps), then fills by score. Live: all 5 multi-topic mixes cover every chosen topic.
- **Verified:**
  - `npm test` 57 of 57, including mocked-response AI tests: eligibility, bounded input, retry, fallback, grounding, unknown/repeat/headline-only rejection, no call without candidates.
  - `check:ai` live: full summary OK; excerpt summary and Today in three checked by hand against the source text. The prompts were then tightened to keep hedges and denials.
  - Live generation: reader A 3 cache hits, 4 calls, 3 highlights; reader B 6 calls, 3 highlights; 0 failures.
  - Journey PASSED; PDF parity 5 of 5; typecheck, lint and build pass.
- **Limits:**
  - A cold-cache paper now takes about 13-25 s (up to 6 summaries plus 1 call).
  - Highlight grounding is a word-overlap check, not semantic verification.
  - Internet Pulse sources still rank highly because only they have native importance signals; topic seeding keeps every chosen topic present.

## Content quality 1: coverage and ranking (feat: improve edition coverage and ranking)
- **Near-duplicates** (`src/domain/articles/similarity.ts`): titles are normalized by removing punctuation, stop words, date words, years, 1-2 digit numbers and boilerplate (live, updates, Show HN…). Same story = word overlap ≥ 0.7, or ≥ 0.8 containment for titles of 4+ words. Fresh articles are clustered; the highest-scoring matching member represents the cluster, and `sourceCount` = distinct sources in the cluster.
- **Importance:** max(coverage, source signal).
  - Coverage: (sources − 1) / 2, capped at 1.
  - Source signals set by the adapters: HN max(points/500, comments/300); GDACS Red 1, Orange 0.6, Green 0.2; CISA 1 if ransomware use is known, else 0.75.
  - Score = 0.6 topic + 0.2 freshness + 0.2 importance, so a major story beats a slightly newer minor one (tested: a Red alert 20 h old beats a Green alert 1 h old).
- **Fill and diversity:** first pass at 2 per source; if fewer than 6, a second pass allows a 3rd per source, never more. Relaxed picks carry the reason "Included to fill your paper…".
- **Snapshots:** stories store `sourceCount` and `importance` (edition JSON defaults; no migration). The preview uses the same scorer. "Why this story?" adds Coverage and Selection rows.
- **World topic:** BBC and NPR now use their world feeds (BBC `/news/world`, NPR `1004`), not the UK and US front pages.
- **Measured on the live pool (11 topic mixes):**
  - Average stories 4.1 → **5.0**.
  - World, Pakistan, Technology, Science and all multi-topic mixes reach 6 of 6.
  - Single-topic Space and Security reach 3 (one source each). Disasters reaches 1 (GDACS had one fresh alert).
  - The DeepSeek near-duplicate is gone.
- **Limits:**
  - Cross-source clustering rarely fires with today's feeds (different phrasings), so coverage importance seldom applies.
  - Single-source topics stay thin until new sources are allowed.
- **Checks:** `npm test` 49 of 49 (similarity, coverage ranking, Red-over-Green, relaxed cap, sparse topics). `check:flow` 13 of 13. Typecheck, lint and build pass.

## Signal Brief (UI). VERIFIED locally
- A Signal Brief at the top of the edition page:
  - "Today in 5 minutes": story count, reading time from saved bodies, date.
  - "Top signal": the rank-1 story, its first sentence only, source and time, "Read the top signal".
  - "Your focus": the highest-ranked story for the reader's strongest-weighted topic. It skips the top signal and near-duplicate headlines. Shows "Selected because it matches your <Topic> interest."
  - "Internet pulse": labelled CISA, HN and GDACS stories not already shown, hidden when there are none.
  - "Reading progress": stories that have entered the viewport, shown as a progressbar. Also in the sticky desktop rail.
- Story cards: "Why this story?" lists Topic, Recency, Source and Personalization (only when feedback changed the weight). Takeaways sit under "What happened". "Why it matters" and "What to watch" are omitted because no such field exists; inventing them would misrepresent the data.
- `buildSignalBrief` (`src/domain/editions/signal-brief.ts`) is pure: no network, no AI, no migration.
- Fixed on the way: `router.refresh()` inside the feedback transition never committed on the larger page, leaving "Saving…" forever. Feedback now uses an explicit pending flag. The action returns the new weights, and the learning card (`LearningChips`) updates instantly from a browser event, with no refresh needed.
- Checks: `npm test` 45 of 45 (7 Signal Brief tests). Typecheck, lint and build pass. Local journey PASSED. PDF parity 5 of 5 (PDF code unchanged). Rendering pages made 0 model calls (the server log shows generation only for new readers, `modelCalls:0`). No horizontal overflow at 390px.

## Phase 4: Firecrawl "Follow your curiosity". NOT BUILT (evaluation threshold failed, 2026-10-17)
- Threshold: at least 2 of 3 queries must return 3 or more useful results within the 96 h freshness limit. Result: **0 of 3**.
- Method: `POST /v2/search` with `sources:["news"]`, `limit:10`, `safe:true`, `highlights:false`. No Agent, Scrape or Crawl. Key never printed.
- Run A (query + " latest developments", which deviated from the exact-query instruction): scholarships 0 results; climate 0 results; cybersecurity 10 results, none within 96 h. Credits: 0 + 0 + 2.
- Run B (exact queries):
  - Each query: HTTP 200, 2.6-3.0 s, 2 credits, 10 results, 0 duplicates, all URLs valid.
  - Response shape: `{success, data:{news:[{title,url,snippet,date,imageUrl,position}]}, creditsUsed, id}`; dates are relative ("5 days ago") or absolute ("Jul 8, 2026").
  - Scholarships: relevant Pakistani outlets (tribune.com.pk, dawn.com, app.com.pk, thenews.pk), plus an off-target UAE item and an aggregator (globalsouthopportunities.com). Newest "1 week ago"; most from 2025 to Aug 2026. **0 within 96 h.**
  - Climate tech: relevant (arabnews.pk, dialogue.earth, digitalpakistan.pk), but newest "4 weeks ago", with items back to 2024. **0 within 96 h.**
  - Open-source security: highly relevant (helpnetsecurity.com ×5, cybersecuritynews.com, anthropic.com, nvidia, microsoft). Newest "5 days ago" (120 h). **0 within 96 h.**
- Total credits used: 8 (6 requests; empty searches cost 0).
- Conclusion: Firecrawl news search returns relevant, reputable but mostly **weeks-to-months-old** results for niche interests. It would rarely add fresh stories to a daily paper. A 7-day window would pass only the security query (4 items).
- Options if revisited: a weekly "curiosity digest" with a 7-14 day window, or dated query terms. Both need a product decision.

## Phase 3: automatic daily generation. VERIFIED on production (deployment 339f8be)
- **Endpoint:** `POST /api/internal/daily-editions` checks `Bearer CRON_SECRET` in constant time. A missing or wrong token, or an unset server secret, gets 401. The response is counts only: `{localDate, examined, created, reused, failed, durationMs}`.
- **Job** (`src/server/services/daily-job.ts`):
  - Profiles in keyset pages of 100, 3 readers at a time, each through the existing `getOrCreateDailyEdition`, so ranking, weights, caching, source isolation and snapshots are unchanged.
  - The article pool is fetched once per run, and only if someone needs a new edition.
  - A failing reader is counted and logged with an id prefix only; the others continue.
  - Readers who sign up after the run still get their paper on demand.
- **Schedule:** Supabase Cron job `dayline-daily-editions` runs `0 1 * * *`, which is **01:00 UTC = 06:00 Asia/Karachi**. It is **active**. `internal.trigger_daily_editions()` (migration 0006) reads the URL and token from Vault. Setup and operation are in `docs/daily-schedule.md`; `npm run cron:setup` is idempotent.
- **Verified locally:**
  - `npm test`: 38 of 38 (auth 401/200, counts-only response, reuse, failure isolation, paging, one pool fetch, no id leakage).
  - `check:daily`: 6 of 6. The scheduled edition used the reader's saved weights. The second run gave created 0 / reused 33. The edition rejected an update even with the secret key.
  - `check:scheduled` against the local server: PASSED. Covers the 401s, run 1 creating the missing edition (created 1, reused 31), run 2 creating nothing (reused 32), and the reader opening that scheduled edition via "Open today's paper", the archive and the PDF (200).
- **Verified on production (deployment bf19931):** no token and wrong token get 401; GET gets 405. `/api/health` reports `cron.missingFields: ["CRON_SECRET"]` without ever showing a value, so health returns `ok:false` until the secret is set.
- **Production, after `CRON_SECRET` was added to Vercel:**
  - `/api/health` returns `ok:true` with `cron.valid:true`; no secret values appear in the body.
  - `npm run cron:setup -- --trigger`: the real pg_cron path (Vault → `internal.trigger_daily_editions()` → pg_net) got **HTTP 200** `{"examined":31,"created":0,"reused":31,"failed":0,"durationMs":8084}`.
  - `BASE_URL=https://dayline-swart.vercel.app npm run check:scheduled`: PASSED. The 401s held; run 1 got HTTP 200 (created 1, reused 31); run 2 got HTTP 200 (created 0, reused 32); counts only; the reader opened the scheduled edition via "Open today's paper", the archive and the PDF (200).
  - Database: 31 editions for 31 readers on 2026-10-17, **0 duplicates**. The cron job `dayline-daily-editions` is `0 1 * * *` and `active: true`.
- **Commits:** `c434290` (job and endpoint), `bf19931` (cron schedule and docs).
- **Limits:** a single run must fit in 300 s (about 5 s for 33 readers now). There is no automatic retry; on-demand generation covers gaps.

## Internet Pulse sources. VERIFIED locally and on production (deployment c8a6765)
- **CISA KEV** (`src/server/sources/cisa-kev.ts`): official JSON. Keeps entries added within the 96 h age limit (at most 8), validated with Zod; malformed entries are counted as rejected. Uses official fields only (name, CVE, vendor/product, description, first sentence of the required action, due date). Links to the CISA catalog search for the CVE. Topics: Cybersecurity and Technology.
- **Hacker News** (`hacker-news.ts`): top 20 ids, item details fetched 5 at a time (6 s timeout per item). Drops job, dead, deleted, text-only and stale items, and keeps 8 by points adjusted for age. Shown as headline and original link only, labelled with points and comments; linked pages are not fetched. Topic: Technology.
- **GDACS** (`gdacs.ts`): official RSS. Orange/Red alerts come first; Green alerts are used only as a fallback (at most 3). Labels carry event type, country, alert level and severity. Spaces before punctuation are tidied. Topics: Disaster alerts and World.
- Shared changes:
  - New topics: Cybersecurity and Disaster alerts.
  - `labels` on article and story snapshots, shown as a kicker identically on web and PDF (migration 0005, applied).
  - Canonical URLs (tracking parameters removed).
  - Ranking also drops duplicate normalized titles.
  - The adapter dispatcher in `pool.ts` lets each source fail independently.
- **No AI:** all three sources have `aiProcessing: false` (tested). The production generation log showed `modelCalls: 0`.
- **Reachability:**

  | Source | Local | Vercel |
  |---|---|---|
  | CISA KEV | 7 items | 7 items |
  | Hacker News | 8 items | 8 items |
  | GDACS | 4 items | 4 items |
  | Dawn | works | still HTTP 403; generation continues without it |

- **Checks:**
  - `npm test`: 31 of 31 (KEV parsing and malformed data, HN filtering and bounds, GDACS fields, fallback and punctuation, independent failure, no AI, source cap, title de-duplication).
  - `typecheck`, `lint`, `build` and `check:feeds` pass.
  - `JOURNEY_TOPICS=security,disasters,technology npm run check:journey`: PASSED locally and on production. The editions contained CISA, GDACS and Hacker News stories, and the PDF matched the web in order, links and margins.
- **Commits:** `c52bebe` (sources), `c8a6765` (GDACS tidy and journey options).
- **Limitations:**
  - CISA links go to the catalog search page, not a per-CVE page.
  - Hacker News destination links are third-party: some block automated checks (WARN) and one (llmspeed.dev) refused connections from this machine.
  - GDACS reuse terms have not been reviewed.
  - The source's topics are applied to all of its items; there is no per-item tagging.

## Phase 2: feedback learning and preview. VERIFIED locally and on production (deployment 6793a10)
- Policy (`domain/personalization/weights.ts`): each selected topic starts at 1.0; More adds 0.25 and Less subtracts 0.25 per story topic; weights are clamped to 0.25-2.0. Weights are re-derived from all stored signals, so repeats and retries can't compound. `profiles.topic_weights` caches the result.
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
| `npm run check:ai` | pass on 5 of 5 runs. OpenRouter `google/gemini-3.8-flash`, strict JSON Schema used, Zod validation passed, summary 80-85 words, 3 takeaways, 7-10 s per run. One run needed its single retry after truncated JSON. The summary was checked by hand against the NASA source: no unsupported claims. |
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
After the authorized production run: the submission package (architecture diagram, README, Loom).

## Deferred
Scheduling, "Since your last read", elaborate styling.
