// LA COMISIÓN DE LA PLATAFORMA — motor único.
//
// Nada más en el sistema decide cuánto cobra Caminante. Si algún día un
// porcentaje aparece en otro archivo, es un bug: se congela por venta y tiene
// que salir de aquí.
//
// ── Dos escalas, según QUIÉN trajo al cliente ────────────────────────────────
// El research de mercado (13 ago 2026) encontró dos lógicas opuestas y las dos
// son ciertas:
//   · Los OTA (Viator, GetYourGuide, Klook) cobran 20-30% PLANO porque su valor
//     es la demanda: una venta es una venta.
//   · En viajes caros las comisiones SUBEN (Lindblad, Hurtigruten pagan >15%)
//     porque vender $100,000 es más difícil, no menos.
// Pero ninguna aplica cuando el operador trae a su propio cliente y solo usa
// los rieles: ahí el trabajo de la plataforma es el mismo con $3,000 que con
// $100,000, y cobrar plano no se defiende.
//
// De ahí las dos escalas. VENTA cuando Caminante entrega el cliente;
// PLATAFORMA cuando el operador lo trae y solo usa la infraestructura.
//
// ── Tramos MARGINALES, como el ISR ───────────────────────────────────────────
// La tasa aplica a cada pedazo del precio, no al total. Con escalones duros
// habría un acantilado: a $8,000 pagar 17% ($1,360) y a $8,100 pagar 14%
// ($1,134) premiaría INFLAR el precio. Con tramos marginales la comisión es
// monótona creciente — subir el precio nunca baja lo que cobra la casa. Eso NO
// necesita prueba: con tramos marginales y tasas positivas está garantizado por
// construcción. Lo que sí hay que cuidar al editar los tramos es que las tasas
// vayan de mayor a menor; si una subiera, la tasa efectiva dejaría de bajar y el
// discurso «entre más cara, más baja» se volvería mentira.

export type Escala = "venta" | "plataforma";

/** [hasta_este_precio, tasa]. El último tramo va al infinito. */
type Tramo = readonly [number, number];

/**
 * EL TOPE ES 20%. Ninguna tasa de ninguna escala puede pasar de ahí — es una
 * decisión de Luis, no una preferencia, y `scripts/invariantes.mjs` tumba el
 * build si alguien la sube.
 *
 * Estuvo roto entre el 18 ago y el 3 sep de 2026: la tabla nació del research
 * de mercado (Viator, GetYourGuide y Klook cobran 20-30% plano) con 25% y 22%
 * arriba, y cuando se fijó el tope nadie la corrigió. No se notó porque el
 * porcentaje siempre se miraba contra el ticket completo —una travesía de
 * $32,197 sale en 19.71% y parece que respeta el tope— y solo salió a la luz al
 * tarifar POR OBJETO: un tren de $6,778 caía en los dos primeros tramos y
 * pagaba 23.33%. Nunca llegó a cobrarse: la escala no está enchufada al
 * checkout todavía.
 */
export const TOPE = 0.20;

/** Caminante entregó el cliente: su audiencia, su contenido, su canal. */
const VENTA: readonly Tramo[] = [
  [3_000, 0.20],
  [8_000, 0.18],
  [15_000, 0.16],
  [Infinity, 0.14],
];

/** El operador trajo a su cliente y solo usa los rieles. */
const PLATAFORMA: readonly Tramo[] = [
  [3_000, 0.20],
  [8_000, 0.17],
  [15_000, 0.14],
  [40_000, 0.11],
  [Infinity, 0.08],
];

const TRAMOS: Record<Escala, readonly Tramo[]> = { venta: VENTA, plataforma: PLATAFORMA };

export type Comision = {
  /** Lo que retiene la plataforma, en pesos. Es lo que se congela en la venta. */
  monto: number;
  /** La tasa EFECTIVA sobre el precio. Varía con el precio: es informativa. */
  pctEfectivo: number;
  escala: Escala;
};

/**
 * Cuánto retiene la plataforma de UNA venta.
 *
 * ⚠️ `precio` es el precio por persona CON IVA, tal como se le cobra al
 * cliente y como vive en `experience_slots.price_mxn`.
 */
