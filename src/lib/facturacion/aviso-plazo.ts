import "server-only";

// EL PLAZO PARA PEDIR FACTURA, DICHO AL COMPRAR (D21 de legal, LFPC art. 7).
//
// Un pago sólo se factura por separado hasta el fin del mes del cobro; después
// entra en la global. Legal aceptó ese plazo con una condición: que el cliente
// lo sepa ANTES de pagar y lo vuelva a leer en su comprobante. Esto arma la
// frase para las pantallas de compra, y sólo donde es verdad: con la
// facturación a clientes prendida y con un emisor que sí factura desde aquí.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emisorDeOperadora } from "@/lib/facturacion/emisor";
import { facturacionClientesActiva } from "@/lib/facturacion/facturapi";
import { avisoPlazoFactura } from "@/lib/facturacion/global-plan";

/** La frase del plazo para una venta de esta operadora (null = la casa). null si aquí no se factura. */
export async function avisoFacturaDeOperadora(operatorId: string | null): Promise<string | null> {
  if (!facturacionClientesActiva()) return null;
  if (operatorId) {
    const e = await emisorDeOperadora(operatorId);
    if (!e.ok) return null;
  }
  return avisoPlazoFactura();
}

/** Lo mismo, partiendo de una reserva (la página de pago). */
export async function avisoFacturaDeReserva(reservationId: string): Promise<string | null> {
  if (!facturacionClientesActiva()) return null;
  const sb = createSupabaseAdminClient();
  const { data: resv } = await sb.from("reservations").select("experience_id").eq("id", reservationId).maybeSingle();
  if (!resv?.experience_id) return null;
  const { data: exp, error } = await sb.from("experiences").select("operator_id").eq("id", resv.experience_id as string).maybeSingle();
  if (error || !exp) return null;
  return avisoFacturaDeOperadora((exp.operator_id as string | null) ?? null);
}
