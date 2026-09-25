// EL ALCANCE — de quién es la información que esta sesión puede ver.
//
// Hasta hoy el panel tenía UNA puerta (`isCurrentUserAdmin`) y detrás de ella
// TODO: las 31 pantallas, el dinero de la plataforma, el CRM completo y —lo
// más grave— la columna «Alergias / condiciones / dieta» de cada caminante de
// cada salida. Aprobar a un operador externo lo metía ahí, porque
// `aprobarOperadorApp` lo daba de alta en `admin_whitelist`, que es una lista
// plana sin niveles. O sea: el socio que sube a un cerro con 11 personas veía
// los márgenes de Luis y los datos médicos de gente que nunca fue suya.
//
// El alcance es la respuesta. Se resuelve UNA vez por request desde la sesión
// y viaja con ella; las consultas no reciben un parámetro que alguien pueda
// olvidar, lo preguntan aquí. Dos reglas:
//
//   1. LA CASA MANDA. Si el correo está en `admin_whitelist` activo, el alcance
//      es «casa» y punto. Esto NO es un detalle: la fila de operador «Numan ·
//      Caminante» trae el correo de Luis, así que sin esta precedencia Luis
//      entraría a su propio panel como operador y se vería a sí mismo filtrado.
//   2. Operador = fila en `operators` con ese correo y `panel_activo = true`
//      (0042). NO basta con existir en la tabla: los EMBAJADORES también viven
//      ahí —se les crea su fila para atribuirles ventas— y un embajador vende,
//      no opera. Derivarlo de existir le habría abierto un panel a cada
//      embajador aprobado sin que nadie lo decidiera.
//
// Ojo con el modelo de confianza: la identidad es el CORREO, igual que en
// `admin_whitelist`. Quien controla el buzón del operador controla su panel.
// Es el mismo trato que ya teníamos, no uno nuevo.

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { esSesionMuerta } from "@/lib/auth/sesion-rota";
import { equipoDe, type EquipoEnSesion } from "@/lib/auth/equipo";
import { COOKIE_SOMBRERO } from "@/lib/auth/sombrero";
import { tieneFacultad } from "@/lib/equipo/facultades";

// EL EQUIPO (0070, 25 sep 2026) entra por aquí con DOS formas, y la forma es
// lo que hace que el resto del panel no tenga que enterarse:
//
//   · Equipo de una OPERADORA → alcance `operador` de esa operadora, con
//     `equipo` colgado. Todo lo que ya filtra por `esOperador()` —CRM,
//     experiencias, rosters, Mi alta— le aplica sin cambiar una línea: es la
//     operadora, acotada. Si trabaja para dos (Caminante y Kéntro), la cookie
//     del sombrero elige cuál, sólo entre las suyas.
//     ⚠️ Aquí el sombrero SÍ decide a nombre de quién se actúa, y es a
//     propósito: un empleado de Druidas actúa por Caminante o por Kéntro, y la
//     pastilla es su única forma de decirlo. El invariante #22 («los actos
//     nunca usan el sombrero») protege a la CASA, que actúa por cualquiera y
//     tiene que decirlo explícito; el equipo sólo puede actuar por las suyas.
//   · Equipo de NUMAN → alcance `equipo`: no es la casa (`tipo === "casa"`
//     sigue siendo falso, así que dinero, dispensas y llaves siguen cerradas) y
//     no es una operadora. Lo que sí puede lo abren a mano `puedeOnboarding()`
//     y `operadoraObjetivo()`.
//   · Las dos a la vez → en `/plataforma` es numan; en el resto, su operadora.

export type Alcance =
  | { tipo: "casa" }
  | { tipo: "operador"; operatorId: string; nombre: string; slug: string | null; equipo?: EquipoEnSesion }
  | { tipo: "equipo"; equipo: EquipoEnSesion };

/** ¿Este alcance está limitado a un operador? Estrecha el tipo. */
export function esOperador(
  a: Alcance | null,
): a is { tipo: "operador"; operatorId: string; nombre: string; slug: string | null; equipo?: EquipoEnSesion } {
  return a?.tipo === "operador";
}

