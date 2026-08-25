// WHITE-LABEL de operadores — CONTRATO del tema + generador del override de
// CSS vars. La casa entera ya corre sobre estas variables (--cream/--charcoal/
// --olive/--orange/--forest/--panel...), así que "vestir" una superficie con la
// marca del operador = inyectar un <style> con este override DESPUÉS del CSS
// base. Sin tema (branding null o columna sin migrar) todo se ve Caminante:
// compat total, cero riesgo para las páginas propias.
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// ── Contrato (operators.branding jsonb) ──────────────────────────────────────
export type OperatorBranding = {
  logoUrl: string; // logo principal (sobre fondo claro)
  logoDarkUrl?: string; // versión para fondo oscuro/foto (si falta, se usa logoUrl)
  colors: {
    primary: string; // sustituye al olivo (botones, links, eyebrows)
    accent: string; // sustituye al naranja (CTAs, itálicas de acento)
    bg?: string; // fondo claro (default crema de la casa)
    ink?: string; // tinta (default carbón)
    dark?: string; // fondo oscuro (default derivado del primary)
  };
  font?: {
    family?: string; // ej. "Fraunces", para display
    cssUrl?: string; // hoja de la fuente (Google Fonts) — SOLO web, exports no (F4)
  };
  faviconUrl?: string;
  ogImageUrl?: string;
  footerLine?: string; // línea legal/branding del pie
  poweredBy?: "discreto" | "visible"; // default discreto (mono 11px)
};

// ⚠️ SIN `rfc` ni `razonSocial` desde la 0038. Esto describe a quien RESPONDE por
// el viaje en el deslinde; quien EMITE la factura vive en las columnas planas
// (`rfc`, `razon_social`, `regimen_fiscal`, `cp_fiscal`). Hoy suelen ser la misma
// entidad, pero tenerlo en dos lugares ya causó que el gate reportara como
// faltante un RFC que sí estaba capturado.
export type OperatorLegal = {
  domicilio: string;
  responsable?: string;
};

export type OperatorTheme = {
  operatorId: string;
  slug: string | null;
  name: string;
  branding: OperatorBranding;
  legal: OperatorLegal | null;
  /** Razón social del emisor (columna plana). El pie del portal la muestra. */
  razonSocial: string | null;
};

// ── Generador del override ────────────────────────────────────────────────────
// Emite SOLO variables: se inyecta después del CSS base de cada superficie y
// las clases existentes toman los colores del operador sin tocar una sola
// regla. Derivados con color-mix() (soportado en todos los navegadores
// actuales) para no pedirle al operador 12 colores: pide 2, deriva el resto.
export function themeCssFor(scope: string, b: OperatorBranding): string {
  const c = b.colors;
  const bg = c.bg || "#fbfbf7";
  const ink = c.ink || "#20211c";
  const dark = c.dark || `color-mix(in srgb, ${c.primary} 55%, #101210)`;
  const vars = [
    `--cream:${bg}`,
    `--charcoal:${ink}`,
    `--olive:${c.primary}`,
    `--olive-d:color-mix(in srgb, ${c.primary} 82%, #000)`,
    `--forest:${dark}`,
    `--orange:${c.accent}`,
    `--salvia:color-mix(in srgb, ${c.primary} 18%, ${bg})`,
    `--sand:color-mix(in srgb, ${ink} 32%, ${bg})`,
    `--dune:color-mix(in srgb, ${c.accent} 26%, ${bg})`,
    `--panel:color-mix(in srgb, ${ink} 5%, ${bg})`,
    `--line:color-mix(in srgb, ${ink} 13%, transparent)`,
    `--ink-soft:color-mix(in srgb, ${ink} 60%, transparent)`,
  ].join(";");
  const font =
    b.font?.family
      ? `${scope} .wl-display,${scope} h1,${scope} h2{font-family:"${b.font.family}","Geist",system-ui,sans-serif;}`
      : "";
  return `${scope}{${vars};}${font}`;
}


// ── El OTRO vocabulario: el de la app (Tailwind) ─────────────────────────────
//
// ⚠️ ESTO NO ES DUPLICADO. El sitio tiene DOS juegos de variables con los MISMOS
// nombres significando cosas distintas, y confundirlos pinta mal sin fallar:
//
//                    landing / .pub / kit        globals.css (Tailwind)
//   --olive          el VERDE de marca           un GRIS calido de texto
//   --dune           tinte claro del acento      el NARANJA de acento
//   --lagoon         (no existe)                 el VERDE primario
//
// `themeCssFor` emite el primero y viste el portal del operador. Si se inyectara
// tal cual sobre las pantallas de Tailwind (experiencia, reservar, deslinde,
// exito) pondria el verde del operador en el TEXTO SECUNDARIO y su acento en un
// tinte palido: un resultado equivocado y dificil de diagnosticar, porque nada
// falla.
//
// Por eso hay dos emisores. Cada superficie usa el que le corresponde.
//
// El enchufe en globals.css NO es `var(--lagoon)` sino un namespace propio,
// `--color-lagoon: var(--app-lagoon, #3E4836)`. Por eso esta funcion emite
// `--app-*` y no los nombres pelones: media docena de hojas inyectadas por
// pagina (template-v2, destinos, deck, kit, tablero) redefinen `:root{--lagoon}`
// con otro vocabulario, y enrutar a `var(--lagoon)` les habria cambiado el color
// a paginas de Caminante que nada tienen que ver con ningun operador.
//
// Consecuencia util: sin white-label la utilidad cae al hex literal de siempre,
// asi que las paginas de la casa quedan intactas POR CONSTRUCCION.
export function themeCssAppFor(scope: string, b: OperatorBranding): string {
  const c = b.colors;
  const bg = c.bg || "#fbfbf7";
  const ink = c.ink || "#20211c";
  const vars = [
    // primario del operador → el verde de la app
    `--app-lagoon:${c.primary}`,
    `--app-lagoon-light:color-mix(in srgb, ${c.primary} 78%, #fff)`,
    // acento del operador → el naranja de la app
    `--app-dune:${c.accent}`,
    `--app-dune-light:color-mix(in srgb, ${c.accent} 84%, #000)`,
    // superficie y tinta
    `--app-cream:${bg}`,
    `--app-charcoal:${ink}`,
    // derivados, atados al operador para que no queden desentonando
    `--app-sand:color-mix(in srgb, ${ink} 22%, ${bg})`,
    `--app-sage:color-mix(in srgb, ${c.primary} 42%, ${bg})`,
    // ⚠️ --app-olive NO se toca: aqui es el gris de texto secundario, no la
    //    marca. Pintarlo del color del operador haria ilegible medio parrafo.
    // ⚠️ --app-forest y --app-clay tampoco: son SEMANTICOS (exito y peligro).
    //    Un operador con marca roja no debe volver rojo el "incluye".
  ].join(";");
  const font = b.font?.family
    ? `${scope} h1,${scope} h2,${scope} h3{font-family:"${b.font.family}","Geist",system-ui,sans-serif;}`
    : "";
  return `${scope}{${vars};}${font}`;
}

