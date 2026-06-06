import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const InsightsSchema = z.object({
  outliers: z.array(
    z.object({
      ig_media_id: z.string(),
      caption_preview: z.string(),
      reason: z.string(),
    }),
  ),
  patterns: z.array(z.string()),
  recommendation: z.string(),
});

const SYSTEM = `You are an analytics assistant for prod.ilan_ — an 18-year-old music producer from Slovakia with real placements (Hunxho, Stunna Gambino, Nelly NLMB, GMTO Bizzy, Multiszn). He offers full-service production: exclusive beats + mix/master + cover art + branding + rollout. Target clients are serious artists with budgets. Not beat leasing. High-ticket.

CONTENT SYSTEM — 11 posts/week, IG + TikTok:
TOFU (get found): 4x viral format replications (must resonate with ARTISTS not producer culture), 1x POV lifestyle (always fresh footage), 2x cookup reels
MOFU (build trust): 1x yap hot take, 1x yap story time (Slovakia → US placements arc), 1x yap educational (teaches artists NOT producers), 1x placement breakdown (split into parts: melody/drums/key choice/before-after/story — 1 placement = 5 reels)
BOFU (convert): YouTube long-form, problem → story → solution

REAL KPI: Qualified DMs from serious artists and connectors. NOT follower count. NOT views.

ICP SIGNALS IN ORDER OF IMPORTANCE:
1. Saves — artist bookmarking for later = serious interest
2. Watch time — content held attention = message landed
3. Comments with artist intent (collab mentions, genre-specific responses)
4. Profile visits from a reel — means they want to know more

WHAT CONVERTS ARTISTS (prioritize these in analysis):
- Placement proof content (MOFU) — this is the real moat
- Collabs with named producers/artists in captions
- Genre-specific CTAs that filter for serious artists — BUT avoid 'comment X if you feel this' style CTAs as these attract broke artists looking for free beats, not buyers. Better CTAs direct to DM or ask about their project/budget.
- Story time content (Slovakia → US arc builds rare trust)
- Educational content aimed at artists (not producers)

WHAT DOES NOT CONVERT (deprioritize):
- Raw view counts — wrong audience watches too
- Generic motivational content — grows followers not clients
- Producer culture content — attracts producers not artists
- Cookups alone — build shallow trust only, not proof

STANDING RULES:
- No free beat CTAs ever on this account
- POV lifestyle always fresh footage
- Placement breakdown is a fixed weekly slot (not occasional)
- Trial reels test viral formats on non-followers before feed
- Bio leads with placements: Hunxho, Stunna Gambino, Nelly NLMB

IMPORTANT CONTEXT: The historical reels in the database were posted BEFORE this content strategy was implemented. Do not judge old content against these rules. Instead, identify which old reels accidentally followed these principles and performed well — those are the most valuable signals.

IMPORTANT: The reason field for each outlier must be a clean, human-readable sentence explaining why this reel is a top performer. Example: 'Highest saves (10) with strong watch time — direct collab CTA with named producer signals serious artist interest.' Never output raw numbers, CSV data, or structured data in the reason field.`;

