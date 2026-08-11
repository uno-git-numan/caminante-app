// Fotos reales para las pantallas del sitio público móvil.
//
// El entregable de Claude Design pinta rectángulos de color con un `data-banco`
// que dice qué debería ir ahí ("paisaje · nosotros", "comunidad · nosotros").
// Esto resuelve ese hueco con el BANCO DE FOTOS real de las experiencias
// publicadas (`Experience.photoBank`, 8 slots tipados), que es la misma fuente
// que usa el Kit. Cero fotos inventadas y cero archivos sueltos que mantener.
//
// Si el banco está vacío devuelve una lista vacía: la pantalla decide si se
// degrada o si esconde el bloque. Nunca se rellena con algo que no es del lugar.

import { fetchPublishedExperienceRows } from "@/lib/experiences/queries";
import type { Experience } from "@/lib/experiences/types";

export type CatFoto = keyof NonNullable<Experience["photoBank"]>;

/**
 * Fotos del banco de TODAS las experiencias publicadas, de las categorías
 * pedidas y en ese orden de preferencia. Deduplica por URL.
 */
export async function fotosDelBanco(cats: CatFoto[], max = 6): Promise<string[]> {
  const rows = await fetchPublishedExperienceRows();
  const vistas = new Set<string>();
  const out: string[] = [];
  for (const cat of cats) {
    for (const r of rows) {
      for (const url of r.data?.photoBank?.[cat] || []) {
        if (!url || vistas.has(url)) continue;
        vistas.add(url);
        out.push(url);
        if (out.length >= max) return out;
      }
    }
  }
  return out;
}

/** La primera foto de las categorías pedidas, o null si el banco no tiene. */
export async function unaFotoDelBanco(cats: CatFoto[]): Promise<string | null> {
  return (await fotosDelBanco(cats, 1))[0] ?? null;
}
