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

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient, toStripeAmount } from "@/lib/payments/stripe";
import { parseMxnAmount } from "@/lib/payments/reservation-links";
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
  const back = (e: string) => `/caminante/reservar/${slug}?error=${encodeURIComponent(e)}`;

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

  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, label, price_mxn, status, experience_id")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot || slot.experience_id !== experienceId || slot.status !== "open") {
    redirect(back("salida"));
  }

  let perPerson: number | null = slot.price_mxn != null ? Number(slot.price_mxn) : null;
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

  const metadata: Record<string, string> = {
    self_serve: "1",
    experience_slug: slug,
    experience_id: experienceId,
    slot_id: slotId,
    slot_label: (slot.label as string | null) ?? "",
    num_people: String(numPeople),
    operator_id: operatorId ?? "",
    commission_pct: commissionPct != null ? String(commissionPct) : "",
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
              name: title,
              ...(slot.label ? { description: `Salida: ${slot.label}` } : {}),
            },
          },
        },
      ],
      metadata,
      payment_intent_data: { metadata },
      phone_number_collection: { enabled: true },
      success_url: `${origin}/caminante/reserva/exito?slug=${encodeURIComponent(slug)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/caminante/reservar/${slug}?error=cancelado`,
    });
    url = session.url;
  } catch (e) {
    redirect(back((e as Error).message));
  }

  if (!url) redirect(back("stripe"));
  redirect(url);
}
