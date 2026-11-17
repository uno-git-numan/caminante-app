// QUÉ DOCUMENTO TOCA UNA DEVOLUCIÓN (D19, DECISIONES-LEGAL-FISCAL §4).
//
// Módulo puro a propósito: decide, no ejecuta. Lo prueba tests/unit sin
// servidor y lo ejecuta lib/facturacion/devoluciones.ts.
//
// · Sin CFDI todavía (pago `por-emitir`):
//     - sin recibo: nada que cancelar; el recibo o la factura que salgan
//       después ya van por lo neto (conceptos.ts descuenta lo devuelto).
//     - con recibo: devolución TOTAL → se cancela el recibo; PARCIAL → se
//       cancela y se reexpide por lo neto cobrado. Así la global nunca toma
//       un recibo por dinero que ya volvió.
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
  facturapi_receipt_id: string | null;
  recibo_neto_de_mxn: number | null;
};

export type PlanDevolucion =
  | { accion: "nada"; porque: string }
  | { accion: "cancelar-recibo"; devuelto: number }
  | { accion: "reexpedir-recibo"; devuelto: number; neto: number }
  | { accion: "egreso"; devuelto: number; importe: number }
  | { accion: "contadora"; porque: string };

/**
 * @param egresoCubierto lo devuelto que ya amparan los egresos vivos del pago
 *   (el mayor `devuelto_acumulado_mxn` pending/stamped), 0 si no hay.
 *
 * `recibo_neto_de_mxn` es lo devuelto que el comprobante vigente (recibo o
 * CFDI de ingreso) YA descuenta: se escribe al reexpedir el recibo y al emitir
 * un recibo o una factura sobre un pago con devolución previa.
 */
export function planDevolucion(p: PagoDevuelto, egresoCubierto = 0): PlanDevolucion {
  const cobrado = r2(Number(p.amount_mxn ?? 0));
  const devuelto = r2(Number(p.refunded_mxn ?? 0));
  if (!(devuelto > 0)) return { accion: "nada", porque: "sin devolución" };
  if (!dentroDelCorte(p.paid_at)) return { accion: "nada", porque: "cobro anterior al corte: lo cuadra la contadora" };

  switch (p.status_cfdi) {
    case "externo":
      return { accion: "contadora", porque: "la factura de este cobro la emitió la contadora: el egreso también es suyo" };
    case "no-facturable":
      return { accion: "nada", porque: "pago sin documento fiscal" };
    case "por-emitir": {
      if (!p.facturapi_receipt_id) return { accion: "nada", porque: "sin recibo: lo que se emita después ya va por lo neto" };
      if (r2(Number(p.recibo_neto_de_mxn ?? 0)) >= devuelto) return { accion: "nada", porque: "el recibo ya está ajustado" };
      const neto = r2(cobrado - devuelto);
      return neto > 0.009 ? { accion: "reexpedir-recibo", devuelto, neto } : { accion: "cancelar-recibo", devuelto };
    }
    case "emitido":
    case "publico-general": {
      // Lo que el ingreso ya salió descontando (se facturó o entró a la global
      // por lo neto) no lleva egreso: sólo lo devuelto DESPUÉS.
      const base = Math.max(r2(egresoCubierto), r2(Number(p.recibo_neto_de_mxn ?? 0)));
      const importe = r2(devuelto - base);
      if (!(importe > 0.009)) return { accion: "nada", porque: "lo devuelto ya tiene su egreso" };
      return { accion: "egreso", devuelto, importe };
    }
    default:
      return { accion: "nada", porque: `status_cfdi ${p.status_cfdi}` };
  }
}

/** Lo que se factura o se recibe de un pago: lo cobrado menos lo devuelto. */
export const netoDePago = (p: { amount_mxn: number | null; refunded_mxn?: number | null }): number =>
  r2(Number(p.amount_mxn ?? 0) - Number(p.refunded_mxn ?? 0));
