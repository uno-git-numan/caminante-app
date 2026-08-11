import { NextResponse } from "next/server";
import { cerrarSalidasVencidas } from "@/lib/experiences/cerrar-vencidas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron diario (Vercel): cierra las salidas cuyo día ya pasó. Ver el porqué en
// `lib/experiences/cerrar-vencidas.ts`. Protegido con CRON_SECRET, igual que
// los demás. Corre a las 14:00 UTC (8am CDMX), antes que todos los otros, para
// que ninguno trabaje sobre salidas que ya no deberían estar abiertas.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await cerrarSalidasVencidas()) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
