import { NextResponse } from "next/server";
import { refreshExpiringTokens } from "@/lib/social/accounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Cron diario: refresca los long-lived tokens de Instagram antes de los 60 días
// (los que vencen en <10 días). Marca 'expired' si el refresh falla. Protegido
// con CRON_SECRET (igual que send-surveys).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await refreshExpiringTokens();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
