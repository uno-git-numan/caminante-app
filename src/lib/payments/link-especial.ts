"use server";

// LINK DE PAGO ESPECIAL — desde la cápsula de UNA salida: un link de Stripe con
// descuento (%) o con un monto fijo, para la persona a la que se le prometió
// otra cosa (Luis, 28 oct 2026: «mi amigo Ander al 50% a cambio de fotos; Inés,
// cobrarle sólo 2K»). Lo que se acordó queda escrito en la reserva (`notes`),
// y el precio de lista también, para que el corte sepa cuánto se perdonó.
//
// Mismo camino que el cobro por WhatsApp (reservation-links.ts → webhook →
// finalize-reservation.ts): la reserva nace `requested`, NO aparta lugar hasta
// que el pago cae. La comisión se calcula normal sobre LO COBRADO (regla del 27
// ago 2026: un descuento no cambia la comisión), con la escala de venta — lo
// trajo la casa, a mano.
//
// Esto no bifurca la caja: usa Payment Links de siempre; sólo cambia el monto.

import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { puedeEditarSlot } from "@/lib/auth/alcance";
import { findOrCreateContact, findOrCreateContactByPhone } from "@/lib/crm/contacts";
import { celularE164 } from "@/lib/grupo/codigo";
import { getStripeServerClient, toStripeAmount } from "@/lib/payments/stripe";
import { parseMxnAmount } from "@/lib/payments/reservation-links";
import { fetchSlotAvailability } from "@/lib/experiences/availability";
import { comisionDeVenta, sinIva, type Regla } from "@/lib/operadores/comision";
import { reglaComisionDeOperador } from "@/lib/operadores/regla";
import { experienceTitle } from "@/lib/admin/queries";
import type { Experience } from "@/lib/experiences/types";

export type LinkEspecialInput = {
  slotId: string;
  /** Alguien que YA está en el grupo de la salida (anfitrión o quien entró):
   *  se cobra a SU ficha, para que su lugar pase a «pagó» al caer el pago.
   *  Con esto, nombre/correo/teléfono se ignoran. */
  contactId?: string;
  nombre: string;
  email: string;
  telefono?: string;
  lugares: number;
  modo: "descuento" | "monto";
  /** % de descuento (modo descuento) o el total a cobrar en MXN (modo monto). */
  valor: number;
  motivo: string;
};

export type LinkEspecialResult =
  | { ok: true; url: string; montoMxn: number; listaMxn: number; reservationId: string; waUrl: string | null; texto: string; conCorreo: boolean }
  | { ok: false; error: string };

const r0 = (n: number) => Math.round(n);
const pesos = (n: number) => `$${r0(n).toLocaleString("en-US")}`;

