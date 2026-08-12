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

export type OperatorLegal = {
  razonSocial: string;
  rfc: string;
  domicilio: string;
  responsable?: string;
};

export type OperatorTheme = {
  operatorId: string;
  slug: string | null;
  name: string;
  branding: OperatorBranding;
  legal: OperatorLegal | null;
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

// ── Carga (best-effort: sin migrar / sin tema ⇒ null, jamás rompe) ───────────
type Row = {
  id: string;
  slug: string | null;
  name: string;
  branding: OperatorBranding | null;
  legal: OperatorLegal | null;
};

export async function fetchOperatorTheme(operatorId: string | null): Promise<OperatorTheme | null> {
  if (!operatorId) return null;
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("operators")
      .select("id, slug, name, branding, legal")
      .eq("id", operatorId)
      .maybeSingle();
    if (error || !data) return null; // columna sin migrar o fila ausente ⇒ sin tema
    const r = data as Row;
    if (!r.branding?.logoUrl || !r.branding?.colors?.primary || !r.branding?.colors?.accent) return null;
    return { operatorId: r.id, slug: r.slug, name: r.name, branding: r.branding, legal: r.legal ?? null };
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
      .maybeSingle();
    if (error || !data) return null;
    return fetchOperatorTheme((data as { id: string }).id);
  } catch {
    return null;
  }
}

// Tema del operador DUEÑO de una experiencia (el funnel se viste solo).
// Los viajes de la casa (operador Numan · Caminante, sin branding) ⇒ null.
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
