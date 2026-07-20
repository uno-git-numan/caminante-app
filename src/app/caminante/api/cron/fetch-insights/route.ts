// CRON · refresca las métricas de IG de lo ya publicado (playbook §8).
// Corre a diario, después del cron de publicar. Es de SOLO LECTURA sobre la
// cola: no puede afectar lo que se publica.
import { NextResponse } from "next/server";
import { refreshInsights } from "@/lib/social/insights";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const res = await refreshInsights();
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
