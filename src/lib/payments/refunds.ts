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
import { emailReembolso } from "@/lib/payments/email-reembolso";

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

  // ── ¿Este reembolso salió del botón del panel? ────────────────────────────
  //
  // La reserva NO se cancela sola cuando el reembolso se hizo por fuera (a mano
  // en Stripe): eso puede ser un ajuste, y cancelar libera cupo y rompe el
  // roster. Pero cuando salió de Caminante, la intención ya está escrita en
  // `reembolsos` (migración 0056) y aquí se ejecuta: cancelar, liberar el lugar
  // y avisarle a la persona. Ese es el orden — el aviso va DETRÁS del dinero.
  await cerrarReembolsoDelPanel(sb, pago.id as string);

  return { handled: true, reembolsoTotal: total, paymentId: pago.id as string };
}

/**
 * Cierra la fila del libro y hace lo que se prometió al apretar el botón.
 *
 * Es idempotente por diseño: Stripe reintenta los webhooks, y este mismo evento
 * puede llegar dos veces. `estado='confirmado'` corta la segunda pasada, y
 * `correo_enviado_at` corta la del correo por separado — si la cancelación
 * funcionó y el correo falló, el reintento manda solo el correo.
 *
 * Nada de esto puede tirar el webhook: el dinero YA se devolvió. Un fallo aquí
 * se registra y se ve en el panel, no se propaga.
 */
async function cerrarReembolsoDelPanel(sb: SupabaseClient, paymentId: string): Promise<void> {
  try {
    const { data: reem } = await sb
      .from("reembolsos")
      .select("id, reservation_id, monto_mxn, origen, cancela_reserva, estado, correo_enviado_at")
      .eq("payment_id", paymentId)
      .in("estado", ["solicitado", "confirmado"])
      .maybeSingle();
    if (!reem) return; // reembolso hecho por fuera: no se toca la reserva

    if (reem.estado !== "confirmado") {
      await sb
        .from("reembolsos")
        .update({ estado: "confirmado", confirmado_at: new Date().toISOString() })
        .eq("id", reem.id);
    }

    const reservationId = reem.reservation_id as string | null;
    if (!reservationId) return;

    // Datos para el correo ANTES de cancelar: da igual el orden para la base,
    // pero leerlos juntos evita una reserva cancelada de la que ya no se sabe a
    // quién avisarle si algo falla en medio.
    const { data: resv } = await sb
      .from("reservations")
      .select("id, status, contact_id, experience_id, slot_id")
      .eq("id", reservationId)
      .maybeSingle();

    if (reem.cancela_reserva && resv && resv.status !== "cancelled") {
      // Aquí se libera el lugar: `cancelled` no está en HOLDING_STATUSES, así
      // que el cupo público y el panel vuelven a contar ese espacio solos.
      const { error: errCancel } = await sb
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);
      if (errCancel) {
        console.error("finalizeRefund/cancelar:", errCancel.message);
        return; // sin cancelación no se manda el correo: diría algo que no pasó
      }
    }

    if (reem.correo_enviado_at || !resv) return;

    const [{ data: contacto }, { data: exp }, { data: slot }] = await Promise.all([
      sb.from("contacts").select("email, full_name").eq("id", resv.contact_id).maybeSingle(),
      sb.from("experiences").select("data").eq("id", resv.experience_id).maybeSingle(),
      resv.slot_id
        ? sb.from("experience_slots").select("label").eq("id", resv.slot_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    const correo = (contacto as { email: string | null } | null)?.email;
    if (!correo) return;

    const d = (exp?.data ?? {}) as { title?: string; titleAccent?: string; docTitle?: string };
    const titulo =
      [d.title, d.titleAccent].filter(Boolean).join(" ").trim() || d.docTitle || "tu experiencia";

    const enviado = await emailReembolso({
      to: correo,
      nombre: (contacto as { full_name: string | null } | null)?.full_name ?? null,
      experiencia: titulo,
      salida: ((slot as { label: string | null } | null)?.label ?? "") || "",
      monto: Number(reem.monto_mxn || 0),
      cancelada: reem.origen === "salida",
    });
    if (enviado) {
      await sb
        .from("reembolsos")
        .update({ correo_enviado_at: new Date().toISOString() })
        .eq("id", reem.id);
    }
  } catch (e) {
    // El dinero ya volvió. Que el cierre falle no puede reventar el webhook.
    console.error("finalizeRefund/cerrar:", (e as Error).message);
  }
}
