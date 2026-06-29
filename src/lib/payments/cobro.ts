"use server";

// Cobro por-persona desde el admin: dado una experiencia + el correo del prospecto,
// arma (o reusa) su reserva y devuelve el Stripe Payment Link listo para pegar en
// WhatsApp. Es el "primer win" usable HOY, sin esperar a la automatización de WhatsApp.
//
// Reusa la misma cascada de dedupe de contacts y el mismo creador de links que usará
// el bot mañana (createReservationPaymentLink) — una sola fuente de verdad.

import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact, normalizePhoneMX } from "@/lib/crm/contacts";
import { createReservationPaymentLink } from "@/lib/payments/reservation-links";

export type CobroInput = {
  slug: string;
  email: string;
  fullName?: string;
  phone?: string;
  numPeople?: number;
  slotId?: string | null;
};

export type CobroResult =
  | { ok: true; url: string; amountMxn: number; reservationId: string; reused: boolean }
  | { ok: false; error: string };

export async function generarCobro(input: CobroInput): Promise<CobroResult> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "No autorizado. Inicia sesión como admin." };
  }

  const slug = (input.slug || "").trim();
  const email = (input.email || "").trim().toLowerCase();
  if (!slug) return { ok: false, error: "Falta la experiencia (slug)." };
  if (!email.includes("@")) return { ok: false, error: "Escribe un correo válido del cliente." };
  if (input.phone && !normalizePhoneMX(input.phone)) {
    return { ok: false, error: "El WhatsApp no parece válido (10 dígitos)." };
  }
  const numPeople = Math.max(1, Math.floor(input.numPeople || 1));

  const sb = createSupabaseAdminClient();

  // 1 · Experiencia publicada
  const { data: expRow } = await sb
    .from("experiences")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!expRow) return { ok: false, error: "No encuentro esa experiencia publicada." };
  const experienceId = expRow.id as string;

  // 2 · Slot (opcional) — validar que pertenece a la experiencia
  let slotId: string | null = null;
  if (input.slotId) {
    const { data: slot } = await sb
      .from("experience_slots")
      .select("id")
      .eq("id", input.slotId)
      .eq("experience_id", experienceId)
      .maybeSingle();
    if (!slot) return { ok: false, error: "Esa salida no es de esta experiencia." };
    slotId = slot.id as string;
  }

  // 3 · Contact (dedupe en cascada; source = whatsapp para "How they found us")
  const contactRes = await findOrCreateContact(sb, {
    email,
    fullName: input.fullName,
    phone: input.phone,
    source: `cobro whatsapp · ${slug}`,
  });
  if (!contactRes.ok) return { ok: false, error: contactRes.error };
  const contact = contactRes.contact;

  // 4 · Reserva: reusar la activa (no-cancelada) o crear una nueva (canal whatsapp).
  //     No toca seats_taken — el cupo se consume al REGISTRARSE, no al generar el link.
  let reservationId: string;
  let q = sb
    .from("reservations")
    .select("id, num_people")
    .eq("contact_id", contact.id)
    .eq("experience_id", experienceId)
    .neq("status", "cancelled");
  q = slotId ? q.eq("slot_id", slotId) : q.is("slot_id", null);
  const { data: existing } = await q.maybeSingle();

  if (existing) {
    reservationId = existing.id as string;
    // Ajustar num_people si cambió (re-cotización) — no retrocede status.
    if ((existing.num_people as number) !== numPeople) {
      await sb.from("reservations").update({ num_people: numPeople }).eq("id", reservationId);
    }
  } else {
    const { data: created, error: resErr } = await sb
      .from("reservations")
      .insert({
        experience_id: experienceId,
        slot_id: slotId,
        contact_id: contact.id,
        num_people: numPeople,
        status: "requested",
        channel: "whatsapp",
      })
      .select("id")
      .single();
    if (resErr) return { ok: false, error: resErr.message };
    reservationId = created.id as string;
  }

  // 5 · Link de pago (reusa si ya existe uno para esta reserva)
  const link = await createReservationPaymentLink(sb, reservationId);
  if (!link.ok) return { ok: false, error: link.error };

  return {
    ok: true,
    url: link.url,
    amountMxn: link.amountMxn,
    reservationId,
    reused: link.reused,
  };
}
