---
name: project-sync-route
description: /api/sync — Instagram Graph API sync, cron schedule, what was debugged, known behaviour
metadata:
  type: project
---

Route: `app/api/sync/route.ts`. Cron: 9am UTC daily via `vercel.json`.

## Auth
Requires `Authorization: Bearer {CRON_SECRET}` header. Localhost requests bypass this. Manual trigger: `curl http://localhost:3000/api/sync -H "Authorization: Bearer {CRON_SECRET}"`.

## What it does (in order)
1. Fetch followers_count from `/{igId}?fields=followers_count`
2. Fetch daily reach series (7 days) from `/{igId}/insights?metric=reach&period=day`
3. Fetch profile_views + accounts_engaged (7-day rolling) from `/{igId}/insights?metric=profile_views,accounts_engaged&period=day&metric_type=total_value`
4. Backfill reach for each past day (ignoreDuplicates — never overwrites past data)
5. Upsert today's account_snapshot with all fields (followers, reach, profile_views, accounts_engaged)
6. Fetch media (limit 50): `/{igId}/media?fields=id,caption,permalink,thumbnail_url,timestamp,media_type`
7. Filter: `media_product_type === "REELS" || media_type === "VIDEO"` (broadened 2026-06-09 — was VIDEO only)
8. For each reel: upsert reels metadata, fetch per-reel insights, upsert reel_snapshot for today

## Reel insights metrics fetched
views, reach, saved, shares, comments, total_interactions, ig_reels_avg_watch_time, ig_reels_video_view_total_time

## Known behaviour
- account_snapshots: only today's row gets full fields. Past days in the reach series get only reach (by design — the API only returns 7-day rolling totals for profile_views/accounts_engaged, not per-day history).
- upsert for reel_snapshots uses onConflict: "reel_id,captured_on" — safe to re-run same day.
- Returns: { account_snapshot, reels_synced, ig_debug, errors[] }

## Debugging history (2026-06-09)
Token was valid (confirmed via /api/debug-sync). Data appeared frozen but was actually just the cron not having run yet that day. Sync confirmed working: reels_synced: 50, errors: []. The media_type filter was broadened as hygiene even though VIDEO was already matching all posts.

## Token expiry
INSTAGRAM_ACCESS_TOKEN lasts ~60 days. Generated ~2026-06-05. Needs refresh ~2026-08-04. Refresh flow is at /api/auth/exchange. **Why:** Token in .env.local and Vercel env vars must be updated before expiry or sync silently stops.
