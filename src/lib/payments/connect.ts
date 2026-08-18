import { getStripeServerClient } from "@/lib/payments/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Stripe Connect · alta y estado de la cuenta del operador.
//
// Qué hace posible: que el operador cobre en SU cuenta (cargo directo) y Numan
// retenga su comisión como `application_fee`. Hoy el 100% cae en NUMAN HUB y se
// le transfiere a mano.
//
// ⚠️ ESTE MÓDULO NO COBRA. Solo da de alta la cuenta y lee su estado. El cobro
// sigue corriendo por `createCheckout` sin un solo cambio — esa bifurcación es
// A3/F1.3 y va al final, cuando ya haya un operador de verdad listo. Es la
// mitigación acordada: el camino que mueve dinero real se toca hasta el final.
//
// ⚠️ NADA AQUÍ ESCRIBE `commission_pct`. La comisión sale de esa columna y de
// ningún otro lado (ver el comentario de la columna en la base). Que un operador
// termine su onboarding de Stripe NO le pone comisión: si `commission_pct` está
// en NULL, `operadorListo` lo rechaza a propósito, porque con NULL el
// `application_fee` sería 0 y el operador se quedaría el 100% de la venta.

const CANONICAL = "https://caminante.numanhub.com";

/** País y capacidades: cuenta Express de MX que cobra con tarjeta y recibe transferencias. */
const PAIS = "MX";

export type OperadorConnect = {
  id: string;
  name: string | null;
  email: string | null;
  slug: string | null;
  tipo_persona: string | null;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean | null;
  stripe_payouts_enabled: boolean | null;
  stripe_onboarded_at: string | null;
};

export const COLUMNAS_CONNECT =
  "id,name,email,slug,tipo_persona,stripe_account_id,stripe_charges_enabled,stripe_payouts_enabled,stripe_onboarded_at";

export type ConnectResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function leerOperador(operadorId: string): Promise<OperadorConnect | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operators")
    .select(COLUMNAS_CONNECT)
    .eq("id", operadorId)
    .maybeSingle();
  return (data as OperadorConnect | null) ?? null;
}

/**
 * Crea la cuenta conectada del operador en Stripe y guarda su id.
 *
 * IDEMPOTENTE: si el operador ya tiene `stripe_account_id`, devuelve ese y no
 * crea otra. Dos cuentas para un mismo operador serían dos destinos de dinero
 * distintos y una de las dos quedaría huérfana con saldo dentro.
 */
export async function crearCuentaConectada(
  operadorId: string,
): Promise<ConnectResult<{ accountId: string; creada: boolean }>> {
  const op = await leerOperador(operadorId);
  if (!op) return { ok: false, error: "Ese operador no existe." };
  if (op.stripe_account_id) {
    return { ok: true, data: { accountId: op.stripe_account_id, creada: false } };
  }
  if (!op.email) {
    return { ok: false, error: "El operador necesita un correo antes de conectar Stripe." };
  }

  const stripe = getStripeServerClient();
  let account;
  try {
    account = await stripe.accounts.create({
      type: "express",
      country: PAIS,
      email: op.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      // `tipo_persona` puede venir en NULL (el operador aún no lo capturó). Se
      // omite en vez de adivinar: Stripe se lo pregunta en su propio flujo, y
      // mandar "individual" por defecto a una S.A. de C.V. le pediría el KYC
      // equivocado y habría que empezar de cero.
      ...(op.tipo_persona === "moral"
        ? { business_type: "company" as const }
        : op.tipo_persona === "fisica"
          ? { business_type: "individual" as const }
          : {}),
      business_profile: {
        name: op.name ?? undefined,
        url: op.slug ? `${CANONICAL}/caminante/o/${op.slug}` : undefined,
      },
      // Para resolver el operador desde un evento de cuenta conectada sin
      // depender de una consulta inversa.
      metadata: { operator_id: op.id },
    });
  } catch (error) {
    return { ok: false, error: `Stripe no pudo crear la cuenta: ${(error as Error).message}` };
  }

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("operators")
    .update({ stripe_account_id: account.id })
    .eq("id", op.id)
    // Solo escribe si SIGUE sin cuenta. Si dos pestañas dieron clic a la vez, la
    // segunda no pisa el id de la primera: quedaría una cuenta viva y otra
    // fantasma, y el dinero llegaría a la que ya nadie mira.
    .is("stripe_account_id", null);
  if (error) return { ok: false, error: error.message };

  return { ok: true, data: { accountId: account.id, creada: true } };
}

/**
 * Account Link que lleva al operador al flujo de KYC de Stripe.
 *
 * ⚠️ LOS ACCOUNT LINKS CADUCAN (minutos) Y SON DE UN SOLO USO. Se generan al
 * vuelo en cada clic y NO se guardan en ninguna columna: un link guardado es un
 * link muerto que manda al operador a una pantalla de error de Stripe.
 */