export function comisionPara(precio: number, escala: Escala): Comision {
  if (!(precio > 0)) return { monto: 0, pctEfectivo: 0, escala };
  let monto = 0;
  let piso = 0;
  for (const [tope, tasa] of TRAMOS[escala]) {
    if (precio <= piso) break;
    monto += (Math.min(precio, tope) - piso) * tasa;
    piso = tope;
  }
  monto = Math.round(monto * 100) / 100;
  return { monto, pctEfectivo: monto / precio, escala };
}

/**
 * La regla que se le aplica a una venta.
 *
 * Hoy conviven dos y hay que ser honestos sobre por qué: `operators.commission_pct`
 * es el número PLANO que se pacta y se congela en el convenio de cada operadora
 * —es lo que cobra el checkout en vivo—, y la ESCALA por tramos es el esquema
 * nuevo, ya calculado aquí pero todavía no enchufado al cobro. Las dos pasan
 * por esta misma puerta para que el día que se cambie de una a otra no haya un
 * porcentaje suelto en otro archivo.
 */
export type Regla = { tipo: "plano"; pct: number } | { tipo: "escala"; escala: Escala };

/** Algo que se cobra, con su precio y cuántas veces se cobra. */
export type Objeto = {
  /** El precio de UNA unidad. Es lo que decide el tramo. */
  precioUnitario: number;
  /** Cuántas. Multiplica la comisión, NO el precio que entra a la escala. */
  cantidad: number;
};

/**
 * La comisión de una venta completa: el viaje MÁS lo que se le agregó.
 *
 * ⚠️ CADA OBJETO SE TARIFICA POR SU PROPIO PRECIO, y las comisiones se suman.
 * No se suman los precios para tarifar el total. Esto es deliberado y es la
 * regla de la casa (Luis, 3 sep 2026):
 *
 *   «La comisión se calcula a partir del precio del objeto que se cobra. Si es
 *    barato, comisión más alta; si es caro, comisión más baja.»
 *
 * Un tren de $6,778 es un ticket barato y paga tasa de ticket barato, aunque
 * viaje pegado a una experiencia de $32,197 que paga tasa de ticket caro. Si se
 * sumaran los precios primero, el tren se colaría al tramo más bajo del viaje y
 * la plataforma cobraría de menos justo en el producto donde más trabaja por
 * peso vendido.
 *
 * ⚠️ Y LA CANTIDAD MULTIPLICA LA COMISIÓN, NO EL PRECIO. Dos personas no
 * compran un boleto de $64,394: compran dos de $32,197. Meter el total a la
 * escala haría que un grupo grande pagara menos tasa por cabeza que una persona
 * sola en el mismo viaje — la tabla habla de tickets, no de facturas.
 */
export function comisionDeVenta(
  venta: { viaje: Objeto; complementos?: Objeto[] },
  regla: Regla,
): Comision & { desglose: { viaje: number; complementos: number } } {
  const deUno = (o: Objeto): number =>
    regla.tipo === "escala"
      ? comisionPara(o.precioUnitario, regla.escala).monto * o.cantidad
      : o.precioUnitario * o.cantidad * (regla.pct / 100);

  const r2 = (n: number) => Math.round(n * 100) / 100;

  const deViaje = r2(deUno(venta.viaje));
  const deComplementos = r2((venta.complementos ?? []).reduce((n, c) => n + deUno(c), 0));
  const monto = r2(deViaje + deComplementos);

  const cobrado =
    venta.viaje.precioUnitario * venta.viaje.cantidad +
    (venta.complementos ?? []).reduce((n, c) => n + c.precioUnitario * c.cantidad, 0);

  return {
    monto,
    // Sobre el total cobrado. Con la escala ya NO es la tasa de ningún tramo:
    // es la mezcla de dos tickets distintos, y por eso se dice «efectiva».
    pctEfectivo: cobrado > 0 ? monto / cobrado : 0,
    escala: regla.tipo === "escala" ? regla.escala : "plataforma",
    desglose: { viaje: deViaje, complementos: deComplementos },
  };
}

/** Para la página pública: los tramos tal como se comunican. */
export function tramosPara(escala: Escala): { desde: number; hasta: number | null; pct: number }[] {
  let piso = 0;
  return TRAMOS[escala].map(([tope, tasa]) => {
    const fila = { desde: piso, hasta: Number.isFinite(tope) ? tope : null, pct: tasa };
    piso = tope;
    return fila;
  });
}

export const pesos = (n: number): string =>
  "$" + Math.round(n).toLocaleString("es-MX") + " MXN";
