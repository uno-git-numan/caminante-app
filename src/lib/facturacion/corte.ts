// EL CORTE Y EL INTERRUPTOR DE LA FACTURACIÓN A CLIENTES (candados legales,
// DECISIONES-LEGAL-FISCAL §6, 12 nov 2026).
//
// 1 · Dos interruptores. La llave de NUMAN en Facturapi (`FACTURAPI_SECRET_KEY`)
//     sola prende ÚNICAMENTE el CFDI de retenciones a las operadoras: retener es
//     obligación de NUMAN (LISR 113-C, LIVA 18-J) sin importar cómo facture sus
//     ventas. Recibos, autofactura y factura global a clientes llevan además
//     `FACTURACION_CLIENTES=1`, apagado hasta el visto bueno de la contadora.
//
// 2 · El corte es CÓDIGO, no acuerdo. Nada se emite (recibo, autofactura ni
//     global) sobre un cobro anterior al corte: eso lo facturó o lo cuadra la
//     contadora, y un CFDI nuestro encima es ingreso duplicado ante el SAT. Lo
//     posterior que ella ya facturó se marca `status_cfdi = 'externo'` con el
//     UUID de su CFDI (0083) y tampoco se toca. Cambiar la fecha es un commit,
//     con rastro, cuando la contadora la confirme (M18).
//
// Módulo puro a propósito: lo prueban los tests sin servidor.

/** Primer día (hora de CDMX) cuyos cobros factura la plataforma. Propuesta 10 nov; la confirma Marisol. */
export const CORTE_FACTURACION_CLIENTES = "2026-11-10";

/** El instante del corte: 00:00 de CDMX (UTC−6, sin horario de verano desde 2022). */
export const inicioDelCorte = (): Date => new Date(`${CORTE_FACTURACION_CLIENTES}T00:00:00-06:00`);

/** ¿Este cobro le toca a la plataforma? Sin fecha de cobro, no: no se le inventa un recibo. */
export function dentroDelCorte(paidAt: string | null | undefined): boolean {
  if (!paidAt) return false;
  const t = new Date(paidAt).getTime();
  return Number.isFinite(t) && t >= inicioDelCorte().getTime();
}

/** El segundo interruptor. Sólo `1` lo prende: cualquier otro valor (o ninguno) lo deja apagado. */
export function interruptorClientes(env: Record<string, string | undefined> = process.env): boolean {
  return env.FACTURACION_CLIENTES === "1";
}

/** El folio fiscal (UUID) de un CFDI que la contadora emitió fuera del sistema. */
export const UUID_CFDI = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** La fecha del corte en palabras, para las pantallas. */
export const corteEnPalabras = (): string =>
  new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "long", year: "numeric" }).format(inicioDelCorte());

export type PagoDeRecibo = {
  facturapi_receipt_id: string | null;
  status: string;
  status_cfdi: string;
  paid_at: string | null;
  refunded_mxn?: number | null;
};

/**
 * El candado de la GLOBAL: antes de timbrarla, cada recibo abierto del periodo
 * tiene que ser de un pago que la plataforma sí factura (cobrado, por-emitir,
 * después del corte y sin devolución). Devuelve los recibos que NO cumplen y por
 * qué; si hay uno solo, la global no se timbra y se avisa: se corrige a mano
 * (cancelar el recibo) antes de volver a intentarla. Facturapi agrupa TODOS los
 * recibos abiertos de la organización, no sólo los que nosotros creemos.
 */
export function recibosQueNoEntranALaGlobal(reciboIds: string[], pagos: PagoDeRecibo[]): { receiptId: string; porque: string }[] {
  const porRecibo = new Map(pagos.filter((p) => p.facturapi_receipt_id).map((p) => [p.facturapi_receipt_id as string, p]));
  const fuera: { receiptId: string; porque: string }[] = [];
  for (const id of reciboIds) {
    const p = porRecibo.get(id);
    if (!p) fuera.push({ receiptId: id, porque: "no corresponde a ningún pago de la plataforma" });
    else if (p.status !== "paid") fuera.push({ receiptId: id, porque: `el pago está ${p.status}` });
    else if (p.status_cfdi !== "por-emitir") fuera.push({ receiptId: id, porque: `el pago ya está ${p.status_cfdi}` });
    else if (!dentroDelCorte(p.paid_at)) fuera.push({ receiptId: id, porque: "el cobro es anterior al corte" });
    else if (Number(p.refunded_mxn ?? 0) > 0) fuera.push({ receiptId: id, porque: "el pago tiene una devolución" });
  }
  return fuera;
}
