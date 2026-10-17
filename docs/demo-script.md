# Dayline: Loom script (target 4:45, limit 5:00)

## Before recording

1. In Supabase, Authentication → Sign In / Providers → Email: turn **off** "Confirm email", so a new account can sign in straight away. (Otherwise create the demo account the day before and confirm it.)
2. Open https://dayline-swart.vercel.app/ in a fresh private window at 1440 px wide. Turn on Loom's cursor highlight.
3. Have a second tab ready with the GitHub repo open on `docs/architecture.md`, scrolled to the diagram.
4. Pick a new email for the demo, such as `demo+1@yourdomain.com`, and a password you can type quickly.
5. Rehearse once. Generating the first paper takes about 10 to 20 seconds; talk over it, never refresh.

## Script

| Time | Do | Say |
|---|---|---|
| 0:00 to 0:25 | Overview. Let the headline word rotate once. Scroll slowly past the real paper screenshot. | "News is scattered across dozens of sites, and at the end of the day most of us can't name three things we learned. Dayline gives you one personal morning paper: the stories that matter to you, summarised, sourced, and finished in about five minutes." |
| 0:25 to 0:45 | Keep scrolling: the sources grid, then the four feature sections. | "It reads trusted newsrooms and official alerts: NASA, BBC, NPR, Ars Technica, Geo News, ScienceDaily, plus structured feeds like CISA's exploited vulnerabilities and GDACS disaster alerts. Every story links back to its publisher." |
| 0:45 to 1:05 | Click **Create my paper**. Show the Create account tab. Type the email and password, then confirm the password. Click **Show** once, then **Create my account**. | "Sign-up is just an email and a password, with a confirm field and show-password. Your paper then follows you to any device, and there's a password reset if you forget it." |
| 1:05 to 1:45 | Onboarding step 1: tick **Technology**, **World**, **Science** and **Pakistan**. In "Search or add an interest", type **AI** and press Enter, then click the **+ Mars** suggestion. Click **Continue**. On step 2 point at the removable chips. Click **Create my first paper**. | "Onboarding is two clear steps. First, what do you want to follow: broad topics, plus anything specific you care about, like AI or Mars. Dayline matches these as whole words in the actual stories, so 'Mars' never matches 'Marshall'. Step two shows exactly what your paper will cover, and I create it." |
| 1:45 to 2:05 | Talk over the honest loading panel. | "Right now it's gathering today's stories, ranking them for me, and writing short summaries only where each publisher's terms allow it." |
| 2:05 to 2:50 | On the paper: point at the date and estimated minutes, then the **Signal Brief** and **Today in three**. Click a **Story 2** link and show it scroll. Point at a story's **Matches your interest in "ai"** badge, the right-hand column (publisher, time, *AI summary* or *Publisher's excerpt* label), and open **Why this story?**. | "Here's today's paper. Today in three gives the three things worth knowing, each linked to its story. Every line is checked against the source: if AI changes a number, drops a denial or turns an allegation into a fact, it's rejected and replaced by the publisher's own words. Every story says why it's here, which interest it matched, and whether it's an AI summary or the publisher's excerpt." |
| 2:50 to 3:15 | Click a topic filter such as **Technology**, show "Download full paper", then **Show all stories**. | "Filters change only the view. The saved paper and the PDF always keep every story." |
| 3:15 to 3:50 | On one story click **Less like this**; on another **More like this**; on a third **Skip this story**, then **Undo**. Scroll to **How Dayline is learning your interests** and click **Preview next edition**, then go back. | "This is how it learns. More and Less are strong signals, Skip is bounded and reversible, and opening an article counts a little. Recent behaviour counts more than old behaviour, the same article never counts twice, and tomorrow it avoids repeating stories I've already seen. The preview shows how my next paper would reorder. Today's paper never changes underneath me." |
| 3:50 to 4:15 | Click **Download PDF** and open it. Scroll the masthead, Today in three, the top story and the two-column stories. Then click **Past papers** in the navbar. | "The same edition is a real newspaper PDF: masthead, today's highlights, top story, columns, and a clickable source on every story. Every paper is kept in the archive." |
| 4:15 to 4:40 | Switch to the architecture tab. Point at the Cron box and the learning box. | "Every morning at 6 a.m. Pakistan time, Supabase Cron calls a protected endpoint that builds each reader's paper exactly once. Ranking, learning and evidence checks are pure, tested code. Each reader's data is locked to them by row-level security." |
| 4:40 to 4:55 | Back on the paper. Toggle **Light mode** once. | "Dayline: one finished, personal paper a day that tells you why each story is there, where it came from, and gets better the more you read. Thanks for watching." |

## If something goes differently

- **No story matched an interest:** the paper says "No fresh story mentioned …"; say "it tells you honestly instead of padding" and move on.
- **"Some sources were unavailable":** say "if a publisher is down, Dayline uses the rest and says so."
- **Sign-up asks you to confirm your email:** "Confirm email" is still on. Sign in with an account you created and confirmed earlier.
