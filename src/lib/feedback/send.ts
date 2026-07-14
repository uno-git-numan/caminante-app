import { randomUUID } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HOLDING_STATUSES } from "@/lib/experiences/availability";
import type { Experience } from "@/lib/experiences/types";
import { sendViaResend } from "@/lib/email/resend";
import { unsubscribeUrl } from "@/lib/email/unsubscribe";

const SITE = "https://caminante.numanhub.com";

// Marca
const CREMA = "#fbfbf7";
const LAGOON = "#3e4836";
const DUNA = "#ff5d36";
const ARENA = "#d4cec6";
const OLIVO = "#776f67";

const firstName = (full: string | null): string => {
  if (!full) return "caminante";
  const n = full.trim().split(/\s+/)[0] || "caminante";
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
};

// Versión en texto plano (multipart → mejor deliverability).
function surveyText(name: string, link: string): string {
  return `Hola, ${name}.\n\nAntes de que se te borre, cuéntanos cómo te fuiste — son dos minutos:\n${link}\n\nSi dejas unas palabras quizá las compartamos, siempre solo con tus iniciales.\n\nCaminante by NUMAN · uno@numanhub.com`;
}

// Correo brandeado con 5 estrellas clicables (cada una abre la encuesta con esa nota).
// unsubUrl (opcional) agrega el pie de "date de baja" — obligatorio en envíos en lote.
function emailHtml(name: string, token: string, unsubUrl?: string): string {
  const link = `${SITE}/caminante/feedback/${token}`;
  let stars = "";
  for (let n = 1; n <= 5; n++) {
    stars += `<a href="${link}?s=${n}" target="_blank" style="text-decoration:none;color:${DUNA};font-size:40px;line-height:1;padding:0 4px;">★</a>`;
  }
  const baja = unsubUrl
    ? `<div style="max-width:540px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${OLIVO};padding:0 8px 18px;"><a href="${unsubUrl}" style="color:${OLIVO};">Darme de baja de estos correos</a></div>`
    : "";
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;padding:0;background:${CREMA};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREMA};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border:1px solid ${ARENA};border-radius:18px;overflow:hidden;">
<tr><td style="padding:32px 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:12px;letter-spacing:3px;color:${OLIVO};text-transform:uppercase;">Caminante &middot; Naturaleza en movimiento</div></td></tr>
<tr><td style="padding:16px 36px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;color:${LAGOON};font-weight:600;">Hola, ${name}.</h1>
<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:${LAGOON};">El mar ya quedó atrás, pero algo de él se queda contigo. Antes de que la marea lo borre, cuéntanos cómo te fuiste.</p>
<p style="margin:0 0 4px;font-size:16px;line-height:1.6;color:${LAGOON};">Son <strong>dos minutos</strong>. Empieza con un toque:</p></td></tr>
<tr><td align="center" style="padding:18px 36px 6px;">${stars}</td></tr>
<tr><td align="center" style="padding:0 36px 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="font-size:13px;color:${OLIVO};">Toca las estrellas — tu encuesta abre con esa nota ya puesta.</div></td></tr>
<tr><td align="center" style="padding:18px 36px 30px;">
<a href="${link}" target="_blank" style="display:inline-block;background:${LAGOON};color:#fff;text-decoration:none;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;padding:14px 32px;border-radius:999px;">Abrir mi encuesta</a></td></tr>
<tr><td style="padding:0 36px 30px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<div style="border-top:1px solid ${ARENA};padding-top:18px;font-size:13px;line-height:1.6;color:${OLIVO};">Si dejas unas palabras, quizá las compartamos —siempre solo con tus iniciales. ¿Dudas? Responde este correo.</div></td></tr>
</table>
<div style="max-width:540px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${OLIVO};padding:18px 8px 6px;">Caminante by NUMAN &middot; uno@numanhub.com</div>
${baja}
</td></tr></table></body></html>`;
}

export type DispatchResult = {
  dueSlots: number;
  invited: number;
  skipped: number;
  errors: number;
};

// Para cada salida que terminó hace ≥24h, manda la encuesta a los asistentes
// (reservas paid/confirmed/attended) que aún no tengan invitación. Idempotente.
export async function runSurveyDispatch(now = new Date()): Promise<DispatchResult> {
  const sb = createSupabaseAdminClient();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const lowerBound = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const res: DispatchResult = { dueSlots: 0, invited: 0, skipped: 0, errors: 0 };

  // Salidas que terminaron hace ≥24h (ventana de 60 días para acotar trabajo).
  const { data: slots } = await sb
    .from("experience_slots")
    .select("id, label, experience_id, ends_at")
    .not("ends_at", "is", null)
    .lte("ends_at", cutoff)
    .gte("ends_at", lowerBound);
  if (!slots || slots.length === 0) return res;

  // Cache de experiencias (config de feedback)
  const expCache = new Map<string, { data: Experience } | null>();
  const getExp = async (id: string) => {
    if (!expCache.has(id)) {
      const { data } = await sb.from("experiences").select("data").eq("id", id).maybeSingle();
      expCache.set(id, (data as unknown as { data: Experience }) ?? null);
    }
    return expCache.get(id) ?? null;
  };

  for (const slotRaw of slots) {
    const slot = slotRaw as { id: string; experience_id: string };
    const expRow = await getExp(slot.experience_id);
    const fb = expRow?.data?.feedback;
    if (!fb?.active) continue; // experiencia sin encuesta activa
    res.dueSlots++;

    // Asistentes de la salida (reservas que apartan) + contacto
    const { data: resv } = await sb
      .from("reservations")
      .select("id, contact_id, contacts(full_name, email, mailing_unsubscribed_at)")
      .eq("slot_id", slot.id)
      .in("status", HOLDING_STATUSES);

    for (const rRaw of resv || []) {
      const r = rRaw as unknown as {
        id: string;
        contact_id: string;
        contacts: { full_name: string | null; email: string | null; mailing_unsubscribed_at: string | null } | null;
      };
      const email = r.contacts?.email;
      if (!email || r.contacts?.mailing_unsubscribed_at) {
        res.skipped++;
        continue;
      }
      // ¿ya tiene invitación? (idempotencia)
      const { data: existing } = await sb
        .from("experience_feedback")
        .select("token")
        .eq("reservation_id", r.id)
        .eq("contact_id", r.contact_id)
        .maybeSingle();
      if (existing) {
        res.skipped++;
        continue;
      }
      const token = randomUUID();
      const { error: insErr } = await sb.from("experience_feedback").insert({
        token,
        reservation_id: r.id,
        contact_id: r.contact_id,
        experience_id: slot.experience_id,
        status: "invited",
        source: "email",
        location_label: fb.locationLabel || null,
        feedback_version: fb.version || "v1",
      });
      if (insErr) {
        res.errors++;
        continue;
      }
      const loc = (fb.locationLabel || "tu experiencia").split(",")[0];
      const name = firstName(r.contacts?.full_name ?? null);
      const unsub = unsubscribeUrl(r.contact_id);
      const ok = await sendViaResend(email, `¿Cómo te fuiste de ${loc}?`, emailHtml(name, token, unsub), {
        ua: "caminante-encuesta/1.0",
        text: surveyText(name, `${SITE}/caminante/feedback/${token}`),
        listUnsubscribeUrl: unsub,
      });
      if (ok) res.invited++;
      else res.errors++;
    }
  }
  return res;
}

// Reenvía el correo de encuesta de UNA invitación pendiente (no submitted).
// Reusa el token existente (no crea otra fila). Best-effort → bool.
export async function resendSurveyEmail(feedbackId: string): Promise<boolean> {
  try {
    const sb = createSupabaseAdminClient();
    const { data: f } = await sb
      .from("experience_feedback")
      .select("token, status, contact_id, location_label")
      .eq("id", feedbackId)
      .maybeSingle();
    if (!f || f.status === "submitted" || !f.token) return false;
    const { data: c } = await sb
      .from("contacts")
      .select("full_name, email, mailing_unsubscribed_at")
      .eq("id", f.contact_id as string)
      .maybeSingle();
    const email = c?.email as string | undefined;
    if (!email) return false;
    if (c?.mailing_unsubscribed_at) return false; // respeta la baja de mailing
    const contactId = f.contact_id as string;
    const token = f.token as string;
    const link = `${SITE}/caminante/feedback/${token}`;
    const loc = ((f.location_label as string | null) || "tu experiencia").split(",")[0];
    const name = firstName((c?.full_name as string | null) ?? null);
    const unsub = unsubscribeUrl(contactId);
    return await sendViaResend(email, `¿Cómo te fuiste de ${loc}?`, emailHtml(name, token, unsub), {
      ua: "caminante-encuesta/1.0",
      text: surveyText(name, link),
      listUnsubscribeUrl: unsub,
    });
  } catch {
    return false;
  }
}