/** El empleado detrás de esta sesión, si lo hay (de numan o de una operadora). */
export function equipoDelAlcance(a: Alcance | null): EquipoEnSesion | null {
  if (!a) return null;
  if (a.tipo === "equipo") return a.equipo;
  if (a.tipo === "operador") return a.equipo ?? null;
  return null;
}

async function alcanceDeEquipo(eq: EquipoEnSesion): Promise<Alcance | null> {
  const ruta = (await headers()).get("x-ruta") ?? "";
  const enPlataforma = ruta.startsWith("/caminante/admin/plataforma");
  if (eq.numan && (enPlataforma || eq.operadoras.length === 0)) return { tipo: "equipo", equipo: eq };
  if (!eq.operadoras.length) return null;
  const pedido = (await cookies()).get(COOKIE_SOMBRERO)?.value?.trim();
  const o = eq.operadoras.find((x) => x.slug === pedido) ?? eq.operadoras[0];
  return { tipo: "operador", operatorId: o.id, nombre: o.nombre, slug: o.slug, equipo: eq };
}

// `cache` de React memoiza POR REQUEST. Sin esto cada consulta del panel —y
// Panorama dispara siete— pagaría su propio `getUser()` contra Supabase.
export const alcanceActual = cache(async (): Promise<Alcance | null> => {
  let email: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email?.toLowerCase() ?? null;
  } catch (e) {
    // Sesión que ya no se puede refrescar = no hay sesión (ver sesion-rota.ts).
    if (!esSesionMuerta(e)) throw e;
    return null;
  }
  if (!email) return null;

  const sb = createSupabaseAdminClient();

  // 1 · La casa manda.
  const { data: wl, error: wlErr } = await sb
    .from("admin_whitelist")
    .select("email")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();
  // ⚠️ Ante un error de lectura NO se asume casa: se sigue al paso 2 y, si
  // tampoco hay operador, esta sesión no ve nada. El menor privilegio.
  if (!wlErr && wl) return { tipo: "casa" };

  // 2 · ¿Es del equipo? (0070). Antes que operador, igual que el rol.
  const eq = await equipoDe(email);
  if (eq) return alcanceDeEquipo(eq);

  // 3 · ¿Es un operador vivo?
  const { data: op, error: opErr } = await sb
    .from("operators")
    .select("id, name, slug")
    .eq("email", email)
    .eq("panel_activo", true)
    .maybeSingle();
  if (opErr || !op) return null;

  const r = op as { id: string; name: string | null; slug: string | null };
  return {
    tipo: "operador",
    operatorId: r.id,
    nombre: r.name || "Operador",
    slug: r.slug,
  };
});

/**
 * Los ids de experiencia que este alcance puede tocar.
 *
 * `null` significa SIN LÍMITE (la casa), no «ninguna» — es la diferencia entre
 * «no filtres» y «filtra por lista vacía», y confundirlas es la forma clásica
 * de que un filtro se caiga abierto. Por eso los llamadores hacen
 * `if (ids) ...filtrar` y nunca `ids?.length`.
 */
export const experienciasDelAlcance = cache(
  async (a: Alcance | null): Promise<string[] | null> => {
    if (!esOperador(a)) return null;
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("experiences")
      .select("id")
      .eq("operator_id", a.operatorId);
    if (error) return []; // sin poder confirmar de quién es, no se ve nada
    return ((data ?? []) as { id: string }[]).map((e) => e.id);
  },
);

/** ¿El alcance alcanza a esta experiencia (por id)? La casa siempre sí. */
export async function alcanzaExperiencia(
  a: Alcance | null,
  experienceId: string | null | undefined,
): Promise<boolean> {
  if (!esOperador(a)) return a?.tipo === "casa";
  if (!experienceId) return false;
  const ids = await experienciasDelAlcance(a);
  return !!ids && ids.includes(experienceId);
}

/** ¿El alcance alcanza a esta experiencia (por slug)? */
export async function alcanzaSlug(a: Alcance | null, slug: string): Promise<boolean> {
  if (!esOperador(a)) return a?.tipo === "casa";
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("experiences")
    .select("operator_id")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return false;
  return (data as { operator_id: string | null }).operator_id === a.operatorId;
}

