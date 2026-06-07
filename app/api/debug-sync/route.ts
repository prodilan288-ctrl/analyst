import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "INSTAGRAM_ACCESS_TOKEN not set" }, { status: 500 });
  }

  const res = await fetch(
    `https://graph.facebook.com/v25.0/17841457595877898?fields=username,followers_count&access_token=${token}`,
  );
  const data = await res.json();
  return NextResponse.json({ status: res.status, data });
}
