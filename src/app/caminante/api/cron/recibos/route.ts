import { NextResponse } from "next/server";
import { crearRecibosPendientes } from "@/lib/facturacion/recibos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron (Vercel, cada hora): emite el RECIBO de cada pago cobrado que aún no lo
// tenga y manda el comprobante. Desacoplado del webhook a propósito: el cobro
// nunca espera a Facturapi. Inerte sin FACTURAPI_SECRET_KEY.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await crearRecibosPendientes(25);
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
