"use server";

// Acciones del onboarding de Connect. Cada una re-verifica admin: el gate del
// layout no cubre server actions invocadas directo (misma regla que
// `eventos-actions.ts` y `solicitudes-actions.ts`).
//
// Devuelven `{ok, error}` en vez de `redirect()` porque las consumen componentes
// cliente, como el resto del panel (ConvenioForm, OperadorForm).

import { conectarCsdFacturapi, sincronizarLegalFacturapi } from "@/lib/facturacion/organizacion";
import { organizacionesActivas } from "@/lib/facturacion/facturapi";
import { constanciasDe } from "@/lib/operadores/constancia-fiscal";
import { analizarCsf } from "@/lib/operadores/csf";
import { leerCer } from "@/lib/facturacion/cer";
import { revalidatePath } from "next/cache";
import { guardarClabe } from "@/lib/operadores/fiscal-privado";
import { alcanceActual, esOperador, operadoraObjetivo } from "@/lib/auth/alcance";

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
  // ⚠️ LA OPERADORA NO VA AL ENLACE DE STRIPE (Luis, 11 nov 2026: «nosotros no
  // queremos que entren nunca a Stripe»). Sus datos se van a pedir aquí y
  // mandar desde aquí (alta dentro de la plataforma, pendiente de la pregunta
  // i3 a legal). Mientras tanto el enlace sólo lo abre la casa. Se cierra en
  // el servidor, no sólo en la pantalla: un botón escondido no es un candado.
  if (esOperador(await alcanceActual())) {
    return { ok: false, error: "Tu cuenta de cobro la preparamos nosotros: no tienes que entrar a ningún otro sitio. Te avisamos cuando haga falta un dato tuyo." };
  }
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
/**
 * La CLABE donde la operadora recibe sus depósitos, para la informativa
 * mensual de plataformas (LIVA 18-J III, D4). Se valida el dígito de control
 * y el banco sale de sus 3 primeros dígitos (lib/fiscal/clabe.ts). Sólo se
 * teclea el banco si el prefijo no está en el listado de Banxico.
 */
export async function guardarClabeAction(
  operadorId: string,
  clabe: string,
  banco?: string | null,
): Promise<{ ok: true; banco: string } | { ok: false; error: string; pideBanco?: boolean }> {
  if (!(await puedeTocarOperador(operadorId))) return { ok: false, error: "No autorizado." };
  const r = await guardarClabe(createSupabaseAdminClient(), operadorId, clabe, banco);
  if (r.ok) revalidatePath(RUTA);
  return r;
}

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
  if (!id) return { ok: false, error: "Falta el operador." };
  if (!cer || !key) return { ok: false, error: "Faltan los dos archivos: el .cer y el .key." };

  // La vigencia y el RFC se LEEN del .cer (cer.ts); ya no se teclean.
  const sb = createSupabaseAdminClient();
  const { data: archivoCer } = await sb.storage.from("csd").download(cer);
  const lectura = archivoCer ? leerCer(Buffer.from(await archivoCer.arrayBuffer())) : null;
  if (!lectura) return { ok: false, error: "Ese .cer no se pudo leer como certificado. ¿Es el que te dio el SAT?" };
  const { data: suyo } = await sb.from("operators").select("rfc").eq("id", id).maybeSingle();
  const rfcSuyo = ((suyo as { rfc?: string | null } | null)?.rfc ?? "").trim().toUpperCase();
  if (rfcSuyo && lectura.rfc && lectura.rfc !== rfcSuyo) {
    return { ok: false, error: `Ese sello es del RFC ${lectura.rfc}, y el de la operadora es ${rfcSuyo}.` };
  }
  const vence = lectura.venceAt;
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

  // Con la contraseña, el CSD sube a la organización de Facturapi de la
  // operadora (se crea si no existe) y quedan sus llaves de emisión (0076). Sin
  // contraseña, o sin conexión activa, el expediente se guarda igual y el sello
  // se conecta después desde este mismo formulario.
  const password = String(formData.get("password") ?? "");
  if (password && organizacionesActivas()) {
    const org = await conectarCsdFacturapi(id, password);
    if (!org.ok) {
      revalidatePath(RUTA);
      return { ok: false, error: `CSD guardado en el expediente, pero no quedó conectado al PAC: ${org.error}` };
    }
  }

  revalidatePath(RUTA);
  return { ok: true };
}

