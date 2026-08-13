// Los tramos de comisión de la página pública de operadores.
//
// ⚠️ ESTE ES EL ÚNICO LUGAR DONDE VIVEN LOS PORCENTAJES. El diseño de Claude
// Design los dejó como `{{TRAMO_1..3}}` a propósito, y aquí nacen en `null`
// porque **Luis todavía no los ha definido**. Un número inventado en esta
// página no es un detalle de copy: es una oferta pública sobre la que alguien
// decide si trae su operación, y después habría que desdecirla en la llamada.
//
// Mientras sean `null`, la sección se sigue publicando y se sigue entendiendo:
// muestra los tres rangos de precio, la regla (a mayor precio, menor comisión)
// y remite al convenio. En cuanto Luis dé los números, se escriben aquí y
// aparecen solos — sin tocar el marcado.
//
// Los RANGOS sí son estructura acordada (hasta $5,000 / $5,001–$15,000 / más de
// $15,000 por persona), no cifras de dinero nuestro.

export type Tramo = {
  /** El rango de precio por persona, tal como se lee en la página. */
  rango: string;
  /** El porcentaje que retiene la plataforma. `null` = todavía sin definir. */
  pct: number | null;
};

export const TRAMOS: Tramo[] = [
  { rango: "Hasta $5,000 MXN", pct: null },
  { rango: "$5,001 – $15,000 MXN", pct: null },
  { rango: "Más de $15,000 MXN", pct: null },
];

/** ¿Ya podemos mostrar cifras? Si falta una sola, no se muestra ninguna. */
export const HAY_TRAMOS = TRAMOS.every((t) => typeof t.pct === "number");

/** Lo que se imprime en la columna del porcentaje. */
export function pctTexto(t: Tramo): string {
  return typeof t.pct === "number" ? `${t.pct}%` : "—";
}
