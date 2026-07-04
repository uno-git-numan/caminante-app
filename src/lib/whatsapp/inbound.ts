// Procesa un "value" del webhook de WhatsApp Cloud API. Es la mitad de adelante del
// funnel y el embrión del bot: captura el inbound (contact/lead/conversation/message/
// engagement), auto-acknowledge en voz de marca dentro de la ventana de 24h, y avisa a
// Luis para que cierre en persona. Mañana: el auto-acknowledge lo reemplaza el cerebro Claude.
//
// Privacidad: conversations/messages/engagement_events NUNCA van a notion_sync_log.
// Idempotente: messages.wa_message_id (unique) hace que los reintentos del webhook no dupliquen.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContactByPhone } from "@/lib/crm/contacts";
import { sendText, whatsappConfigured } from "@/lib/whatsapp/client";
import { notifyLuis } from "@/lib/whatsapp/notify";

type WaMessage = {
  from: string; // wa_id (internacional sin +)
  id: string;
  type: string;
  text?: { body?: string };
  button?: { text?: string; payload?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
};
type WaValue = {
  contacts?: Array<{ wa_id: string; profile?: { name?: string } }>;
  messages?: WaMessage[];
  statuses?: unknown[];
};

// El wa_id de México llega como 521XXXXXXXXXX (el "1" legacy de móvil). Para ENVIAR,
// la API/lista de prueba esperan 52XXXXXXXXXX — Meta mismo mapea input 52… → wa_id 521…
// (error #131030 si respondes al 521…). Se normaliza quitando ese "1".
function replyNumber(waId: string): string {
  const digits = waId.replace(/\D/g, "");
  if (digits.startsWith("521") && digits.length === 13) {
    return `+52${digits.slice(3)}`;
  }
  return digits.startsWith("+") ? waId : `+${digits}`;
}

function messageText(m: WaMessage): string {
  if (m.text?.body) return m.text.body;
  if (m.button?.text) return m.button.text;
  if (m.interactive?.button_reply?.title) return m.interactive.button_reply.title;
  if (m.interactive?.list_reply?.title) return m.interactive.list_reply.title;
  return `[${m.type}]`;
}

// Links enviados por WhatsApp: SIEMPRE el dominio público canónico (no
// NEXT_PUBLIC_SITE_URL, que en dev/preview apunta a localhost o al preview).
const SITE = "https://caminante.numanhub.com";

export async function processInboundValue(value: WaValue): Promise<void> {
  const messages = value.messages || [];
  if (!messages.length) return; // statuses (delivered/read) u otros → ignorar

  const sb = createSupabaseAdminClient();

  for (const m of messages) {
    try {
      const e164 = m.from.startsWith("+") ? m.from : `+${m.from}`;
      const profileName = value.contacts?.find((c) => c.wa_id === m.from)?.profile?.name;
      const body = messageText(m);

      // 1 · Contact (phone-first, dedupe en cascada)
      const cRes = await findOrCreateContactByPhone(sb, {
        waPhone: e164,
        fullName: profileName,
        source: "whatsapp",
      });
      if (!cRes.ok) continue;
      const contact = cRes.contact;

      // 2 · Conversación (1 por contact+canal). Abre la ventana de 24h.
      const nowIso = new Date().toISOString();
      const { data: convo } = await sb
        .from("conversations")
        .upsert(
          { contact_id: contact.id, channel: "whatsapp", wa_phone: e164, last_inbound_at: nowIso },
          { onConflict: "contact_id,channel" },
        )
        .select("id, state")
        .single();
      if (!convo) continue;

      // 3 · Mensaje (idempotente por wa_message_id). Si ya existía → no repetir efectos.
      const { error: msgErr } = await sb.from("messages").insert({
        conversation_id: convo.id,
        direction: "in",
        wa_message_id: m.id,
        type: m.type,
        body,
      });
      if (msgErr) {
        if (msgErr.code === "23505") continue; // webhook reintentado → ya procesado
        continue;
      }

      // 4 · Señal de interés + lead
      await sb.from("engagement_events").insert({
        contact_id: contact.id,
        kind: "replied",
        weight: 5,
        meta: { body: body.slice(0, 280) },
      });
      const { data: existingLead } = await sb
        .from("leads")
        .select("id")
        .eq("contact_id", contact.id)
        .neq("status", "won")
        .neq("status", "lost")
        .maybeSingle();
      if (!existingLead) {
        await sb.from("leads").insert({
          contact_id: contact.id,
          source: "whatsapp",
          status: "engaged",
          last_engaged_at: nowIso,
        });
      } else {
        await sb.from("leads").update({ status: "engaged", last_engaged_at: nowIso }).eq("id", existingLead.id);
      }

      // 5 · Auto-acknowledge en voz de marca (dentro de la ventana de 24h → texto libre).
      //     Solo bot; si la conversación está escalada a humano, no auto-responde.
      if (convo.state !== "human" && whatsappConfigured()) {
        const nombre = profileName?.split(/\s+/)[0] || "";
        const ack =
          `Hola${nombre ? " " + nombre : ""} 🌊 Gracias por escribir a Caminante. ` +
          `Aquí puedes ver la expedición, fechas y lo que incluye: ${SITE}/caminante\n\n` +
          `Te leo personalmente y te ayudo a apartar tu lugar. ¿Te late?`;
        const sent = await sendText(replyNumber(m.from), ack);
        if (sent.ok) {
          await sb.from("messages").insert({
            conversation_id: convo.id,
            direction: "out",
            wa_message_id: sent.id,
            type: "text",
            body: ack,
          });
        }
      }

      // 6 · Avisar a Luis para cerrar en persona (no bloquea el webhook si falla).
      await notifyLuis({
        name: contact.full_name || profileName || e164,
        phone: e164,
        body,
      }).catch(() => {});
    } catch {
      // Nunca tirar el webhook por un mensaje: Meta reintentaría todo el batch.
      continue;
    }
  }
}
