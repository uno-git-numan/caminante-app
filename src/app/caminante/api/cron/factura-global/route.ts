import { NextResponse } from "next/server";
import { facturasGlobalesDelMesAnterior } from "@/lib/facturacion/global";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Cron (Vercel, día 1 a las 13:00 UTC = 7am CDMX): la factura global a público
// en general del mes anterior, una por emisor (la casa y cada operadora con su
// organización en Facturapi). Dentro de las 72 h que marca el SAT. Idempotente:
// un emisor con global ya hecha para ese periodo se salta.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const resultados = await facturasGlobalesDelMesAnterior();
    return NextResponse.json({ ok: resultados.every((r) => r.ok), resultados });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
