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

/** Caminante entregó el cliente: su audiencia, su contenido, su canal. */
const VENTA: readonly Tramo[] = [
  [3_000, 0.25],
  [8_000, 0.22],
  [15_000, 0.20],
  [Infinity, 0.18],
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

/**
 * La comisión de UNA venta completa: el viaje MÁS lo que se le agregó.
 *
 * ⚠️ El complemento comisiona. Un tren de $6,778 pegado a un viaje de $32,197
 * no es un regalo de la plataforma: pasó por el mismo checkout, el mismo cobro
 * y el mismo soporte.
 *
 * Lo que había que decidir era a QUÉ TASA, y la respuesta es la que ya usa todo
 * lo demás: **la venta es UN boleto**. Se suma base + complementos y el total
 * entra a la regla, así que los pesos del complemento pagan la tasa del tramo
 * donde caen.
 *
 * La alternativa —correr el complemento solo por la escala, como boleto
 * aparte— se descartó porque invierte el discurso: al ser barato caería en el
 * tramo MÁS caro (un tren de $6,778 pagaría ~23% mientras el viaje de $32,197
 * paga ~18%) y se comería casi todo el margen del agregado. Entre más cara la
 * venta, más baja la tasa; el complemento no puede ser la excepción.
 */
export function comisionDeVenta(
  { base, complementos = 0 }: { base: number; complementos?: number },
  regla: Regla,
): Comision & { desglose: { viaje: number; complementos: number } } {
  const total = base + complementos;
  const c: Comision =
    regla.tipo === "escala"
      ? comisionPara(total, regla.escala)
      : {
          monto: Math.round(total * (regla.pct / 100) * 100) / 100,
          pctEfectivo: regla.pct / 100,
          escala: "plataforma",
        };
  // El desglose NO se recalcula por separado (eso sería otra comisión): se
  // reparte la del total a prorrata, que es lo único consistente con un tramo
  // marginal. Sirve para explicarle al operador de dónde salió su retención.
  const parte = total > 0 ? complementos / total : 0;
  const deComplementos = Math.round(c.monto * parte * 100) / 100;
  return {
    ...c,
    desglose: {
      viaje: Math.round((c.monto - deComplementos) * 100) / 100,
      complementos: deComplementos,
    },
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
