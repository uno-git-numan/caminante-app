// Finaliza el pago de una RESERVA (experiencia-directa, esquema 0007).
//
// ⚠️ NO confundir con finalize.ts (finalizeSucceededPaymentIntent): ese opera sobre
// el esquema marketplace DORMIDO (trips/bookings, nunca aplicado a esta base). Este
// camino opera sobre contacts → reservations → payments y es el bueno para el cobro
// por persona vía Stripe Payment Link. Se dispara con checkout.session.completed.
//
// Idempotente por payments.provider_ref (unique) — Stripe reintenta el webhook y el
// usuario puede pagar/cerrar varias veces; solo se registra un pago por PaymentIntent.

import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fromStripeAmount } from "@/lib/payments/stripe";

export type FinalizeReservationResult = {
  handled: boolean; // false = el evento no es de una reserva (sin metadata.reservation_id)
  paymentRecorded: boolean;
  reservationId?: string;
  status?: string;
};

// Avanza estados; nunca retrocede (ventas manda en lo manual; 'completed' no se toca).
const RANK: Record<string, number> = {
  requested: 0,
  confirmed: 1,
  partially_paid: 2,
  paid: 3,
  completed: 4,
  cancelled: 99,
};

export async function finalizeReservationCheckout(
  session: Stripe.Checkout.Session,
  client?: SupabaseClient,
): Promise<FinalizeReservationResult> {
  const reservationId = session.metadata?.reservation_id;
  if (!reservationId) return { handled: false, paymentRecorded: false };

  const sb = client ?? createSupabaseAdminClient();

  const providerRef =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? session.id);

  // Idempotencia: ¿ya registramos este PaymentIntent?
  const { data: existing } = await sb
    .from("payments")
    .select("id")
    .eq("provider_ref", providerRef)
    .maybeSingle();
  if (existing) {
    return { handled: true, paymentRecorded: false, reservationId };
  }

  const amountPaid = fromStripeAmount(session.amount_total ?? 0);
  if (amountPaid <= 0) {
    return { handled: true, paymentRecorded: false, reservationId };
  }

  const { data: resv } = await sb
    .from("reservations")
    .select("id, contact_id, status, total_amount_mxn, amount_due_mxn")
    .eq("id", reservationId)
    .maybeSingle();
  if (!resv) {
    // Metadata apunta a una reserva inexistente — no reventar el webhook.
    return { handled: true, paymentRecorded: false, reservationId };
  }

  const contactId = (session.metadata?.contact_id as string) || resv.contact_id;

  // Registrar el abono.
  const { error: payErr } = await sb.from("payments").insert({
    reservation_id: reservationId,
    contact_id: contactId,
    amount_mxn: amountPaid,
    status: "paid",
    method: "stripe",
    provider_ref: providerRef,
    paid_at: new Date().toISOString(),
  });
  if (payErr && payErr.code !== "23505") {
    // 23505 = carrera contra otro webhook: el otro lo registró, seguimos como éxito.
    throw new Error(`No se pudo registrar el pago: ${payErr.message}`);
  }
  const paymentRecorded = !payErr;

  // Recalcular estado: Σ pagos 'paid' vs target (amount_due → total → lo pagado).
  const { data: paidRows } = await sb
    .from("payments")
    .select("amount_mxn")
    .eq("reservation_id", reservationId)
    .eq("status", "paid");
  const sumPaid = (paidRows ?? []).reduce((acc, r) => acc + Number(r.amount_mxn || 0), 0);
  const target = Number(resv.amount_due_mxn ?? resv.total_amount_mxn ?? amountPaid);
  const computed = sumPaid >= target && target > 0 ? "paid" : "partially_paid";

  // Solo avanzar (nunca retroceder ni tocar completed/cancelled).
  const current = (resv.status as string) || "requested";
  let finalStatus = current;
  if ((RANK[computed] ?? 0) > (RANK[current] ?? 0)) {
    finalStatus = computed;
    await sb.from("reservations").update({ status: computed }).eq("id", reservationId);
  }

  // Cola de sync a Notion — SOLO comercial (Pipeline: Paid / Payment Amount / Method).
  await sb.from("notion_sync_log").insert({
    entity: "payment",
    entity_id: reservationId,
    action: "paid",
    status: "pending",
    payload: {
      reservation_id: reservationId,
      contact_id: contactId,
      amount_mxn: amountPaid,
      sum_paid_mxn: sumPaid,
      reservation_status: finalStatus,
      method: "stripe",
      provider_ref: providerRef,
      paid_at: new Date().toISOString(),
    },
  });

  return { handled: true, paymentRecorded, reservationId, status: finalStatus };
}
