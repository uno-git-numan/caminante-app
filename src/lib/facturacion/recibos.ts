import "server-only";

// EL RECIBO DE CADA PAGO (0076): nota de venta no fiscal en la organización de
// la operadora que vende, con PDF, y el comprobante por correo con la llamada a
// facturar. Si el cliente no pide factura antes de que cierre el mes, la
// factura global del emisor (lib/facturacion/global.ts) se lo lleva.
//
// Desacoplado del webhook a propósito: el cobro se registra y termina; el recibo
// lo intenta `crearRecibosPendientes` (cron cada hora + llamada best-effort al
// final de cada cobro). Idempotente por pago: `idempotency_key` en Facturapi y
// el índice único de `payments.facturapi_receipt_id`.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emisorDePago, facturapiDe } from "@/lib/facturacion/emisor";
import { conceptosDePago, type PagoParaComprobante } from "@/lib/facturacion/conceptos";
import { facturacionClientesActiva } from "@/lib/facturacion/facturapi";
import { corteEnPalabras, dentroDelCorte, inicioDelCorte } from "@/lib/facturacion/corte";
import { sendViaResend } from "@/lib/email/resend";
import { boton, h1, marco, p, saludo } from "@/lib/email/plantilla";
import { SITE } from "@/lib/payments/pago-token";

const COLS = "id, reservation_id, contact_id, amount_mxn, status, status_cfdi, method, paid_at, facturapi_receipt_id";

export type ResultadoRecibo = { ok: true; receiptId: string; yaExistia: boolean } | { ok: false; error: string; reintentar: boolean };

/** Crea el recibo de UN pago (y manda el comprobante). Inerte si ya lo tiene. */
export async function crearReciboDePago(paymentId: string): Promise<ResultadoRecibo> {
  if (!facturacionClientesActiva()) return { ok: false, error: "Facturación a clientes apagada.", reintentar: true };
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("payments").select(COLS).eq("id", paymentId).maybeSingle();
  const pay = data as PagoParaComprobante | null;
  if (!pay) return { ok: false, error: "No encontramos ese pago.", reintentar: false };
  if (pay.facturapi_receipt_id) return { ok: true, receiptId: pay.facturapi_receipt_id, yaExistia: true };
  if (pay.status !== "paid") return { ok: false, error: "Sólo se emite recibo de un pago cobrado.", reintentar: false };
  if (pay.status_cfdi !== "por-emitir") return { ok: false, error: "Este pago ya tiene su documento fiscal.", reintentar: false };
  // Candado del corte: lo cobrado antes lo factura o lo cuadra la contadora.
  if (!dentroDelCorte(pay.paid_at)) return { ok: false, error: `Cobro anterior al ${corteEnPalabras()}: no lo factura la plataforma.`, reintentar: false };
  if (!(Number(pay.amount_mxn) > 0)) return { ok: false, error: "Monto en cero.", reintentar: false };

  const emisor = await emisorDePago(pay.id);
  if (!emisor.ok) return { ok: false, error: emisor.error, reintentar: emisor.porEmitir };
  const d = await conceptosDePago(pay);
  const api = facturapiDe(emisor.emisor);

  let recibo;
  try {
    recibo = await api.crearRecibo({ conceptos: d.conceptos, formaPago: d.formaPago, fecha: pay.paid_at ?? undefined, idempotencyKey: `pago-${pay.id}` });
  } catch (e) {
    return { ok: false, error: `Facturapi: ${(e as Error).message}`, reintentar: true };
  }
  const { error } = await sb
    .from("payments")
    .update({ facturapi_receipt_id: recibo.id, facturapi_receipt_key: recibo.key || null, recibo_expira_at: recibo.expiresAt || null })
    .eq("id", pay.id)
    .is("facturapi_receipt_id", null);
  if (error) return { ok: false, error: error.message, reintentar: true };

  // El comprobante: nuestro correo, con el PDF del recibo y el camino a la factura.
  try {
    await mandarComprobante({ pay, titulo: d.titulo, salida: d.salida, total: d.total, email: d.email, nombre: d.nombre, emisor: emisor.emisor.nombre, pdf: await api.descargarReciboPDF(recibo.id), expira: recibo.expiresAt });
    await sb.from("payments").update({ recibo_enviado_at: new Date().toISOString() }).eq("id", pay.id);
  } catch (e) {
    console.error("[recibos] comprobante no enviado:", (e as Error).message);
  }
  return { ok: true, receiptId: recibo.id, yaExistia: false };
}

/** Los pagos cobrados sin recibo, en orden de antigüedad. Devuelve cuántos salieron y cuántos siguen esperando emisor. */
export async function crearRecibosPendientes(limit = 25): Promise<{ emitidos: number; esperando: number; errores: string[] }> {
  if (!facturacionClientesActiva()) return { emitidos: 0, esperando: 0, errores: [] };
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("payments")
    .select("id")
    .eq("status", "paid")
    .eq("status_cfdi", "por-emitir")
    .is("facturapi_receipt_id", null)
    // Sólo lo cobrado desde el corte (00:00 CDMX, lib/facturacion/corte.ts): lo
    // anterior lo cuadra la contadora y no se le inventa un recibo. Lo que ella
    // facturó después del corte está `externo` y ya no entra por el filtro de arriba.
    .gte("paid_at", inicioDelCorte().toISOString())
    .order("paid_at", { ascending: true })
    .limit(limit);
  let emitidos = 0;
  let esperando = 0;
  const errores: string[] = [];
  for (const p of (data ?? []) as { id: string }[]) {
    const r = await crearReciboDePago(p.id);
    if (r.ok) emitidos += r.yaExistia ? 0 : 1;
    else if (r.reintentar) esperando += 1;
    else errores.push(`${p.id.slice(0, 8)}: ${r.error}`);
  }
  return { emitidos, esperando, errores };
}

const pesos = (n: number) => `$${Math.round(n).toLocaleString("en-US")} MXN`;
const fechaCorta = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "long" }).format(new Date(iso));

async function mandarComprobante(i: {
  pay: PagoParaComprobante;
  titulo: string;
  salida: string | null;
  total: number;
  email: string | null;
  nombre: string | null;
  emisor: string;
  pdf: ArrayBuffer;
  expira: string;
}): Promise<void> {
  if (!i.email) return;
  const limite = i.expira ? fechaCorta(i.expira) : "fin de mes";
  const { html, texto } = marco("Tu comprobante de pago", [
    h1("Recibimos tu pago"),
    p(`Hola${saludo(i.nombre)}. Va tu comprobante por <b>${pesos(i.total)}</b> de <b>${i.titulo}${i.salida ? ` · ${i.salida}` : ""}</b>. El PDF viene adjunto.`),
    p(`¿Necesitas factura? Entra a tu espacio, guarda tus datos fiscales y pídela con un clic <b>antes del ${limite}</b>. Después de esa fecha tu pago entra en la factura global del mes y ya no se puede facturar por separado.`),
    boton("Pedir mi factura", `${SITE}/caminante/perfil#facturas`),
    p(`La factura la emite ${i.emisor}, que opera tu experiencia; Caminante te la entrega aquí mismo.`),
  ]);
  await sendViaResend(i.email, `Tu comprobante · ${i.titulo}`, html, {
    ua: "caminante-recibos/1.0",
    text: texto,
    attachments: [{ filename: "comprobante-caminante.pdf", content: Buffer.from(i.pdf).toString("base64"), contentType: "application/pdf" }],
  });
}
