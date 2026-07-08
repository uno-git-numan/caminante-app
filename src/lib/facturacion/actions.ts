"use server";

// Autofactura: emite el CFDI de ingreso de un pago ya cobrado. Público (sin
// login) pero seguro: solo actúa sobre un paymentId cuyo token firmado coincide
// (lo genera la pantalla de éxito o el lookup correo+monto). Timbra en Facturapi,
// archiva XML+PDF en Storage, marca el pago 'emitido' y manda el CFDI al cliente.

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { tokenValido } from "@/lib/facturacion/token";
import {
  facturacionActiva,
  crearFacturaIngreso,
  descargarCFDI,
  enviarCFDIPorCorreo,
} from "@/lib/facturacion/facturapi";
import {
  esRfcValido,
  esCpValido,
  regimenCompatible,
  usoCfdiValido,
} from "@/lib/facturacion/catalogos";
import type { Experience } from "@/lib/experiences/types";

function volver(paymentId: string, token: string, error: string): never {
  redirect(
    `/caminante/facturacion?p=${encodeURIComponent(paymentId)}&t=${encodeURIComponent(
      token,
    )}&error=${encodeURIComponent(error)}`,
  );
}

export async function emitirCFDI(formData: FormData): Promise<void> {
  const paymentId = String(formData.get("paymentId") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();

  // 0 · El token debe corresponder a este pago (prueba de titularidad).
  if (!paymentId || !tokenValido(paymentId, token)) {
    redirect("/caminante/facturacion?error=sesion");
  }
  if (!facturacionActiva()) volver(paymentId, token, "La facturación aún no está disponible.");

  const rfc = String(formData.get("rfc") ?? "").trim().toUpperCase();
  const razonSocial = String(formData.get("razonSocial") ?? "").trim();
  const regimenFiscal = String(formData.get("regimen") ?? "").trim();
  const usoCfdi = String(formData.get("uso") ?? "").trim();
  const codigoPostal = String(formData.get("cp") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  // 1 · Validación fiscal antes de gastar un timbre.
  if (!esRfcValido(rfc)) volver(paymentId, token, "El RFC no es válido.");
  if (!razonSocial) volver(paymentId, token, "Falta la razón social (nombre fiscal).");
  if (!regimenCompatible(rfc, regimenFiscal))
    volver(paymentId, token, "El régimen fiscal no corresponde a ese RFC.");
  if (!usoCfdiValido(usoCfdi)) volver(paymentId, token, "El uso de CFDI no es válido.");
  if (!esCpValido(codigoPostal)) volver(paymentId, token, "El código postal debe tener 5 dígitos.");
  if (!email.includes("@")) volver(paymentId, token, "El correo no es válido.");

  const sb = createSupabaseAdminClient();

  // 2 · El pago: cobrado, facturable y con monto.
  const { data: pay } = await sb
    .from("payments")
    .select("id, reservation_id, contact_id, amount_mxn, status, status_cfdi")
    .eq("id", paymentId)
    .maybeSingle();
  if (!pay || pay.status !== "paid") volver(paymentId, token, "No encontramos ese pago.");
  if (pay.status_cfdi === "emitido") volver(paymentId, token, "Este pago ya fue facturado.");
  if (pay.status_cfdi !== "por-emitir")
    volver(paymentId, token, "Este pago ya no se puede facturar individualmente.");
  const total = Number(pay.amount_mxn || 0);
  if (total <= 0) volver(paymentId, token, "El monto del pago no permite facturación.");

  // Concepto legible: experiencia + salida.
  let descripcion = "Experiencia Caminante";
  try {
    const { data: resv } = await sb
      .from("reservations")
      .select("experience_id, slot_id")
      .eq("id", pay.reservation_id)
      .maybeSingle();
    if (resv) {
      const { data: expRow } = await sb
        .from("experiences")
        .select("data")
        .eq("id", resv.experience_id)
        .maybeSingle();
      const exp = (expRow?.data as Experience | undefined) ?? undefined;
      const nombre =
        exp?.cardTitle || [exp?.title, exp?.titleAccent].filter(Boolean).join(" ").trim() || "";
      let salida = "";
      if (resv.slot_id) {
        const { data: slot } = await sb
          .from("experience_slots")
          .select("label")
          .eq("id", resv.slot_id)
          .maybeSingle();
        salida = (slot?.label as string | null) ?? "";
      }
      descripcion = ["Experiencia Caminante", nombre, salida].filter(Boolean).join(" — ");
    }
  } catch {
    /* concepto genérico si falla la lectura */
  }

  // 3 · Reserva el pago contra doble-timbrado (índice único pending/stamped).
  const { data: inv, error: invErr } = await sb
    .from("cfdi_invoices")
    .insert({
      payment_id: pay.id,
      reservation_id: pay.reservation_id,
      contact_id: pay.contact_id,
      rfc,
      razon_social: razonSocial,
      regimen_fiscal: regimenFiscal,
      uso_cfdi: usoCfdi,
      codigo_postal: codigoPostal,
      email,
      total_mxn: total,
      status: "pending",
    })
    .select("id")
    .single();
  if (invErr) {
    // 23505 = ya hay un CFDI vivo (pending/stamped) para este pago.
    if (invErr.code === "23505") volver(paymentId, token, "Este pago ya está en proceso de facturación.");
    volver(paymentId, token, "No pudimos iniciar la factura. Intenta de nuevo.");
  }
  const invoiceId = inv!.id as string;

  // 4 · Timbrar. Si falla, deja rastro y libera el pago para reintentar.
  try {
    const factura = await crearFacturaIngreso({
      receptor: {
        rfc,
        razonSocial,
        regimenFiscal,
        usoCfdi,
        codigoPostal,
        email,
      },
      totalConIva: total,
      descripcion,
    });

    // Archivar XML+PDF en el bucket privado 'cfdi'.
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const base = `${year}/${month}/${factura.uuid}`;
    let xmlPath: string | null = null;
    let pdfPath: string | null = null;
    try {
      const xml = await descargarCFDI(factura.id, "xml");
      const pdf = await descargarCFDI(factura.id, "pdf");
      const up1 = await sb.storage.from("cfdi").upload(`${base}.xml`, Buffer.from(xml), {
        contentType: "application/xml",
        upsert: true,
      });
      const up2 = await sb.storage.from("cfdi").upload(`${base}.pdf`, Buffer.from(pdf), {
        contentType: "application/pdf",
        upsert: true,
      });
      if (!up1.error) xmlPath = `${base}.xml`;
      if (!up2.error) pdfPath = `${base}.pdf`;
    } catch {
      /* si el archivado falla, el CFDI YA está timbrado — no romper */
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
    await enviarCFDIPorCorreo(factura.id, email);
  } catch (e) {
    await sb
      .from("cfdi_invoices")
      .update({ status: "error", error: (e as Error).message.slice(0, 500) })
      .eq("id", invoiceId);
    volver(paymentId, token, `No se pudo timbrar: ${(e as Error).message}`);
  }

  redirect(`/caminante/facturacion?p=${encodeURIComponent(paymentId)}&t=${encodeURIComponent(token)}&ok=1`);
}
