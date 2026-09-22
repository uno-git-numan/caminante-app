"use server";

// GUARDAR LA MARCA DESDE EL PANEL — la tercera superficie que marca.ts prometía.
//
// Las otras dos (el formulario público de aplicar y el alta por la casa) exigen
// los DOS colores para guardar algo. Aquí no: esta pantalla es donde una
// operadora que llegó con logo y sin paleta —o al revés— completa lo que le
// falta, en el orden que quiera, y lo que deje a medias se guarda. Lo que
// decide si la marca VISTE es `marcaLista`, no si se guardó.
//
// ⚠️ SOBRE QUIÉN se guarda lo decide `operadoraObjetivo`: la casa sobre quien
// diga (`operadora`, input oculto), la operadora sólo sobre sí misma.

import { revalidatePath } from "next/cache";
import { operadoraObjetivo } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { color, logoUrl } from "@/lib/operators/marca";
import type { OperatorBranding } from "@/lib/operators/branding";

export type Res = { ok: true; completa: boolean } | { ok: false; error: string };

export async function guardarMarca(formData: FormData): Promise<Res> {
  const operatorId = await operadoraObjetivo(String(formData.get("operadora") ?? ""));
  if (!operatorId) return { ok: false, error: "No hay una operadora sobre la que guardar esto." };

  const t = (k: string) => String(formData.get(k) ?? "").trim();

  // Un color mal tecleado se rechaza en la puerta: `color-mix()` con basura
  // devuelve el heredado y la página se vería Caminante sin que nada fallara.
  const primaryCrudo = t("marcaPrimary");
  const accentCrudo = t("marcaAccent");
  const primary = primaryCrudo ? color(primaryCrudo) : "";
  const accent = accentCrudo ? color(accentCrudo) : "";
  if (primaryCrudo && !primary) return { ok: false, error: "El color principal no es un hex válido (#637154)." };
  if (accentCrudo && !accent) return { ok: false, error: "El color de acento no es un hex válido (#ff5d36)." };

  const logoCrudo = t("marcaLogo");
  const logo = logoCrudo ? logoUrl(logoCrudo) : "";
  if (logoCrudo && !logo) return { ok: false, error: "El logo tiene que ser una liga https a un .png, .jpg, .svg o .webp." };
  const logoOscuroCrudo = t("marcaLogoOscuro");
  const logoOscuro = logoOscuroCrudo ? logoUrl(logoOscuroCrudo) : "";
  if (logoOscuroCrudo && !logoOscuro) return { ok: false, error: "El logo para fondo oscuro tiene que ser una liga https a una imagen." };

  const poweredBy = t("poweredBy") === "visible" ? "visible" : "discreto";
  const footerLine = t("marcaPie").replace(/\s+/g, " ").slice(0, 200);

  const sb = createSupabaseAdminClient();
  const { data: previa, error: errLeer } = await sb.from("operators").select("branding").eq("id", operatorId).maybeSingle();
  if (errLeer) return { ok: false, error: "No se pudo leer la marca actual." };
  const antes = ((previa as { branding: OperatorBranding | null } | null)?.branding ?? null) as
    | (Partial<OperatorBranding> & Record<string, unknown>)
    | null;

  // Se conserva lo que esta pantalla no toca (fuente, favicon, OG) y se pisa
  // sólo lo capturado aquí. Vacío en un campo = vacío; no «deja el anterior»:
  // borrar el logo tiene que poder hacerse.
  const branding = {
    ...(antes ?? {}),
    logoUrl: logo ?? "",
    ...(logoOscuro ? { logoDarkUrl: logoOscuro } : { logoDarkUrl: undefined }),
    colors: { ...(antes?.colors ?? {}), primary: primary ?? "", accent: accent ?? "" },
    poweredBy,
    ...(footerLine ? { footerLine } : { footerLine: undefined }),
  };
  // JSON no guarda `undefined`; se limpia para que la columna no cargue llaves vacías.
  const limpio = JSON.parse(JSON.stringify(branding)) as OperatorBranding;

  const { error } = await sb.from("operators").update({ branding: limpio }).eq("id", operatorId);
  if (error) {
    console.error("guardarMarca:", error);
    return { ok: false, error: "No se pudo guardar la marca." };
  }

  revalidatePath("/caminante/admin/mi-alta");
  revalidatePath("/caminante/admin/mi-alta/marca");
  revalidatePath("/caminante/admin/plataforma/comunidad");
  return { ok: true, completa: !!(primary && accent) };
}
