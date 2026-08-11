// Reembolsos: marcar en `payments` lo que Stripe devolvió.
//
// Hasta hoy NINGÚN código escribía `status='refunded'`, pero el panel sí sumaba
// esas filas → el KPI «reembolsos del mes» estaba estructuralmente en $0 y no
// por buenas noticias. Un cobro reembolsado seguía contando como ingreso y como
// bruto del operador, o sea que se le habría pagado comisión sobre dinero
// devuelto.
//
// Módulo APARTE a propósito: el camino crítico del webhook es cobrar, y esto no
// debe poder tirarlo.

import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fromStripeAmount } from "@/lib/payments/stripe";

export type RefundResult = {
  handled: boolean; // false = el cargo no corresponde a ningún pago nuestro
  reembolsoTotal?: boolean;
  paymentId?: string;
};

/**
 * `charge.refunded` — Stripe manda el cargo COMPLETO con `amount_refunded`
 * acumulado, no solo la devolución de este evento.
 *
 * Se localiza el pago por `provider_ref` (= PaymentIntent id), que es la misma
 * llave con la que se registró el cobro.
 */
export async function finalizeRefund(
  charge: Stripe.Charge,
  client?: SupabaseClient,
): Promise<RefundResult> {
  const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!intentId) return { handled: false };

  const sb = client ?? createSupabaseAdminClient();
  const { data: pago } = await sb
    .from("payments")
    .select("id, amount_mxn, status, reservation_id")
    .eq("provider_ref", intentId)
    .maybeSingle();
  if (!pago) return { handled: false };

  const devuelto = fromStripeAmount(charge.amount_refunded || 0);
  const cobrado = Number(pago.amount_mxn || 0);
  // Un reembolso parcial NO es un pago reembolsado: el dinero que se quedó
  // sigue siendo ingreso. Se marca 'refunded' solo cuando volvió todo.
  const total = devuelto >= cobrado - 0.01;

  // ⚠️ `payments.status` tiene un CHECK que solo acepta
  // pending | paid | failed | refunded (0007_crm_experience_direct.sql:122).
  // Un reembolso PARCIAL no cabe ahí todavía: escribir otro valor reventaría el
  // update y el reembolso se perdería sin dejar rastro. Hasta que la migración
  // agregue `refunded_mxn`, el parcial NO cambia el status —que sería mentira en
  // los dos sentidos— y se reporta para que un humano lo concilie.
  if (!total) {
    console.warn(
      `finalizeRefund: reembolso PARCIAL de ${devuelto} sobre ${cobrado} (pago ${pago.id}). ` +
        "No se puede representar todavía: el pago sigue como 'paid'. Concíliese a mano.",
    );
    return { handled: true, reembolsoTotal: false, paymentId: pago.id as string };
  }

  const { error } = await sb.from("payments").update({ status: "refunded" }).eq("id", pago.id);
  if (error) {
    console.error("finalizeRefund:", error.message);
    return { handled: false };
  }

  // La reserva NO se cancela sola: un reembolso puede ser un ajuste, y cancelar
  // libera cupo y rompe el roster. Esa decisión la toma un humano en el panel.
  return { handled: true, reembolsoTotal: total, paymentId: pago.id as string };
}
