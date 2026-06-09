---
name: project-insights-api
description: /api/insights route — Anthropic integration, caching, enrichment, prompt, known quirks
metadata:
  type: project
---

Route: `app/api/insights/route.ts`. Client component: `app/components/InsightsPanel.tsx`.

## Flow
1. Fetch latest snapshot date from reel_snapshots
2. Fetch top 30 reels by saved desc (with caption, posted_at, format, funnel_stage) for that date
3. Check insights_cache for row with generated_at within last 24h — if found, return payload directly
4. Call Anthropic claude-haiku-4-5 via messages.parse() with zodOutputFormat (structured output)
5. Validate reason fields — if garbled (3+ commas or mostly numeric), retry once with stricter prompt
6. Enrich outliers: fetch caption, thumbnail_url, permalink from reels table by ig_media_id — OVERWRITE AI's caption_preview with real DB caption (80 chars)
7. DELETE all insights_cache rows, INSERT new row with enriched payload
8. Return enriched payload

## Schema (Zod)
outliers: [{ig_media_id, caption_preview, reason}] — thumbnail_url and permalink added post-AI in enrichment step
patterns: [string]
recommendation: string

## Prompt context
System prompt includes full content strategy, ICP signals, what converts vs doesn't, standing rules, historical data context note. See route.ts for full text — it's long and intentional.

## Caching
Table: insights_cache (id uuid, generated_at timestamptz, payload jsonb). 24h TTL. DELETE-before-INSERT pattern so only one row ever exists.
**Must run CREATE TABLE if table doesn't exist yet on a fresh Supabase project.**

## Known quirks
- claude-haiku-4-5 sometimes outputs garbled CSV-like data in reason fields. Retry logic handles this.
- Instagram CDN thumbnail_url expires. Frontend has onError fallback to dark placeholder with play icon.
- zodOutputFormat takes one argument (no name param) — `zodOutputFormat(InsightsSchema)`.
- Structured output via messages.parse() — response.parsed_output is the typed result.

## Token cost
~5,138 input / ~800 output per call at claude-haiku-4-5 pricing (~$0.009/call). Cache makes most calls free.

## Logs
console.log on cache hit (with generated_at), cache miss, and after API: model, input_tokens, output_tokens, stop_reason. Full error detail (status, message, error body) logged on catch.
