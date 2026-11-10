import { identidadParaStripe } from "./identidad-stripe";
import { getStripeServerClient } from "@/lib/payments/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailStripeListo } from "@/lib/operadores/emails";
import { altaCobroEnPlataforma, MCC_TURISMO, recaudaLaPlataforma } from "./alta-cobro";

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

/** País: cuentas de MX que cobran con tarjeta y reciben transferencias. */
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
  rfc: string | null;
  razon_social: string | null;
  cp_fiscal: string | null;
};

export const COLUMNAS_CONNECT =
  "id,name,email,slug,tipo_persona,stripe_account_id,stripe_charges_enabled,stripe_payouts_enabled,stripe_onboarded_at,rfc,razon_social,cp_fiscal";

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
 * LA CUENTA DE COBRO DE SIEMPRE, DICHA COMO STRIPE LA ACEPTA HOY (9 nov 2026).
 *
 * En LIVE Stripe rechazó crear la cuenta Express de siempre al darle «Conectar»
 * Nomádika: «Use Accounts v2, remove type, and set losses_collector to stripe».
 * Probado contra Stripe en modo test el mismo día:
 *
 *   dashboard express + pérdidas de Stripe ... «configuration is not supported»
 *   dashboard full    + pérdidas de Stripe ... ✓ (v1 la ve como `standard`)
 *
 * O sea: con Stripe respondiendo por los saldos negativos, la única cuenta que
 * existe es la de dashboard COMPLETO. La operadora ve su propio Stripe, Stripe
 * le cobra sus comisiones a ella en los cargos directos y la verificación la
 * hace Stripe con su enlace (el mismo Account Link v1 de siempre funciona).
 *
 * ⚠️ DOS CONFIGURACIONES, NO UNA. Cobramos con CARGO CON DESTINO y
 * `on_behalf_of` (connect-cobro.ts). `merchant` la hace comerciante —la venta
 * sale a su nombre— y `recipient` con `stripe_transfers` le deja recibir la
 * transferencia. Sin la segunda, Stripe contestó en test: «Your destination
 * account needs to have … stripe_transfers capability enabled». Con las dos,
 * el PaymentIntent con `on_behalf_of` + `transfer_data` + `application_fee`
 * se creó en test. En un cargo con destino el fee de Stripe lo sigue pagando
 * la plataforma, así que el dinero se reparte EXACTAMENTE como antes.
 *
 * El estado se sigue leyendo por la API v1 (`accounts.retrieve`), que ve estas
 * cuentas igual: `charges_enabled`, `requirements`, `controller`.
 */
async function crearCuentaV2(
  stripe: ReturnType<typeof getStripeServerClient>,
  op: OperadorConnect,
): Promise<{ id: string }> {
  const entidad = op.tipo_persona === "moral" ? "company" : op.tipo_persona === "fisica" ? "individual" : undefined;
  const url = op.slug ? `${CANONICAL}/caminante/o/${op.slug}` : CANONICAL;
  const cuenta = await stripe.v2.core.accounts.create({
    contact_email: op.email ?? undefined,
    display_name: op.name ?? undefined,
    dashboard: "full",
    // `entity_type` se omite si no lo ha dicho, en vez de adivinar: mandar
    // «individual» a una S.A. de C.V. le pediría el KYC equivocado.
    // Y lo que ya sabemos de su constancia (identidad-stripe.ts), para que
    // Stripe no se lo vuelva a preguntar.
    identity: { country: "mx", ...(entidad ? { entity_type: entidad } : {}), ...identidadParaStripe(op) },
    configuration: {
      merchant: { capabilities: { card_payments: { requested: true } }, mcc: MCC_TURISMO },
      recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
    },
    defaults: {
      currency: "mxn",
      locales: ["es-419"],
      profile: {
        business_url: url,
        product_description: "Experiencias guiadas en naturaleza, reservadas por Caminante.",
      },
      responsibilities: { fees_collector: "stripe", losses_collector: "stripe" },
    },
    // Para resolver el operador desde un evento de cuenta conectada sin
    // depender de una consulta inversa.
    metadata: { operator_id: op.id },
  });
  return { id: cuenta.id };
}

/**
 * Cuando su constancia se confirma DESPUÉS de crear la cuenta (la creó con el
 * primer clic, antes de subirla), se le manda a Stripe lo que faltaba. Sólo
 * mientras Stripe no la haya verificado: una cuenta que ya cobra no se toca.
 * Nunca lanza; si Stripe no acepta, la operadora lo llena en su verificación
 * como antes.
 */
