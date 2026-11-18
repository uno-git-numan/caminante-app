import { NextResponse } from "next/server";
import { revisarConfirmaciones } from "@/lib/cancelacion/cupo-servidor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron (Vercel, cada hora): la cláusula de cupo mínimo (D26 de legal, §7.5).
//  · Llegó la fecha de confirmación con el mínimo cubierto → la salida se
//    confirma sola y se avisa al grupo.
//  · Falta un día (o es hoy) y no se ha juntado → se le avisa a la casa una
//    vez, para que confirme o cancele en plazo. Después de esa fecha, cancelar
//    por falta de grupo cuesta la bonificación del 20 %.
// Cada hora y no diario: si el mínimo se junta la tarde del día límite, la
// confirmación tiene que salir ese mismo día. Inerte antes de la 0093.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await revisarConfirmaciones()) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
