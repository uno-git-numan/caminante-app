"use server";

// EL BOTÓN DE REEMBOLSO — devolver dinero desde Caminante, sin abrir Stripe.
//
// Dos caminos, misma mecánica:
//   · Una persona se baja  → `reembolsarPersona`
//   · Se cae la salida     → `cancelarSalidaYReembolsar` (todos + cerrar la fecha)
//
// ⚠️ EL ORDEN IMPORTA Y NO ES CAPRICHO. Aquí NO se cancela la reserva ni se
// manda el correo: solo se apunta la intención en `reembolsos` y se le pide a
// Stripe la devolución. Cancelar y avisar ocurre cuando Stripe CONFIRMA, en el
// webhook (`finalizeRefund`). Si se hiciera al revés, un refund rechazado
// —tarjeta expirada, disputa abierta, saldo insuficiente— dejaría a la persona
// con un correo que dice «te devolvimos tu dinero» y un lugar liberado que
// nadie devolvió. El aviso tiene que ir detrás del dinero, no delante.
//
// ⚠️ SOLO LA CASA. El dinero sale de la cuenta de NUMAN HUB, no de la del
// operador. Un operador puede ver su salida y perseguir firmas; devolver
// dinero es de quien lo recibió.

import { revalidatePath } from "next/cache";
import { alcanceActual, esOperador } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripeServerClient, toStripeAmount } from "@/lib/payments/stripe";

export type ResultadoReembolso =
  | { ok: true; reembolsados: number; monto: number; avisos: string[] }
  | { ok: false; error: string };

type PagoVivo = {
  id: string;
  reservation_id: string | null;
  amount_mxn: number;
  provider_ref: string | null;
  method: string | null;
};

/**
 * Los pagos que TODAVÍA se pueden devolver de estas reservas.
 *
 * Filtra por `status='paid'` (un reembolsado no se reembolsa otra vez) y exige
 * `provider_ref`: sin el PaymentIntent no hay nada que pedirle a Stripe. Los
 * cobros por transferencia entran aquí sin `provider_ref` a propósito — se
 * devuelven por el banco, y decirlo es mejor que fallar en silencio.
 */
async function pagosDe(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  reservationIds: string[],
): Promise<PagoVivo[]> {
  if (!reservationIds.length) return [];
  const { data } = await sb
    .from("payments")
    .select("id, reservation_id, amount_mxn, provider_ref, method, status")
    .in("reservation_id", reservationIds)
    .eq("status", "paid");
  return ((data ?? []) as (PagoVivo & { status: string })[]).map((p) => ({
    id: p.id,
    reservation_id: p.reservation_id,
    amount_mxn: Number(p.amount_mxn || 0),
    provider_ref: p.provider_ref,
    method: p.method,
  }));
}

/** Pide a Stripe la devolución y deja la fila del libro. Devuelve el aviso si algo no se pudo. */
async function devolver(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  pago: PagoVivo,
  ctx: { slotId: string | null; motivo: string; origen: "persona" | "salida"; quien: string | null },
): Promise<{ monto: number; aviso: string | null }> {
  if (pago.amount_mxn <= 0) return { monto: 0, aviso: null };
  if (!pago.provider_ref || pago.method !== "stripe") {
    return {
      monto: 0,
      aviso: `Un cobro de $${pago.amount_mxn.toLocaleString("es-MX")} no pasó por Stripe (${pago.method ?? "sin método"}): devuélvelo por el banco.`,
    };
  }

  // La fila va ANTES del cargo a Stripe. Si el proceso se muere justo después
  // de devolver el dinero, el libro ya sabe que se pidió; al revés, el dinero
  // se habría ido sin dejar rastro.
  const { data: fila, error: errFila } = await sb
    .from("reembolsos")
    .insert({
      payment_id: pago.id,
      reservation_id: pago.reservation_id,
      slot_id: ctx.slotId,
      monto_mxn: pago.amount_mxn,
      motivo: ctx.motivo || null,
      origen: ctx.origen,
      cancela_reserva: true,
      solicitado_por: ctx.quien,
    })
    .select("id")
    .single();
  if (errFila) {
    // 23505 = el índice parcial `reembolsos_un_vivo_por_pago`: ya hay uno vivo.
    const yaHay = errFila.code === "23505";
    return {
      monto: 0,
      aviso: yaHay
        ? "Ese pago ya tiene un reembolso en curso. No se pidió otro."
        : `No se pudo abrir el reembolso: ${errFila.message}`,
    };
  }

  try {
    const stripe = getStripeServerClient();
    const refund = await stripe.refunds.create({
      payment_intent: pago.provider_ref,
      amount: toStripeAmount(pago.amount_mxn),
      metadata: { origen: "caminante", reembolso_id: fila.id as string },
    });
    await sb.from("reembolsos").update({ stripe_refund_id: refund.id }).eq("id", fila.id);
    return { monto: pago.amount_mxn, aviso: null };
  } catch (e) {
    // El reembolso queda 'fallido' Y CON EL MOTIVO. Así el libro dice por qué
    // esa persona no recibió su dinero, en vez de callarse.
    await sb
      .from("reembolsos")
      .update({ estado: "fallido", error: (e as Error).message })
      .eq("id", fila.id);
    return { monto: 0, aviso: `Stripe rechazó la devolución: ${(e as Error).message}` };
  }
}

