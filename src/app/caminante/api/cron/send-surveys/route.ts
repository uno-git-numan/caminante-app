import { NextResponse } from "next/server";
import { runSurveyDispatch } from "@/lib/feedback/send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron diario (Vercel) → manda la encuesta a quienes su salida terminó hace ≥24h.
// Protegido: Vercel Cron incluye `Authorization: Bearer ${CRON_SECRET}` si la env existe.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runSurveyDispatch();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
