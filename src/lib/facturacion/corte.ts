// EL CORTE Y EL INTERRUPTOR DE LA FACTURACIÓN A CLIENTES (candados legales,
// DECISIONES-LEGAL-FISCAL §6, 12 nov 2026).
//
// 1 · Dos interruptores. La llave de NUMAN en Facturapi (`FACTURAPI_SECRET_KEY`)
//     sola prende ÚNICAMENTE el CFDI de retenciones a las operadoras: retener es
//     obligación de NUMAN (LISR 113-C, LIVA 18-J) sin importar cómo facture sus
//     ventas. Comprobantes, autofactura y factura global a clientes llevan además
//     `FACTURACION_CLIENTES=1`, apagado hasta el visto bueno de la contadora.
//
// 2 · El corte es CÓDIGO, no acuerdo. Nada se emite (comprobante, autofactura
//     ni global) sobre un cobro anterior al corte: eso lo facturó o lo cuadra la
//     contadora, y un CFDI nuestro encima es ingreso duplicado ante el SAT. Lo
//     posterior que ella ya facturó se marca `status_cfdi = 'externo'` con el
//     UUID de su CFDI (0083) y tampoco se toca. Cambiar la fecha es un commit,
//     con rastro, cuando la contadora la confirme (M18).
//
// Módulo puro a propósito: lo prueban los tests sin servidor.

/**
 * Primer día (hora de CDMX) cuyos cobros factura la plataforma: el 1 de
 * noviembre de 2026 (D21 de legal, aprobado por Luis el 17 nov). La plataforma
 * factura MESES COMPLETOS: la contadora pidió que el sistema emita toda la
 * facturación porque un mes trabajado a dos manos genera discrepancias. Octubre
 * y lo anterior los cierra ella. (La propuesta inicial era el 10 nov.)
 */
export const CORTE_FACTURACION_CLIENTES = "2026-11-01";

/** El instante del corte: 00:00 de CDMX (UTC−6, sin horario de verano desde 2022). */
export const inicioDelCorte = (): Date => new Date(`${CORTE_FACTURACION_CLIENTES}T00:00:00-06:00`);

/** ¿Este cobro le toca a la plataforma? Sin fecha de cobro, no. */
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