/** ¿El alcance alcanza a esta salida? Se decide por la experiencia dueña. */
export async function alcanzaSlot(a: Alcance | null, slotId: string): Promise<boolean> {
  if (!esOperador(a)) return a?.tipo === "casa";
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("experience_slots")
    .select("experience_id")
    .eq("id", slotId)
    .maybeSingle();
  if (error || !data) return false;
  return alcanzaExperiencia(a, (data as { experience_id: string | null }).experience_id);
}

// ── Guardas para SERVER ACTIONS ──────────────────────────────────────────
//
// El gate del layout no cubre una action invocada directo (regla vieja de la
// casa, ver rules/auth-sesion.md). Estas tres son el equivalente de
// `isCurrentUserAdmin()` para lo que un operador SÍ puede tocar: siempre dicen
// que sí a la casa, y al operador solo sobre lo suyo.
//
// ⚠️ Lo que NO se abrió y no es descuido: registrar pagos, cancelar reservas,
// asignar operadores, mover comisiones, facturar, publicar en las redes de
// Caminante y mandar el boletín siguen exigiendo `isCurrentUserAdmin()`. Son
// dinero, identidad de la marca o administración de la plataforma.

/**
 * SOBRE QUÉ OPERADORA ACTÚA ESTA SESIÓN.
 *
 * Es la respuesta única a una pregunta que se hacía en dos lugares con dos
 * reglas distintas — y que en un tercero no se hacía. `connect-actions.ts`
 * dejaba pasar a la casa o a la operadora sobre sí misma; el expediente
 * (`expediente-actions.ts`) sólo aceptaba a la operadora, con lo que la casa no
 * podía subir un papel por nadie. Resultado real (Nomádika, sep 2026): una
 * operadora atorada y una casa que tampoco la podía destrabar. Ver
 * design/mvp/MVP.md §1.
 *
 *   · La CASA actúa sobre la operadora que diga (`pedida`). Sin decir cuál, no
 *     actúa sobre ninguna: adivinar sería peor.
 *   · Una OPERADORA actúa sólo sobre sí misma. Si el formulario trae otro id
 *     —viaja en un `<input hidden>`, cambiarlo es abrir el inspector— la
 *     respuesta es «ninguna», no «la suya»: escribir en silencio sobre otra
 *     fila de la que pidió es la forma de que un bug parezca que funcionó.
 *   · Sin sesión, ninguna.
 */
export async function operadoraObjetivo(pedida: string | null | undefined): Promise<string | null> {
  const a = await alcanceActual();
  if (!a) return null;
  const id = (pedida ?? "").trim();
  if (esOperador(a)) return !id || id === a.operatorId ? a.operatorId : null;
  // El equipo de numan actúa por la operadora que diga, como la casa, pero
  // sólo si tiene la facultad de onboarding. Sin ella, por ninguna.
  if (a.tipo === "equipo") return tieneFacultad(a.equipo, "onboarding") ? id || null : null;
  return id || null;
}

/**
 * ¿Puede hacer el onboarding de operadoras? La casa, o el equipo de numan con
 * esa facultad. Es la guarda de agendar la llamada, pedir expediente, aprobar
 * o rechazar una solicitud y resolver documentos y actividades. NO abre
 * dispensas, suspensiones ni comisiones: eso sigue siendo `isCurrentUserAdmin`.
 */
export async function puedeOnboarding(): Promise<boolean> {
  const a = await alcanceActual();
  if (!a) return false;
  if (a.tipo === "casa") return true;
  return a.tipo === "equipo" && a.equipo.numan && tieneFacultad(a.equipo, "onboarding");
}

/** ¿Puede escribir sobre esta experiencia (por slug)? */
export async function puedeEditarSlug(slug: string): Promise<boolean> {
  const a = await alcanceActual();
  if (!a) return false;
  return alcanzaSlug(a, slug);
}

/** ¿Puede escribir sobre esta experiencia (por id)? */
export async function puedeEditarExperiencia(experienceId: string): Promise<boolean> {
  const a = await alcanceActual();
  if (!a) return false;
  return alcanzaExperiencia(a, experienceId);
}

/** ¿Puede escribir sobre esta salida? */
export async function puedeEditarSlot(slotId: string): Promise<boolean> {
  const a = await alcanceActual();
  if (!a) return false;
  return alcanzaSlot(a, slotId);
}
