// LAS CLÁUSULAS-RESUMEN DEL DESLINDE, con su origen y si son obligatorias.
//
// Antes eran `string[]`: una lista de frases, todas iguales entre sí. Dos cosas
// obligaron a que cada cláusula cargue metadatos:
//
//   1. **No todas son obligatorias.** El documento maestro es explícito: la
//      sección G (uso de imagen) es una ELECCIÓN del participante —«AUTORIZO» o
//      «NO DESEO»— y el boletín también. Listarlas junto a la liberación de
//      responsabilidad, con el mismo peso visual, le dice al viajero que acepta
//      todo o no entra. Eso no es lo que dice el documento que está firmando.
//
//   2. **Ya no todas son nuestras.** Cuando un operador trae su propia carta de
//      deslinde, la lista final es una FUSIÓN (`lib/ai/fusionar-deslinde.ts`).
//      Sin marcar el origen, nadie puede volver a mirar la lista y saber qué
//      redactó Caminante, qué redactó el operador y qué se combinó — que es
//      justo lo que hay que poder auditar en un documento legal.
//
// COMPATIBILIDAD: lo guardado hasta hoy son cadenas sueltas, y siguen siendo
// válidas. `leerClausulas` acepta las dos formas y devuelve siempre la forma
// rica; una cadena legada se lee como obligatoria y de la casa, que es lo que
// era. Por eso NO hay migración de datos: el lector es el que normaliza.
//
// ⚠️ Todo el que dibuje o exporte cláusulas pasa por aquí. Si aparece un segundo
// normalizador en otro archivo, las dos formas se separan y vuelve el bug.

export type OrigenClausula = "casa" | "operador" | "fusion";

export type Clausula = {
  texto: string;
  /** `false` solo para lo que el participante ELIGE (uso de imagen, boletín). */
  obligatoria: boolean;
  origen: OrigenClausula;
};

/** Como viaja en la base: cadena legada u objeto. */
export type ClausulaGuardada = string | Partial<Clausula>;

const ORIGENES: OrigenClausula[] = ["casa", "operador", "fusion"];

/**
 * Lector único. Tolera cadenas legadas, objetos incompletos y basura.
 *
 * `obligatoria` cae en `true` cuando falta: en un deslinde, la omisión segura es
 * «esto se acepta», no «esto es opcional».
 */
export function leerClausulas(raw: readonly ClausulaGuardada[] | null | undefined): Clausula[] {
  if (!Array.isArray(raw)) return [];
  const out: Clausula[] = [];
  for (const c of raw) {
    if (typeof c === "string") {
      const texto = c.trim();
      if (texto) out.push({ texto, obligatoria: true, origen: "casa" });
      continue;
    }
    if (!c || typeof c !== "object") continue;
    const texto = typeof c.texto === "string" ? c.texto.trim() : "";
    if (!texto) continue;
    out.push({
      texto,
      obligatoria: c.obligatoria !== false,
      origen: ORIGENES.includes(c.origen as OrigenClausula) ? (c.origen as OrigenClausula) : "casa",
    });
  }
  return out;
}

/** Solo el texto, en orden — para el PDF y para donde no cabe el matiz. */
export function textosDeClausulas(raw: readonly ClausulaGuardada[] | null | undefined): string[] {
  return leerClausulas(raw).map((c) => c.texto);
}

/** Las que el viajero DEBE aceptar para poder registrarse. */
export function clausulasObligatorias(raw: readonly ClausulaGuardada[] | null | undefined): Clausula[] {
  return leerClausulas(raw).filter((c) => c.obligatoria);
}

/** Etiqueta corta para la interfaz. */
export function etiquetaOrigen(origen: OrigenClausula): string {
  return origen === "operador" ? "del operador" : origen === "fusion" ? "fusionada" : "de Caminante";
}
