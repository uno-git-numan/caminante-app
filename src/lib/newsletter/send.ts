// ENVÍO DEL BOLETÍN. Patrón de feedback/send.ts: sendViaResend (reintento ante
// 429/5xx) + multipart texto + List-Unsubscribe de un clic.
//
// ⚠️ LA BAJA ES SAGRADA. Los destinatarios son SIEMPRE contacts con correo y
// `mailing_unsubscribed_at IS NULL`. Nada aquí escribe esa columna: solo la LEE
// para excluir. El link del pie es el HMAC firmado por contacto que ya usa la
// encuesta (lib/email/unsubscribe → /caminante/api/unsubscribe), que marca la
// baja sin login y JAMÁS la revierte.
//
// v1 sin cron: lo dispara Luis a mano desde el Kit, con confirmación de dos
// pasos en la UI + este módulo revalidando el conteo antes de mandar.
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendViaResend } from "@/lib/email/resend";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";
import { renderNewsletter, newsletterText, type NewsletterBody, type NewsletterTemplate } from "./templates";

export type Destinatario = { id: string; email: string; full_name: string | null };

// Suscriptores vivos: con correo y SIN baja. Fuente única de la lista.
export async function fetchDestinatarios(): Promise<Destinatario[]> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("contacts")
    .select("id, email, full_name")
    .not("email", "is", null)
    .is("mailing_unsubscribed_at", null);
  const vistos = new Set<string>();
  const out: Destinatario[] = [];
  for (const c of (data ?? []) as Destinatario[]) {
    const mail = (c.email || "").trim().toLowerCase();
    // Dedupe por correo: el CRM puede tener dos contactos con el mismo mail
    // (dedupe en cascada por teléfono) y nadie debe recibirlo dos veces.
    if (!mail.includes("@") || vistos.has(mail)) continue;
    vistos.add(mail);
    out.push({ ...c, email: mail });
  }
  return out;
}

export async function contarDestinatarios(): Promise<number> {
  return (await fetchDestinatarios()).length;
}

export type EnvioResult = { enviados: number; fallidos: number; total: number };

// Envía a UN destinatario (o a una dirección suelta, para la prueba).
async function enviarUno(
  d: Destinatario,
  template: NewsletterTemplate,
  body: NewsletterBody,
  subject: string,
  preheader: string,
): Promise<boolean> {
  const unsub = unsubscribeUrl(d.id);
  const html = renderNewsletter(template, body, preheader, d.id);
  const text = newsletterText(body, unsub);
  return sendViaResend(d.email, subject, html, {
    text,
    listUnsubscribeUrl: unsub,
    ua: "caminante-newsletter/1.0",
    // El boletín lo firma Luis (las cartas van en su voz) → se lee como correo
    // 1:1 y Gmail tiende a mandarlo a Principal en vez de Promociones.
    fromName: "Luis · Caminante",
  });
}

// PRUEBA: siempre disponible, sin confirmación, a una sola dirección. Usa un id
// de contacto real si existe (para que el link de baja del pie sea el de verdad
// y se pueda probar); si no, firma con el id genérico de prueba.
export async function enviarPrueba(
  to: string,
  template: NewsletterTemplate,
  body: NewsletterBody,
  subject: string,
  preheader: string,
): Promise<boolean> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("contacts").select("id, email, full_name").eq("email", to).limit(1);
  const contacto = (data ?? [])[0] as Destinatario | undefined;
  const d: Destinatario = contacto ?? { id: "prueba", email: to, full_name: null };
  return enviarUno(d, template, body, `[PRUEBA] ${subject}`, preheader);
}

// ENVÍO REAL en lotes. Un destinatario que falla NO tumba el envío: se cuenta y
// se sigue. Devuelve el conteo real de entregados (lo que se guarda en
// newsletters.recipients_count — no la lista completa, que sería mentira si
// hubo fallos).
export async function enviarBoletin(
  template: NewsletterTemplate,
  body: NewsletterBody,
  subject: string,
  preheader: string,
): Promise<EnvioResult> {
  const lista = await fetchDestinatarios();
  let enviados = 0;
  let fallidos = 0;
  const LOTE = 8; // sendViaResend ya reintenta ante 429; el lote acota la ráfaga
  for (let i = 0; i < lista.length; i += LOTE) {
    const lote = lista.slice(i, i + LOTE);
    const res = await Promise.allSettled(
      lote.map((d) => enviarUno(d, template, body, subject, preheader)),
    );
    for (const r of res) {
      if (r.status === "fulfilled" && r.value) enviados++;
      else fallidos++;
    }
  }
  return { enviados, fallidos, total: lista.length };
}
