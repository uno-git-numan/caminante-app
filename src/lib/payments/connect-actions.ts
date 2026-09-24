"use server";

// Acciones del onboarding de Connect. Cada una re-verifica admin: el gate del
// layout no cubre server actions invocadas directo (misma regla que
// `eventos-actions.ts` y `solicitudes-actions.ts`).
//
// Devuelven `{ok, error}` en vez de `redirect()` porque las consumen componentes
// cliente, como el resto del panel (ConvenioForm, OperadorForm).

import { revalidatePath } from "next/cache";
import { operadoraObjetivo } from "@/lib/auth/alcance";

/**
 * ¿Puede tocar el expediente de ESTA operadora?
 *
 * Las cuatro acciones de aquí exigían `isCurrentUserAdmin()`, y por eso la ficha
 * de la casa mentía: marcaba «CSD fiscal · ÉL» y «Stripe Connect · ÉL» cuando
 * en realidad ninguno de los dos lo podía hacer él. Un candado con dueño pero
 * sin puerta es peor que no tener candado.
 *
 * La regla —la casa sobre cualquiera, la operadora sólo sobre sí misma— vive en
 * `operadoraObjetivo` (alcance.ts), que es la MISMA que usa el expediente. Aquí
 * estaba escrita aparte, y el expediente tenía otra: por eso la casa podía
 * conectarle Stripe a una operadora pero no subirle un papel.
 */
async function puedeTocarOperador(operadorId: string): Promise<boolean> {
  return !!operadorId && (await operadoraObjetivo(operadorId)) === operadorId;
}
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { crearLinkOnboarding, refrescarEstado, completarAltaCobro, type TokensDeAlta } from "@/lib/payments/connect";
import { erroresDeVerificacion, traducirPendientes, type ErrorDeVerificacion } from "@/lib/payments/alta-cobro";

const RUTA = "/caminante/admin/operadores/cobros";

export type ConnectActionResult = { ok: boolean; error?: string };

/**
 * Devuelve el link de KYC de Stripe para que el cliente navegue a él.
 *
 * El link se pide EN EL CLIC y se usa de inmediato: los Account Links caducan en
 * minutos y son de un solo uso, así que renderizarlo en la página lo volvería un
 * link muerto a la primera recarga. Por eso esto devuelve la URL en vez de
 * pintarla en un `<a href>`.
 */
export async function pedirLinkStripe(
  operadorId: string,
  origen?: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!(await puedeTocarOperador(operadorId))) return { ok: false, error: "No autorizado." };
  if (!operadorId) return { ok: false, error: "Falta el operador." };
  const r = await crearLinkOnboarding(operadorId, origen);
  return r.ok ? { ok: true, url: r.data.url } : { ok: false, error: r.error };
}

/**
 * Vuelve a preguntarle a Stripe en qué va la cuenta.
 *
 * El webhook `account.updated` mantiene esto al día solo, pero el botón existe
 * para dos casos reales: que el evento aún no llegue cuando el operador regresa
 * del flujo, y que el endpoint todavía no esté suscrito a eventos de cuentas
 * conectadas (una casilla del dashboard de Stripe, fácil de olvidar).
 */
export async function refrescarConexion(operadorId: string): Promise<ConnectActionResult> {
  if (!(await puedeTocarOperador(operadorId))) return { ok: false, error: "No autorizado." };
  if (!operadorId) return { ok: false, error: "Falta el operador." };
  const r = await refrescarEstado(operadorId);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath(RUTA);
  return { ok: true };
}

/**
 * Guarda las rutas del CSD ya subido y su vigencia.
 *
 * ⚠️ Los DOS archivos o ninguno. El SAT entrega `.cer` y `.key` y timbrar necesita
 * ambos; guardar uno solo dejaría el expediente viéndose completo y fallando en
 * producción. Por eso esta acción los exige juntos en vez de aceptar el que
 * llegue (0038 les dio una columna a cada uno).
 *
 * ⚠️ AQUÍ NO PASA NI SE GUARDA LA CONTRASEÑA DEL CSD. Va directo a Facturapi al
 * crear la organización del operador. Si algún día llegara una en este FormData,
 * sería un bug, no una funcionalidad.
 */
