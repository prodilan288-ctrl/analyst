---
name: project-analyst-overview
description: prod.ilan_ analytics dashboard — full build status, stack, what's done, what's next
metadata:
  type: project
---

Private content analytics dashboard for @prod.ilan_ (Instagram music producer). Not SaaS. One user.

**Why:** Instagram is a time trap (1hr/day lost opening app), no centralized analytics, no single view of what drives qualified DMs.

**Stack:** Next.js 16 (App Router), Supabase, Tailwind CSS 4, Anthropic API (claude-haiku-4-5), Vercel. Repo: prodilan288-ctrl/analyst. Deployed: analyst-flame.vercel.app.

**Database tables:** account_snapshots, reel_snapshots, reels, insights_cache. All in Supabase project exkpsrrtexxhosfbmjyb.

## Module 1: Analytics Dashboard — BUILT ✅

### What's working
- `/api/sync` — pulls Instagram Graph API data (followers, reach, profile_views, accounts_engaged, reel metrics). Cron at 9am UTC via vercel.json. Auth: `Authorization: Bearer {CRON_SECRET}` header.
- `account_snapshots` — daily account-level metrics. Only today's row gets full fields; past days get reach backfill only (by design).
- `reel_snapshots` — per-reel daily metrics (views, reach, saved, shares, comments, avg_watch_time, total_watch_time).
- `reels` — reel metadata (ig_media_id, caption, permalink, thumbnail_url, posted_at, format, funnel_stage).
- Dashboard page: stat cards (followers, 7-day reach, profile views, accounts engaged), reach chart, InsightsPanel, ReelsTable.
- ReelsTable: sortable columns, inline format/funnel_stage tag editing (PATCH /api/reels/[id]/tag), amber highlight on Saved column (ICP signal).
- InsightsPanel: AI-generated outliers + patterns + recommendation, 24-hour cache in insights_cache table, enriched with real caption/thumbnail/permalink from reels table.
- Design: dark theme (#111111 bg), amber accents on ICP cards and saved column, funnel stage colour tags (teal/violet/amber), sticky table header.

### Key env vars (in .env.local + Vercel)
- INSTAGRAM_ACCESS_TOKEN — ~60 day expiry. Generated 2026-06-05. Next refresh needed ~2026-08-04.
- IG_ACCOUNT_ID=17841457595877898
- NEXT_PUBLIC_PAGE_ID=1203359669524673
- SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- CRON_SECRET
- ANTHROPIC_API_KEY
- META_APP_SECRET

### Recent bugs fixed (2026-06-05 to 2026-06-09)
- Gemini → Anthropic migration (claude-haiku-4-5, zodOutputFormat structured output)
- Garbled AI reason fields: validation + retry logic added, system prompt tightened
- Caption_preview: now overwritten post-AI with real DB caption (80 chars)
- Cache: DELETE before INSERT so stale results never block fresh ones
- Reel filter: was `media_type === "VIDEO"`, broadened to `media_product_type === "REELS" || media_type === "VIDEO"` (future-proof against Meta reclassifying)
- Thumbnail: Instagram CDN URLs expire — img has onError fallback to dark placeholder with play icon
- insights_cache: table created in Supabase, 24h TTL working

## Modules 2–4: NOT BUILT YET
- Module 2: IG Scheduler (post without opening app)
- Module 3: Scripting & Hooks Generator (Claude API)
- Module 4: Trending Format Finder (TikTok Creative Center API)

**How:** Why: Instagram is a time trap. **How to apply:** Don't start building scheduler/scripting/trending until Ilan says so. Focus is Module 1 polish and data quality.
