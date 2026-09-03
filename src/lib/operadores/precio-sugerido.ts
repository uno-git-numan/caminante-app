// EL PRECIO SUGERIDO — la calculadora de las dos direcciones.
//
// ⚠️ ESTO ES UNA CALCULADORA, NO UNA REGLA. Corre en el FORMULARIO para sugerir
// un precio; lo que se guarda es un precio, y al vender la comisión se calcula
// desde ese precio. El «elevar» ocurre UNA sola vez, cuando una persona lo ve en
// pantalla y aprueba el número.
//
// Esa distinción es la que resuelve el miedo razonable de «¿y si el operador
// escribe su costo YA con la comisión adentro?». Si el sistema elevara el precio
// en cada guardado, un costo inflado se volvería a inflar y el cliente pagaría la
// comisión dos veces. Como el gross-up vive solo aquí y el resultado se ve antes
// de guardar, un costo inflado tiene un único efecto visible: el renglón «recibes
// tú» sale más alto de lo que la persona dijo necesitar. Se ve, y se corrige.
//
// Y sobre «¿no le conviene inflar el costo para pagar menos tasa?»: la tasa baja,
// sí —es la regla de la casa, entre más caro el ticket más baja la tasa— pero la
// comisión en PESOS sube siempre (tramos marginales con tasas positivas). Para
// bajarse la tasa tendría que subirle el precio al cliente, que es un costo real
// y visible. No hay comida gratis; hay una decisión comercial suya.

import { comisionDeVenta, IVA, type Regla } from "./comision";

export type Desglose = {
  /** Lo que paga el cliente. */
  publico: number;
  /** El valor del servicio, sin IVA. Sobre esto se calcula la comisión. */
  base: number;
  /** Lo que recibe el operador, sin IVA — lo que tiene que cuadrar con su cotización. */
  neto: number;
  /** Lo que retiene la plataforma, sin IVA. */
  comision: number;
  /** La tasa que le tocó a ESTE ticket. */
  pct: number;
  /** IVA de cada parte. Los dos van dentro del precio público. */
  ivaNeto: number;
  ivaComision: number;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

const comisionDe = (base: number, regla: Regla): number =>
  comisionDeVenta({ viaje: { precioUnitario: base, cantidad: 1 } }, regla).monto;

/**
 * Del PRECIO PÚBLICO hacia atrás: ¿qué le queda a cada quién?
 *
 * Esta es la dirección que manda. Un precio guardado es un hecho; el neto del
 * operador se deriva de él, no al revés.
 */
export function desglosarPrecio(publico: number, regla: Regla): Desglose {
  const base = r2(publico / (1 + IVA));
  const comision = r2(comisionDe(base, regla));
  const neto = r2(base - comision);
  return {
    publico: r2(publico),
    base,
    neto,
    comision,
    pct: base > 0 ? comision / base : 0,
    ivaNeto: r2(neto * IVA),
    ivaComision: r2(comision * IVA),
  };
}

/**
 * Del NETO hacia adelante: ¿qué precio deja exactamente eso en su bolsa?
 *
 * Es una ECUACIÓN, no una multiplicación: la comisión depende del precio que se
 * está buscando. Por eso itera. Un markup sobre el costo da otro número y deja
 * al proveedor corto — fue el error del tren de Barrancas.
 *
 * Converge rápido y monótono porque la comisión crece más despacio que el
 * precio (toda tasa < 1). 40 vueltas es holgadísimo para centavos.
 */
export function precioSugerido(neto: number, regla: Regla): Desglose {
  if (!(neto > 0)) return desglosarPrecio(0, regla);
  let base = neto;
  for (let i = 0; i < 40; i++) base = neto + comisionDe(base, regla);
  return desglosarPrecio(r2(base * (1 + IVA)), regla);
}
