import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ig_media_id: string }> },
) {
  const { ig_media_id } = await params;
  const body = await req.json();

  const update: Record<string, string | null> = {};
  if ("format" in body) update.format = body.format ?? null;
  if ("funnel_stage" in body) update.funnel_stage = body.funnel_stage ?? null;

  const { data, error } = await supabase
    .from("reels")
    .update(update)
    .eq("ig_media_id", ig_media_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
