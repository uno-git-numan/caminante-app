import { NextResponse } from "next/server";
import { fetchPublicAvailability } from "@/lib/experiences/availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Público: disponibilidad EN VIVO por experiencia/salida (cupo + lugares disponibles).
// Sin cache — el cupo se va cerrando en tiempo real. Solo agregados, cero PII.
export async function GET() {
  try {
    const experiences = await fetchPublicAvailability();
    return NextResponse.json(
      { experiences },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ experiences: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
