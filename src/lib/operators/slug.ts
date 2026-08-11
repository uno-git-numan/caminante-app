// La dirección pública del operador: /caminante/operador/<slug>.
//
// ⚠️ El hueco que esto cierra (11 ago, preparando el primer onboarding real):
// NADA asignaba `slug` nunca. Los dos operadores que sí lo tienen —Numan y
// Kéntro— lo recibieron de un `update` a mano en las migraciones 0020 y 0030.
// Cualquier operador nacido de aprobar una aplicación quedaba con `slug = NULL`,
// y eso rompe tres cosas a la vez: el panel muestra el link como
// «/caminante/operador/» (a la nada), «Vista previa» no lleva a ningún lado, y
// `setOperatorPublic` publicaría un perfil imposible de alcanzar. El chip
// «Operada por» de la experiencia también los filtra (`public.ts` exige slug),
// así que el operador quedaba invisible sin que nada avisara.
//
// El slug se calcula del NOMBRE, una sola vez, y después no se vuelve a tocar:
// es una URL que ya se compartió y renombrarla rompe links vivos. Si el
// operador cambia de nombre comercial, la dirección se cambia a mano y con
// intención.

import type { SupabaseClient } from "@supabase/supabase-js";

/** «Kéntro Hospitalidad» → «kentro-hospitalidad». Vacío si no queda nada usable. */
export function slugify(nombre: string): string {
  return (nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // acentos fuera: la URL va en ASCII
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/**
 * Un slug libre a partir del nombre. Si ya está tomado prueba `-2`, `-3`… — la
 * columna es UNIQUE y dos operadoras pueden llamarse parecido.
 * Devuelve null si del nombre no sale nada (p. ej. puros símbolos).
 */
export async function slugLibre(
  sb: SupabaseClient,
  nombre: string,
): Promise<string | null> {
  const base = slugify(nombre);
  if (!base) return null;
  for (let i = 1; i <= 50; i++) {
    const cand = i === 1 ? base : `${base}-${i}`;
    const { data } = await sb.from("operators").select("id").eq("slug", cand).maybeSingle();
    if (!data) return cand;
  }
  return null;
}
