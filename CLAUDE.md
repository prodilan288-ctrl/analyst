@AGENTS.md

# prod.ilan_ — Content Automation System
## Full Vision Document & Project Briefing for Claude Code

---

## Who This Is For

**Ilan** — 18-year-old music producer from Slovakia (@prod.ilan_ on Instagram and TikTok). Charting producer with real placements: Hunxho, Stunna Gambino, Nelly NLMB, GMTO Bizzy, Multiszn.

Full-service offering: exclusive production + mix/master + cover art + branding + rollout plan. Target clients: serious artists with budgets and momentum. Not beat-leasing, not free beats. High-ticket retainers and one-time offers.

Also building a separate CRM outreach tool for producers (different codebase, different project — do not mix these up).

---

## Where This All Started — The Content Strategy Problem

Before building anything technical, a full content strategy was developed in this Claude project. Understanding that strategy is essential context for understanding why this tool matters and what it needs to measure.

### The Brand Goal
Attract serious artists and industry connectors through content — so inbound replaces cold outreach. Every metric the tool tracks should map back to this, not vanity numbers.

### The Funnel Architecture
Every piece of content maps to one of three layers:

**TOFU — Get Found**
Reach strangers, drive profile visits. Formats: viral format replications, POV lifestyle (always fresh footage), cookup reels.

**MOFU — Build Trust**
Convert a viewer into a believer. Formats: talking-head yaps (hot take, story time, educational for artists), placement breakdowns (split into parts: melody/drums/key choice/before-after/story — one placement = 5 reels).

**BOFU — Convert**
Turn a believer into a client. Format: YouTube long-form, problem → story → solution, aimed at artists.

### The Weekly Content Plan (11 posts/week, IG + TikTok cross-post)
- 4× Viral format replications (TOFU) — aimed at artists, not producer culture
- 1× Yap — hot take (TOFU/MOFU)
- 1× Yap — story time (MOFU) — Slovakia → US placements arc
- 1× Yap — educational (MOFU) — teaches artists, not producers
- 1× POV lifestyle (TOFU) — always fresh footage, never recycled
- 2× Cookup reels (TOFU/light MOFU)
- 1× Placement breakdown (MOFU) — split into parts

Posted on-the-go throughout the week, not batched in one session. Yap topics kept in notes app and recorded in one session weekly.

### Trial Reels Strategy
3 trial reels per day on Instagram. Trial reels are shown only to non-followers — followers never see failed experiments, feed stays curated. Change ONE variable per trial (hook OR caption OR a re-cut). Used primarily to test the 4 viral format replications on strangers before they touch the main feed. TikTok has no trial system — just cross-post feed reels directly.

### YouTube Plan
Starting week 2-3 of the new content strategy. 1-2 long-form videos per week. Problem → story → solution format, aimed at artists. Evergreen BOFU asset — don't gate it on Instagram follower numbers.

### Key Content Principles
- Real KPI = qualified DMs from artists and connectors, not follower count
- Viral formats must resonate with artists, not producer culture
- Placement breakdown is a fixed weekly slot ("occasionally" means never)
- MOFU is the layer with the real moat — placements + proof + full-service are things generic producers can't copy
- The personal brand thread: "the producer who runs like a business"

---

## The Problem This Tool Solves

### Problem 1: Instagram is a time trap
Uploading a reel on Instagram means opening the app. Opening the app means getting sucked into the feed. Ilan loses approximately 1 hour per day to this. Across a year that's 365 hours — over 15 full days of lost productive time. The scheduler module (module 2) eliminates this entirely by letting him post without ever opening the app.

### Problem 2: No centralized analytics
Right now, understanding what's working means manually checking Instagram insights for each reel, one at a time, with no historical view, no sorting, no way to see which formats drive the metrics that actually matter (profile visits, saves — the ICP signals). TikTok is a completely separate manual check. There's no single view showing content performance against the real goal.

### Problem 3: Hook and script writing is slow
Every reel needs a hook, a caption, and sometimes a CTA. Writing these from scratch for 11 posts a week is significant friction. A scripting module tuned to his voice removes this entirely — input the concept, get 3 hook variants and 2 caption options instantly.

### Problem 4: Trend research is passive and inconsistent
Finding viral formats to replicate currently means passively scrolling and hoping to notice something. This is unstructured, time-consuming, and produces inconsistent results. A trend research module makes this systematic and intentional.

---

## The Full Tool Vision — All Modules