async function quienEsLaCasa(): Promise<{ ok: true; quien: string | null } | { ok: false; error: string }> {
  const alcance = await alcanceActual();
  if (!alcance) return { ok: false, error: "No autorizado. Inicia sesión." };
  if (esOperador(alcance)) {
    return { ok: false, error: "Los reembolsos los hace Caminante: el dinero sale de su cuenta." };
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return { ok: true, quien: data.user?.id ?? null };
}

/** UNA persona se baja: se le devuelve lo que pagó y su lugar vuelve a la venta. */
export async function reembolsarPersona(
  reservationId: string,
  motivo: string,
): Promise<ResultadoReembolso> {
  const auth = await quienEsLaCasa();
  if (!auth.ok) return { ok: false, error: auth.error };

  const sb = createSupabaseAdminClient();
  const { data: resv } = await sb
    .from("reservations")
    .select("id, slot_id, status")
    .eq("id", reservationId)
    .maybeSingle();
  if (!resv) return { ok: false, error: "No se encontró esa reserva." };
  if (resv.status === "cancelled") return { ok: false, error: "Esa reserva ya está cancelada." };

  const pagos = await pagosDe(sb, [reservationId]);
  if (!pagos.length) {
    return { ok: false, error: "Esa reserva no tiene ningún pago vivo que devolver." };
  }

  const avisos: string[] = [];
  let monto = 0;
  let n = 0;
  for (const p of pagos) {
    const r = await devolver(sb, p, {
      slotId: (resv.slot_id as string | null) ?? null,
      motivo,
      origen: "persona",
      quien: auth.quien,
    });
    if (r.aviso) avisos.push(r.aviso);
    if (r.monto > 0) { monto += r.monto; n += 1; }
  }

  revalidatePath("/caminante/admin/salidas");
  return { ok: true, reembolsados: n, monto, avisos };
}

/**
 * SE CAE LA SALIDA: se le devuelve a todos y la fecha se cierra.
 *
 * La fecha se marca `cancelled` de UNA vez, aunque un reembolso concreto haya
 * fallado: si el viaje no va, no puede seguir vendiéndose mientras se resuelve
 * a mano el cobro que no volvió. Los que fallaron salen en los avisos.
 */
export async function cancelarSalidaYReembolsar(
  slotId: string,
  motivo: string,
): Promise<ResultadoReembolso> {
  const auth = await quienEsLaCasa();
  if (!auth.ok) return { ok: false, error: auth.error };

  const sb = createSupabaseAdminClient();
  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, status")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot) return { ok: false, error: "No se encontró esa salida." };

  const { data: resvsRaw } = await sb
    .from("reservations")
    .select("id, status")
    .eq("slot_id", slotId)
    .neq("status", "cancelled");
  const reservationIds = ((resvsRaw ?? []) as { id: string }[]).map((r) => r.id);
  const pagos = await pagosDe(sb, reservationIds);

  const avisos: string[] = [];
  let monto = 0;
  let n = 0;
  for (const p of pagos) {
    const r = await devolver(sb, p, { slotId, motivo, origen: "salida", quien: auth.quien });
    if (r.aviso) avisos.push(r.aviso);
    if (r.monto > 0) { monto += r.monto; n += 1; }
  }

  // Cerrar la fecha. Va después de pedir las devoluciones para no cancelar una
  // salida cuyos reembolsos ni siquiera se intentaron.
  const { error: errSlot } = await sb
    .from("experience_slots")
    .update({ status: "cancelled" })
    .eq("id", slotId);
  if (errSlot) avisos.push(`La fecha NO se pudo cerrar: ${errSlot.message}`);

  // Las reservas sin pago que devolver se cancelan aquí: nadie va a viajar y
  // esperar un webhook que nunca va a llegar las dejaría colgadas en el roster.
  const conPago = new Set(pagos.map((p) => p.reservation_id));
  const sinPago = reservationIds.filter((id) => !conPago.has(id));
  if (sinPago.length) {
    await sb.from("reservations").update({ status: "cancelled" }).in("id", sinPago);
  }

  revalidatePath("/caminante/admin/salidas");
  return { ok: true, reembolsados: n, monto, avisos };
}