export async function crearLinkOnboarding(
  operadorId: string,
  origen?: string,
): Promise<ConnectResult<{ url: string }>> {
  const alta = await crearCuentaConectada(operadorId);
  if (!alta.ok) return alta;

  const base = origen?.startsWith("https://") ? origen : CANONICAL;
  const vuelta = `${base}/caminante/operador/cobros`;

  const stripe = getStripeServerClient();
  try {
    const link = await stripe.accountLinks.create({
      account: alta.data.accountId,
      // Stripe manda aquí cuando el link ya caducó: se pide uno nuevo y sigue.
      refresh_url: `${vuelta}?stripe=refresh`,
      // Volver NO significa que terminó — Stripe lo dice explícitamente. Por eso
      // la pantalla de vuelta consulta el estado real con `refrescarEstado`
      // en vez de creerle al redirect.
      return_url: `${vuelta}?stripe=volvio`,
      type: "account_onboarding",
    });
    return { ok: true, data: { url: link.url } };
  } catch (error) {
    return { ok: false, error: `Stripe no pudo crear el link: ${(error as Error).message}` };
  }
}

export type EstadoConnect = {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  /** Lo que Stripe TODAVÍA pide, tal cual. Se le muestra al operador sin traducir. */
  pendientes: string[];
  /** Requisitos con fecha límite: si no se cumplen, Stripe corta los cobros. */
  fechaLimite: number | null;
  detallesEnviados: boolean;
};

/**
 * Lee la cuenta en Stripe y sincroniza las columnas de estado.
 *
 * ⚠️ La verdad sobre si un operador puede cobrar la dice STRIPE, no nosotros.
 * Que exista la cuenta no significa que el KYC esté completo: `charges_enabled`
 * puede tardar días y puede volver a apagarse si Stripe pide un documento nuevo.
 */
export async function refrescarEstado(
  operadorId: string,
): Promise<ConnectResult<EstadoConnect>> {
  const op = await leerOperador(operadorId);
  if (!op) return { ok: false, error: "Ese operador no existe." };
  if (!op.stripe_account_id) return { ok: false, error: "Ese operador todavía no conecta Stripe." };

  const stripe = getStripeServerClient();
  let account;
  try {
    account = await stripe.accounts.retrieve(op.stripe_account_id);
  } catch (error) {
    return { ok: false, error: `Stripe no respondió: ${(error as Error).message}` };
  }

  return guardarEstado(op.id, account);
}

/**
 * Escribe el estado de una cuenta de Stripe en el operador. Lo usan tanto
 * `refrescarEstado` (a petición) como el webhook `account.updated` (solo).
 */
export async function guardarEstado(
  operadorId: string,
  account: {
    id: string;
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    details_submitted?: boolean;
    requirements?: unknown;
  },
): Promise<ConnectResult<EstadoConnect>> {
  const req = (account.requirements ?? {}) as {
    currently_due?: string[];
    past_due?: string[];
    eventually_due?: string[];
    disabled_reason?: string | null;
    current_deadline?: number | null;
  };

  const chargesEnabled = Boolean(account.charges_enabled);
  const payoutsEnabled = Boolean(account.payouts_enabled);

  const estado: EstadoConnect = {
    accountId: account.id,
    chargesEnabled,
    payoutsEnabled,
    // `past_due` primero: eso es lo que ya venció y lo que apaga los cobros.
    pendientes: [...new Set([...(req.past_due ?? []), ...(req.currently_due ?? [])])],
    fechaLimite: req.current_deadline ?? null,
    detallesEnviados: Boolean(account.details_submitted),
  };

  const patch: Record<string, unknown> = {
    stripe_charges_enabled: chargesEnabled,
    stripe_payouts_enabled: payoutsEnabled,
    stripe_requirements: account.requirements ?? null,
  };
  // `stripe_onboarded_at` es la fecha en que quedó listo la PRIMERA vez, no la
  // última: se sella solo si estaba vacía. Stripe puede apagar y volver a
  // encender los cobros (un documento que vence, una revisión); si se
  // re-escribiera, se perdería cuándo empezó de verdad a operar.
  if (chargesEnabled && !(await yaSellado(operadorId))) {
    patch.stripe_onboarded_at = new Date().toISOString();
  }

  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("operators").update(patch).eq("id", operadorId);
  if (error) return { ok: false, error: error.message };

  return { ok: true, data: estado };
}

async function yaSellado(operadorId: string): Promise<boolean> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operators")
    .select("stripe_onboarded_at")
    .eq("id", operadorId)
    .maybeSingle();
  return Boolean((data as { stripe_onboarded_at?: string | null } | null)?.stripe_onboarded_at);
}

/**
 * Resuelve el operador dueño de una cuenta conectada.
 * Lo necesita el webhook: los eventos de cuenta conectada traen `acct_…`, no el
 * id del operador.
 */
export async function operadorDeCuenta(accountId: string): Promise<string | null> {
  if (!accountId) return null;
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("operators")
    .select("id")
    .eq("stripe_account_id", accountId)
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}
