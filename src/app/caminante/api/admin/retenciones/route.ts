// La descarga del reporte mensual de retenciones (CSV) para Marisol.
//
// Sólo la casa: trae CURP y CLABE completas, que la informativa del SAT pide
// (LIVA 18-J III) y ninguna otra pantalla enseña. Un route handler y no una
// server action porque lo que sale es un archivo.
//
//   ?mes=2026-11                 → un renglón por operadora (informativa, entero)
//   ?mes=2026-11&detalle=1       → venta por venta (para conciliar con Stripe)
//   ?mes=2026-11&formato=txt     → la carga masiva de la informativa del SAT
//                                  (PTEv2: «|», UTF-8, sin encabezado; legal §2.1)
import { NextResponse } from "next/server";
import { getCurrentRole } from "@/lib/auth/authorization";
import { MES_VALIDO, reporteRetenciones } from "@/lib/fiscal/reporte-retenciones-server";
import { csvDelDetalle, csvDelReporte, txtInformativa } from "@/lib/fiscal/reporte-retenciones";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if ((await getCurrentRole()) !== "admin") return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const url = new URL(req.url);
  const mes = url.searchParams.get("mes") ?? "";
  if (!MES_VALIDO.test(mes)) return NextResponse.json({ error: "Mes inválido (AAAA-MM)." }, { status: 400 });
  const detalle = url.searchParams.get("detalle") === "1";
  const rep = await reporteRetenciones(mes);
  if (url.searchParams.get("formato") === "txt") {
    const { txt } = txtInformativa(rep);
    return new NextResponse(txt, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="informativa-plataformas-${mes}.txt"`,
        "Cache-Control": "no-store",
      },
    });
  }
  const csv = detalle ? csvDelDetalle(rep, rep.nombres) : csvDelReporte(rep);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="retenciones-${mes}${detalle ? "-detalle" : ""}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
