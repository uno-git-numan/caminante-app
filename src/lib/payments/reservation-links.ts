// El LINK DE PAGO de una reserva (cobro por persona, enviado por WhatsApp).
//
// Hasta el 3 nov 2026 era un Stripe Payment Link: la persona llegaba a Stripe
// sin contexto y al pagar se perdía, sin saber cómo volver a firmar el deslinde.
// Ahora el link es una página de Caminante, /caminante/pago/<token>
// (reservations.pago_token, 0074): explica qué se paga, manda a Stripe al tocar
// «Pagar» (pagina-pago.ts crea la Checkout Session con la metadata
// {reservation_id, contact_id, slot_id…}) y vuelve a la pantalla de éxito con
// «Firmar mi deslinde». El webhook es el de siempre (finalize-reservation.ts).
//
// Reusable: lo llaman el action de cobro del admin HOY y el bot de WhatsApp
// MAÑANA. Recibe el client service-role como parámetro (no crea el suyo).

import type { SupabaseClient } from "@supabase/supabase-js";
import { nuevoPagoToken, urlDePago } from "@/lib/payments/pago-token";
import type { Experience } from "@/lib/experiences/types";

export type ReservationLinkResult =
  | { ok: true; url: string; amountMxn: number; reused: boolean }
  | { ok: false; error: string };

// "$16,000" | "16,000 MXN" | "16000" → 16000. Devuelve null si no hay número válido.
export function parseMxnAmount(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

type ReservationRow = {
  id: string;
  experience_id: string;
  slot_id: string | null;
  contact_id: string;
  num_people: number;
  status: string;
  total_amount_mxn: number | null;
  amount_due_mxn: number | null;
  payment_link_url: string | null;
  pago_token: string | null;
};

// Crea (o reusa) el link de pago de una reserva. `reuseExisting` evita generar un
// link nuevo cada vez (Stripe acumula links): si ya hay uno guardado, lo devuelve.
export async function createReservationPaymentLink(
  sb: SupabaseClient,
  reservationId: string,
  opts: { reuseExisting?: boolean } = {},
): Promise<ReservationLinkResult> {
  const reuseExisting = opts.reuseExisting !== false; // default true

  const { data: resv } = await sb
    .from("reservations")
    .select(
      "id, experience_id, slot_id, contact_id, num_people, status, total_amount_mxn, amount_due_mxn, payment_link_url, pago_token",
    )
    .eq("id", reservationId)
    .maybeSingle();

  const reservation = resv as ReservationRow | null;
  if (!reservation) return { ok: false, error: "Reserva no encontrada." };
  if (reservation.status === "cancelled") {
    return { ok: false, error: "La reserva está cancelada." };
  }
  if (reuseExisting && reservation.pago_token) {
    return {
      ok: true,
      url: urlDePago(reservation.pago_token),
      amountMxn: Number(reservation.amount_due_mxn ?? reservation.total_amount_mxn ?? 0),
      reused: true,
    };
  }

  // Precio por persona: el del slot manda; si el slot no tiene (null), el base de la experiencia.
  const { data: expRow } = await sb
    .from("experiences")
    .select("slug, data")
    .eq("id", reservation.experience_id)
    .maybeSingle();
  const experience = (expRow?.data as Experience | undefined) ?? undefined;
  if (!experience) return { ok: false, error: "Experiencia no encontrada." };

  let perPerson: number | null = null;
  if (reservation.slot_id) {
    const { data: slot } = await sb
      .from("experience_slots")
      .select("price_mxn")
      .eq("id", reservation.slot_id)
      .maybeSingle();
    if (slot?.price_mxn != null) perPerson = Number(slot.price_mxn);
  }
  if (perPerson == null) perPerson = parseMxnAmount(experience.price?.amount);
  if (perPerson == null || perPerson <= 0) {
    return {
      ok: false,
      error: "La experiencia no tiene precio definido. Define el precio (o el del slot) antes de cobrar.",
    };
  }

  const numPeople = Math.max(1, reservation.num_people || 1);
  const amountMxn = perPerson * numPeople;

  // La página de pago: el token se acuña una vez y se conserva. Monto
  // congelado en la reserva: es lo que pagina-pago.ts cobra al tocar «Pagar».
  const token = reservation.pago_token || nuevoPagoToken();
  const url = urlDePago(token);
  try {
    const patch: Record<string, unknown> = {
      pago_token: token,
      payment_link_url: url,
      payment_link_id: null,
      amount_due_mxn: amountMxn,
    };
    if (!reservation.total_amount_mxn || Number(reservation.total_amount_mxn) === 0) {
      patch.total_amount_mxn = amountMxn;
    }
    const { error: upErr } = await sb.from("reservations").update(patch).eq("id", reservation.id);
    if (upErr) return { ok: false, error: upErr.message };

    // Cola de sync a Notion — SOLO comercial (Pipeline: link enviado / monto).
    await sb.from("notion_sync_log").insert({
      entity: "reservation",
      entity_id: reservation.id,
      action: "payment_link_sent",
      status: "pending",
      payload: {
        contact_id: reservation.contact_id,
        experience_slug: experience.slug,
        amount_due_mxn: amountMxn,
        num_people: numPeople,
        payment_link_url: url,
      },
    });

    return { ok: true, url, amountMxn, reused: false };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