This is a private, personal content management system. Not a SaaS. Not public. Built entirely for one user (@prod.ilan_). This changes everything about how it's built — no multi-tenancy, no app review, no user management complexity, no scaling concerns. Just the cleanest possible tool for one operator who posts 11 times a week and needs to run the content side of his business like a system.

The modules build on each other. Analytics informs scripting. Scripting feeds scheduling. Scheduling removes the need to open the app. The whole system compounds over time.

---

### Module 1: Analytics Dashboard ← BUILDING THIS NOW
**What it does:** Pulls Instagram data via the Graph API and presents it in a single, clean dashboard. Account-level metrics and per-reel metrics. Sortable by the signals that actually matter for the ICP (profile visits, saves) rather than just views.

**Why it's first:** Every other module is more useful with data. The analytics layer tells you which formats to replicate (trend research), which hooks work (scripting), and what's worth scheduling. It's the foundation.

**Account-level metrics:**
- Followers over time (chart, 7-day and 30-day view)
- Reach per day
- Impressions per day
- Profile visits per day
- Follower growth rate

**Per-reel metrics (sortable):**
- Views / plays
- Reach
- Saves
- Shares
- Comments
- Profile visits driven by that reel
- Watch-through rate / average watch time
- Engagement rate

**Key design principle:** The dashboard should surface profile visits and saves prominently — these are the ICP signals. A reel with 500 views and 40 profile visits is more valuable than a reel with 5000 views and 10 profile visits. The tool should make this visible at a glance.

**Cross-platform:** Instagram only for now. TikTok Business API added in a later iteration.

---

### Module 2: IG Scheduler
**What it does:** Upload a reel, write the caption, set a time, and it posts automatically. Ilan never opens the Instagram app to post.

**Why it matters:** This is the 1-hour-per-day recovery module. If every post goes through the tool, the Instagram app becomes something opened intentionally rather than by default.

**How it works technically:**
- Video uploaded to cloud storage (Cloudflare R2 or S3)
- Meta Content Publishing API schedules the post
- Reel fires at the set time without any manual action
- TikTok scheduling routed through Buffer API (simpler than building direct TikTok integration)

**Connection to analytics:** After a scheduled reel posts, the analytics module automatically starts tracking it. No manual linking — the tool knows what was posted and when.

---

### Module 3: Scripting & Hooks Generator
**What it does:** Input a concept (format type + topic + vibe), get back hook variants, caption options, and a CTA. All tuned to Ilan's voice and the specific format.

**Why it matters:** 11 posts a week means 11 hooks, 11 captions. Currently written from scratch. The scripting module turns this into a 30-second task per reel.

**How it works technically:**
- Claude API (claude-sonnet) with a system prompt deeply tuned to Ilan's voice, format library, and ICP
- Input: format (viral/yap/cookup/POV/placement), concept, target (TOFU/MOFU/BOFU)
- Output: 3 hook variants, 2 caption options, suggested CTA
- Trial reel variant: takes a performing reel and generates hook variations for A/B testing (one variable changed per variant)

**Connection to analytics:** Over time, the tool learns which hooks correlate with high profile visits and saves. Scripting suggestions improve based on real data from the analytics module.

---

### Module 4: Trending Format Finder
**What it does:** Systematically surfaces viral formats in the music/producer/artist niche that are worth replicating. Replaces passive scrolling with structured weekly research.

**Why it matters:** 4 of Ilan's 11 weekly posts are viral format replications. Currently found by chance. This module makes it intentional and data-driven.

**How it works technically:**
- TikTok Creative Center API (trend data: sounds, hashtags, top videos)
- Optional: track a curated list of adjacent creator accounts via media endpoints
- AI analysis extracts format structure, hook pattern, pacing
- Output: weekly brief of 5-8 formats worth considering, with replication notes
- Semi-automated (weekly, not real-time) — that's intentional and sufficient

**Key constraint:** Formats pulled must be filtered for ICP relevance. A format going viral in producer culture ≠ a format that will pull artists. This filter is baked into the AI analysis prompt.

---

### Future Modules (not planned in detail yet)
- **Deep AI analysis:** Pattern recognition across 90+ days of data. "Your educational yaps drive 3x more profile visits than cookups but you post 2 cookups for every 1 yap — here's the optimal mix."
- **TikTok analytics:** Mirror of the IG analytics module for TikTok.
- **YouTube analytics:** Track long-form performance once the YouTube channel is running.
- **Multi-platform view:** Single dashboard comparing same content across IG, TikTok, YouTube.
- **Client pipeline connection:** Eventually, connect content performance to the CRM. A reel that drove 5 DMs from artists surfaces in the outreach pipeline automatically.

---

## Technical Architecture

