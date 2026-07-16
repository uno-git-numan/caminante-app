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