export async function completarIdentidadStripe(operadorId: string): Promise<void> {
  try {
    const op = await leerOperador(operadorId);
    if (!op?.stripe_account_id || op.stripe_charges_enabled) return;
    const identity = identidadParaStripe(op);
    if (!Object.keys(identity).length) return;
    await getStripeServerClient().v2.core.accounts.update(op.stripe_account_id, { identity });
  } catch (e) {
    console.error("completarIdentidadStripe:", (e as Error).message);
  }
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
  /**
   * Token de cuenta hecho en el navegador (Stripe.js) con los datos de la
   * operadora y `tos_shown_and_accepted`. Sólo lo manda el alta EN LA
   * PLATAFORMA; el camino de siempre (Express + link) no lo usa.
   */
  accountToken?: string,
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
  const comun = {
    country: PAIS,
    email: op.email,
    capabilities: {
      card_payments: { requested: true as const },
      transfers: { requested: true as const },
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
  };
  let account;
  try {
    // ⚠️ DOS FORMAS DE CUENTA, Y LA FORMA ES PARA SIEMPRE (el dashboard no se
    // cambia después). Con la bandera apagada, la cuenta de dashboard completo
    // por Accounts v2 + link a Stripe (`crearCuentaV2`, 9 nov 2026; antes era
    // Express y Stripe ya no la acepta en LIVE). Prendida, una cuenta sin dashboard en la que LA PLATAFORMA
    // recaba los requisitos, paga las comisiones y responde por los saldos
    // negativos —es lo que permite que la operadora no salga de aquí—, y los
    // datos llegan en el token; el giro y el sitio, que no pueden ir en un
    // token, se ponen directo. Ver alta-cobro.ts.
    //
    // ⚠️ LA BANDERA NO SE PUEDE PRENDER TAL CUAL (9 nov 2026): esta forma deja
    // las pérdidas a la PLATAFORMA, y en LIVE Stripe sólo acepta cuentas nuevas
    // con las pérdidas a Stripe. Prenderla daría el mismo error que tumbó el
    // alta de Nomádika.
    account = altaCobroEnPlataforma()
      ? await stripe.accounts.create({
          ...comun,
          controller: {
            stripe_dashboard: { type: "none" },
            fees: { payer: "application" },
            losses: { payments: "application" },
            requirement_collection: "application",
          },
          business_profile: {
            ...comun.business_profile,
            mcc: MCC_TURISMO,
            url: comun.business_profile.url ?? CANONICAL,
            product_description: "Experiencias guiadas en naturaleza, reservadas por Caminante.",
          },
          ...(accountToken ? { account_token: accountToken } : {}),
        })
      : await crearCuentaV2(stripe, op);
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
  // ⚠️ ESTA RUTA TIENE QUE EXISTIR, Y NO EXISTÍA. Apuntaba a
  // `/caminante/operador/cobros`, que es el PERFIL PÚBLICO del operador
  // (`/caminante/operador/[slug]`) con «cobros» de slug: 404 comprobado el
  // 22 sep 2026. O sea que quien terminaba su alta de Stripe —el momento de
  // mayor confianza de todo el onboarding— aterrizaba en una página de error.
  //
  // La página de cobros del operador vive en `mi-alta/cobrar` desde hoy; la de
  // la casa, en `admin/operadores/cobros`. Se manda a la del operador porque
  // quien acaba de hacer su KYC es él. Nadie lo notó porque Connect nunca se
  // había usado: el primer operador en conectarse habría sido el primero en
  // ver el 404.
  const vuelta = `${base}/caminante/admin/mi-alta/cobrar`;

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
  /** Por qué algo sigue pendiente (RFC que no cuadra, documento ilegible). */
  errores: { requirement?: string; reason?: string; code?: string }[];
  /** ¿La cuenta la llena la plataforma? Decide qué pantalla ve la operadora. */
  recaudaLaPlataforma: boolean;
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
    controller?: { requirement_collection?: string | null } | null;
  },
): Promise<ConnectResult<EstadoConnect>> {
  const req = (account.requirements ?? {}) as {
    currently_due?: string[];
    past_due?: string[];
    eventually_due?: string[];
    errors?: { requirement?: string; reason?: string; code?: string }[];
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
    errores: req.errors ?? [],
    recaudaLaPlataforma: recaudaLaPlataforma(account),
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
  const primeraVez = chargesEnabled && !(await yaSellado(operadorId));
  if (primeraVez) {
    patch.stripe_onboarded_at = new Date().toISOString();
  }

  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("operators").update(patch).eq("id", operadorId);
  if (error) return { ok: false, error: error.message };

  // ⚠️ SÓLO LA PRIMERA VEZ, y por eso cuelga del mismo sello. Stripe apaga y
  // vuelve a encender los cobros (un documento que vence, una revisión), y esto
  // lo escribe el webhook `account.updated`: sin esa condición, cada vaivén
  // mandaría otra vez «¡ya puedes cobrar!» y el correo dejaría de significar
  // algo. Un fallo al enviar no tumba el guardado: el estado ya es verdad.
  if (primeraVez) {
    const { data } = await sb.from("operators").select("email, name").eq("id", operadorId).maybeSingle();
    const op = data as { email: string | null; name: string | null } | null;
    if (op?.email) {
      await emailStripeListo(op.email, op.name).catch((e) => console.error("emailStripeListo:", e));
    }
  }

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

// ── El alta EN LA PLATAFORMA: recibir los tokens y mandarlos ─────────────────

export type TokensDeAlta = {
  /** Datos de la cuenta (física: la persona; moral: la empresa) + aceptación. */
  accountToken?: string;
  /** Moral: el representante legal y cada dueño de 25% o más. */
  personTokens?: string[];
  /** La cuenta bancaria (CLABE), como token. */
  bankToken?: string;
};

/**
 * Manda a Stripe lo que la operadora capturó en la pantalla de cobro.
 *
 * ⚠️ AQUÍ NO LLEGA NI UN DATO PERSONAL: llegan TOKENS. El nombre, la fecha de
 * nacimiento, el RFC, la CLABE y la identificación los tokenizó Stripe.js en
 * el navegador de la operadora; este servidor sólo ve `ctoken_…`, `ptoken_…`
 * y `btok_…`, de un solo uso, y no tiene nada que guardar. Es la razón de
 * hacerlo con tokens y no con un formulario normal: la regla 8 (los datos
 * personales no salen a herramientas externas) se cumple porque nunca entran.
 *
 * Es re-entrante: si la cuenta no existe, se crea con el token; si existe, se
 * actualiza. Stripe sólo reemplaza lo que el token trae, así que la operadora
 * puede volver a completar únicamente lo que falte. Y una cuenta que ya salió
 * a Stripe (Express) se rechaza: sus datos los recaba Stripe, no nosotros.
 */
export async function completarAltaCobro(
  operadorId: string,
  tokens: TokensDeAlta,
): Promise<ConnectResult<EstadoConnect>> {
  if (!altaCobroEnPlataforma()) {
    return { ok: false, error: "El alta dentro de la plataforma todavía no está prendida." };
  }
  if (!tokens.accountToken && !tokens.personTokens?.length && !tokens.bankToken) {
    return { ok: false, error: "No llegó nada que enviar." };
  }

  const stripe = getStripeServerClient();
  const op = await leerOperador(operadorId);
  if (!op) return { ok: false, error: "Ese operador no existe." };

  let accountId = op.stripe_account_id;
  try {
    if (!accountId) {
      // Sin cuenta todavía: se crea CON el token, que es la única forma de que
      // la aceptación del contrato (`tos_shown_and_accepted`) quede sellada con
      // fecha, IP y navegador de quien aceptó.
      if (!tokens.accountToken) {
        return { ok: false, error: "Faltan los datos de la cuenta para darla de alta." };
      }
      const alta = await crearCuentaConectada(operadorId, tokens.accountToken);
      if (!alta.ok) return alta;
      accountId = alta.data.accountId;
    } else {
      const cuenta = await stripe.accounts.retrieve(accountId);
      if (!recaudaLaPlataforma(cuenta)) {
        return { ok: false, error: "Esta cuenta se completa por su propio enlace, no desde aquí." };
      }
      if (tokens.accountToken) {
        await stripe.accounts.update(accountId, { account_token: tokens.accountToken });
      }
    }
    for (const person_token of tokens.personTokens ?? []) {
      await stripe.accounts.createPerson(accountId, { person_token });
    }
    if (tokens.bankToken) {
      // Un token de cuenta bancaria vale como `external_account`; sustituye a
      // la anterior de la misma moneda, que es lo que se quiere al corregir.
      await stripe.accounts.update(accountId, { external_account: tokens.bankToken });
    }
  } catch (error) {
    return { ok: false, error: `No se pudieron enviar los datos: ${(error as Error).message}` };
  }

  return refrescarEstado(operadorId);
}
