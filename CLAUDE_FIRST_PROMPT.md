# First prompt for Claude Code

Paste the following into Claude Code in this project folder when implementation starts. Then use milestone-specific prompts from our planning conversation.

---

We have at most nine hours to implement a hackathon product. Read HACKATHON_PLAN.md first. Treat it as the project plan, while respecting any existing repository instructions and current user corrections. I use Next.js, TypeScript and Tailwind. Build milestone 0 and the first persisted vertical slice only, then report evidence and remaining blockers. Do not attempt every feature at once.

Read QUALITY_AND_DIFFERENTIATION.md as well. Code readability, maintainability and scalability are explicit judging priorities reported by the user. Apply its engineering standards now. The proposed "Since your last read" feature belongs to a later milestone; do not implement it in this setup phase. Preserve the timestamps and immutable article/edition snapshots it will need.

The product is a personal daily newspaper: short onboarding, personalized sourced stories, matching downloadable newspaper PDF, saved archives and feedback that improves future editions. Preserve one immutable edition snapshot as the source for both web and PDF.

First inspect the workspace and available runtime. Create a compact CLAUDE.md and PROGRESS.md. If the hackathon repository already exists, use it; otherwise initialize the local repository and tell me the exact remaining GitHub setup action. Never rewrite or fabricate commit history. Do not expose secrets in logs or commits.

Commit throughout implementation after each meaningful, verified unit of work; do not wait until the phase or project ends. Inspect the diff, stage only the relevant files, and use descriptive messages such as `feat: persist daily editions` or `fix: prevent duplicate daily generation`. Run checks appropriate to the change before committing. Exclude secrets, private data and generated build artifacts. Preserve existing history without squashing, amending or backdating it. Record checks and remaining work in PROGRESS.md, and report commit hashes/messages at each handoff. Distinguish local commits from commits pushed to GitHub; do not claim a push unless it succeeded.

Timebox feasibility to 30 minutes: deploy the minimal Next.js shell if hosting credentials exist, generate one real PDF in the intended host, fetch at least two candidate sources, prove a Supabase write/read and validate one model response if a key exists. Use available credentials without printing them; request only missing account setup details. Clearly distinguish unverified source permissions and live integrations from fixtures. If a dependency is blocked, continue independent work with a documented adapter or fixture, and report the blocker.

Then implement a small saved fixture edition, web rendering, PDF download and archive. Mark fixtures visibly. Add authenticated session ownership and database isolation. Reloading must preserve the edition. Repeated generation must not create duplicate daily editions. The PDF and web must have the same ordered titles and text. Use an editorial newspaper layout with a serif masthead, warm paper, dark ink and restrained accent.

Do not add chat, audio, agents inside the application, vector storage, crawling infrastructure or a second backend framework. Use one main coding session; optionally delegate independent review. Any parallel editing must have disjoint file ownership or isolated worktrees.

Provide working build output, the actual PDF path/download, a visual check of the PDF, and the result of the save/reload/archive journey. Distinguish implemented, tested and blocked items. Update PROGRESS.md with the next milestone and commit coherent completed work. Stop at this checkpoint so we can review the result before the next milestone.
