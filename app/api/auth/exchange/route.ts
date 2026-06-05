import { NextRequest, NextResponse } from "next/server";

const APP_ID = "1467023401406337";
const REDIRECT_URI = "http://localhost:3000/callback";
const BASE = "https://graph.facebook.com/v25.0";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing ?code= parameter" }, { status: 400 });
  }

  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ error: "META_APP_SECRET not set" }, { status: 500 });
  }

  // Step 1: authorization code → short-lived user token
  const shortRes = await fetch(
    `${BASE}/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${appSecret}&code=${code}`,
  );
  const shortData = await shortRes.json();
  if (shortData.error) {
    return NextResponse.json({ error: "Short-lived token exchange failed", detail: shortData.error }, { status: 400 });
  }
  const shortToken: string = shortData.access_token;

  // Step 2: short-lived → long-lived user token (~60 days)
  const longRes = await fetch(
    `${BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`,
  );
  const longData = await longRes.json();
  if (longData.error) {
    return NextResponse.json({ error: "Long-lived token exchange failed", detail: longData.error }, { status: 400 });
  }

  return NextResponse.json({
    access_token: longData.access_token,
    expires_in_days: Math.round((longData.expires_in ?? 0) / 86400),
    token_type: longData.token_type,
    next_step: "Copy access_token into .env.local as INSTAGRAM_ACCESS_TOKEN and update the Vercel env var",
  });
}
