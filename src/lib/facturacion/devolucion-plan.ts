// QUÉ DOCUMENTO TOCA UNA DEVOLUCIÓN (D19, DECISIONES-LEGAL-FISCAL §4).
//
// Módulo puro a propósito: decide, no ejecuta. Lo prueba tests/unit sin
// servidor y lo ejecuta lib/facturacion/devoluciones.ts.
//
// · Sin CFDI todavía (pago `por-emitir`): NADA. No hay documento que corregir:
//   la factura que pida el cliente, o la global del mes, salen ya por lo neto
//   —lo cobrado menos lo devuelto— (conceptos.ts, global-plan.ts). Hasta el 17
//   nov 2026 aquí se cancelaba o reexpedía un recibo de Facturapi; la
//   plataforma ya no usa recibos.
// · Con CFDI (`emitido` o `publico-general`): CFDI de EGRESO relacionado (01)
//   al original —la factura del cliente o la global— por lo devuelto que aún
//   no ampara ningún egreso. El egreso no depende del receptor y deja el
//   ingreso intacto en su mes: es la regla general (D19). La cancelación del
//   original (motivo 03) es un caso permitido, no obligatorio, y NO se hace
//   automática: pide confirmar con la contadora el numeral y el plazo (M19).
// · `externo`: la factura es de la contadora; su egreso también. Se avisa.
// · Antes del corte: lo cuadra la contadora; la plataforma no toca nada.

import { dentroDelCorte } from "@/lib/facturacion/corte";

const r2 = (x: number) => Math.round(x * 100) / 100;

export type PagoDevuelto = {
  amount_mxn: number | null;
  refunded_mxn: number | null;
  status_cfdi: string;
  paid_at: string | null;
  /** Lo devuelto que el CFDI de ingreso YA salió descontando (0086). */
  devuelto_al_facturar_mxn: number | null;
};

export type PlanDevolucion =
  | { accion: "nada"; porque: string }
  | { accion: "egreso"; devuelto: number; importe: number }
  | { accion: "contadora"; porque: string };

/**
 * @param egresoCubierto lo devuelto que ya amparan los egresos vivos del pago
 *   (el mayor `devuelto_acumulado_mxn` pending/stamped), 0 si no hay.
 *
 * `devuelto_al_facturar_mxn` es lo devuelto ANTES de facturar: la factura del
 * cliente o la global ya salieron por lo neto, así que un egreso sólo ampara lo
 * que se devuelva después.
 */
export function planDevolucion(p: PagoDevuelto, egresoCubierto = 0): PlanDevolucion {
  const devuelto = r2(Number(p.refunded_mxn ?? 0));
  if (!(devuelto > 0)) return { accion: "nada", porque: "sin devolución" };
  if (!dentroDelCorte(p.paid_at)) return { accion: "nada", porque: "cobro anterior al corte: lo cuadra la contadora" };

  switch (p.status_cfdi) {
    case "externo":
      return { accion: "contadora", porque: "la factura de este cobro la emitió la contadora: el egreso también es suyo" };
    case "no-facturable":
      return { accion: "nada", porque: "pago sin documento fiscal" };
    case "por-emitir":
      return { accion: "nada", porque: "sin CFDI todavía: lo que se emita ya va por lo neto" };
    case "emitido":
    case "publico-general": {
      const base = Math.max(r2(egresoCubierto), r2(Number(p.devuelto_al_facturar_mxn ?? 0)));
      const importe = r2(devuelto - base);
      if (!(importe > 0.009)) return { accion: "nada", porque: "lo devuelto ya está documentado" };
      return { accion: "egreso", devuelto, importe };
    }
    default:
      return { accion: "nada", porque: `status_cfdi ${p.status_cfdi}` };
  }
}

/** Clave del egreso contra una factura global (Apéndice 2 de la guía del CFDI global 4.0). */
export const CLAVE_EGRESO_CONTRA_GLOBAL = "84111506";

export type ConceptoDeEgreso = {
  descripcion: string;
  cantidad: number;
  precioUnitarioConIva: number;
  claveProdServ?: string;
  claveUnidad?: string;
  noIdentificacion?: string;
};

/**
 * El concepto de la nota de crédito, según contra qué va (D21 bis de legal,
 * leído en la guía de llenado del CFDI global 4.0, Apéndice 2):
 *   · contra una GLOBAL: clave 84111506, el FOLIO de la operación como número de
 *     identificación (el mismo que lleva su concepto en la global), cantidad 1,
 *     unidad ACT y la descripción de la devolución;
 *   · contra la factura a nombre del cliente: la clave de la experiencia, igual
 *     que el ingreso que corrige.
 * En los dos casos el uso es G02 y la relación 01 (lo pone quien timbra).
 */
export function conceptoDeEgreso(i: { contraGlobal: boolean; folio: string; importe: number; servicio: string; claveExperiencia?: string }): ConceptoDeEgreso {
  const comun = { descripcion: `Devolución · ${i.servicio}`, cantidad: 1, precioUnitarioConIva: r2(i.importe) };
  return i.contraGlobal
    ? { ...comun, claveProdServ: CLAVE_EGRESO_CONTRA_GLOBAL, claveUnidad: "ACT", noIdentificacion: i.folio }
    : { ...comun, ...(i.claveExperiencia ? { claveProdServ: i.claveExperiencia } : {}) };
}

/** Lo que se factura de un pago: lo cobrado menos lo devuelto. */
export const netoDePago = (p: { amount_mxn: number | null; refunded_mxn?: number | null }): number =>
  r2(Number(p.amount_mxn ?? 0) - Number(p.refunded_mxn ?? 0));
