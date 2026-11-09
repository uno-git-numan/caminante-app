import "server-only";

// EL NÚCLEO DE EMISIÓN: la factura al cliente de UN pago ya cobrado.
//
// Lo llaman dos puertas: la autofactura pública por token (`actions.ts`, quien
// compró sin cuenta) y «Facturar» en Mi espacio (`lib/perfil/facturacion-actions.ts`,
// con la ficha fiscal guardada). Las dos validan QUIÉN pide; aquí se valida QUÉ
// se factura y se timbra una sola vez (índice único pending/stamped por pago).
//
// Modelo Airbnb (MAPA-FACTURACION.md §0): la emite la OPERADORA de la
// experiencia con su CSD, desde su organización de Facturapi (`emisor.ts`).
// Si el pago ya tiene su RECIBO (0076), se factura ese recibo (Facturapi lo
// saca de la global); si no lo tiene, se emite la factura directa con los
// mismos conceptos (`conceptos.ts`).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emisorDePago, facturapiDe } from "@/lib/facturacion/emisor";
import { conceptosDePago, type PagoParaComprobante } from "@/lib/facturacion/conceptos";
import type { ReceptorFiscal } from "@/lib/facturacion/facturapi";
import { esCpValido, esRfcValido, regimenCompatible, usoCfdiValido } from "@/lib/facturacion/catalogos";

export type ResultadoEmision = { ok: true; invoiceId: string; uuid: string } | { ok: false; error: string };

/** Valida la ficha del receptor con los catálogos antes de gastar un timbre. */
export function validarReceptor(r: ReceptorFiscal): string | null {
  if (!esRfcValido(r.rfc)) return "El RFC no es válido.";
  if (!r.razonSocial.trim()) return "Falta la razón social (nombre fiscal, exacto como en tu constancia).";
  if (!regimenCompatible(r.rfc, r.regimenFiscal)) return "El régimen fiscal no corresponde a ese RFC.";
  if (!usoCfdiValido(r.usoCfdi)) return "El uso de CFDI no es válido.";
  if (!esCpValido(r.codigoPostal)) return "El código postal debe tener 5 dígitos.";
  if (!r.email.includes("@")) return "El correo no es válido.";
  return null;
}

/**
 * ¿Este pago se puede facturar ahora, y por qué no si no? Lo lee también la
 * pantalla, para no ofrecer un botón que va a fallar.
 */
export async function estadoFacturable(pay: PagoParaComprobante): Promise<{ ok: true } | { ok: false; motivo: string; porEmitir: boolean }> {
  if (pay.status !== "paid") return { ok: false, motivo: "Sólo se factura un pago cobrado.", porEmitir: false };
  if (pay.status_cfdi === "emitido") return { ok: false, motivo: "Este pago ya tiene factura.", porEmitir: false };
  if (pay.status_cfdi === "publico-general") return { ok: false, motivo: "Este pago ya entró en la factura global del mes.", porEmitir: false };
  if (pay.status_cfdi !== "por-emitir") return { ok: false, motivo: "Este pago ya no se puede facturar por separado.", porEmitir: false };
  if (!(Number(pay.amount_mxn) > 0)) return { ok: false, motivo: "El monto no permite facturación.", porEmitir: false };
  const emisor = await emisorDePago(pay.id);
  if (!emisor.ok) return { ok: false, motivo: emisor.error, porEmitir: emisor.porEmitir };
  return { ok: true };
}

