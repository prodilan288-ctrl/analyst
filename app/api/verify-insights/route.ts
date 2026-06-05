import { NextResponse } from "next/server";

const BASE = "https://graph.facebook.com/v25.0";

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const igId = process.env.IG_ACCOUNT_ID;

  if (!token || !igId) {
    return NextResponse.json({ error: "INSTAGRAM_ACCESS_TOKEN or IG_ACCOUNT_ID not set" }, { status: 500 });
  }

  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - 7 * 24 * 60 * 60;

  // 1a. Reach — period=day, no metric_type
  const reachRes = await fetch(
    `${BASE}/${igId}/insights?metric=reach&period=day&since=${sevenDaysAgo}&until=${now}&access_token=${token}`,
  );
  const reachInsights = await reachRes.json();

  // 1b. Profile views + accounts engaged — require metric_type=total_value
  const totalValueRes = await fetch(
    `${BASE}/${igId}/insights?metric=profile_views,accounts_engaged&period=day&metric_type=total_value&since=${sevenDaysAgo}&until=${now}&access_token=${token}`,
  );
  const totalValueInsights = await totalValueRes.json();

  // 2. First reel's insights — fetch media list then hit the first item
  const mediaRes = await fetch(
    `${BASE}/${igId}/media?fields=id,media_type,media_product_type,timestamp&limit=1&access_token=${token}`,
  );
  const mediaData = await mediaRes.json();
  const firstMedia = mediaData.data?.[0];

  let reelInsights = null;
  if (firstMedia) {
    const reelInsightsRes = await fetch(
      `${BASE}/${firstMedia.id}/insights?metric=views,reach,saved,shares,comments,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time&access_token=${token}`,
    );
    reelInsights = await reelInsightsRes.json();
  }

  return NextResponse.json({
    account_insights_reach: reachInsights,
    account_insights_total_value: totalValueInsights,
    first_media: firstMedia ?? null,
    reel_insights: reelInsights,
  });
}
