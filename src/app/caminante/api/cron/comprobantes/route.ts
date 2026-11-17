import { NextResponse } from "next/server";
import { mandarComprobantesPendientes } from "@/lib/facturacion/comprobantes";
import { documentarDevolucionesPendientes } from "@/lib/facturacion/devoluciones";
import { bajasPorTerminacion } from "@/lib/facturacion/portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron (Vercel, cada hora): manda el COMPROBANTE de cada pago cobrado que aún
// no lo tenga (nuestro correo, con el folio y la llamada a facturar antes de
// fin de mes). Desacoplado del webhook a propósito: el cobro nunca espera a
// nadie. Inerte sin la llave Y sin FACTURACION_CLIENTES=1, y nunca sobre un
// cobro anterior al corte (lib/facturacion/corte.ts). Se llamaba `recibos`
// cuando el comprobante era un recibo de Facturapi (hasta el 17 nov 2026).
//
// Y dos redes:
//  · D19: el egreso de una devolución que `finalizeRefund` no alcanzó a timbrar
//    al momento se reintenta aquí.
//  · D20: una operadora dada de baja deja de facturar y su CSD se da de baja en
//    Facturapi.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const bajas = await bajasPorTerminacion();
    const devoluciones = await documentarDevolucionesPendientes(25);
    const r = await mandarComprobantesPendientes(25);
    return NextResponse.json({ ok: true, ...r, devoluciones, bajas });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
