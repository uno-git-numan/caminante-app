import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAllExperiences } from "@/lib/experiences/data";

export const runtime = "nodejs";

// One-time / idempotent seed: pushes the in-code experiences into Supabase.
// Dev-only guard so it can't be triggered against production.
export async function POST() {
  if (!process.env.NEXT_PUBLIC_SITE_URL?.includes("localhost")) {
    return NextResponse.json(
      { error: "Seed is only available in local development." },
      { status: 403 },
    );
  }

  const sb = createSupabaseAdminClient();
  const rows = getAllExperiences().map((e) => ({
    slug: e.slug,
    status: e.status,
    data: e,
  }));

  const { data, error } = await sb
    .from("experiences")
    .upsert(rows, { onConflict: "slug" })
    .select("slug, status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ seeded: data });
}
