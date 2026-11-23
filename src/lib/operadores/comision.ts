// LA COMISIÓN DE LA PLATAFORMA — motor único.
//
// Nada más en el sistema decide cuánto cobra Caminante. Si algún día un
// porcentaje aparece en otro archivo, es un bug: se congela por venta y tiene
// que salir de aquí.
//
// ── COMISIÓN FIJA: 8 % Y 12 % (Luis, 23 nov 2026) ────────────────────────────
//
//   «Quiero que la comisión sea ya fija. 8% y 12% si nosotros traemos el
//    cliente. 8% si no. (Ya incluye stripe acá adentro)… que no se quede la
//    comisión escalonada y sea fija del 8% para todos parejo.»
//
// Dos tasas, y lo único que las separa es QUIÉN trajo al cliente:
//
//     12 %  la venta la originó Caminante (su sitio, su boletín, sus redes)
//      8 %  la originó la operadora, que sólo usa los rieles
//
// Sobre la base SIN IVA, la misma tasa para un ticket de $1,750 que para uno
// de $50,000. No hay tramos, no hay mínimo por reserva, no hay tabla.
//
// ── Qué había antes, y por qué importa saberlo ──────────────────────────────
// Del 13 ago al 23 nov de 2026 fueron dos ESCALAS por tramos marginales (venta
// 20/18/16/14, plataforma 15/13/11/9/8) con un mínimo de $250 por reserva. De
// ahí vienen los nombres que siguen en el código y en la base: el tipo se
// llama `Escala`, la regla `{ tipo: "escala" }`, las columnas
// `escala_comision` y `comision_regla = 'escala'`. **Hoy «escala» quiere decir
// «cuál de las dos tasas fijas»**, nada más. No se renombró porque esos valores
// ya están escritos en reservas cobradas y un renombre a medias es peor que un
// nombre viejo.
//
// ⚠️ Las ventas ya cobradas NO cambian: su comisión se congeló al cobrar
// (`platform_fee_mxn`, 0016) y de ahí se lee, no de este archivo.
//
// ── Lo que el 8 % tiene que pagar ───────────────────────────────────────────
// El procesamiento de pagos va DENTRO de la comisión (convenio, Cuarta §3). El
// costo real, con sus fuentes, está en `design/contabilidad/COSTOS-PLATAFORMA.md`
// y la cuenta de esta decisión en `design/contabilidad/COMISION-FIJA-2026-11-23.md`:
// el cobro con tarjeta se lleva cerca de 4.8 puntos de la base, así que del 8 %
// quedan unos 3 y del 12 % unos 7. Quien cambie estas tasas tiene que rehacer
// esa cuenta antes, no después.

export type Escala = "venta" | "plataforma";

/**
 * EL TOPE ES 20%. Ninguna tasa puede pasar de ahí — ni las dos fijas ni una
 * pactada con una operadora. Es una decisión de Luis y una obligación del
 * convenio (Tercera §4); `scripts/invariantes.mjs` tumba el build si alguien
 * la sube, y la base lo hace cumplir con un CHECK (0047).
 */
export const TOPE = 0.20;

/**
 * LAS DOS TASAS. Son el único lugar donde viven el 8 y el 12.
 *
 * ⚠️ `plataforma` nunca puede ser mayor que `venta`: sería cobrarle más a quien
 * trae a su propio cliente, que es justo lo contrario de lo que distinguen. El
 * invariante 18 lo vigila.
 */
export const TASA: Readonly<Record<Escala, number>> = {
  /** Caminante entregó el cliente: su audiencia, su contenido, su canal. */
  venta: 0.12,
  /** La operadora trajo a su cliente y sólo usa los rieles. */
  plataforma: 0.08,
};

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
 *   2. Si la tasa se aplicara al precio con IVA, la tasa
 *      efectiva sería la de la tabla ÷ 1.16 y ningún porcentaje publicado sería
 *      cierto. Un solo número, un solo significado: todo en base.
 *
 * Un precio al público de $1,750 es una base de $1,508.62: al 8 % son $120.69
 * y al 12 % son $181.03 (más IVA en los dos casos).
 */
export function comisionPara(precio: number, escala: Escala): Comision {
  if (!(precio > 0)) return { monto: 0, pctEfectivo: 0, escala };
  const monto = Math.round(precio * TASA[escala] * 100) / 100;
  return { monto, pctEfectivo: monto / precio, escala };
}

/**
 * La regla que se le aplica a una venta.
 *
 * Hay dos, y las dos cobran de verdad. `reglaComisionDeOperador` elige en este
 * orden: el porcentaje PLANO del convenio firmado, luego el plano pactado en
 * `operators.commission_pct`, y si no hay ninguno, LA TARIFA DE LA CASA
 * (`{ tipo: "escala" }`: 8 % o 12 % según quién trajo al cliente). Desde el
 * 23 nov de 2026 ninguna operadora tiene un plano pactado: todas van por la
 * tarifa de la casa. El plano se conserva porque el convenio lo permite
 * (Tercera §2) y porque hay reservas viejas cobradas así.
 *
 * ⚠️ `commission_pct` en NULL no es «sin comisión»: es «la tarifa de la casa».
 *
 * Las dos pasan por esta misma puerta para que no haya un porcentaje suelto en
 * otro archivo.
 */
export type Regla = { tipo: "plano"; pct: number } | { tipo: "escala"; escala: Escala };

/** Algo que se cobra, con su precio y cuántas veces se cobra. */
export type Objeto = {
  /** El precio de UNA unidad, sin IVA. */
  precioUnitario: number;
  /** Cuántas. Multiplica la comisión, NO el precio que entra a la escala. */
  cantidad: number;
};

/**
 * La comisión de una venta completa: el viaje MÁS lo que se le agregó.
 *
 * Cada objeto se tarifica por su propio precio y las comisiones se suman. Con
 * la tasa fija eso da lo mismo que tarifar el total —8 % de la suma es la suma
 * de los 8 %—, salvo por el redondeo a centavos de cada renglón, que es el que
 * se conserva porque así se desglosa en el corte y en el convenio (Tercera §9).
 *
 * ⚠️ NO HAY MÍNIMO POR RESERVA. Hubo uno de $250 mientras la comisión fue por
 * tramos; con «fija y pareja» un mínimo cobraría más del 8 % en los tickets
 * chicos, que es lo que la decisión del 23 nov quita.
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

  const monto = r2(deViaje + deComplementos);

  return {
    monto,
    // Sobre el total cobrado. Con la tasa fija coincide con ella salvo centavos.
    pctEfectivo: cobrado > 0 ? monto / cobrado : 0,
    escala: regla.tipo === "escala" ? regla.escala : "plataforma",
    desglose: { viaje: deViaje, complementos: deComplementos },
  };
}

/** Las dos tasas en porcentaje entero, para decirlas en pantalla: `{ venta: 12, plataforma: 8 }`. */
export const TASA_PCT: Readonly<Record<Escala, number>> = {
  venta: Math.round(TASA.venta * 100),
  plataforma: Math.round(TASA.plataforma * 100),
};

/** La frase corta de la tarifa, igual en todas las pantallas. */
export const FRASE_TARIFA = `${TASA_PCT.plataforma} % si tú traes al cliente · ${TASA_PCT.venta} % si te lo traemos nosotros`;

export const pesos = (n: number): string =>
  "$" + Math.round(n).toLocaleString("es-MX") + " MXN";
