# Dayline: five-minute Loom script

Before recording: open https://dayline-swart.vercel.app/ in a **fresh private window**, so you get a new anonymous reader. Keep a second tab ready with the GitHub repo and `docs/architecture.md`. Target length: about 4:40.

| Time | Do | Say |
|---|---|---|
| 0:00–0:25 | Show the Dayline home page. | "News is scattered across dozens of sites, and we still can't name three things we learned. Dayline turns that into one finite morning paper made for you, five minutes well spent." |
| 0:25–0:55 | Click **Get started**. Tick **Technology**, **Cybersecurity** and **Disaster alerts**. Click **Make my paper** and let the pending state show. | "Onboarding is one step: pick up to three topics. There's no sign-up form; you get a private anonymous session. Dayline now collects stories from its trusted sources and ranks them for me." |
| 0:55–1:50 | On the edition, point at the masthead and date. Point at a story's kicker (e.g. **Actively exploited vulnerability · CVE-…** or **Disaster alert · … · Red alert**). Then point at one label under a story (**AI summary of the full article text** or **Publisher's excerpt**), at **Why this story**, and at **Read the original at …**. | "This is today's paper: up to six stories, ranked by my interests and freshness, at most two per source. Every story says why it's here and links to the original publisher. Where we're allowed, Gemini writes a short grounded summary from the source text only. Otherwise we show the publisher's own excerpt, and we always label which is which." |
| 1:50–2:30 | On the lead story click **Less like this** and show "Saved: … weaker". Optionally click **More like this** on another story. Scroll to **Your preferences**. | "I can steer it. Less like this lowers that topic's weight. Clicking twice doesn't count twice, because weights are recomputed from my saved choices. Today's paper stays exactly as published." |
| 2:30–3:00 | Click **Preview next edition**. Show the banner and the reordered stories, then click **Back to today's saved paper**. | "Preview reorders today's stories with my new weights. It's clearly labelled as a preview of today's stories, it isn't saved, and it makes no AI calls. Tomorrow's real paper uses these weights." |
| 3:00–3:30 | Click **Archive**, then reopen the edition. Click **Download PDF** and open it. Scroll the masthead, kickers and **Read the original** links. | "Every paper is saved, and the archive survives reloads. The PDF is a real newspaper layout made from the same saved snapshot, so it has the same stories, same order, same text, and clickable sources." |
| 3:30–4:05 | Switch to the architecture tab and point to the Cron path. | "Readers don't have to remember. Every day at 6 a.m. Pakistan time, Supabase Cron calls a secret-protected endpoint that builds each reader's paper once. Running it again creates nothing new, and if it ever fails, the paper is generated when the reader opens Dayline." |
| 4:05–4:30 | Point to the Internet Pulse sources in the diagram, or back at a CISA or GDACS story. | "Internet Pulse adds signals people actually need: CISA's actively exploited vulnerabilities, global disaster alerts from GDACS, and what's rising on Hacker News. All come from official structured data, attributed, never rewritten by AI." |
| 4:30–4:45 | Back on the paper. | "Dayline is one finished paper a day: personal, transparent about why each story is here and where it came from, and it learns what you want. Thanks for watching." |

## Tips

- If a story has no AI label (NASA wasn't picked that day), say "today's sources are excerpt-only", and show a NASA story from an archived edition if one exists.
- Don't refresh during **Make my paper**; generation takes up to about 15 s.
- Keep the private window, so the paper and archive belong to the demo reader.
