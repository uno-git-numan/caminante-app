import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { processInboundValue } from "@/lib/whatsapp/inbound";

export const runtime = "nodejs";

// 1 · Verificación del webhook (Meta hace un GET al configurarlo).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// 2 · Mensajes entrantes. Verifica firma (si hay app secret), procesa, responde 200.
//     Siempre 200 tras procesar: la idempotencia (wa_message_id) hace seguro el reintento,
//     y un 500 haría que Meta reintente todo el batch.
export async function POST(request: Request) {
  const raw = await request.text();

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const sig = request.headers.get("x-hub-signature-256") || "";
    const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(raw).digest("hex");
    const ok =
      sig.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    if (!ok) return new NextResponse("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(raw);
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.value) await processInboundValue(change.value);
      }
    }
  } catch {
    // Tragado a propósito: no queremos tormenta de reintentos por un payload raro.
  }
  return NextResponse.json({ received: true }, { status: 200 });
}
