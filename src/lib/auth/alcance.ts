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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { esSesionMuerta } from "@/lib/auth/sesion-rota";

export type Alcance =
  | { tipo: "casa" }
  | { tipo: "operador"; operatorId: string; nombre: string; slug: string | null };

/** ¿Este alcance está limitado a un operador? Estrecha el tipo. */
export function esOperador(
  a: Alcance | null,
): a is { tipo: "operador"; operatorId: string; nombre: string; slug: string | null } {
  return a?.tipo === "operador";
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

  // 2 · ¿Es un operador vivo?
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
