"use server";

// Pago DIRECTO en la web (canal "web"): el visitante elige salida + nº de personas
// y paga con Stripe Checkout, sin pasar por WhatsApp. El pago APARTA el lugar; el
// registro/deslinde va después (pantalla de éxito → /caminante/registro/[slug]).
//
// Crea una Checkout Session con metadata {self_serve, experience_id, slot_id,
// num_people, operator_id, commission_pct, ...}. El webhook (checkout.session.completed)
// → finalize-selfserve.ts crea contacto+reserva PAGADA+pago, atribuida al operador.
//
// El canal WhatsApp (redes sociales) sigue por /admin/cobro (Payment Link). Son distintos.

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient, toStripeAmount } from "@/lib/payments/stripe";
import { parseMxnAmount } from "@/lib/payments/reservation-links";
import { cleanGrupoToken, fetchSlotAvailability } from "@/lib/experiences/availability";
import { deslindeListo } from "@/lib/experiences/flujo-venta";
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

export async function createCheckout(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const slotId = String(formData.get("slotId") ?? "").trim();
  const numPeople = Math.max(1, Math.min(20, parseInt(String(formData.get("numPeople") ?? "1"), 10) || 1));
  // Índice del nivel de precio elegido (habitación compartida/sencilla…). El
  // MONTO se resuelve server-side por este índice contra la experiencia guardada
  // — NUNCA se confía en un monto que mande el cliente.
  const tierIndexRaw = String(formData.get("tierIndex") ?? "").trim();
  // Token de grupo privado (si la salida es privada, es OBLIGATORIO y se
  // valida contra la BD — nunca se confía en el cliente).
  const grupoToken = cleanGrupoToken(formData.get("grupo"));
  const backQ = grupoToken ? `&grupo=${grupoToken}` : "";
  const back = (e: string) => `/caminante/reservar/${slug}?error=${encodeURIComponent(e)}${backQ}`;

  if (!slug || !slotId) redirect(back("datos"));

  const sb = createSupabaseAdminClient();

  const { data: expRow } = await sb
    .from("experiences")
    .select("id, data, operator_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!expRow) redirect(`/caminante/experiencias/${slug}`);
  const experience = (expRow.data as Experience | undefined) ?? undefined;
  const experienceId = expRow.id as string;
  if (!experience) redirect(back("experiencia"));

  // REGLA: NO SE COBRA sin registro y deslinde completo. Defensa en profundidad:
  // aunque algo se cuele publicado sin deslinde (como pasó con Hacienda San
  // Andrés, caso Enyd 9 jul), el dinero no entra sin el flujo legal completo.
  if (!deslindeListo(experience).ok) redirect(back("deslinde"));

  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, label, price_mxn, status, experience_id, visibility, access_token")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot || slot.experience_id !== experienceId || slot.status !== "open") {
    redirect(back("salida"));
  }
  // Salida PRIVADA: exige el token exacto de su link de grupo.
  if (slot.visibility === "private" && (!grupoToken || grupoToken !== slot.access_token)) {
    redirect(back("salida"));
  }

  // Cupo server-side: el form limita en cliente, pero el monto de personas
  // llega por FormData — verificar contra la ocupación REAL antes de cobrar.
  const avail = (await fetchSlotAvailability(experienceId)).get(slotId);
  if (avail && avail.available !== null && numPeople > avail.available) {
    redirect(back(avail.available <= 0 ? "salida" : `Solo quedan ${avail.available} lugares en esa salida.`));
  }

  // Precio por persona. Prioridad:
  //   1. Nivel elegido (priceTiers[tierIndex]) — su monto se lee del dato guardado.
  //   2. price_mxn del slot.
  //   3. price.amount base de la experiencia.
  const tiers = experience.priceTiers ?? [];
  let tierLabel = "";
  let perPerson: number | null = null;
  if (tiers.length > 0) {
    const idx = /^\d+$/.test(tierIndexRaw) ? parseInt(tierIndexRaw, 10) : -1;
    const tier = idx >= 0 ? tiers[idx] : undefined;
    if (!tier) redirect(back("nivel")); // hay niveles pero no eligió uno válido
    perPerson = parseMxnAmount(tier.amount);
    tierLabel = tier.label;
  }
  if (perPerson == null) perPerson = slot.price_mxn != null ? Number(slot.price_mxn) : null;
  if (perPerson == null) perPerson = parseMxnAmount(experience.price?.amount);
  if (perPerson == null || perPerson <= 0) redirect(back("precio"));

  // Operador dueño + comisión vigente (snapshot en metadata → congelada en la reserva).
  const operatorId = (expRow.operator_id as string | null) ?? null;
  let commissionPct: number | null = null;
  if (operatorId) {
    const { data: op } = await sb
      .from("operators")
      .select("commission_pct")
      .eq("id", operatorId)
      .maybeSingle();
    if (op?.commission_pct != null) commissionPct = Number(op.commission_pct);
  }

  const origin = await getOrigin();
  const title =
    [experience.title, experience.titleAccent].filter(Boolean).join(" ").trim() ||
    experience.docTitle ||
    "Experiencia Caminante";

  // Cookies del navegador de Meta para el match de Conversions API (CAPI):
  // _fbp (browser id) y _fbc (click id, derivado de fbclid por el pixel). Se
  // guardan en la metadata de Stripe → vuelven en el webhook → finalize-selfserve
  // los pasa al Purchase server-side. Cierra identidad navegador→servidor y
  // atribución de anuncios. Solo van si existen.
  const jar = await cookies();
  const fbp = jar.get("_fbp")?.value ?? "";
  const fbc = jar.get("_fbc")?.value ?? "";

  const metadata: Record<string, string> = {
    self_serve: "1",
    experience_slug: slug,
    experience_id: experienceId,
    slot_id: slotId,
    slot_label: (slot.label as string | null) ?? "",
    num_people: String(numPeople),
    operator_id: operatorId ?? "",
    commission_pct: commissionPct != null ? String(commissionPct) : "",
    tier_label: tierLabel,
    slot_visibility: (slot.visibility as string | null) ?? "public",
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
  };

  let url: string | null = null;
  try {
    const stripe = getStripeServerClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: numPeople,
          price_data: {
            currency: "mxn",
            unit_amount: toStripeAmount(perPerson),
            product_data: {
              name: tierLabel ? `${title} — ${tierLabel}` : title,
              ...(slot.label ? { description: `Salida: ${slot.label}` } : {}),
            },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      phone_number_collection: { enabled: true },
      success_url: `${origin}/caminante/reserva/exito?slug=${encodeURIComponent(slug)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/caminante/reservar/${slug}?error=cancelado${backQ}`,
    });
    url = session.url;
  } catch (e) {
    redirect(back((e as Error).message));
  }

  if (!url) redirect(back("stripe"));
  redirect(url);
}
