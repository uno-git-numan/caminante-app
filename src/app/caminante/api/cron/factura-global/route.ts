import { NextResponse } from "next/server";
import { facturasGlobalesPendientes } from "@/lib/facturacion/global";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Cron (Vercel, TODOS los días a las 13:00 UTC = 7:00 CDMX): la factura global
// a público en general de cada mes cerrado con pagos sin facturar, una por
// emisor (la casa y cada operadora con su facturación activa). El día 1 sale la
// del mes que acaba de cerrar, fechada el último día de ese mes (el SAT deja
// hasta 72 h atrás). Los demás días casi nunca hay nada: si aparece un pago de
// un mes ya facturado —capturado tarde— sale una global complementaria de ese
// mes (D21), y si la corrida del día 1 falló, ésta la recoge. Idempotente por
// emisor, mes y número de complementaria.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const resultados = await facturasGlobalesPendientes();
    return NextResponse.json({ ok: resultados.every((r) => r.ok), resultados });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
