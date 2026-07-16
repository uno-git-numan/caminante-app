import { NextResponse } from "next/server";
import { runCupoAlert } from "@/lib/kit/cupo-alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron diario (Vercel) → P7 «Cupo honesto» automática: detecta salidas públicas
// que se están agotando (cupo restante ≤ umbral) y avisa a Luis/Roberta para
// publicar la story del kit. Protegido con CRON_SECRET (igual que send-surveys).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runCupoAlert();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