### Stack (decided, not up for debate)
- **Framework:** Next.js (App Router) — needed for API routes, OAuth callbacks, server-side fetching, and the foundation that scales to every future module
- **Database:** Supabase — stores tokens, daily metric snapshots, per-reel stats as time-series data
- **Styling:** Tailwind CSS
- **AI:** Claude API (Anthropic) for scripting module
- **Cloud storage:** Cloudflare R2 (for scheduler video uploads, future module)
- **Deployment:** Vercel

### Data Architecture Principle
This tool is time-series by nature. Every metric pulled from the API gets stored with a timestamp. This is what enables the historical charts, trend lines, and eventually the deep analysis module. Don't store just the latest value — store every daily snapshot.

### Token Management
- Access tokens last ~60 days
- Refresh logic must be built before expiry
- Token stored in Supabase (encrypted), not in code or .env in production
- A background job (Supabase Edge Function or Vercel Cron) handles daily metric pulls and token refresh

---

## Current Build Status

### Meta App Setup — DONE
- App name: Analyst
- Meta App ID: 1467023401406337
- Instagram App ID: 1706760680774024
- App mode: Development (stays in Development — private tool, no App Review needed ever)
- Facebook Page: prod.ilan_ (created fresh, owned by Ilan Fekete Facebook account)
- Instagram connected to: prod.ilan_ Facebook page
- Permissions granted: pages_show_list, pages_read_engagement, instagram_basic, instagram_manage_insights

### OAuth — DONE
- Flow: Instagram Graph API + Facebook Login for Business
- Redirect URI: http://localhost:3000/callback
- Result: Valid access token obtained (~60 day expiry)
- Do NOT redo OAuth unless token is explicitly confirmed expired

### Next.js Project — CREATED
- Project name: analyst
- Running on localhost:3000
- Callback route exists at app/callback/page.tsx

### What's NOT Done Yet
- GET /me/accounts → Page ID
- GET /PAGE_ID?fields=instagram_business_account → IG Business Account ID
- Verify account endpoint working
- Verify insights endpoint working
- Supabase project created and schema set up
- Dashboard UI built
- Token refresh logic
- Daily sync cron job

### Immediate Next Action
Run the setup API route to get Page ID and IG Business Account ID:

```typescript
// app/api/setup/route.ts
import { NextResponse } from 'next/server'

const TOKEN = 'PASTE_ACCESS_TOKEN_HERE'

export async function GET() {
  const pagesRes = await fetch(
    `https://graph.facebook.com/v25.0/me/accounts?access_token=${TOKEN}`
  )
  const pages = await pagesRes.json()
  const page = pages.data?.[0]

  const igRes = await fetch(
    `https://graph.facebook.com/v25.0/${page.id}?fields=instagram_business_account&access_token=${TOKEN}`
  )
  const igData = await igRes.json()
  const igId = igData.instagram_business_account?.id

  const accountRes = await fetch(
    `https://graph.facebook.com/v25.0/${igId}?fields=username,followers_count,media_count&access_token=${TOKEN}`
  )
  const account = await accountRes.json()

  return NextResponse.json({ page_id: page.id, ig_account_id: igId, account })
}
```

Visit http://localhost:3000/api/setup with dev server running. The JSON response gives you everything needed to start building the dashboard.

---

## What "Done" Looks Like for Module 1

A clean, dark-themed dashboard (matching the prod.ilan_ aesthetic) that shows:

1. **Overview bar** — followers, 7-day reach, 7-day profile visits, 30-day follower growth
2. **Trend charts** — followers over time, daily reach, daily profile visits (line charts, toggleable between 7/30 day)
3. **Reels table** — every reel, sortable by: profile visits (default), views, saves, shares, watch-through rate — with the reel thumbnail, caption preview, post date, and funnel stage tag (TOFU/MOFU/BOFU) visible at a glance
4. **Reel detail view** — click any reel to expand all its metrics with a mini chart showing performance over time since posting

When this is done, Ilan has a single place to understand exactly which content is pulling his ICP — and every content decision going forward is data-driven rather than gut-feel.

---

## Separate Project — CRM Tool for Producers
Do not mix this up with the analytics tool. The CRM is a completely separate codebase and project. It's being rebuilt from scratch (the original version was messy). It includes: Scout (find artists via Spotify API), Contacts pipeline (new → contacted → replied → call → closed → lost), Call Notes (AI summary), DM Generator, Follow-ups. Target user for the CRM is eventually other producers (SaaS), not just Ilan himself. Stack: React + Supabase + Gemini + Spotify API. This project is paused while the analytics tool is being built.
