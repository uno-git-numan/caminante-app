// CRON · reporte semanal de redes al admin (lunes por la mañana).
import { NextResponse } from "next/server";
import { enviarReporteSemanal } from "@/lib/notifications/reporte-semanal";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const res = await enviarReporteSemanal();
  return NextResponse.json(res, { status: res.ok ? 200 : 500 });
}
