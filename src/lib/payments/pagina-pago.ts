"use server";

// «PAGAR» DESDE LA PÁGINA DE PAGO (/caminante/pago/<token>).
//
// Aquí nace la Checkout Session de Stripe para una reserva que ya existe
// (requested, con monto fijado por el admin: precio especial o cobro por
// WhatsApp). Antes el link era un Payment Link de Stripe creado al generar
// el cobro; ahora la sesión se crea cuando la persona toca «Pagar», con el
// monto que la reserva tiene en ese momento — nunca un monto del cliente.
//
// Vuelve por el webhook de siempre (finalize-reservation.ts, por
// metadata.reservation_id) y aterriza en /caminante/reserva/exito, que ya
// sabe ofrecer «Firmar mi deslinde» atado a ESA reserva.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient, toStripeAmount } from "@/lib/payments/stripe";
import { cleanPagoToken } from "@/lib/payments/pago-token";
import { comisionDeVenta, sinIva, type Regla } from "@/lib/operadores/comision";
import { reglaComisionDeOperador } from "@/lib/operadores/regla";
import { experienceTitle } from "@/lib/admin/queries";
import type { Experience } from "@/lib/experiences/types";

async function getOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const isLocal = host.includes("localhost") || host.startsWith("127.");
    const protocol = h.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
    return `${protocol}://${host}`;
  }
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://caminante.numanhub.com").replace(/\/$/, "");
}

export async function iniciarPagoDeReserva(formData: FormData) {
  const token = cleanPagoToken(formData.get("token"));
  if (!token) redirect("/caminante");
  const back = (e: string) => `/caminante/pago/${token}?error=${encodeURIComponent(e)}`;

  const sb = createSupabaseAdminClient();
  const { data: r } = await sb
    .from("reservations")
    .select("id, status, num_people, amount_due_mxn, total_amount_mxn, precio_lista_mxn, experience_id, slot_id, contact_id, operator_id, commission_pct, escala_comision")
    .eq("pago_token", token)
    .maybeSingle();
  if (!r) redirect("/caminante");
  if (r.status === "cancelled") redirect(back("Este link ya no está activo."));
  if (r.status === "paid" || r.status === "completed") redirect(back("Este pago ya se hizo."));

  const monto = Number(r.amount_due_mxn ?? r.total_amount_mxn ?? 0);
  if (!Number.isFinite(monto) || monto < 10) redirect(back("Esta reserva no tiene un monto por cobrar. Escríbenos."));
  const personas = Math.max(1, Number(r.num_people) || 1);

  const [{ data: exp }, { data: slot }, { data: contacto }] = await Promise.all([
    sb.from("experiences").select("slug, data").eq("id", r.experience_id as string).maybeSingle(),
    r.slot_id
      ? sb.from("experience_slots").select("label, status").eq("id", r.slot_id as string).maybeSingle()
      : Promise.resolve({ data: null as { label: string | null; status: string } | null }),
    sb.from("contacts").select("email").eq("id", r.contact_id as string).maybeSingle(),
  ]);
  if (!exp) redirect("/caminante");
  if (slot && slot.status !== "open") redirect(back("Esta salida ya cerró ventas. Escríbenos y lo resolvemos."));
  const slug = exp.slug as string;
  const experience = (exp.data ?? null) as Partial<Experience> | null;
  const titulo = experienceTitle(experience, slug);

  // La comisión, sobre LO COBRADO (un descuento no la cambia: regla del 27 ago
  // 2026) y con la escala de venta: estos cobros los arma la casa a mano.
  const operatorId = (r.operator_id as string | null) ?? null;
  const { regla: reglaOperador, origen } = await reglaComisionDeOperador(operatorId);
  const regla: Regla = reglaOperador.tipo === "plano" ? reglaOperador : { tipo: "escala", escala: "venta" };
  const comision = comisionDeVenta({ viaje: { precioUnitario: sinIva(monto / personas), cantidad: personas } }, regla);
  const commissionPct = reglaOperador.tipo === "plano" ? reglaOperador.pct : null;
  if (r.commission_pct !== commissionPct || (regla.tipo === "escala" && r.escala_comision !== "venta")) {
    await sb
      .from("reservations")
      .update({ operator_id: operatorId, commission_pct: commissionPct, ...(regla.tipo === "escala" ? { escala_comision: "venta" } : {}) })
      .eq("id", r.id as string);
  }

  const lista = r.precio_lista_mxn != null ? Number(r.precio_lista_mxn) : null;
  const metadata: Stripe.MetadataParam = {
    reservation_id: r.id as string,
    contact_id: r.contact_id as string,
    slot_id: (r.slot_id as string | null) ?? "",
    slot_label: (slot?.label as string | null) ?? "",
    experience_slug: slug,
    experience_id: r.experience_id as string,
    num_people: String(personas),
    operator_id: operatorId ?? "",
    commission_pct: commissionPct != null ? String(commissionPct) : "",
    platform_fee_mxn: String(comision.monto),
    comision_regla: regla.tipo === "plano" ? `${origen}:${regla.pct}` : "escala:venta",
    canal_cobro: "casa",
    ...(lista != null && lista > monto ? { precio_especial: "1", precio_lista_mxn: String(lista) } : {}),
  };

  const origin = await getOrigin();
  const email = ((contacto?.email as string | null) ?? "").trim();
  let url: string | null = null;
  try {
    const stripe = getStripeServerClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "mxn",
            unit_amount: toStripeAmount(monto),
            product_data: {
              name: `${titulo} — ${personas} ${personas === 1 ? "lugar" : "lugares"}`,
              ...(slot?.label ? { description: `Salida: ${slot.label}` } : {}),
            },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      phone_number_collection: { enabled: true },
      // El correo va fijo cuando la ficha lo tiene: el pago cae en SU contacto.
      ...(email.includes("@") ? { customer_email: email } : {}),
      success_url: `${origin}/caminante/reserva/exito?slug=${encodeURIComponent(slug)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/caminante/pago/${token}`,
    });
    url = session.url;
  } catch (e) {
    redirect(back(`No se pudo abrir el pago: ${(e as Error).message}`));
  }
  if (!url) redirect(back("No se pudo abrir el pago."));
  redirect(url);
}
