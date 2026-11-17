import "server-only";

// LA DEVOLUCIÓN EN LOS PAPELES (D19, DECISIONES-LEGAL-FISCAL §4; 0084).
//
// Cuando Stripe confirma una devolución, el documento fiscal de ese pago se
// corrige el MISMO DÍA. Qué documento, lo decide `planDevolucion`
// (devolucion-plan.ts, puro y probado); aquí se ejecuta:
//
//   · sin CFDI todavía   → nada: lo que se emita después (la factura del
//                         cliente o la global) ya sale por lo neto.
//   · egreso            → ya había CFDI (factura del cliente o global): CFDI de
//                         egreso relacionado (01) por lo devuelto que aún no ampara
//                         ningún egreso.
//   · contadora         → la factura es de la contadora (`externo`): su egreso
//                         también; la pantalla de facturación lo lista.
//
// Lo llaman dos vías, y las dos pueden ser la primera: `finalizeRefund` en
// cuanto Stripe confirma (webhook o respuesta directa del panel) y el cron de
// comprobantes cada hora, que recoge lo que haya fallado. Idempotente: el
// egreso se identifica por el acumulado devuelto que documenta (índice único
// de la 0084).
//
// NUNCA tira el cierre del reembolso: el dinero ya volvió. Un fallo se registra
// y lo reintenta el cron.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cpFiscalDe, emisorDeOperadora, emisorDePago, facturapiDe } from "@/lib/facturacion/emisor";
import { conceptosDePago, type PagoParaComprobante } from "@/lib/facturacion/conceptos";
import { facturacionClientesActiva, type ReceptorFiscal } from "@/lib/facturacion/facturapi";
import { inicioDelCorte } from "@/lib/facturacion/corte";
import { conceptoDeEgreso, planDevolucion, type PlanDevolucion } from "@/lib/facturacion/devolucion-plan";
import { folioDePago } from "@/lib/facturacion/global-plan";

const COLS = "id, folio, reservation_id, contact_id, amount_mxn, refunded_mxn, status, status_cfdi, method, paid_at, devuelto_al_facturar_mxn, cfdi_global_id";

type Pago = PagoParaComprobante & {
  refunded_mxn: number | null;
  devuelto_al_facturar_mxn: number | null;
  cfdi_global_id: string | null;
};

export type ResultadoDevolucion =
  | { ok: true; accion: PlanDevolucion["accion"]; detalle: string }
  | { ok: false; error: string; reintentar: boolean };


/** Corrige el documento fiscal de UN pago según lo que Stripe ya devolvió. */
export async function documentarDevolucion(paymentId: string): Promise<ResultadoDevolucion> {
  if (!facturacionClientesActiva()) return { ok: false, error: "Facturación a clientes apagada.", reintentar: true };
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("payments").select(COLS).eq("id", paymentId).maybeSingle();
  const pay = data as Pago | null;
  if (!pay) return { ok: false, error: "No encontramos ese pago.", reintentar: false };

  const { data: egresos } = await sb
    .from("cfdi_invoices")
    .select("devuelto_acumulado_mxn")
    .eq("payment_id", pay.id)
    .eq("tipo", "egreso")
    .in("status", ["pending", "stamped"]);
  const cubierto = Math.max(0, ...((egresos ?? []) as { devuelto_acumulado_mxn: number | null }[]).map((e) => Number(e.devuelto_acumulado_mxn ?? 0)));

  const plan = planDevolucion(pay, cubierto);
  switch (plan.accion) {
    case "nada":
      return { ok: true, accion: "nada", detalle: plan.porque };
    case "contadora":
      return { ok: true, accion: "contadora", detalle: plan.porque };
    case "egreso":
      return emitirEgreso(pay, plan);
  }
}

// ── Con CFDI: el egreso ──────────────────────────────────────────────────────

type Original = { uuid: string; emisorId: string | null; receptor: ReceptorFiscal | null; globalId: string | null };

async function originalDe(pay: Pago): Promise<Original | null> {
  const sb = createSupabaseAdminClient();
  if (pay.status_cfdi === "emitido") {
    const { data } = await sb
      .from("cfdi_invoices")
      .select("uuid_cfdi, emisor_operator_id, rfc, razon_social, regimen_fiscal, uso_cfdi, codigo_postal, email")
      .eq("payment_id", pay.id)
      .eq("tipo", "cliente")
      .eq("status", "stamped")
      .maybeSingle();
    const i = data as Record<string, string | null> | null;
    if (!i?.uuid_cfdi) return null;
    return {
      uuid: i.uuid_cfdi,
      emisorId: i.emisor_operator_id,
      globalId: null,
      receptor: { rfc: i.rfc ?? "", razonSocial: i.razon_social ?? "", regimenFiscal: i.regimen_fiscal ?? "", usoCfdi: "G02", codigoPostal: i.codigo_postal ?? "", email: i.email ?? "" },
    };
  }
  if (!pay.cfdi_global_id) return null;
  const { data } = await sb.from("cfdi_globales").select("id, uuid_cfdi, emisor_operator_id, status").eq("id", pay.cfdi_global_id).maybeSingle();
  const g = data as { id: string; uuid_cfdi: string | null; emisor_operator_id: string | null; status: string } | null;
  if (!g?.uuid_cfdi || g.status !== "stamped") return null;
  return { uuid: g.uuid_cfdi, emisorId: g.emisor_operator_id, globalId: g.id, receptor: null };
}

