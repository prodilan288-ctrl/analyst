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

const SYSTEM = `You are an analytics assistant for a music producer's Instagram content strategy.
The producer's goal is qualified DMs from serious artists — not follower count or raw views.
The real ICP signals are saves and watch time.`;

const USER_PROMPT = `Analyze this reel performance data and return insights:
- outliers: max 3 reels significantly above average saves or watch time
- patterns: max 3 observations about what content performs best
- recommendation: one concrete action to take this week

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
    .select("views, reach, saved, shares, comments, avg_watch_time, reels!inner(ig_media_id, caption, format, funnel_stage)")
    .eq("captured_on", latestDateRow.captured_on);

  if (error || !rows?.length) {
    return NextResponse.json({ error: error?.message ?? "No data" }, { status: 500 });
  }

  const reelData = rows.map((r) => {
    const meta = r.reels as unknown as { ig_media_id: string; caption: string | null; format: string | null; funnel_stage: string | null };
    return {
      ig_media_id: meta.ig_media_id,
      caption_preview: (meta.caption ?? "").slice(0, 80),
      format: meta.format,
      funnel_stage: meta.funnel_stage,
      views: r.views,
      reach: r.reach,
      saved: r.saved,
      shares: r.shares,
      comments: r.comments,
      avg_watch_time_s: r.avg_watch_time != null ? Math.round(r.avg_watch_time / 1000) : null,
    };
  });

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
        format: zodOutputFormat(InsightsSchema, "insights"),
      },
    });

    if (!response.parsed_output) {
      return NextResponse.json({ error: "No structured output returned" }, { status: 500 });
    }

    return NextResponse.json(response.parsed_output);
  } catch (e) {
    return NextResponse.json(
      { error: "Anthropic request failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
