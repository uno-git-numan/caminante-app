// Guardrail de "flujo completo": REGLA DE LUIS (9 jul 2026, tras el caso Enyd):
// "no debe existir nunca un evento sin deslinde, sin flujo completo. Nunca."
//
// deslindeListo() es la fuente única de verdad que consultan los TRES gates:
//   1. publicar desde el form (ExperienceForm)
//   2. publicar desde el dashboard (setExperienceStatus)
//   3. cobrar (createCheckout + la página /reservar)
// Bloquea: deslinde inactivo o sin cláusulas. El doc completo (waiverDocUrl) es
// advertencia, no bloqueo — el formulario de registro funciona sin él.

import type { Experience } from "@/lib/experiences/types";

export type FlujoVenta = {
  ok: boolean;
  faltantes: string[]; // bloqueantes
  advertencias: string[]; // no bloquean, pero se muestran al admin
};

export function deslindeListo(exp: Pick<Experience, "registration"> | null | undefined): FlujoVenta {
  const reg = exp?.registration;
  const clauses = (reg?.waiverClauses ?? []).filter((c) => c && c.trim());
  const faltantes: string[] = [];
  const advertencias: string[] = [];

  if (!reg?.active) {
    faltantes.push("El registro y deslinde no está activo (sección “Registro y deslinde”).");
  }
  if (clauses.length === 0) {
    faltantes.push("El deslinde no tiene cláusulas-resumen.");
  }
  if (!(reg?.waiverDocUrl ?? "").trim()) {
    advertencias.push("Falta el link al documento legal completo (waiverDocUrl).");
  }

  return { ok: faltantes.length === 0, faltantes, advertencias };
}
