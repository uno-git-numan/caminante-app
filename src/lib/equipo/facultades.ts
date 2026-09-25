// LAS FACULTADES DEL EQUIPO — puro, sin servidor, para pantallas y pruebas.
//
// Cuatro, y Luis las prende y apaga por persona (25 sep 2026). Son PERMISOS
// de hacer; lo que se VE lo decide el alcance (numan, o la operadora del
// sombrero). Una persona sin facultades entra y mira; no toca.

export const FACULTADES = ["onboarding", "clientes", "armar", "campo"] as const;
export type Facultad = (typeof FACULTADES)[number];

export const FACULTAD: Record<Facultad, { nombre: string; que: string; de: "numan" | "operadora" }> = {
  onboarding: {
    nombre: "Onboarding de operadoras",
    que: "Toma solicitudes, hace la llamada, revisa y aprueba documentos y actividades, acompaña hasta la firma.",
    de: "numan",
  },
  clientes: {
    nombre: "Clientes y embajadores",
    que: "El CRM, WhatsApp, links de cobro, encuestas y el alta de embajadores.",
    de: "operadora",
  },
  armar: {
    nombre: "Armar experiencias",
    que: "Crear, editar y publicar experiencias, fechas, cupos y precios.",
    de: "operadora",
  },
  campo: {
    nombre: "Operar en campo",
    que: "Los rosters completos, con los datos médicos de quien viaja. Sólo quien opera la salida.",
    de: "operadora",
  },
};

export function esFacultad(x: unknown): x is Facultad {
  return typeof x === "string" && (FACULTADES as readonly string[]).includes(x);
}

/** Limpia una lista que llega de un formulario: sólo facultades reales, sin repetir. */
export function facultadesDe(lista: unknown): Facultad[] {
  const arr = Array.isArray(lista) ? lista : [];
  return FACULTADES.filter((f) => arr.includes(f));
}

/**
 * Lo que una OPERADORA puede darle a su propio equipo: nunca `onboarding`,
 * que es de la plataforma, y nunca `numan`. Lo demás sí.
 */
export const FACULTADES_DE_OPERADORA: Facultad[] = ["clientes", "armar", "campo"];

export function tieneFacultad(e: { facultades: readonly string[] } | null | undefined, f: Facultad): boolean {
  return !!e && e.facultades.includes(f);
}
