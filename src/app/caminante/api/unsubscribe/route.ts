// Baja de mailing. GET = link humano (página de confirmación). POST = one-click
// de Gmail/Yahoo (RFC 8058, header List-Unsubscribe-Post). Ambos ponen
// contacts.mailing_unsubscribed_at (idempotente). Verifica la firma HMAC del link.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyContact } from "@/lib/email/unsubscribe";

export const dynamic = "force-dynamic";

async function darDeBaja(contactId: string, sig: string): Promise<boolean> {
  if (!verifyContact(contactId, sig)) return false;
  try {
    const sb = createSupabaseAdminClient();
    // Solo marca si aún no está de baja (no revierte nada; las bajas son sagradas).
    await sb
      .from("contacts")
      .update({ mailing_unsubscribed_at: new Date().toISOString() })
      .eq("id", contactId)
      .is("mailing_unsubscribed_at", null);
    return true;
  } catch {
    return false;
  }
}

function pagina(ok: boolean): string {
  const msg = ok
    ? "Listo, te diste de baja. No volverás a recibir correos de novedades de Caminante. Tus comprobantes y recordatorios de un viaje que ya reservaste sí pueden llegarte."
    : "No pudimos procesar la baja con este enlace. Escríbenos a uno@numanhub.com y lo hacemos a mano.";
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Baja de correos · Caminante</title></head>
<body style="margin:0;background:#fbfbf7;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#20211c;">
<div style="max-width:520px;margin:12vh auto;padding:0 24px;text-align:center;">
<div style="font-size:12px;letter-spacing:3px;color:#776f67;text-transform:uppercase;margin-bottom:18px;">Caminante · Naturaleza en movimiento</div>
<h1 style="font-size:26px;font-weight:600;color:#3e4836;margin:0 0 14px;">${ok ? "Baja confirmada" : "Algo salió mal"}</h1>
<p style="font-size:16px;line-height:1.6;color:#3e4836;">${msg}</p>
<a href="/caminante" style="display:inline-block;margin-top:22px;color:#ff5d36;text-decoration:none;font-weight:600;">Volver a Caminante →</a>
</div></body></html>`;
}

export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("c") || "";
  const s = req.nextUrl.searchParams.get("s") || "";
  const ok = await darDeBaja(c, s);
  return new NextResponse(pagina(ok), { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function POST(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("c") || "";
  const s = req.nextUrl.searchParams.get("s") || "";
  await darDeBaja(c, s);
  // One-click: responde 200 aunque falle (no exponemos detalle al cliente de correo).
  return new NextResponse(null, { status: 200 });
}