/** Emite la factura del pago. Idempotente por el índice único de cfdi_invoices. */
export async function emitirCFDIDePago(input: { paymentId: string; receptor: ReceptorFiscal }): Promise<ResultadoEmision> {
  const sb = createSupabaseAdminClient();
  const receptor: ReceptorFiscal = {
    ...input.receptor,
    rfc: input.receptor.rfc.trim().toUpperCase(),
    razonSocial: input.receptor.razonSocial.trim(),
    email: input.receptor.email.trim(),
  };
  const malo = validarReceptor(receptor);
  if (malo) return { ok: false, error: malo };

  const { data } = await sb
    .from("payments")
    .select("id, reservation_id, contact_id, amount_mxn, status, status_cfdi, method, paid_at, facturapi_receipt_id")
    .eq("id", input.paymentId)
    .maybeSingle();
  const pay = data as PagoParaComprobante | null;
  if (!pay) return { ok: false, error: "No encontramos ese pago." };
  const puede = await estadoFacturable(pay);
  if (!puede.ok) return { ok: false, error: puede.motivo };
  const emisor = await emisorDePago(pay.id);
  if (!emisor.ok) return { ok: false, error: emisor.error };
  const api = facturapiDe(emisor.emisor);
  const d = await conceptosDePago(pay);

  // ── Reservar el pago contra doble timbre ────────────────────────────────
  const { data: inv, error: invErr } = await sb
    .from("cfdi_invoices")
    .insert({
      payment_id: pay.id,
      reservation_id: pay.reservation_id,
      contact_id: pay.contact_id,
      tipo: "cliente",
      emisor_operator_id: emisor.emisor.operatorId,
      facturapi_receipt_id: pay.facturapi_receipt_id ?? null,
      rfc: receptor.rfc,
      razon_social: receptor.razonSocial,
      regimen_fiscal: receptor.regimenFiscal,
      uso_cfdi: receptor.usoCfdi,
      codigo_postal: receptor.codigoPostal,
      email: receptor.email,
      total_mxn: d.total,
      status: "pending",
    })
    .select("id")
    .single();
  if (invErr || !inv) {
    if (invErr?.code === "23505") return { ok: false, error: "Este pago ya está en proceso de facturación." };
    return { ok: false, error: "No pudimos iniciar la factura. Intenta de nuevo." };
  }
  const invoiceId = inv.id as string;

  // ── Timbrar (recibo → factura, o factura directa), archivar, marcar, mandar ─
  try {
    const factura = pay.facturapi_receipt_id
      ? await api.facturarRecibo(pay.facturapi_receipt_id, receptor, d.total)
      : await api.crearFacturaIngreso({ receptor, conceptos: d.conceptos, formaPago: d.formaPago });
    const now = new Date();
    const base = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${factura.uuid}`;
    let xmlPath: string | null = null;
    let pdfPath: string | null = null;
    try {
      const [xml, pdf] = await Promise.all([api.descargarCFDI(factura.id, "xml"), api.descargarCFDI(factura.id, "pdf")]);
      const up1 = await sb.storage.from("cfdi").upload(`${base}.xml`, Buffer.from(xml), { contentType: "application/xml", upsert: true });
      const up2 = await sb.storage.from("cfdi").upload(`${base}.pdf`, Buffer.from(pdf), { contentType: "application/pdf", upsert: true });
      if (!up1.error) xmlPath = `${base}.xml`;
      if (!up2.error) pdfPath = `${base}.pdf`;
    } catch {
      /* el CFDI YA está timbrado: archivar después, no romper */
    }
    await sb
      .from("cfdi_invoices")
      .update({
        status: "stamped",
        facturapi_id: factura.id,
        uuid_cfdi: factura.uuid,
        subtotal_mxn: factura.subtotal,
        iva_mxn: factura.iva,
        xml_url: xmlPath,
        pdf_url: pdfPath,
        stamped_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);
    await sb.from("payments").update({ status_cfdi: "emitido" }).eq("id", pay.id);
    await api.enviarCFDIPorCorreo(factura.id, receptor.email);
    return { ok: true, invoiceId, uuid: factura.uuid };
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from("cfdi_invoices").update({ status: "error", error: msg.slice(0, 500) }).eq("id", invoiceId);
    return { ok: false, error: `No se pudo timbrar: ${msg}` };
  }
}