const USER_PROMPT = `Analyze this reel performance data and return insights:
- outliers: max 3 reels that show the strongest ICP signals based on the criteria above
- patterns: max 3 observations about what content accidentally worked before the strategy, and what that tells us to double down on now
- recommendation: one concrete content action to take THIS WEEK based on what the data shows works for attracting serious artists

Reel data:`;

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  const { data: latestDateRow } = await supabase
    .from("reel_snapshots")
    .select("captured_on")
    .order("captured_on", { ascending: false })
    .limit(1)
    .single();

  if (!latestDateRow) {
    return NextResponse.json({ error: "No reel snapshots found" }, { status: 404 });
  }

  const { data: rows, error } = await supabase
    .from("reel_snapshots")
    .select("views, reach, saved, shares, comments, avg_watch_time, reels!inner(ig_media_id, caption, posted_at, format, funnel_stage)")
    .eq("captured_on", latestDateRow.captured_on)
    .order("saved", { ascending: false })
    .limit(30);

  if (error || !rows?.length) {
    return NextResponse.json({ error: error?.message ?? "No data" }, { status: 500 });
  }

  const reelData = rows.map((r) => {
    const meta = r.reels as unknown as { ig_media_id: string; caption: string | null; posted_at: string | null; format: string | null; funnel_stage: string | null };
    return {
      ig_media_id: meta.ig_media_id,
      caption: (meta.caption ?? "").slice(0, 80),
      posted_at: meta.posted_at?.split("T")[0] ?? null,
      views: r.views,
      reach: r.reach,
      saved: r.saved,
      shares: r.shares,
      comments: r.comments,
      avg_watch_time: r.avg_watch_time,
      format: meta.format,
      funnel_stage: meta.funnel_stage,
    };
  });

  // Return cached insights if generated within the last 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("insights_cache")
    .select("payload, generated_at")
    .gte("generated_at", cutoff)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (cached) {
    console.log("Cache hit - returning cached insights");
    console.log("generated_at:", cached.generated_at);
    return NextResponse.json(cached.payload);
  }

  console.log("Cache miss - calling API");

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.parse({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `${USER_PROMPT}\n${JSON.stringify(reelData, null, 2)}`,
        },
      ],
      output_config: {
        format: zodOutputFormat(InsightsSchema),
      },
    });

    console.log("Model:", response.model);
    console.log("Input tokens:", response.usage.input_tokens);
    console.log("Output tokens:", response.usage.output_tokens);
    console.log("Stop reason:", response.stop_reason);

    if (!response.parsed_output) {
      return NextResponse.json({ error: "No structured output returned" }, { status: 500 });
    }

    // Validate reason fields — flag garbled output (CSV-like: 3+ commas, or mostly numeric)
    const isGarbled = (s: string) =>
      (s.match(/,/g) ?? []).length >= 3 || /^[\d\s,\.]+$/.test(s.trim());

    const garbledReasons = response.parsed_output.outliers.filter((o) => isGarbled(o.reason));

    let parsed = response.parsed_output;

    if (garbledReasons.length > 0) {
      console.warn(`Garbled reason fields detected (${garbledReasons.length}), retrying with stricter prompt`);

      const retry = await client.messages.parse({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `${USER_PROMPT}\n${JSON.stringify(reelData, null, 2)}`,
          },
          {
            role: "assistant",
            content: JSON.stringify(response.parsed_output),
          },
          {
            role: "user",
            content: "The reason fields for some outliers contain raw data instead of human-readable explanations. Rewrite every reason field as a clear sentence describing why the reel is a top performer, referencing the actual metrics (saves, watch time, comments). No numbers-only output, no CSV, no structured data.",
          },
        ],
        output_config: {
          format: zodOutputFormat(InsightsSchema),
        },
      });

      if (retry.parsed_output) {
        const stillGarbled = retry.parsed_output.outliers.filter((o) => isGarbled(o.reason));
        if (stillGarbled.length > 0) {
          console.warn("Retry still produced garbled reasons — caching anyway");
        } else {
          console.log("Retry produced clean reasons");
          parsed = retry.parsed_output;
        }
      }
    }

    // Enrich outliers with caption, thumbnail_url, and permalink from the reels table
    const mediaIds = parsed.outliers.map((o) => o.ig_media_id);
    const { data: reelMeta } = await supabase
      .from("reels")
      .select("ig_media_id, caption, thumbnail_url, permalink")
      .in("ig_media_id", mediaIds);

    const metaMap = Object.fromEntries(
      (reelMeta ?? []).map((r) => [r.ig_media_id, r]),
    );

    const enrichedPayload = {
      ...parsed,
      outliers: parsed.outliers.map((o) => ({
        ...o,
        caption_preview: (metaMap[o.ig_media_id]?.caption ?? o.caption_preview ?? "").slice(0, 80),
        thumbnail_url: metaMap[o.ig_media_id]?.thumbnail_url ?? null,
        permalink: metaMap[o.ig_media_id]?.permalink ?? null,
      })),
    };

    await supabase.from("insights_cache").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("insights_cache")
      .insert({ generated_at: new Date().toISOString(), payload: enrichedPayload });

    return NextResponse.json(enrichedPayload);
  } catch (e) {
    const errObj = e as Record<string, unknown>;
    const detail = {
      message: e instanceof Error ? e.message : String(e),
      status: errObj?.status,
      error: errObj?.error,
      stack: e instanceof Error ? e.stack : undefined,
    };
    console.error("Anthropic error:", JSON.stringify(detail, null, 2));
    return NextResponse.json(
      { error: "Anthropic request failed", detail },
      { status: 500 },
    );
  }
}
