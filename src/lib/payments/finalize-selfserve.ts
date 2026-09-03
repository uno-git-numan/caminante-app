// Finaliza un pago SELF-SERVE de la web (canal "web"): a diferencia de
// finalize-reservation.ts (que espera una reserva YA creada por el admin, con
// metadata.reservation_id), aquí NO hay reserva previa — el visitante pagó directo.
// Creamos contacto (dedupe por correo) + reserva PAGADA + pago, atribuida al operador
// con la comisión congelada (snapshot). Se dispara en checkout.session.completed
// cuando la metadata trae self_serve="1".
//
// Idempotente por payments.provider_ref (unique). NO depende de 0014/0015.

import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fromStripeAmount } from "@/lib/payments/stripe";
import { findOrCreateContact } from "@/lib/crm/contacts";
import { notifyNuevaReserva } from "@/lib/notifications/notify-admin";
import { capiPurchase } from "@/lib/meta/capi";
import { notifyConfirmacionCompra } from "@/lib/notifications/notify-customer";

export type FinalizeSelfServeResult = {
  handled: boolean; // false = no es una sesión self-serve (sin metadata.self_serve)
  paymentRecorded: boolean;
  reservationId?: string;
};

export async function finalizeSelfServeCheckout(
  session: Stripe.Checkout.Session,
  client?: SupabaseClient,
): Promise<FinalizeSelfServeResult> {
  if (session.metadata?.self_serve !== "1") {
    return { handled: false, paymentRecorded: false };
  }

  const sb = client ?? createSupabaseAdminClient();

  const providerRef =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? session.id);

  // Idempotencia: ¿ya registramos este pago?
  const { data: existing } = await sb
    .from("payments")
    .select("id")
    .eq("provider_ref", providerRef)
    .maybeSingle();
  if (existing) return { handled: true, paymentRecorded: false };

  const amountPaid = fromStripeAmount(session.amount_total ?? 0);
  if (amountPaid <= 0) return { handled: true, paymentRecorded: false };

  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const fullName = session.customer_details?.name ?? null;
  const phone = session.customer_details?.phone ?? null;
  if (!email) return { handled: true, paymentRecorded: false }; // sin correo no hay contacto

  const experienceId = session.metadata?.experience_id ?? "";
  const slotId = session.metadata?.slot_id || null;
  const experienceSlug = session.metadata?.experience_slug ?? "";
  const numPeople = Math.max(1, parseInt(session.metadata?.num_people ?? "1", 10) || 1);
  const operatorId = session.metadata?.operator_id || null;
  const commissionPct = session.metadata?.commission_pct
    ? Number(session.metadata.commission_pct)
    : null;
  // Nivel de precio elegido (habitación compartida/sencilla…) — se guarda en
  // notes para que el roster/dashboard sepa el tipo. Sin migración.
  const tierLabel = (session.metadata?.tier_label ?? "").trim();
  if (!experienceId) return { handled: true, paymentRecorded: false };

  // Contacto: dedupe en cascada (correo manda aquí). source = web pago.
  const contactRes = await findOrCreateContact(sb, {
    email,
    fullName: fullName ?? undefined,
    phone: phone ?? undefined,
    source: `web pago · ${experienceSlug}`,
  });
  if (!contactRes.ok) throw new Error(contactRes.error);
  const contact = contactRes.contact;

  // Reserva: reusar la activa (no-cancelada) de este contacto+salida, o crear una.
  let reservationId: string;
  let q = sb
    .from("reservations")
    .select("id, status, num_people, total_amount_mxn")
    .eq("contact_id", contact.id)
    .eq("experience_id", experienceId)
    .neq("status", "cancelled");
  q = slotId ? q.eq("slot_id", slotId) : q.is("slot_id", null);
  const { data: existingResv } = await q.maybeSingle();

  if (existingResv) {
    reservationId = existingResv.id as string;
    // ¿La reserva ya tiene pagos? Entonces esta compra es ADICIONAL (misma
    // persona comprando más boletos en otro checkout): se SUMA, no se pisa.
    // Sin pagos previos (p.ej. reserva 'confirmed' del registro), el checkout
    // define el conteo — comportamiento original. (Bug real: Abraham, 2 jul —
    // dos compras de 1 boleto quedaban como num_people=1.)
    const { data: prevPays } = await sb
      .from("payments")
      .select("amount_mxn, status")
      .eq("reservation_id", reservationId);
    const yaPagado = ((prevPays || []) as { amount_mxn: number; status: string }[])
      .filter((p) => p.status === "paid")
      .reduce((n, p) => n + Number(p.amount_mxn || 0), 0);
    const esCompraAdicional = yaPagado > 0;

    // No retroceder: si ya estaba 'completed', se queda; si no, pasa a 'paid'.
    const nextStatus = (existingResv.status as string) === "completed" ? "completed" : "paid";
    await sb
      .from("reservations")
      .update({
        num_people: esCompraAdicional
          ? ((existingResv.num_people as number) || 0) + numPeople
          : numPeople,
        total_amount_mxn: esCompraAdicional
          ? Number(existingResv.total_amount_mxn || 0) + amountPaid
          : amountPaid,
        status: nextStatus,
        channel: "web",
        operator_id: operatorId,
        commission_pct: commissionPct,
        ...(tierLabel ? { notes: `Nivel: ${tierLabel}` } : {}),
      })
      .eq("id", reservationId);
  } else {
    const { data: created, error: resErr } = await sb
      .from("reservations")
      .insert({
        experience_id: experienceId,
        slot_id: slotId,
        contact_id: contact.id,
        num_people: numPeople,
        total_amount_mxn: amountPaid,
        status: "paid",
        channel: "web",
        operator_id: operatorId,
        commission_pct: commissionPct,
        ...(tierLabel ? { notes: `Nivel: ${tierLabel}` } : {}),
      })
      .select("id")
      .single();
    if (resErr) throw new Error(`No se pudo crear la reserva: ${resErr.message}`);
    reservationId = created.id as string;
  }

  // Complementos comprados. El precio viene CONGELADO de la metadata de Stripe
  // —lo que se cobró, no lo que hoy diga la tabla— porque el roster de la salida
  // tiene que decir lo que la persona creyó estar comprando.
  const crudo = session.metadata?.complementos ?? "";
  if (crudo) {
    try {
      const elegidos = JSON.parse(crudo) as { id: string; n: string; u: number; pp: number }[];
      const filas = elegidos.map((c) => ({
        reservation_id: reservationId,
        complement_id: c.id,
        nombre_snapshot: c.n,
        personas: c.pp ? numPeople : 1,
        precio_mxn: Number(c.u) * (c.pp ? numPeople : 1),
      }));
      if (filas.length) {
        // onConflict: comprar dos veces el mismo complemento no lo duplica.
        const { error } = await sb
          .from("reservation_complements")
          .upsert(filas, { onConflict: "reservation_id,complement_id" });
        if (error) console.error("[finalize] complementos:", error.message);
      }
    } catch (e) {
      // Un complemento que no se guarda NO tumba el pago: el dinero ya entró.
      console.error("[finalize] complementos ilegibles:", (e as Error).message);
    }
  }

  // Pago.
  const { error: payErr } = await sb.from("payments").insert({
    reservation_id: reservationId,
    contact_id: contact.id,
    amount_mxn: amountPaid,
    status: "paid",
    method: "stripe",
    provider_ref: providerRef,
    paid_at: new Date().toISOString(),
  });
  if (payErr && payErr.code !== "23505") {
    throw new Error(`No se pudo registrar el pago: ${payErr.message}`);
  }

  // Cola de sync a Notion — SOLO comercial (Pipeline: Paid + operador atribuido).
  await sb.from("notion_sync_log").insert({
    entity: "payment",
    entity_id: reservationId,
    action: "paid",
    status: "pending",
    payload: {
      reservation_id: reservationId,
      contact_id: contact.id,
      experience_slug: experienceSlug,
      amount_mxn: amountPaid,
      num_people: numPeople,
      channel: "web",
      operator_id: operatorId,
      commission_pct: commissionPct,
      method: "stripe",
      provider_ref: providerRef,
      paid_at: new Date().toISOString(),
    },
  });

  // Aviso al admin (correo + WhatsApp si está configurado) — best-effort,
  // notifyNuevaReserva se traga sus errores y jamás tira el webhook.
  const { data: expRow } = await sb
    .from("experiences")
    .select("data")
    .eq("id", experienceId)
    .maybeSingle();
  const expData = (expRow?.data ?? null) as {
    title?: string;
    titleAccent?: string;
    cardTitle?: string;
    registration?: { active?: boolean };
  } | null;
  const nombreExperiencia =
    expData?.cardTitle ||
    [expData?.title, expData?.titleAccent].filter(Boolean).join(" ").trim() ||
    experienceSlug;
  // Confirmación AL CLIENTE (su comprobante) + aviso al admin — ambos best-effort
  // en paralelo, jamás tiran el webhook. El CTA del deslinde solo si está activo.
  const deslindeUrl = expData?.registration?.active
    ? `https://caminante.numanhub.com/caminante/registro/${experienceSlug}?reserva=${reservationId}`
    : null;
  await Promise.allSettled([
    notifyConfirmacionCompra({
      email,
      nombre: fullName,
      experiencia: nombreExperiencia,
      salida: session.metadata?.slot_label || "",
      personas: numPeople,
      montoMxn: amountPaid,
      tierLabel: tierLabel || undefined,
      deslindeUrl,
    }),
    notifyNuevaReserva({
      cliente: fullName || email,
      experiencia: nombreExperiencia,
      salida: session.metadata?.slot_label || "sin fecha",
      personas: numPeople,
      montoMxn: amountPaid,
      metodo: "Stripe (pago web)",
      canal: "web",
    }),
  ]);

  // Meta Conversions API — Purchase server-side (la señal de dinero). SOLO en el
  // primer registro (!payErr) para no doblar en reintentos del webhook; event_id =
  // PaymentIntent id da dedup con el pixel del navegador. Best-effort: nunca tira
  // el webhook. Sin datos médicos (LFPDPPP). fbp/fbc vienen de la metadata (checkout).
  if (!payErr) {
    await capiPurchase({
      eventId: providerRef,
      value: amountPaid,
      currency: "MXN",
      contentIds: experienceSlug ? [experienceSlug] : undefined,
      numItems: numPeople,
      eventSourceUrl: experienceSlug
        ? `https://caminante.numanhub.com/caminante/experiencias/${experienceSlug}`
        : undefined,
      userData: {
        email,
        phone,
        fullName,
        externalId: contact.id,
        fbp: session.metadata?.fbp ?? null,
        fbc: session.metadata?.fbc ?? null,
      },
    }).catch(() => {});
  }

  return { handled: true, paymentRecorded: !payErr, reservationId };
}
