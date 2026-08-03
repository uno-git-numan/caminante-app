// Guardrail de "flujo completo": REGLA DE LUIS (9 jul 2026, tras el caso Enyd):
// "no debe existir nunca un evento sin deslinde, sin flujo completo. Nunca."
//
// deslindeListo() es la fuente única de verdad que consultan los TRES gates:
//   1. publicar desde el form (ExperienceForm)
//   2. publicar desde el dashboard (setExperienceStatus)
//   3. cobrar (createCheckout + la página /reservar)
// Bloquea: deslinde inactivo o sin cláusulas. La regla de Luis (9 jul) "quien
// firma SIEMPRE debe poder leer el documento" ahora se cumple SOLA: al activar el
// registro con cláusulas, el deslinde se genera y publica data-driven en
// /caminante/deslinde/[slug] (deslinde-doc.ts). `waiverDocUrl` pasó a ser un
// override OPCIONAL (subir un PDF externo) — ya no se exige.

import type { Experience } from "@/lib/experiences/types";

export type FlujoVenta = {
  ok: boolean;
  faltantes: string[]; // todo lo listado bloquea la venta/publicación
};

export function deslindeListo(exp: Pick<Experience, "registration"> | null | undefined): FlujoVenta {
  const reg = exp?.registration;
  const clauses = (reg?.waiverClauses ?? []).filter((c) => c && c.trim());
  const faltantes: string[] = [];

  if (!reg?.active) {
    faltantes.push("El registro y deslinde no está activo (sección “Registro y deslinde”).");
  }
  if (clauses.length === 0) {
    faltantes.push("El deslinde no tiene cláusulas: agrega al menos una en “Registro y deslinde”. (El documento legal se genera solo a partir de ellas.)");
  }
  // waiverDocUrl ya NO se exige: el deslinde se genera data-driven en
  // /caminante/deslinde/[slug] a partir de las cláusulas + el marco legal.

  return { ok: faltantes.length === 0, faltantes };
}

// REGLA DE LUIS (3 ago 2026): "siempre tiene que estar prendido todo antes de
// publicar la experiencia."
//
// El caso: la salida de hongos del 26 jul salió con 18 personas y NADIE recibió
// encuesta — la casilla "Encuesta activa" del formulario nace apagada y nada
// avisaba. Se vendió, se viajó y se terminó sin medir; el único síntoma fue el
// silencio. (Volcanes y barrancas estaban igual.)
//
// A diferencia del deslinde, esto NO bloquea cobrar: una venta con la encuesta
// apagada no le hace daño al cliente. Bloquea PUBLICAR, que es donde Luis quiere
// el candado.
export function encuestaLista(exp: Pick<Experience, "feedback"> | null | undefined): FlujoVenta {
  const fb = exp?.feedback;
  const secciones = (fb?.sections ?? []).filter((s) => s?.label && s.label.trim());
  const faltantes: string[] = [];

  if (!fb?.active) {
    faltantes.push("La encuesta de satisfacción no está activa (sección “Encuesta de satisfacción”). Sin ella la salida se opera sin medir.");
  }
  if (secciones.length === 0) {
    faltantes.push("La encuesta no tiene categorías que calificar: agrega al menos una en “Encuesta de satisfacción”.");
  }
  if (!fb?.locationLabel?.trim()) {
    faltantes.push("La encuesta necesita “Etiqueta de locación”: da el asunto del correo (“¿Cómo te fuiste de …?”).");
  }

  return { ok: faltantes.length === 0, faltantes };
}

// El candado ÚNICO de publicar: deslinde + encuesta. Lo consultan los dos
// caminos que publican (el formulario y el dashboard).
export function listaParaPublicar(
  exp: Pick<Experience, "registration" | "feedback"> | null | undefined,
): FlujoVenta {
  const faltantes = [...deslindeListo(exp).faltantes, ...encuestaLista(exp).faltantes];
  return { ok: faltantes.length === 0, faltantes };
}
