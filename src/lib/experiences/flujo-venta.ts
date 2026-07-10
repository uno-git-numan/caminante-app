// Guardrail de "flujo completo": REGLA DE LUIS (9 jul 2026, tras el caso Enyd):
// "no debe existir nunca un evento sin deslinde, sin flujo completo. Nunca."
//
// deslindeListo() es la fuente única de verdad que consultan los TRES gates:
//   1. publicar desde el form (ExperienceForm)
//   2. publicar desde el dashboard (setExperienceStatus)
//   3. cobrar (createCheckout + la página /reservar)
// Bloquea: deslinde inactivo, sin cláusulas o SIN el documento completo
// (waiverDocUrl) — regla de Luis (9 jul): quien firma SIEMPRE debe poder ver el
// PDF del deslinde; el doc nunca puede estar vacío.

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
    faltantes.push("El deslinde no tiene cláusulas-resumen.");
  }
  if (!(reg?.waiverDocUrl ?? "").trim()) {
    faltantes.push("Falta el PDF del deslinde (URL del documento) — quien firma siempre debe poder leerlo.");
  }

  return { ok: faltantes.length === 0, faltantes };
}
