import "server-only";

// EL COMPROBANTE DE CADA PAGO: nuestro correo, con el folio de la operación y
// la llamada a facturar antes de que cierre el mes. Si el cliente no pide
// factura, la global del emisor (lib/facturacion/global.ts) se lleva el pago
// con ese mismo folio.
//
// Hasta el 17 nov 2026 esto creaba un RECIBO en Facturapi y adjuntaba su PDF.
// Los recibos son un producto aparte ($599 al mes por organización) y no
// hacían falta: el comprobante es nuestro y la factura sale directa.
//
// Desacoplado del webhook a propósito: el cobro se registra y termina; el
// comprobante lo manda `mandarComprobantesPendientes` (cron cada hora +
// llamada best-effort al final de cada cobro). Idempotente por pago:
// `comprobante_enviado_at`.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emisorDePago } from "@/lib/facturacion/emisor";
import { COLS_PAGO_COMPROBANTE as COLS, conceptosDePago, type PagoParaComprobante } from "@/lib/facturacion/conceptos";
import { facturacionClientesActiva } from "@/lib/facturacion/facturapi";
import { inicioDelCorte } from "@/lib/facturacion/corte";
import { netoDePago } from "@/lib/facturacion/devolucion-plan";
import { enPlazoParaFacturar, folioDePago, limiteParaFacturar } from "@/lib/facturacion/global-plan";
import { sendViaResend } from "@/lib/email/resend";
import { boton, h1, marco, p, saludo } from "@/lib/email/plantilla";
import { SITE } from "@/lib/payments/pago-token";

type Pago = PagoParaComprobante & { comprobante_enviado_at: string | null };

const pesos = (n: number) => `$${Math.round(n).toLocaleString("en-US")} MXN`;
const fechaCorta = (d: Date) => new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "long" }).format(d);

/**
 * Manda el comprobante de los pagos cobrados desde el corte que aún no lo
 * tienen. Sólo donde la factura se puede pedir aquí: si la operadora de la
 * venta no factura desde el portal, este correo prometería algo que no existe.
 */
export async function mandarComprobantesPendientes(limit = 25): Promise<{ enviados: number; esperando: number; errores: string[] }> {
  if (!facturacionClientesActiva()) return { enviados: 0, esperando: 0, errores: [] };
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("payments")
    .select(`${COLS}, comprobante_enviado_at`)
    .eq("status", "paid")
    .eq("status_cfdi", "por-emitir")
    .is("comprobante_enviado_at", null)
    // Sólo lo cobrado desde el corte (00:00 CDMX, lib/facturacion/corte.ts): lo
    // anterior lo cuadra la contadora.
    .gte("paid_at", inicioDelCorte().toISOString())
    .order("paid_at", { ascending: false })
    .limit(200);
  let enviados = 0;
  let esperando = 0;
  const errores: string[] = [];
  for (const pay of (data ?? []) as Pago[]) {
    if (enviados >= limit) break;
    // Pasado el fin de su mes ya no se factura por separado: no se le ofrece.
    if (!enPlazoParaFacturar(pay.paid_at) || !(netoDePago(pay) > 0) || !pay.paid_at) continue;
    const emisor = await emisorDePago(pay.id);
    if (!emisor.ok) {
      esperando += 1;
      continue;
    }
    const d = await conceptosDePago(pay);
    if (!d.email) continue; // sin correo no hay a quién mandarlo; la factura se pide igual en Mi espacio
    try {
      const folio = folioDePago(pay.folio ?? pay.id);
      const limite = fechaCorta(limiteParaFacturar(pay.paid_at));
      const { html, texto } = marco("Tu comprobante de pago", [
        h1("Recibimos tu pago"),
        p(`Hola${saludo(d.nombre)}. Recibimos <b>${pesos(d.total)}</b> por <b>${d.titulo}${d.salida ? ` · ${d.salida}` : ""}</b>. Tu folio de operación es <b>${folio}</b>.`),
        p(`¿Necesitas factura? Entra a tu espacio, guarda tus datos fiscales y pídela con un clic <b>a más tardar el ${limite}</b>. Después de esa fecha tu pago entra en la factura global del mes y ya no se puede facturar por separado.`),
        boton("Pedir mi factura", `${SITE}/caminante/perfil#facturas`),
        p(`La factura la emite ${emisor.emisor.nombre}, que opera tu experiencia; Caminante te la entrega aquí mismo.`),
      ]);
      // `sendViaResend` no truena: devuelve si salió. Sólo se marca lo que sí salió.
      const salio = await sendViaResend(d.email, `Tu comprobante · ${d.titulo}`, html, { ua: "caminante-comprobantes/1.0", text: texto });
      if (!salio) {
        errores.push(`${pay.id.slice(0, 8)}: el correo no salió`);
        continue;
      }
      await sb.from("payments").update({ comprobante_enviado_at: new Date().toISOString() }).eq("id", pay.id).is("comprobante_enviado_at", null);
      enviados += 1;
    } catch (e) {
      errores.push(`${pay.id.slice(0, 8)}: ${(e as Error).message}`);
    }
  }
  return { enviados, esperando, errores };
}
