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
// ── Por qué PLATAFORMA bajó a 15/13/11/9/8 (8 sep 2026) ──────────────────────
// La escala anterior arrancaba en 20% —el mismo número que VENTA— y solo se
// separaba 1.2 puntos en el ticket promedio ($13,118 real, de 58 pagos). Es
// decir: casi no premiaba traer al cliente, que es LO ÚNICO que las dos escalas
// existen para distinguir. Ahora la separación es de 5 puntos parejos en todo
// el rango.
//
// El piso lo fija el costo REAL de la plataforma, no una corazonada:
//   · Stripe          4.85–5.0% de la base, casi plano (3.6% + $3 sobre el
//                     cobrado con IVA, más IVA de la comisión)
//   · Infraestructura $1,401 MXN/mes fijos (Vercel Pro + Supabase Pro + Resend
//                     Pro + Facturapi), o sea ~$93 por reserva a 15/mes y ~$14
//                     a 100/mes
//   · Timbre + WhatsApp  ~$1.30 por reserva
// Total: 5.64% del ticket hoy, 4.95% a 500 reservas/mes. La cuenta completa,
// con las fuentes y la fecha de cada precio, está en
// `design/contabilidad/COSTOS-PLATAFORMA.md`.
//
// Con la escala nueva el tramo más delgado (un ticket de $50,000, que hoy no
// vendemos: el máximo cobrado son $32,000) deja 4.2 puntos sobre ese costo. El
// ticket promedio deja 7.1.
//
// ── Tramos MARGINALES, como el ISR ───────────────────────────────────────────
// La tasa aplica a cada pedazo del precio, no al total. Con escalones duros
// habría un acantilado: a $8,000 pagar 13% ($1,040) y a $8,100 pagar 11%
// ($891) premiaría INFLAR el precio. Con tramos marginales la comisión es
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
 * pagaba 23.33%. No llegó a cobrarse, pero no por lejanía: la escala SÍ la usa
 * el checkout (ver `Regla`), y solo se salvó porque en esos días ninguna venta
 * cayó en ese camino.
 */
export const TOPE = 0.20;

/** Caminante entregó el cliente: su audiencia, su contenido, su canal. */
const VENTA: readonly Tramo[] = [
  [3_000, 0.20],
  [8_000, 0.18],
  [15_000, 0.16],
  [40_000, 0.14],
  [Infinity, 0.14],
];

/** El operador trajo a su cliente y solo usa los rieles. */
const PLATAFORMA: readonly Tramo[] = [
  [3_000, 0.15],
  [8_000, 0.13],
  [15_000, 0.11],
  [40_000, 0.09],
  [Infinity, 0.08],
];

const TRAMOS: Record<Escala, readonly Tramo[]> = { venta: VENTA, plataforma: PLATAFORMA };

/**
 * LO MÍNIMO QUE DEJA UNA RESERVA, en pesos.
 *
 * No es codicia: es el punto donde la reserva deja de pagarse sola. Cada reserva
 * le cuesta a la plataforma ~4.9% de Stripe MÁS su parte del fijo mensual
 * (~$93 a 15 reservas/mes). Abajo de ~$960 de ticket, el 15% del primer tramo
 * ya no alcanza a cubrir eso y la venta sale en números rojos.
 *
 * $250 muerde solo abajo de $1,667 (250 ÷ 0.15). El ticket más barato que se ha
 * cobrado son $2,550, así que hoy este piso no toca NADA: es un candado para
 * cuando alguien liste un complemento suelto de $400.
 *
 * ⚠️ Se aplica a la VENTA COMPLETA, no por objeto. Si se aplicara por objeto, un
 * complemento de $500 pagaría $250 = 50% y reventaría el tope. Y por eso mismo
 * el piso va acotado por TOPE: nunca puede cobrar más del 20% de lo cobrado.
 *
 * ⚠️ Solo aplica a la regla de ESCALA. Los `commission_pct` planos ya pactados
 * se congelaron en su convenio; meterles un piso después sería cambiarle a
 * alguien el trato ya firmado.
 */
export const MINIMO_POR_RESERVA = 250;

export type Comision = {
  /** Lo que retiene la plataforma, en pesos. Es lo que se congela en la venta. */
  monto: number;
  /** La tasa EFECTIVA sobre el precio. Varía con el precio: es informativa. */
  pctEfectivo: number;
  escala: Escala;
};

/** El IVA mexicano. Vive aquí porque la comisión se calcula SIN él. */
export const IVA = 0.16;

/** De un precio al público (con IVA) al valor del servicio. */
export const sinIva = (conIva: number): number => Math.round((conIva / (1 + IVA)) * 100) / 100;

