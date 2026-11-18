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
import { datosFiscalesDe, emisorDePago } from "@/lib/facturacion/emisor";
import { REGIMENES } from "@/lib/facturacion/catalogos";
import { COLS_PAGO_COMPROBANTE as COLS, conceptosDePago, type PagoParaComprobante } from "@/lib/facturacion/conceptos";
import { facturacionClientesActiva } from "@/lib/facturacion/facturapi";
import { inicioDelCorte } from "@/lib/facturacion/corte";
import { netoDePago } from "@/lib/facturacion/devolucion-plan";
import { enPlazoParaFacturar, folioDePago, limiteParaFacturar } from "@/lib/facturacion/global-plan";
import { esVariante, limiteArrepentimiento, VENTANAS, ymdCdmx } from "@/lib/cancelacion/politica";
import { sendViaResend } from "@/lib/email/resend";
import { boton, h1, marco, p, saludo } from "@/lib/email/plantilla";
import { SITE } from "@/lib/payments/pago-token";

type Pago = PagoParaComprobante & { comprobante_enviado_at: string | null };

const pesos = (n: number) => `$${Math.round(n).toLocaleString("en-US")} MXN`;
const fechaCorta = (d: Date) => new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "long" }).format(d);
const fechaLarga = (d: Date) => new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "long", year: "numeric" }).format(d);

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
    // Los datos de quien emite van en el comprobante (D21). Sin RFC no es un
    // comprobante completo: se espera a que la operadora los tenga.
    const fiscal = await datosFiscalesDe(emisor.emisor);
    if (!fiscal.rfc || !fiscal.cp) {
      esperando += 1;
      continue;
    }
    try {
      const folio = folioDePago(pay.folio ?? pay.id);
      const limite = fechaCorta(limiteParaFacturar(pay.paid_at));
      const regimen = fiscal.regimen ? (REGIMENES.find((r) => r.clave === fiscal.regimen)?.label ?? fiscal.regimen) : null;
      const servicio = `${d.titulo}${d.salida ? ` · ${d.salida}` : ""}`;
      // Lo que legal pide que lleve el comprobante de la operación (D21): quién
      // emite (RFC y régimen), lugar y fecha, el servicio, el total y el folio.
      const renglones = [
        `<b>Folio:</b> ${folio}`,
        `<b>Emite:</b> ${fiscal.razonSocial ?? emisor.emisor.nombre} · RFC ${fiscal.rfc}`,
        regimen ? `<b>Régimen fiscal:</b> ${regimen}` : null,
        `<b>Lugar de expedición:</b> C.P. ${fiscal.cp}`,
        `<b>Fecha del pago:</b> ${fechaLarga(new Date(pay.paid_at))}`,
        `<b>Servicio:</b> ${servicio}`,
        `<b>Total pagado:</b> ${pesos(d.total)} (IVA incluido)`,
      ].filter(Boolean);
      const cancelacion = await politicaAceptada(pay);
      const { html, texto } = marco("Tu comprobante de pago", [
        h1("Recibimos tu pago"),
        p(`Hola${saludo(d.nombre)}. Éste es el comprobante de tu pago por <b>${servicio}</b>.`),
        p(renglones.join("<br>")),
        // La política que aceptó al pagar y hasta cuándo puede arrepentirse (D23).
        ...(cancelacion ? [p(cancelacion)] : []),
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

/**
 * El renglón de la política de cancelación para el comprobante (D23 de legal):
 * la liga a la política que aceptó y, si tiene derecho a arrepentirse, la fecha
 * límite ya calculada. null si la reserva no guardó una política (0089).
 */
async function politicaAceptada(pay: Pago): Promise<string | null> {
  if (!pay.reservation_id) return null;
  const sb = createSupabaseAdminClient();
  const { data: resv } = await sb
    .from("reservations")
    .select("politica_variante, politica_aceptada_at, experience_id, slot_id")
    .eq("id", pay.reservation_id)
    .maybeSingle();
  if (!resv || !esVariante(resv.politica_variante)) return null;
  const [{ data: exp }, { data: slot }] = await Promise.all([
    sb.from("experiences").select("slug").eq("id", resv.experience_id as string).maybeSingle(),
    resv.slot_id ? sb.from("experience_slots").select("starts_at").eq("id", resv.slot_id as string).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  if (!exp?.slug) return null;
  const liga = `${SITE}/caminante/experiencias/${exp.slug}#cancelacion`;
  let plazo = "";
  const inicio = (slot as { starts_at?: string | null } | null)?.starts_at;
  const aceptada = (resv.politica_aceptada_at as string | null) ?? pay.paid_at;
  if (inicio && aceptada) {
    try {
      // Los 5 días hábiles corren desde lo último entre la aceptación y el
      // PRIMER pago de la reserva (D24.2), que no siempre es éste.
      const { data: primer } = await sb.from("payments").select("paid_at").eq("reservation_id", pay.reservation_id).not("paid_at", "is", null).order("paid_at", { ascending: true }).limit(1).maybeSingle();
      const primerPago = (primer as { paid_at?: string | null } | null)?.paid_at ?? pay.paid_at;
      const plazoDesde = primerPago && new Date(primerPago).getTime() > new Date(aceptada).getTime() ? primerPago : aceptada;
      const limite = limiteArrepentimiento(aceptada, ymdCdmx(inicio), plazoDesde);
      if (limite && new Date(limite).getTime() > Date.now()) {
        const cuando = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }).format(new Date(limite));
        plazo = ` Si te arrepientes, puedes cancelar con la devolución del <b>100 %</b> hasta el <b>${cuando}</b> (hora del centro de México).`;
      }
    } catch {
      /* año sin lista de días de descanso: no se inventa una fecha */
    }
  }
  return `Al pagar aceptaste la <a href="${liga}">política de cancelación</a> de esta experiencia (${VENTANAS[resv.politica_variante].nombre}).${plazo}`;
}
