import { NextResponse } from "next/server";
import { fetchPublishedExperiences } from "@/lib/experiences/queries";
import { toCard } from "@/lib/experiences/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: returns the cards for all published experiences (landing grid + calendar).
export async function GET() {
  const experiences = (await fetchPublishedExperiences()).map(toCard);
  return NextResponse.json(
    { experiences },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } },
  );
}
