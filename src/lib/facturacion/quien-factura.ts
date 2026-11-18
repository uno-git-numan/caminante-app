// QUIÉN LE FACTURA AL CLIENTE (D22 de legal, 17 nov 2026).
//
// Lo decide el CONVENIO, no el canal por el que entró el dinero:
//   · experiencia de la casa, o sin operadora → factura la casa (NUMAN);
//   · operadora SIN convenio firmado (vende con dispensa) → NUMAN vende a
//     nombre propio y factura NUMAN; la operadora es su proveedora y le factura
//     a NUMAN su servicio (D6);
//   · operadora CON convenio firmado → ella es quien vende, y factura ella
//     (desde el portal si lo activó; si no, por sus medios).
//
// Antes el código buscaba siempre a la operadora de la experiencia: una venta
// de una operadora sin convenio se habría quedado sin factura.
//
// Módulo puro a propósito: lo prueban los tests sin servidor.

export type OperadoraParaFacturar = { es_la_casa?: boolean | null; convenio_firmado_at?: string | null };

/** ¿La factura al cliente de una venta de esta operadora la emite la casa? `null` = sin operadora. */
export function facturaLaCasa(op: OperadoraParaFacturar | null | undefined): boolean {
  return !op || Boolean(op.es_la_casa) || !op.convenio_firmado_at;
}
