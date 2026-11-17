import { NextResponse } from "next/server";
import { crearRecibosPendientes } from "@/lib/facturacion/recibos";
import { documentarDevolucionesPendientes } from "@/lib/facturacion/devoluciones";
import { bajasPorTerminacion } from "@/lib/facturacion/portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron (Vercel, cada hora): emite el RECIBO de cada pago cobrado que aún no lo
// tenga y manda el comprobante. Desacoplado del webhook a propósito: el cobro
// nunca espera a Facturapi. Inerte sin la llave Y sin FACTURACION_CLIENTES=1, y
// nunca sobre un cobro anterior al corte (lib/facturacion/corte.ts).
//
// Y la RED de las devoluciones (D19): lo que `finalizeRefund` no alcanzó a
// documentar al momento —recibo por cancelar o reexpedir, egreso por timbrar—
// se reintenta aquí. Primero las devoluciones: un recibo nuevo de un pago ya
// devuelto saldría por lo neto de todos modos, pero el orden deja la base al día.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    // D20: una operadora dada de baja deja de facturar y su CSD se da de baja en Facturapi.
    const bajas = await bajasPorTerminacion();
    const devoluciones = await documentarDevolucionesPendientes(25);
    const r = await crearRecibosPendientes(25);
    return NextResponse.json({ ok: true, ...r, devoluciones, bajas });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
