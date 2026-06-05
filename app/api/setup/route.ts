import { NextResponse } from "next/server";

const BASE = "https://graph.facebook.com/v25.0";

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "INSTAGRAM_ACCESS_TOKEN not set" }, { status: 500 });
  }

  // /me/accounts returns empty because this page is in a Meta Business Portfolio —
  // pages inside a portfolio are not visible via that endpoint.
  const PAGE_ID = "1203359669524673";

  // Step 2: get IG business account id from page
  const pageRes = await fetch(
    `${BASE}/${PAGE_ID}?fields=name,instagram_business_account&access_token=${token}`,
  );
  const pageData = await pageRes.json();
  const igId = pageData.instagram_business_account?.id;

  if (!igId) {
    return NextResponse.json({
      error: "No instagram_business_account on page",
      raw: pageData,
    });
  }

  // Step 3: verify IG account
  const igRes = await fetch(
    `${BASE}/${igId}?fields=username,followers_count,media_count&access_token=${token}`,
  );
  const igData = await igRes.json();

  return NextResponse.json({
    page: { id: PAGE_ID, name: pageData.name },
    ig_account_id: igId,
    account: igData,
  });
}