/**
 * Cuánto retiene la plataforma de UNA venta.
 *
 * ⚠️ `precio` es la BASE SIN IVA, no el precio de la etiqueta.
 *
 * Dos razones, y las dos importan:
 *   1. Una comisión se cobra sobre el valor del servicio, no sobre un impuesto
 *      que no es de nadie: el IVA se traslada al SAT. Cobrar 18% sobre los
 *      $32,197 en vez de sobre los $27,756 sería cobrarle al operador por
 *      recaudar.
 *   2. Si el tramo se leyera con IVA y la tasa se aplicara sin él, la tasa
 *      efectiva sería la de la tabla ÷ 1.16 y ningún porcentaje publicado sería
 *      cierto. Un solo número, un solo significado: todo en base.
 *
 * Los cortes ($3,000 / $8,000 / $15,000 / $40,000) son de base, entonces: al
 * público eso es $3,480 / $9,280 / $17,400 / $46,400.
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
 * Hoy conviven dos, y LAS DOS COBRAN DE VERDAD. `reglaComisionDeOperador` elige
 * en este orden: el porcentaje PLANO del convenio firmado, luego el plano
 * pactado en `operators.commission_pct`, y si no hay ninguno, LA ESCALA. O sea
 * que la escala no es un plan a futuro: es lo que se le cobra hoy a cualquier
 * operadora sin porcentaje pactado.
 *
 * ⚠️ Eso hace que `commission_pct` en NULL signifique dos cosas distintas según
 * quién lo lea: para el gate de Connect es «sin definir» y bloquea la venta;
 * aquí es «cóbrale por escala». No es contradicción —Connect exige un plano
 * porque el `application_fee` se calcula antes de conocer el carrito— pero si
 * alguien cambia uno de los dos lados sin ver el otro, la venta sale por un
 * camino y el corte la reporta por el otro.
 *
 * Las dos pasan por esta misma puerta para que el día que se cambie de una a
 * otra no haya un porcentaje suelto en otro archivo.
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

  const cobrado =
    venta.viaje.precioUnitario * venta.viaje.cantidad +
    (venta.complementos ?? []).reduce((n, c) => n + c.precioUnitario * c.cantidad, 0);

  // El piso, acotado por el tope: nunca cobra más del 20% de lo cobrado, y solo
  // rige para la escala (ver MINIMO_POR_RESERVA).
  const piso = regla.tipo === "escala" ? Math.min(MINIMO_POR_RESERVA, r2(cobrado * TOPE)) : 0;
  const monto = r2(Math.max(deViaje + deComplementos, piso));

  return {
    monto,
    // Sobre el total cobrado. Con la escala ya NO es la tasa de ningún tramo:
    // es la mezcla de dos tickets distintos, y por eso se dice «efectiva».
    pctEfectivo: cobrado > 0 ? monto / cobrado : 0,
    escala: regla.tipo === "escala" ? regla.escala : "plataforma",
    desglose: { viaje: deViaje, complementos: deComplementos },
  };
}

/**
 * LA TABLA DE DOS COLUMNAS — la forma en que el convenio publica las escalas.
 *
 * ⚠️ AQUÍ NO SE FUSIONA NADA, y es lo contrario de `tramosPara`. Fusionando, el
 * último tramo de VENTA (14% de $15,000 en adelante) deja de coincidir con los
 * dos de PLATAFORMA ($15,000–$40,000 al 9% y de ahí al 8%), y una tabla de dos
 * columnas armada con esos renglones sale con huecos: «De $15,000 en adelante ·
 * 14% · —» seguido de «De $15,000 a $40,000 · — · 9%». Se lee como un error de
 * dedo, que es justo lo que la fusión quería evitar en la página pública, donde
 * cada escala se pinta sola.
 *
 * Que los cortes coincidan renglón a renglón no es casualidad ni suerte: lo
 * exige el invariante 18. Si algún día dejaran de compartirlos, esta función
 * mentiría — y el invariante tumba el deploy antes.
 */
export function tablaDeComisiones(): { desde: number; hasta: number | null; venta: number; plataforma: number }[] {
  let piso = 0;
  return VENTA.map(([tope, tasaVenta], i) => {
    const fila = {
      desde: piso,
      hasta: Number.isFinite(tope) ? tope : null,
      venta: tasaVenta,
      plataforma: PLATAFORMA[i][1],
    };
    piso = tope;
    return fila;
  });
}

/**
 * Para la página pública: los tramos tal como se comunican.
 *
 * ⚠️ Los tramos con la MISMA tasa se fusionan en un renglón. Las dos escalas
 * comparten cortes a propósito —el convenio las publica como una tabla de dos
 * columnas y un invariante lo vigila—, y eso obliga a VENTA a partir su último
 * tramo en $40,000 aunque cobre 14% de los dos lados. Ahí ese corte significa
 * algo: enfrente, PLATAFORMA sí cambia de 9% a 8%. Pero cada escala se pinta
 * SOLA en la página pública, y dos renglones seguidos diciendo 14% no se leen
 * como precisión: se leen como un error de dedo.
 */
export function tramosPara(escala: Escala): { desde: number; hasta: number | null; pct: number }[] {
  const filas: { desde: number; hasta: number | null; pct: number }[] = [];
  let piso = 0;
  for (const [tope, tasa] of TRAMOS[escala]) {
    const previa = filas[filas.length - 1];
    if (previa && previa.pct === tasa) previa.hasta = Number.isFinite(tope) ? tope : null;
    else filas.push({ desde: piso, hasta: Number.isFinite(tope) ? tope : null, pct: tasa });
    piso = tope;
  }
  return filas;
}

export const pesos = (n: number): string =>
  "$" + Math.round(n).toLocaleString("es-MX") + " MXN";