async function emitirEgreso(pay: Pago, plan: Extract<PlanDevolucion, { accion: "egreso" }>): Promise<ResultadoDevolucion> {
  const sb = createSupabaseAdminClient();
  const original = await originalDe(pay);
  if (!original) return { ok: false, error: "No encontramos el CFDI timbrado que corrige este egreso.", reintentar: false };
  const emisor = original.emisorId ? await emisorDeOperadora(original.emisorId) : await emisorDePago(pay.id);
  if (!emisor.ok) return { ok: false, error: emisor.error, reintentar: emisor.porEmitir };
  const cpEmisor = original.receptor ? original.receptor.codigoPostal : await cpFiscalDe(emisor.emisor);
  if (!cpEmisor) return { ok: false, error: "Falta el código postal fiscal del emisor para el egreso a público en general.", reintentar: false };

  const d = await conceptosDePago(pay);
  const clave = d.conceptos[0]?.claveProdServ;
  const r = original.receptor;

  // Reservar este acumulado contra doble timbre (índice único de la 0084).
  const { data: fila, error: insErr } = await sb
    .from("cfdi_invoices")
    .insert({
      payment_id: pay.id,
      reservation_id: pay.reservation_id,
      contact_id: pay.contact_id,
      tipo: "egreso",
      emisor_operator_id: emisor.emisor.operatorId,
      rfc: r?.rfc ?? "XAXX010101000",
      razon_social: r?.razonSocial ?? "PUBLICO EN GENERAL",
      regimen_fiscal: r?.regimenFiscal ?? "616",
      uso_cfdi: "G02",
      codigo_postal: cpEmisor,
      email: r?.email || null,
      total_mxn: plan.importe,
      status: "pending",
      relacionado_uuid: original.uuid,
      devuelto_acumulado_mxn: plan.devuelto,
      cfdi_global_id: original.globalId,
    })
    .select("id")
    .single();
  if (insErr || !fila) {
    if (insErr?.code === "23505") return { ok: true, accion: "nada", detalle: "Este egreso ya está en proceso." };
    return { ok: false, error: insErr?.message ?? "No se pudo registrar el egreso.", reintentar: true };
  }
  const egresoId = fila.id as string;
  const api = facturapiDe(emisor.emisor);

  try {
    const egreso = await api.crearEgreso({
      receptor: r,
      cpEmisor,
      formaPago: d.formaPago,
      uuidRelacionado: original.uuid,
      // Contra la global: clave 84111506 con el folio; contra la factura del
      // cliente: la clave de la experiencia (D21 bis, `conceptoDeEgreso`).
      conceptos: [
        conceptoDeEgreso({
          contraGlobal: !r,
          folio: folioDePago(pay.folio ?? pay.id),
          importe: plan.importe,
          servicio: [d.titulo, d.salida].filter(Boolean).join(" · "),
          claveExperiencia: clave,
        }),
      ],
    });
    const now = new Date();
    const base = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/egreso-${egreso.uuid}`;
    let xmlPath: string | null = null;
    let pdfPath: string | null = null;
    try {
      const [xml, pdf] = await Promise.all([api.descargarCFDI(egreso.id, "xml"), api.descargarCFDI(egreso.id, "pdf")]);
      const up1 = await sb.storage.from("cfdi").upload(`${base}.xml`, Buffer.from(xml), { contentType: "application/xml", upsert: true });
      const up2 = await sb.storage.from("cfdi").upload(`${base}.pdf`, Buffer.from(pdf), { contentType: "application/pdf", upsert: true });
      if (!up1.error) xmlPath = `${base}.xml`;
      if (!up2.error) pdfPath = `${base}.pdf`;
    } catch {
      /* el egreso YA está timbrado: archivar después, no romper */
    }
    await sb
      .from("cfdi_invoices")
      .update({ status: "stamped", facturapi_id: egreso.id, uuid_cfdi: egreso.uuid, subtotal_mxn: egreso.subtotal, iva_mxn: egreso.iva, xml_url: xmlPath, pdf_url: pdfPath, stamped_at: new Date().toISOString() })
      .eq("id", egresoId);
    // Al cliente que tenía factura a su nombre le llega su nota de crédito.
    if (r?.email) await api.enviarCFDIPorCorreo(egreso.id, r.email);
    return { ok: true, accion: "egreso", detalle: `Egreso ${egreso.uuid} por $${plan.importe}, relacionado a ${original.uuid}.` };
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from("cfdi_invoices").update({ status: "error", error: msg.slice(0, 500) }).eq("id", egresoId);
    return { ok: false, error: `No se pudo timbrar el egreso: ${msg}`, reintentar: true };
  }
}

// ── La red: lo que no se documentó al momento ───────────────────────────────

/** Pagos con devolución desde el corte cuyo documento quizá falta corregir. Lo corre el cron de comprobantes. */
export async function documentarDevolucionesPendientes(limit = 25): Promise<{ hechos: number; errores: string[] }> {
  if (!facturacionClientesActiva()) return { hechos: 0, errores: [] };
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("payments")
    .select("id")
    .gt("refunded_mxn", 0)
    .in("status_cfdi", ["emitido", "publico-general"])
    .gte("paid_at", inicioDelCorte().toISOString())
    .order("paid_at", { ascending: false })
    .limit(limit);
  let hechos = 0;
  const errores: string[] = [];
  for (const p of (data ?? []) as { id: string }[]) {
    const r = await documentarDevolucion(p.id);
    if (r.ok) hechos += r.accion === "nada" || r.accion === "contadora" ? 0 : 1;
    else errores.push(`${p.id.slice(0, 8)}: ${r.error}`);
  }
  return { hechos, errores };
}