export async function generarLinkEspecial(input: LinkEspecialInput): Promise<LinkEspecialResult> {
  if (!(await puedeEditarSlot(input.slotId))) return { ok: false, error: "Sin permiso." };

  const sb = createSupabaseAdminClient();

  // Alguien del grupo: su ficha manda (Luis, 29 oct 2026: «este descuento va
  // justamente para Miranda»). Un correo tecleado distinto al de su ficha
  // crearía OTRA persona y su lugar del espacio seguiría en «falta pagar».
  type Ficha = { id: string; full_name: string | null; email: string | null; phone: string | null };
  let delGrupo: Ficha | null = null;
  if (input.contactId) {
    const { data: c } = await sb.from("contacts").select("id, full_name, email, phone").eq("id", input.contactId).maybeSingle();
    if (!c) return { ok: false, error: "No encuentro a esa persona." };
    const [{ count: enGrupo }, { data: slotAnf }] = await Promise.all([
      sb.from("grupo_lugares").select("id", { count: "exact", head: true }).eq("slot_id", input.slotId).eq("contact_id", c.id as string),
      sb.from("experience_slots").select("anfitrion_contact_id").eq("id", input.slotId).maybeSingle(),
    ]);
    if (!(enGrupo ?? 0) && (slotAnf as { anfitrion_contact_id: string | null } | null)?.anfitrion_contact_id !== c.id) {
      return { ok: false, error: "Esa persona no está en el grupo de esta salida." };
    }
    delGrupo = c as Ficha;
    if (!delGrupo.email && !delGrupo.phone) return { ok: false, error: "Esa persona no tiene correo ni WhatsApp en su ficha: pon uno en Comunidad antes de cobrarle." };
  }

  const nombre = (delGrupo ? delGrupo.full_name || "" : input.nombre || "").trim().slice(0, 120);
  const email = (delGrupo ? delGrupo.email || "" : input.email || "").trim().toLowerCase();
  const telefono = (delGrupo ? delGrupo.phone || "" : input.telefono || "").trim();
  const lugares = Math.max(1, Math.min(20, Math.floor(Number(input.lugares) || 1)));
  const motivo = (input.motivo || "").trim().slice(0, 200);
  // Correo O WhatsApp, cualquiera de los dos (Luis, 29 oct 2026). Sin correo,
  // el comprobante y el deslinde no salen solos al pagar: la persona aparece en
  // «Falta firmar» y desde ahí se le manda el deslinde por WhatsApp.
  const conCorreo = email.includes("@");
  const telE164 = telefono ? celularE164(telefono) : null;
  if (!nombre) return { ok: false, error: "Escribe el nombre." };
  if (email && !conCorreo) return { ok: false, error: "Ese correo no parece válido." };
  if (telefono && !telE164) return { ok: false, error: "El WhatsApp no parece válido (10 dígitos)." };
  if (!conCorreo && !telE164) return { ok: false, error: "Escribe su correo o su WhatsApp: por uno de los dos le llega el link." };
  if (!motivo) return { ok: false, error: "Escribe el porqué (queda en la reserva, para el corte)." };
  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, experience_id, label, price_mxn, status, starts_at")
    .eq("id", input.slotId)
    .maybeSingle();
  if (!slot) return { ok: false, error: "Esa salida no existe." };
  if (slot.status !== "open") return { ok: false, error: "Esa salida ya no se vende. Reábrela antes de cobrar." };

  const { data: expRow } = await sb
    .from("experiences")
    .select("id, slug, data, operator_id, status")
    .eq("id", slot.experience_id as string)
    .maybeSingle();
  if (!expRow) return { ok: false, error: "No encuentro la experiencia." };
  const experience = (expRow.data ?? null) as Partial<Experience> | null;
  const slug = expRow.slug as string;
  const operatorId = (expRow.operator_id as string | null) ?? null;

  // Precio de lista por persona: el de la salida manda; si no, el base.
  const perPerson = slot.price_mxn != null ? Number(slot.price_mxn) : parseMxnAmount(experience?.price?.amount);
  if (perPerson == null || perPerson <= 0) return { ok: false, error: "La experiencia no tiene precio de lista: ponlo antes de cobrar con descuento." };
  const listaMxn = r0(perPerson * lugares);

  let montoMxn: number;
  if (input.modo === "descuento") {
    const pct = Number(input.valor);
    if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return { ok: false, error: "El descuento es un porcentaje entre 1 y 99." };
    montoMxn = r0(listaMxn * (1 - pct / 100));
  } else {
    montoMxn = r0(Number(input.valor));
    if (!Number.isFinite(montoMxn) || montoMxn <= 0) return { ok: false, error: "Escribe el monto total a cobrar." };
    if (montoMxn > listaMxn) return { ok: false, error: `Ese monto es mayor que el precio de lista (${pesos(listaMxn)}). Para cobrar de más, cambia el precio de la salida.` };
  }
  if (montoMxn < 10) return { ok: false, error: "Stripe no cobra menos de $10." };

  // Cupo: el link no aparta, pero no tiene sentido mandar uno que no va a caber.
  const avail = (await fetchSlotAvailability(slot.experience_id as string)).get(slot.id as string);
  if (avail && avail.available != null && lugares > avail.available) {
    return { ok: false, error: avail.available <= 0 ? "Esa salida está llena." : `Sólo quedan ${avail.available} lugares en esa salida.` };
  }

  let contact: { id: string };
  if (delGrupo) {
    contact = { id: delGrupo.id };
  } else {
    const contactRes = conCorreo
      ? await findOrCreateContact(sb, { email, fullName: nombre, phone: telefono || undefined, source: `link especial · ${slug}` })
      : await findOrCreateContactByPhone(sb, { waPhone: telE164 as string, fullName: nombre, source: `link especial · ${slug}` });
    if (!contactRes.ok) return { ok: false, error: contactRes.error };
    contact = contactRes.contact;
  }

  // Una reserva viva de esta persona en esta salida que ya tenga pagos no se
  // toca: ese es otro cobro. Una `requested` sin pagos se reutiliza.
  const { data: vivas } = await sb
    .from("reservations")
    .select("id, status, total_amount_mxn")
    .eq("contact_id", contact.id)
    .eq("slot_id", slot.id as string)
    .neq("status", "cancelled");
  const previa = (vivas ?? [])[0] as { id: string; status: string } | undefined;
  if (previa && previa.status !== "requested") {
    return { ok: false, error: `${nombre} ya tiene una reserva ${previa.status === "paid" ? "pagada" : "viva"} en esta salida. Cóbrale lo que falte desde Pagos.` };
  }

  // La comisión, sobre lo cobrado y con la escala de venta (lo vende la casa a mano).
  const { regla: reglaOperador, origen: origenRegla } = await reglaComisionDeOperador(operatorId);
  const regla: Regla = reglaOperador.tipo === "plano" ? reglaOperador : { tipo: "escala", escala: "venta" };
  const comision = comisionDeVenta({ viaje: { precioUnitario: sinIva(montoMxn / lugares), cantidad: lugares } }, regla);
  const commissionPct = reglaOperador.tipo === "plano" ? reglaOperador.pct : null;

  const descuentoTexto = input.modo === "descuento" ? `${Number(input.valor)}% de descuento` : "monto especial";
  const notes = `Precio especial (${descuentoTexto}): ${motivo} · lista ${pesos(listaMxn)} · cobra ${pesos(montoMxn)}`;

  let reservationId: string;
  if (previa) {
    reservationId = previa.id;
    await sb
      .from("reservations")
      .update({ num_people: lugares, total_amount_mxn: montoMxn, amount_due_mxn: montoMxn, notes, operator_id: operatorId, commission_pct: commissionPct, updated_at: new Date().toISOString() })
      .eq("id", reservationId);
  } else {
    const { data: created, error } = await sb
      .from("reservations")
      .insert({
        experience_id: slot.experience_id,
        slot_id: slot.id,
        contact_id: contact.id,
        num_people: lugares,
        status: "requested",
        channel: "admin",
        total_amount_mxn: montoMxn,
        amount_due_mxn: montoMxn,
        operator_id: operatorId,
        commission_pct: commissionPct,
        ...(regla.tipo === "escala" ? { escala_comision: "venta" } : {}),
        notes,
      })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: error?.message ?? "No se pudo crear la reserva." };
    reservationId = created.id as string;
  }

  const titulo = experienceTitle(experience, slug);
  const metadata: Stripe.MetadataParam = {
    reservation_id: reservationId,
    contact_id: contact.id,
    slot_id: slot.id as string,
    slot_label: (slot.label as string | null) ?? "",
    experience_slug: slug,
    experience_id: slot.experience_id as string,
    num_people: String(lugares),
    operator_id: operatorId ?? "",
    commission_pct: commissionPct != null ? String(commissionPct) : "",
    platform_fee_mxn: String(comision.monto),
    comision_regla: regla.tipo === "plano" ? `${origenRegla}:${regla.pct}` : "escala:venta",
    canal_cobro: "casa",
    precio_especial: "1",
    precio_lista_mxn: String(listaMxn),
  };

  let url: string;
  let linkId: string;
  try {
    const stripe = getStripeServerClient();
    const product = await stripe.products.create({
      name: `${titulo} — ${lugares} ${lugares === 1 ? "lugar" : "lugares"} · precio especial`,
      ...(slot.label ? { description: `Salida: ${slot.label}` } : {}),
    });
    const price = await stripe.prices.create({ product: product.id, unit_amount: toStripeAmount(montoMxn), currency: "mxn" });
    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata,
      payment_intent_data: { metadata },
    });
    url = link.url;
    linkId = link.id;
  } catch (e) {
    return { ok: false, error: `Stripe: ${(e as Error).message}` };
  }

  await sb.from("reservations").update({ payment_link_url: url, payment_link_id: linkId }).eq("id", reservationId);

  const pila = nombre.split(/\s+/)[0];
  const texto = `Hola, ${pila}. Aquí está tu link de pago para ${titulo}${slot.label ? ` (${slot.label})` : ""}: ${url}\n\nSon ${pesos(montoMxn)} por ${lugares} ${lugares === 1 ? "lugar" : "lugares"}. ${conCorreo ? "Al pagar te llega el deslinde por correo." : "Al pagar te mando el deslinde por aquí."}`;
  const waUrl = telE164 ? `https://wa.me/${telE164.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}` : null;

  revalidatePath("/caminante/admin/salidas");
  return { ok: true, url, montoMxn, listaMxn, reservationId, waUrl, texto, conCorreo };
}