// ── Carga (best-effort: sin migrar / sin tema ⇒ null, jamás rompe) ───────────
type Row = {
  id: string;
  slug: string | null;
  name: string;
  branding: OperatorBranding | null;
  legal: OperatorLegal | null;
  razon_social: string | null;
};

export async function fetchOperatorTheme(operatorId: string | null): Promise<OperatorTheme | null> {
  if (!operatorId) return null;
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("operators")
      .select("id, slug, name, branding, legal, razon_social")
      .eq("id", operatorId)
      .maybeSingle();
    if (error || !data) return null; // columna sin migrar o fila ausente ⇒ sin tema
    const r = data as Row;
    // ⚠️ EL MÍNIMO SON LOS DOS COLORES, NO EL LOGO — igual que `marcaLista` en
    // marca.ts, que es la fuente única del contrato. Este candado SÍ exigía
    // logo, y como aquí no falla nada visible, un operador con paleta y sin
    // logo se quedaba sin tema en silencio: ni la pantalla truena ni el panel
    // avisa. Exigirlo aquí además tapaba desde arriba un bug de la superficie
    // (el portal pintaba `src=""`, que el navegador resuelve como la propia
    // página); ese hoyo se cerró donde vive, en /caminante/o/[slug].
    if (!r.branding?.colors?.primary || !r.branding?.colors?.accent) return null;
    return {
      operatorId: r.id,
      slug: r.slug,
      name: r.name,
      branding: r.branding,
      legal: r.legal ?? null,
      razonSocial: r.razon_social ?? null,
    };
  } catch {
    return null;
  }
}

// Tema por slug de operador (mini-portal /caminante/o/[slug]).
export async function fetchOperatorThemeBySlug(slug: string): Promise<OperatorTheme | null> {
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("operators")
      .select("id")
      .eq("slug", slug)
      // ⚠️ `is_public` es OBLIGATORIO aquí. El portal /caminante/o/<slug> es una
      // página pública sobre el operador, igual que su perfil — y el perfil sí
      // lo exigía (public.ts). Sin este filtro bastaba tener branding para
      // quedar publicado: al poner a Kéntro en pausa el 11 de agosto, su perfil
      // desapareció pero su portal siguió en el aire respondiendo 200. Dos
      // superficies públicas del mismo operador no pueden tener reglas
      // distintas, y menos que la permisiva sea la nueva.
      .eq("is_public", true)
      .maybeSingle();
    if (error || !data) return null;
    return fetchOperatorTheme((data as { id: string }).id);
  } catch {
    return null;
  }
}

// Tema del operador DUEÑO de una experiencia (el funnel se viste solo).
// Los viajes de la casa (operador Numan · Caminante, sin branding) ⇒ null.
//
// ⚠️ A propósito NO filtra por `is_public`, al revés que el portal por slug.
// `is_public` decide si el operador tiene PERFIL público (una página sobre él);
// esto decide de quién es el viaje que se está vendiendo. Kéntro está en pausa
// como perfil y aun así su experiencia debe verse suya: quien compra tiene que
// ver la misma marca que va a firmar en el deslinde y a recibir en la factura.
export async function fetchThemeForExperience(experienceSlug: string): Promise<OperatorTheme | null> {
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("experiences")
      .select("operator_id")
      .eq("slug", experienceSlug)
      .maybeSingle();
    if (error || !data) return null;
    return fetchOperatorTheme((data as { operator_id: string | null }).operator_id);
  } catch {
    return null;
  }
}

// Tema del operador ATRIBUIDO a una reserva ya pagada. Lo usa la pantalla de
// éxito, que no siempre trae slug.
//
// ⚠️ Se lee `reservations.operator_id`, no el de la experiencia. La 0016
// CONGELA el operador al momento de la venta: si mañana la experiencia cambia
// de dueño, quien compró hoy debe seguir viendo la marca de quien le vendió —
// es la misma que dice su deslinde y la que va a facturarle.
export async function fetchThemeForReservation(reservationId: string): Promise<OperatorTheme | null> {
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("reservations")
      .select("operator_id")
      .eq("id", reservationId)
      .maybeSingle();
    if (error || !data) return null;
    return fetchOperatorTheme((data as { operator_id: string | null }).operator_id);
  } catch {
    return null;
  }
}
