// LA FACTURA DE LA COMISIÓN (B2): NUMAN → la operadora, por cada cobro
// confirmado (convenio v3.3, Décima tercera §2 y §4; DECISIONES D7, D8 y D9).
//
// Modelo Airbnb: en una venta por CUENTA CONECTADA la operadora es el comercio
// y le factura al cliente; el único ingreso de NUMAN es su comisión, y eso es
// lo que factura aquí. Lo retenido al cobrar (comisión + IVA) es exactamente el
// total de este CFDI y ambos se saldan entre sí: por eso la forma de pago es
// 17, compensación. En una venta por `casa` (el dinero entra a NUMAN y se le
// paga a la operadora contra SU factura, D6) no hay B2.
//
// La cuota de admisión ($20, IVA incluido) va como renglón aparte en el CFDI de
// comisión de la venta que la pagó (D7): un comprobante, dos conceptos.
//
// Módulo puro a propósito: decide, no ejecuta. Lo ejecuta comisiones.ts.

const r2 = (x: number) => Math.round(x * 100) / 100;

/** «Servicio de distribuidores por comisión» (D8). */
export const CLAVE_COMISION = "80141628";
/** Compensación: lo retenido al cobrar ES el pago de esta factura (convenio, Décima tercera §4). */
export const FORMA_PAGO_COMPENSACION = "17";

/** El tercer interruptor: la comisión a las operadoras. Sólo `1` lo prende. */
export function interruptorComisiones(env: Record<string, string | undefined> = process.env): boolean {
  return env.FACTURACION_COMISIONES === "1";
}

export type PagoConComision = {
  canal_cobro: string | null;
  status: string;
  amount_mxn: number | null;
  refunded_mxn: number | null;
  /** La comisión de NUMAN, sin IVA. */
  platform_fee_mxn: number | null;
  /** Lo que se retuvo al cobrar: comisión + IVA. Es el total que debe dar el CFDI. */
  fee_retenido_mxn: number | null;
};

export type ConceptoDeComision = { descripcion: string; cantidad: number; precioUnitarioConIva: number; claveProdServ: string };

export type PlanComision =
  | { emitir: false; porque: string }
  | { emitir: true; conceptos: ConceptoDeComision[]; comisionConIva: number; admisionConIva: number; total: number };

/**
 * ¿Se factura la comisión de este pago, y con qué conceptos?
 * @param admisionMxn los $20 de admisión si ESTA venta la pagó; 0 si no.
 */
export function planComision(p: PagoConComision, o: { servicio: string; folio: string; admisionMxn: number }): PlanComision {
  if (p.canal_cobro !== "connect") return { emitir: false, porque: "no se cobró por cuenta conectada: la operadora le factura a NUMAN (D6)" };
  if (p.status !== "paid") return { emitir: false, porque: `el pago está ${p.status}` };
  const comision = r2(Number(p.platform_fee_mxn ?? 0));
  if (!(comision > 0)) return { emitir: false, porque: "la venta no generó comisión" };
  const calculado = r2(comision * 1.16);
  const retenido = p.fee_retenido_mxn == null ? null : r2(Number(p.fee_retenido_mxn));
  // El CFDI tiene que dar EXACTAMENTE lo que se retuvo. Si no cuadra, no se
  // timbra: se dice y se revisa (regla de la casa: nada de parches).
  if (retenido != null && Math.abs(retenido - calculado) > 0.02) {
    return { emitir: false, porque: `lo retenido ($${retenido}) no es la comisión más IVA ($${calculado}): revisar antes de facturar` };
  }
  const comisionConIva = retenido ?? calculado;
  const admisionConIva = r2(Math.max(0, o.admisionMxn));
  const conceptos: ConceptoDeComision[] = [
    { descripcion: `Comisión de plataforma · ${o.servicio} · operación ${o.folio}`, cantidad: 1, precioUnitarioConIva: comisionConIva, claveProdServ: CLAVE_COMISION },
  ];
  if (admisionConIva > 0) {
    conceptos.push({ descripcion: "Cuota de admisión a la plataforma, única", cantidad: 1, precioUnitarioConIva: admisionConIva, claveProdServ: CLAVE_COMISION });
  }
  return { emitir: true, conceptos, comisionConIva, admisionConIva, total: r2(comisionConIva + admisionConIva) };
}

/**
 * La nota de crédito de la comisión cuando la venta se devuelve (D9: «egreso
 * proporcional de NUMAN a la operadora»). La comisión vuelve en la misma
 * proporción que el cobro; la admisión sólo vuelve si la venta se devolvió
 * COMPLETA (Stripe la regresa al revertir lo que quedaba y se vuelve a cobrar
 * en la siguiente venta). Devuelve lo que falta por documentar, 0 si nada.
 *
 * @param cubierto lo que ya amparan los egresos de comisión vivos de este pago.
 */
export function importeEgresoComision(i: { cobrado: number; devuelto: number; comisionConIva: number; admisionConIva: number; cubierto: number }): number {
  const cobrado = r2(i.cobrado);
  const devuelto = r2(i.devuelto);
  if (!(cobrado > 0) || !(devuelto > 0)) return 0;
  const total = devuelto >= cobrado - 0.01;
  const objetivo = total ? r2(i.comisionConIva + i.admisionConIva) : r2((i.comisionConIva * devuelto) / cobrado);
  const falta = r2(objetivo - r2(i.cubierto));
  return falta > 0.009 ? falta : 0;
}
