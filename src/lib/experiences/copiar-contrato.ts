// EL CONTRATO DE LA COPIA — qué viaja y qué no, sin tocar el servidor.
//
// Vive aparte de `copiar.ts` (que es `server-only` porque abre Supabase) para
// que el componente que enseña el selector pueda leerlo. Es la misma regla que
// ya mordió tres veces en este repo: una constante pura viviendo en un módulo
// de servidor arrastra al cliente hasta la llave de servicio, y Next tumba el
// build nombrando al módulo del fondo, nunca al componente culpable.
//
// Aquí sólo hay tipos, texto y una función pura. Nada que necesite una sesión.

import type { Experience } from "./types";

/** Una candidata a ser punto de partida, como se lee en el selector. */
export type Copiable = {
  slug: string;
  /** Su nombre completo, ya armado: el título vive partido en dos campos. */
  titulo: string;
  /** El estado de la república, para distinguir dos salidas del mismo nombre. */
  donde: string;
  publicada: boolean;
};

/** Lo que se limpia al copiar, dicho en palabras para la pantalla. */
export const LO_QUE_NO_VIAJA = [
  "la dirección (el slug) y el estado: la copia nace en borrador",
  "la liga de pago de Stripe",
  "los captions del Kit",
  "las fechas escritas a mano",
] as const;

/**
 * La copia lista para sembrar el formulario.
 *
 * Se conserva TODO lo que describe el lugar —fotos, ficha, aliados, cláusulas,
 * incluye/no incluye, mochila, FAQ— porque eso es justo lo que se quiere
 * reusar. Lo que se va:
 *
 * - **`stripeLink`** — es la liga de pago de ESA experiencia. Copiada, la
 *   experiencia nueva le cobraría al cliente el producto viejo, al precio
 *   viejo, y el cobro se vería perfecto de los dos lados. Es el único campo de
 *   esta lista que mueve dinero, y por eso va primero.
 * - **`slug` y `status`** — la copia nace en borrador y sin dirección. El slug
 *   se vuelve a derivar del título nuevo; si alguien no cambia el título, la
 *   guarda anti-sobrescritura de `saveExperience` lo para y le pregunta.
 * - **`kitCaptions`** — están escritos para la otra salida. Heredarlos pondría
 *   un caption sobre hongos en una experiencia de correr, y como el Kit los da
 *   por buenos, nadie los volvería a leer.
 * - **`datesBadge` y el renglón «Fechas» de la portada** — son las fechas
 *   escritas A MANO. Las tarjetas de fechas de la página salen de las salidas
 *   reales (`/api/availability`) y por eso no hay que tocarlas; estas dos no, y
 *   heredadas anuncian en grande un fin de semana que ya pasó.
 *
 * Las SALIDAS no se copian porque no viven aquí: son filas de `slots`, se dan
 * de alta en su pantalla y una experiencia sin fecha es un estado normal.
 */
export function limpiarParaCopia(exp: Experience): Experience {
  const copia = { ...exp } as Experience & Record<string, unknown>;

  copia.slug = "";
  copia.status = "draft";
  copia.stripeLink = null;
  delete copia.kitCaptions;
  delete copia.datesBadge;

  if (Array.isArray(copia.heroMeta)) {
    copia.heroMeta = copia.heroMeta.map((m) =>
      /fecha/i.test(m.k ?? "") ? { ...m, v: "" } : m,
    );
  }

  return copia;
}
