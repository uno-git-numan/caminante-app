"use server";

import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripeServerClient } from "@/lib/payments/stripe";
import type { Experience } from "./types";

export type SaveResult =
  | { ok: true; slug: string; status: Experience["status"] }
  | { ok: false; error: string };

export async function saveExperience(exp: Experience): Promise<SaveResult> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "No autorizado. Inicia sesión como admin." };
  }
  const slug = (exp.slug || "").trim();
  if (!slug) {
    return { ok: false, error: "Falta el identificador (slug)." };
  }
  if (!exp.title?.trim() && !exp.titleAccent?.trim()) {
    return { ok: false, error: "Falta el título de la experiencia." };
  }

  const sb = createSupabaseAdminClient();
  const row = { slug, status: exp.status, data: { ...exp, slug } };
  const { error } = await sb.from("experiences").upsert(row, { onConflict: "slug" });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, slug, status: exp.status };
}

export type StripeLinkResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

// Creates a Stripe Payment Link for the experience's price. Not a charge — it's a
// reusable link customers use to pay. Stored on the experience and shown as a CTA.
export async function generateStripeLink(input: {
  title: string;
  subtitle: string;
  amount: string;
  currency: string;
}): Promise<StripeLinkResult> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "No autorizado." };
  }
  const cents = Math.round(parseFloat((input.amount || "").replace(/[^0-9.]/g, "")) * 100);
  if (!cents || cents < 1000) {
    return { ok: false, error: "Define un precio válido antes de generar el link." };
  }
  const currency = /usd/i.test(input.currency) ? "usd" : "mxn";
  try {
    const stripe = getStripeServerClient();
    const product = await stripe.products.create({
      name: input.title || "Experiencia Caminante",
      ...(input.subtitle ? { description: input.subtitle } : {}),
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: cents,
      currency,
    });
    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
    });
    return { ok: true, url: link.url };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