/** Un link que no se va a usar: la reserva `requested` se cancela y el link de Stripe se apaga. */
export async function cancelarLinkEspecial(reservationId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = createSupabaseAdminClient();
  const { data: resv } = await sb
    .from("reservations")
    .select("id, slot_id, status, payment_link_id")
    .eq("id", reservationId)
    .maybeSingle();
  if (!resv) return { ok: false, error: "No encuentro esa reserva." };
  if (!resv.slot_id || !(await puedeEditarSlot(resv.slot_id as string))) return { ok: false, error: "Sin permiso." };
  if (resv.status !== "requested") return { ok: false, error: "Esa reserva ya tiene pago: no es un link pendiente." };
  const { count } = await sb.from("payments").select("id", { count: "exact", head: true }).eq("reservation_id", reservationId).eq("status", "paid");
  if ((count ?? 0) > 0) return { ok: false, error: "Esa reserva ya tiene un pago registrado." };
  if (resv.payment_link_id) {
    try {
      await getStripeServerClient().paymentLinks.update(resv.payment_link_id as string, { active: false });
    } catch (e) {
      console.error("cancelarLinkEspecial stripe:", e);
    }
  }
  await sb.from("reservations").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", reservationId);
  revalidatePath("/caminante/admin/salidas");
  return { ok: true };
}
