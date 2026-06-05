import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";

const PROMPT = `You are an analytics assistant for a music producer's Instagram content strategy.
The producer's goal is qualified DMs from serious artists — not follower count or raw views.
The real ICP signals are saves and watch time.
Analyze the reel performance data and return JSON only, no markdown, no backticks, no prose:
{
  "outliers": [{ "ig_media_id": "string", "caption_preview": "string", "reason": "string" }],
  "patterns": ["string"],
  "recommendation": "string"
}
outliers: max 3 reels significantly above average saves or watch time.
patterns: max 3 observations about what content performs best for this account.
recommendation: one concrete action to take this week.`;

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  // Latest snapshot date
  const { data: latestDateRow } = await supabase
    .from("reel_snapshots")
    .select("captured_on")
    .order("captured_on", { ascending: false })
    .limit(1)
    .single();

  if (!latestDateRow) {
    return NextResponse.json({ error: "No reel snapshots found" }, { status: 404 });
  }

  // All reel snapshots for that date joined with reel metadata
  const { data: rows, error } = await supabase
    .from("reel_snapshots")
    .select("views, reach, saved, shares, comments, avg_watch_time, reels!inner(ig_media_id, caption, format, funnel_stage)")
    .eq("captured_on", latestDateRow.captured_on);

  if (error || !rows?.length) {
    return NextResponse.json({ error: error?.message ?? "No data" }, { status: 500 });
  }

  // Build compact data payload for Gemini
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

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(
    `${PROMPT}\n\nReel data:\n${JSON.stringify(reelData, null, 2)}`,
  );
  const raw = result.response.text().trim();

  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Failed to parse Gemini response", raw }, { status: 500 });
  }
}
