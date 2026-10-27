import { NextResponse } from "next/server";
import { correrRecordatoriosDelGrupo } from "@/lib/grupo/recordatorios";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron diario (Vercel, 15:00 UTC = 9am CDMX): los avisos uno a uno del espacio
// del grupo. «Faltan 3 días» a quien entró y no ha apartado; «se abrió un
// lugar» al primero de la lista de espera; y a la operadora, «no se juntó el
// mínimo» el día después de la fecha límite. Ver lib/grupo/recordatorios.ts.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await correrRecordatoriosDelGrupo();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
