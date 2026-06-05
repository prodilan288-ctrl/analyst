import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BASE = "https://graph.facebook.com/v25.0";
// /me/accounts returns empty — page is in a Meta Business Portfolio, bypass by ID
const PAGE_ID = "1203359669524673";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isLocalhost = request.headers.get("host")?.includes("localhost");

  if (!isVercelCron && !isLocalhost) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.INSTAGRAM_ACCESS_TOKEN) {
    return NextResponse.json({ error: "INSTAGRAM_ACCESS_TOKEN not set" }, { status: 500 });
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN!;
  const igId = process.env.IG_ACCOUNT_ID!;
  const errors: string[] = [];
  const today = new Date().toISOString().split("T")[0];
  const now = Math.floor(Date.now() / 1000);
  const sevenDaysAgo = now - 7 * 24 * 60 * 60;

  // Step 1: followers
  const followersRes = await fetch(
    `${BASE}/${igId}?fields=followers_count&access_token=${token}`,
  );
  const followersData = await followersRes.json();
  if (followersData.error) errors.push(`followers: ${followersData.error.message}`);
  const followers: number | null = followersData.followers_count ?? null;

  // Step 2: daily reach series — all 7 values, each has end_time for its date
  const reachRes = await fetch(
    `${BASE}/${igId}/insights?metric=reach&period=day&since=${sevenDaysAgo}&until=${now}&access_token=${token}`,
  );
  const reachData = await reachRes.json();
  if (reachData.error) errors.push(`reach: ${reachData.error.message}`);
  const reachValues: { value: number; end_time: string }[] = reachData.data?.[0]?.values ?? [];
  const todayReach = reachValues.length > 0 ? reachValues[reachValues.length - 1].value : null;

  // Step 3: profile_views + accounts_engaged (7-day rolling totals, no daily breakdown)
  const totalValueRes = await fetch(
    `${BASE}/${igId}/insights?metric=profile_views,accounts_engaged&period=day&metric_type=total_value&since=${sevenDaysAgo}&until=${now}&access_token=${token}`,
  );
  const totalValueData = await totalValueRes.json();
  if (totalValueData.error) errors.push(`total_value: ${totalValueData.error.message}`);
  const findTotal = (name: string) =>
    totalValueData.data?.find((m: { name: string }) => m.name === name)?.total_value?.value ?? null;
  const profileViews = findTotal("profile_views");
  const accountsEngaged = findTotal("accounts_engaged");

  // Also surface what was actually fetched for debugging
  const ig_debug = { followers, todayReach, profileViews, accountsEngaged, reachValueCount: reachValues.length };

  // Step 4a: backfill each day in the reach series
  // ignoreDuplicates so re-running sync never overwrites a day that already has full data
  for (const val of reachValues) {
    const date = val.end_time.split("T")[0];
    if (date === today) continue; // today handled below with full fields
    const { error } = await supabase
      .from("account_snapshots")
      .upsert({ captured_on: date, reach: val.value }, { onConflict: "captured_on", ignoreDuplicates: true });
    if (error) errors.push(`account_snapshot backfill ${date}: ${error.message}`);
  }

  // Step 4b: upsert today with all fields
  const { error: snapshotError } = await supabase
    .from("account_snapshots")
    .upsert(
      { captured_on: today, followers, reach: todayReach, profile_views: profileViews, accounts_engaged: accountsEngaged },
      { onConflict: "captured_on" },
    );
  if (snapshotError) errors.push(`account_snapshot: ${snapshotError.message}`);

  // Step 5: fetch all media, filter to VIDEO (reels)
  const mediaRes = await fetch(
    `${BASE}/${igId}/media?fields=id,caption,permalink,thumbnail_url,timestamp,media_type&limit=50&access_token=${token}`,
  );
  const mediaData = await mediaRes.json();
  if (mediaData.error) errors.push(`media: ${mediaData.error.message}`);
  const reels = (mediaData.data ?? []).filter((m: { media_type: string }) => m.media_type === "VIDEO");

  let reelsSynced = 0;

  for (const reel of reels) {
    // Step 6: upsert reel metadata
    const { data: reelRow, error: reelError } = await supabase
      .from("reels")
      .upsert(
        {
          ig_media_id: reel.id,
          caption: reel.caption ?? null,
          permalink: reel.permalink ?? null,
          thumbnail_url: reel.thumbnail_url ?? null,
          posted_at: reel.timestamp ?? null,
        },
        { onConflict: "ig_media_id" },
      )
      .select("id")
      .single();

    if (reelError) {
      errors.push(`reel upsert ${reel.id}: ${reelError.message}`);
      continue;
    }

    // Step 7: fetch reel insights
    const insightsRes = await fetch(
      `${BASE}/${reel.id}/insights?metric=views,reach,saved,shares,comments,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time&access_token=${token}`,
    );
    const insightsData = await insightsRes.json();

    if (insightsData.error) {
      errors.push(`reel insights ${reel.id}: ${insightsData.error.message}`);
      continue;
    }

    const metric = (name: string) =>
      insightsData.data?.find((m: { name: string }) => m.name === name)?.values?.[0]?.value ?? null;

    // Step 8: upsert reel snapshot
    const { error: snapError } = await supabase
      .from("reel_snapshots")
      .upsert(
        {
          reel_id: reelRow.id,
          captured_on: today,
          views: metric("views"),
          reach: metric("reach"),
          saved: metric("saved"),
          shares: metric("shares"),
          comments: metric("comments"),
          total_interactions: metric("total_interactions"),
          avg_watch_time: metric("ig_reels_avg_watch_time"),
          total_watch_time: metric("ig_reels_video_view_total_time"),
        },
        { onConflict: "reel_id,captured_on" },
      );

    if (snapError) {
      errors.push(`reel_snapshot ${reel.id}: ${snapError.message}`);
    } else {
      reelsSynced++;
    }
  }

  return NextResponse.json({
    account_snapshot: snapshotError ? "error" : "ok",
    reels_synced: reelsSynced,
    ig_debug,
    errors,
  });
}
