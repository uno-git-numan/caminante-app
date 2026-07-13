import { NextResponse } from "next/server";
import { fetchPublishedExperienceRows, fetchPublishedExperiences } from "@/lib/experiences/queries";
import { fetchExperienceRatings } from "@/lib/experiences/ratings";
import { toCard } from "@/lib/experiences/card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public: returns the cards for all published experiences (landing grid + calendar),
// cada una con su satisfacción REAL (rating) derivada de la encuesta. Sin encuestas
// → rating null → la UI muestra "Experiencia nueva".
export async function GET() {
  const rows = await fetchPublishedExperienceRows();
  if (rows.length) {
    const ratings = await fetchExperienceRatings();
    const experiences = rows.map((r) => ({
      ...toCard(r.data),
      rating: ratings.get(r.id) ?? null,
    }));
    return NextResponse.json(
      { experiences },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } },
    );
  }
  // Fallback (sin BD): tarjetas del seed, sin rating.
  const experiences = (await fetchPublishedExperiences()).map((e) => ({ ...toCard(e), rating: null }));
  return NextResponse.json(
    { experiences },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=30" } },
  );
}