/**
 * LOS DATOS FISCALES YA NO SE TECLEAN (Luis, 9 nov 2026: «que salgan de la
 * constancia y no pidamos»). `analizarCsf` los escribe cuando el SAT confirma
 * la constancia (`fiscal-de-csf.ts`). Aquí sólo quedan las dos cosas que una
 * persona todavía puede tener que hacer:
 *
 * 1 · ELEGIR RÉGIMEN, cuando la constancia trae más de uno de negocio (p. ej.
 *     612 y 625). Sólo se acepta uno de LOS QUE TRAE su constancia: no es un
 *     campo libre, es escoger entre lo que el SAT ya dijo.
 */
export async function elegirRegimen(operadorId: string, clave: string): Promise<ConnectActionResult> {
  const id = (operadorId ?? "").trim();
  if (!(await puedeTocarOperador(id))) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Falta el operador." };
  const constancia = (await constanciasDe([id])).get(id);
  if (!constancia?.resultado.ok) return { ok: false, error: "Primero tiene que estar confirmada su constancia fiscal." };
  if (!constancia.resultado.datos.regimenes.includes(clave)) {
    return { ok: false, error: "Ese régimen no está en su constancia." };
  }
  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("operators").update({ regimen_fiscal: clave }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await sincronizarSiHayOrganizacion(id);
  revalidatePath(RUTA);
  revalidatePath("/caminante/admin/mi-alta");
  return { ok: true };
}

/**
 * 2 · VOLVER A LEER la constancia: cuando el SAT no respondió la primera vez o
 *     la lectura falló. Corre lo mismo que al subirla.
 */
export async function releerConstancia(operadorId: string): Promise<ConnectActionResult> {
  const id = (operadorId ?? "").trim();
  if (!(await puedeTocarOperador(id))) return { ok: false, error: "No autorizado." };
  if (!id) return { ok: false, error: "Falta el operador." };
  const constancia = (await constanciasDe([id])).get(id);
  if (!constancia) return { ok: false, error: "No hay constancia subida en el expediente." };
  const a = await analizarCsf(constancia.docId);
  if (!a) return { ok: false, error: "No se pudo leer la constancia." };
  await sincronizarSiHayOrganizacion(id);
  revalidatePath(RUTA);
  revalidatePath("/caminante/admin/mi-alta");
  return { ok: true };
}

// Si la operadora ya tiene organización en Facturapi, sus datos legales se
// actualizan allá también (best-effort: el dato nuestro ya quedó guardado).
async function sincronizarSiHayOrganizacion(id: string) {
  if (!organizacionesActivas()) return;
  const sb = createSupabaseAdminClient();
  const { data: op } = await sb
    .from("operators")
    .select("facturapi_org_id, es_la_casa, rfc, razon_social, regimen_fiscal, cp_fiscal")
    .eq("id", id)
    .maybeSingle();
  if (!op?.facturapi_org_id || op.es_la_casa) return;
  if (!(op.rfc && op.razon_social && op.regimen_fiscal && op.cp_fiscal)) return;
  const r = await sincronizarLegalFacturapi(id);
  if (!r.ok) console.error("[fiscales] Facturapi legal:", r.error);
}

/**
 * «¿Quién firma?» — persona física o moral, SOLA.
 *
 * Cuando la constancia ya está confirmada, la persona la dice su RFC y este
 * botón sobra (`fiscal-de-csf.ts` la corrige). Lo pide el paso 03 de Mi alta (lámina «Panel Operadora»), antes de firmar,
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