export async function guardarCsd(formData: FormData): Promise<ConnectActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!(await puedeTocarOperador(id))) return { ok: false, error: "No autorizado." };
  const cer = String(formData.get("cerPath") ?? "").trim();
  const key = String(formData.get("keyPath") ?? "").trim();
  const vence = String(formData.get("vence") ?? "").trim();
  if (!id) return { ok: false, error: "Falta el operador." };
  if (!cer || !key) return { ok: false, error: "Faltan los dos archivos: el .cer y el .key." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(vence)) {
    return { ok: false, error: "Falta la fecha de vigencia del CSD (la trae el acuse del SAT)." };
  }

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("operators")
    .update({
      csd_cer_path: cer,
      csd_key_path: key,
      csd_vence_at: vence,
      csd_subido_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(RUTA);
  return { ok: true };
}

/**
 * Datos fiscales del EMISOR del CFDI.
 *
 * ⚠️ Escribe las columnas PLANAS (`rfc`, `razon_social`, …), que son las que lee
 * `operadorListo` y las que consumirá Facturapi. NO toca `operators.legal`, el
 * jsonb del convenio: ese describe a la entidad que responde por el deslinde y
 * lo edita su propio formulario.
 *
 * Se solapan en dos campos —RFC y razón social— y eso ya mordió: Kéntro tenía su
 * RFC en `legal` y las columnas planas en NULL, así que el gate lo reportaba como
 * faltante estando capturado. Mientras las dos existan, la pantalla PRE-LLENA
 * desde `legal` para que nadie lo teclee dos veces, y la fuente de verdad para
 * facturar es esta. Unificarlas es una migración aparte, con decisión de Luis.
 */
export async function guardarFiscales(formData: FormData): Promise<ConnectActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  if (!(await puedeTocarOperador(id))) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Falta el operador." };

  const t = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  const rfc = t("rfc", 13).toUpperCase();
  const razonSocial = t("razonSocial", 200);
  const regimenFiscal = t("regimenFiscal", 3);
  const cpFiscal = t("cpFiscal", 5);
  const tipoPersona = t("tipoPersona", 10);

  // Un RFC a medias es peor que ninguno: se timbra mal y se corrige tarde.
  // Mismo criterio (y misma expresión) que el formulario del convenio.
  if (rfc && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc)) {
    return { ok: false, error: "Ese RFC no tiene forma de RFC. Déjalo vacío si aún no lo tienes." };
  }
  if (cpFiscal && !/^\d{5}$/.test(cpFiscal)) {
    return { ok: false, error: "El código postal fiscal son 5 dígitos." };
  }
  // El régimen es una clave del catálogo del SAT (601, 612, 626…). Se valida la
  // forma, no el valor: el catálogo completo vive en `lib/facturacion`.
  if (regimenFiscal && !/^\d{3}$/.test(regimenFiscal)) {
    return { ok: false, error: "El régimen fiscal es la clave de 3 dígitos del SAT (601, 612, 626…)." };
  }
  if (tipoPersona && tipoPersona !== "fisica" && tipoPersona !== "moral") {
    return { ok: false, error: "Persona física o moral." };
  }

  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("operators")
    .update({
      // Vacío se guarda como NULL, no como cadena vacía: el gate pregunta por
      // ausencia y un "" respondería que sí hay dato.
      rfc: rfc || null,
      razon_social: razonSocial || null,
      regimen_fiscal: regimenFiscal || null,
      cp_fiscal: cpFiscal || null,
      tipo_persona: tipoPersona || null,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath(RUTA);
  return { ok: true };
}

/**
 * «¿Quién firma?» — persona física o moral, SOLA.
 *
 * Existe aparte de `guardarFiscales` porque ésa escribe los cinco campos
 * fiscales a la vez: llamarla con sólo la persona habría puesto en NULL el RFC,
 * la razón social, el régimen y el código postal de quien ya los capturó. Lo
 * pide el paso 03 de Mi alta (lámina «Panel Operadora»), antes de firmar,
 * porque cambia qué documento sostiene la firma: la identificación, o el acta y
 * el poder del representante.
 */
export async function guardarTipoPersona(
  operadorId: string,
  tipo: "fisica" | "moral",
): Promise<ConnectActionResult> {
  const id = (operadorId ?? "").trim();
  if (!(await puedeTocarOperador(id))) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Falta el operador." };
  if (tipo !== "fisica" && tipo !== "moral") return { ok: false, error: "Persona física o moral." };
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("operators").update({ tipo_persona: tipo }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(RUTA);
  revalidatePath("/caminante/admin/mi-alta");
  return { ok: true };
}

export type ResAltaCobro =
  | { ok: true; verificada: boolean; pendientes: string[]; errores: ErrorDeVerificacion[] }
  | { ok: false; error: string };

/**
 * El alta de la cuenta de cobro DENTRO de la plataforma: recibe los tokens que
 * Stripe.js hizo en el navegador de la operadora y los manda. Ver
 * `completarAltaCobro` y alta-cobro.ts.
 *
 * ⚠️ EXIGE EL CONVENIO FIRMADO. En pantalla no aparece el contrato del
 * procesador (decisión de Luis, 24 sep 2026); la aceptación que Stripe pide
 * vive en la Cuarta §7 del convenio. Sin firma no hay nada aceptado, y dar de
 * alta la cuenta sería sellar un `tos_acceptance` que no respalda ningún
 * documento. El candado va aquí, en el servidor, aunque la pantalla también
 * lo enseñe: una pantalla se puede saltar; una acción no.
 */
export async function completarAltaCobroAction(
  operadorId: string,
  tokens: TokensDeAlta,
): Promise<ResAltaCobro> {
  const id = (operadorId ?? "").trim();
  if (!(await puedeTocarOperador(id))) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Falta el operador." };

  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("operators").select("convenio_firmado_at").eq("id", id).maybeSingle();
  if (!(data as { convenio_firmado_at?: string | null } | null)?.convenio_firmado_at) {
    return { ok: false, error: "Primero firma tu convenio: ahí está lo que aceptas al abrir tu cuenta de cobro." };
  }

  const t: TokensDeAlta = {
    accountToken: soloToken(tokens.accountToken, "ctoken_"),
    personTokens: (tokens.personTokens ?? []).map((p) => soloToken(p, "ptoken_")).filter((p): p is string => !!p),
    bankToken: soloToken(tokens.bankToken, "btok_"),
  };
  const r = await completarAltaCobro(id, t);
  if (!r.ok) return { ok: false, error: r.error };
  revalidatePath(RUTA);
  revalidatePath("/caminante/admin/mi-alta");
  revalidatePath("/caminante/admin/mi-alta/cobrar");
  return {
    ok: true,
    verificada: r.data.chargesEnabled,
    pendientes: traducirPendientes(r.data.pendientes),
    errores: erroresDeVerificacion(r.data.errores),
  };
}

// Lo que llega del cliente tiene que PARECER un token de Stripe. No es
// seguridad —el token ya es de un solo uso y de nuestra cuenta— sino la
// garantía de que por aquí no entra un dato personal por error: un RFC o una
// CLABE en crudo no empiezan con `ctoken_`, y se descartan sin leerse.
function soloToken(v: string | undefined, prefijo: string): string | undefined {
  const s = (v ?? "").trim();
  return s.startsWith(prefijo) && /^[a-z]+_[A-Za-z0-9]+$/.test(s) ? s : undefined;
}
