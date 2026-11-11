import { NextResponse } from "next/server";
import { emitirRetencionesDelMes, puedeEmitir } from "@/lib/fiscal/emitir-retenciones";
import { mesCdmx } from "@/lib/fiscal/reporte-retenciones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Cron (Vercel, día 2 a las 16:00 UTC = 10am CDMX): el CFDI de retenciones del
// mes anterior a cada operadora con ventas (LISR 113-C II: a más tardar el día
// 5). Idempotente: quien ya tiene el suyo timbrado se salta. Con los candados
// cerrados (sin llave de Facturapi o sin claves de catálogo confirmadas) no
// hace nada y lo dice.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const puede = puedeEmitir();
  if (!puede.ok) return NextResponse.json({ ok: true, emitidos: 0, aviso: puede.porque });
  const [y, m] = mesCdmx(new Date()).split("-").map(Number);
  const mes = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  try {
    const r = await emitirRetencionesDelMes(mes);
    return NextResponse.json({ ok: r.every((x) => x.resultado.ok), mes, resultados: r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
