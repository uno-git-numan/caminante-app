import "server-only";

// LA FACTURA DE LA COMISIÓN A LA OPERADORA (B2) Y SU NOTA DE CRÉDITO (0088).
//
// Por cada cobro confirmado por cuenta conectada, NUMAN le factura a la
// operadora su comisión más IVA (y la cuota de admisión, en la venta que la
// pagó). Si la venta se devuelve, sale el egreso proporcional. Qué se factura y
// por cuánto lo decide comision-plan.ts (puro y probado); aquí se ejecuta.
//
// Emite SIEMPRE la casa (la organización de `FACTURAPI_SECRET_KEY`), a nombre
// de la operadora de la venta, con los datos fiscales de su constancia.
// Tercer interruptor: `FACTURACION_COMISIONES=1`. Apagado, nada sale.
//
// Lo corre el cron de comprobantes cada hora; el egreso además se intenta en
// cuanto Stripe confirma la devolución. Idempotente por los índices únicos de
// la 0088 (una comisión viva por pago; un egreso por acumulado devuelto).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { clienteFacturapi, facturacionActiva, llaveDeLaCasa, type ReceptorFiscal } from "@/lib/facturacion/facturapi";
import { conceptosDePago, type PagoParaComprobante } from "@/lib/facturacion/conceptos";
import { folioDePago } from "@/lib/facturacion/global-plan";
import { CLAVE_COMISION, FORMA_PAGO_COMPENSACION, fechaDeComision, importeEgresoComision, interruptorComisiones, planComision, type PagoConComision } from "@/lib/facturacion/comision-plan";

const COLS = "id, folio, reservation_id, contact_id, amount_mxn, refunded_mxn, status, status_cfdi, method, paid_at, canal_cobro, platform_fee_mxn, fee_retenido_mxn";

type Pago = PagoParaComprobante & PagoConComision;

export type ResultadoComision = { ok: true; hecho: boolean; detalle: string } | { ok: false; error: string; reintentar: boolean };

/** La llave de la casa Y el interruptor de comisiones. */
export const facturacionComisionesActiva = (): boolean => facturacionActiva() && interruptorComisiones();

/** La operadora de la venta como receptora del CFDI. null con el motivo si no se le puede facturar. */
async function receptorDe(pay: Pago): Promise<{ receptor: ReceptorFiscal } | { error: string; reintentar: boolean }> {
  const sb = createSupabaseAdminClient();
  if (!pay.reservation_id) return { error: "El pago no está ligado a una reserva.", reintentar: false };
  const { data: resv } = await sb.from("reservations").select("operator_id, experience_id").eq("id", pay.reservation_id).maybeSingle();
  let opId = (resv?.operator_id as string | null) ?? null;
  if (!opId && resv?.experience_id) {
    const { data: exp } = await sb.from("experiences").select("operator_id").eq("id", resv.experience_id as string).maybeSingle();
    opId = (exp?.operator_id as string | null) ?? null;
  }
  if (!opId) return { error: "La venta no tiene operadora asignada.", reintentar: false };
  const { data: op, error } = await sb.from("operators").select("name, email, es_la_casa, rfc, razon_social, regimen_fiscal, cp_fiscal").eq("id", opId).maybeSingle();
  if (error || !op) return { error: "No pudimos leer a la operadora de esta venta.", reintentar: true };
  if (op.es_la_casa) return { error: "La venta es de la casa: no hay comisión que facturarse a sí misma.", reintentar: false };
  const t = (x: unknown) => String(x ?? "").trim();
  if (!t(op.rfc) || !t(op.razon_social) || !t(op.regimen_fiscal) || !t(op.cp_fiscal)) {
    return { error: `Faltan datos fiscales de ${op.name} (salen de su constancia).`, reintentar: true };
  }
  if (!t(op.email).includes("@")) return { error: `Falta el correo de ${op.name} para mandarle su factura.`, reintentar: true };
  return {
    receptor: { rfc: t(op.rfc).toUpperCase(), razonSocial: t(op.razon_social), regimenFiscal: t(op.regimen_fiscal), usoCfdi: "G03", codigoPostal: t(op.cp_fiscal), email: t(op.email) },
  };
}

async function archivar(api: ReturnType<typeof clienteFacturapi>, facturapiId: string, nombre: string): Promise<{ xml: string | null; pdf: string | null }> {
  const sb = createSupabaseAdminClient();
  const now = new Date();
  const base = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${nombre}`;
  try {
    const [xml, pdf] = await Promise.all([api.descargarCFDI(facturapiId, "xml"), api.descargarCFDI(facturapiId, "pdf")]);
    const up1 = await sb.storage.from("cfdi").upload(`${base}.xml`, Buffer.from(xml), { contentType: "application/xml", upsert: true });
    const up2 = await sb.storage.from("cfdi").upload(`${base}.pdf`, Buffer.from(pdf), { contentType: "application/pdf", upsert: true });
    return { xml: up1.error ? null : `${base}.xml`, pdf: up2.error ? null : `${base}.pdf` };
  } catch {
    return { xml: null, pdf: null }; // ya está timbrado: archivar después, no romper
  }
}

/** Emite el CFDI de comisión de UN pago. Inerte si ya lo tiene o si no le toca. */
export async function emitirComisionDePago(paymentId: string): Promise<ResultadoComision> {
  if (!facturacionComisionesActiva()) return { ok: false, error: "Facturación de comisiones apagada.", reintentar: true };
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("payments").select(COLS).eq("id", paymentId).maybeSingle();
  const pay = data as Pago | null;
  if (!pay) return { ok: false, error: "No encontramos ese pago.", reintentar: false };

  const { data: adm } = await sb.from("operator_admisiones").select("monto_mxn").eq("payment_id", pay.id).eq("estado", "cobrada").maybeSingle();
  const d = await conceptosDePago(pay);
  const plan = planComision(pay, {
    servicio: [d.titulo, d.salida].filter(Boolean).join(" · "),
    folio: folioDePago(pay.folio ?? pay.id),
    admisionMxn: Number((adm as { monto_mxn?: number | string } | null)?.monto_mxn ?? 0),
  });
  if (!plan.emitir) return { ok: true, hecho: false, detalle: plan.porque };
  const r = await receptorDe(pay);
  if ("error" in r) return { ok: false, error: r.error, reintentar: r.reintentar };

  // Reservar el pago contra doble timbre (índice único de la 0088).
  const { data: fila, error: insErr } = await sb
    .from("cfdi_invoices")
    .insert({
      payment_id: pay.id,
      reservation_id: pay.reservation_id,
      tipo: "comision",
      emisor_operator_id: null, // emite la casa
      rfc: r.receptor.rfc,
      razon_social: r.receptor.razonSocial,
      regimen_fiscal: r.receptor.regimenFiscal,
      uso_cfdi: r.receptor.usoCfdi,
      codigo_postal: r.receptor.codigoPostal,
      email: r.receptor.email,
      total_mxn: plan.total,
      status: "pending",
    })
    .select("id")
    .single();
  if (insErr || !fila) {
    if (insErr?.code === "23505") return { ok: true, hecho: false, detalle: "La comisión de este pago ya está facturada o en proceso." };
    return { ok: false, error: insErr?.message ?? "No se pudo registrar la factura de comisión.", reintentar: true };
  }
  const invoiceId = fila.id as string;
  const api = clienteFacturapi(llaveDeLaCasa());
  try {
    const factura = await api.crearFacturaIngreso({
      receptor: r.receptor,
      conceptos: plan.conceptos,
      formaPago: FORMA_PAGO_COMPENSACION,
      // Cobro y emisión en meses distintos: se fecha el día del cobro (D24).
      fecha: fechaDeComision(pay.paid_at ?? null),
    });
    const a = await archivar(api, factura.id, `comision-${factura.uuid}`);
    await sb
      .from("cfdi_invoices")
      .update({ status: "stamped", facturapi_id: factura.id, uuid_cfdi: factura.uuid, subtotal_mxn: factura.subtotal, iva_mxn: factura.iva, xml_url: a.xml, pdf_url: a.pdf, stamped_at: new Date().toISOString() })
      .eq("id", invoiceId);
    await api.enviarCFDIPorCorreo(factura.id, r.receptor.email);
    // Lo timbrado tiene que ser lo retenido: si no, se dice.
    if (Math.abs(factura.total - plan.total) > 0.02) {
      return { ok: false, error: `La comisión se timbró por $${factura.total} y lo retenido fue $${plan.total}: revisar.`, reintentar: false };
    }
    return { ok: true, hecho: true, detalle: `Comisión ${factura.uuid} por $${plan.total}.` };
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from("cfdi_invoices").update({ status: "error", error: msg.slice(0, 500) }).eq("id", invoiceId);
    return { ok: false, error: `No se pudo timbrar la comisión: ${msg}`, reintentar: true };
  }
}

/** El egreso proporcional de la comisión de UN pago devuelto. Inerte si no hay comisión facturada o ya está documentado. */
export async function documentarDevolucionDeComision(paymentId: string): Promise<ResultadoComision> {
  if (!facturacionComisionesActiva()) return { ok: false, error: "Facturación de comisiones apagada.", reintentar: true };
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("payments").select(COLS).eq("id", paymentId).maybeSingle();
  const pay = data as Pago | null;
  if (!pay) return { ok: false, error: "No encontramos ese pago.", reintentar: false };
  const devuelto = Number(pay.refunded_mxn ?? 0);
  if (!(devuelto > 0)) return { ok: true, hecho: false, detalle: "sin devolución" };

  const { data: filas } = await sb
    .from("cfdi_invoices")
    .select("tipo, status, total_mxn, uuid_cfdi, rfc, razon_social, regimen_fiscal, codigo_postal, email")
    .eq("payment_id", pay.id)
    .in("tipo", ["comision", "egreso-comision"])
    .in("status", ["pending", "stamped"]);
  type Fila = { tipo: string; status: string; total_mxn: number; uuid_cfdi: string | null; rfc: string; razon_social: string; regimen_fiscal: string; codigo_postal: string; email: string | null };
  const todas = (filas ?? []) as Fila[];
  const comision = todas.find((f) => f.tipo === "comision" && f.status === "stamped" && f.uuid_cfdi);
  if (!comision) return { ok: true, hecho: false, detalle: "la comisión de este pago no está facturada" };

  const { data: adm } = await sb.from("operator_admisiones").select("monto_mxn").eq("payment_id", pay.id).maybeSingle();
  const admision = Number((adm as { monto_mxn?: number | string } | null)?.monto_mxn ?? 0);
  // La comisión con IVA es el total del CFDI menos el renglón de admisión, si lo llevó.
  const totalB2 = Number(comision.total_mxn);
  const admisionConIva = admision > 0 && totalB2 > admision ? admision : 0;
  const importe = importeEgresoComision({
    cobrado: Number(pay.amount_mxn ?? 0),
    devuelto,
    comisionConIva: totalB2 - admisionConIva,
    admisionConIva,
    cubierto: todas.filter((f) => f.tipo === "egreso-comision").reduce((n, f) => n + Number(f.total_mxn), 0),
  });
  if (!(importe > 0)) return { ok: true, hecho: false, detalle: "la devolución de la comisión ya está documentada" };

  const receptor: ReceptorFiscal = { rfc: comision.rfc, razonSocial: comision.razon_social, regimenFiscal: comision.regimen_fiscal, usoCfdi: "G02", codigoPostal: comision.codigo_postal, email: comision.email ?? "" };
  const { data: fila, error: insErr } = await sb
    .from("cfdi_invoices")
    .insert({
      payment_id: pay.id,
      reservation_id: pay.reservation_id,
      tipo: "egreso-comision",
      emisor_operator_id: null,
      rfc: receptor.rfc,
      razon_social: receptor.razonSocial,
      regimen_fiscal: receptor.regimenFiscal,
      uso_cfdi: "G02",
      codigo_postal: receptor.codigoPostal,
      email: receptor.email || null,
      total_mxn: importe,
      status: "pending",
      relacionado_uuid: comision.uuid_cfdi,
      devuelto_acumulado_mxn: devuelto,
    })
    .select("id")
    .single();
  if (insErr || !fila) {
    if (insErr?.code === "23505") return { ok: true, hecho: false, detalle: "Este egreso de comisión ya está en proceso." };
    return { ok: false, error: insErr?.message ?? "No se pudo registrar el egreso de comisión.", reintentar: true };
  }
  const egresoId = fila.id as string;
  const api = clienteFacturapi(llaveDeLaCasa());
  try {
    const d = await conceptosDePago(pay);
    const egreso = await api.crearEgreso({
      receptor,
      cpEmisor: receptor.codigoPostal,
      formaPago: FORMA_PAGO_COMPENSACION,
      uuidRelacionado: comision.uuid_cfdi as string,
      conceptos: [{ descripcion: `Devolución de comisión · ${[d.titulo, d.salida].filter(Boolean).join(" · ")} · operación ${folioDePago(pay.folio ?? pay.id)}`, cantidad: 1, precioUnitarioConIva: importe, claveProdServ: CLAVE_COMISION }],
    });
    const a = await archivar(api, egreso.id, `egreso-comision-${egreso.uuid}`);
    await sb
      .from("cfdi_invoices")
      .update({ status: "stamped", facturapi_id: egreso.id, uuid_cfdi: egreso.uuid, subtotal_mxn: egreso.subtotal, iva_mxn: egreso.iva, xml_url: a.xml, pdf_url: a.pdf, stamped_at: new Date().toISOString() })
      .eq("id", egresoId);
    if (receptor.email) await api.enviarCFDIPorCorreo(egreso.id, receptor.email);
    return { ok: true, hecho: true, detalle: `Egreso de comisión ${egreso.uuid} por $${importe}.` };
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from("cfdi_invoices").update({ status: "error", error: msg.slice(0, 500) }).eq("id", egresoId);
    return { ok: false, error: `No se pudo timbrar el egreso de comisión: ${msg}`, reintentar: true };
  }
}

/** La red: comisiones sin facturar y devoluciones de comisión sin documentar. Lo corre el cron de comprobantes. */
export async function comisionesPendientes(limit = 25): Promise<{ comisiones: number; egresos: number; esperando: number; errores: string[] }> {
  const out = { comisiones: 0, egresos: 0, esperando: 0, errores: [] as string[] };
  if (!facturacionComisionesActiva()) return out;
  const sb = createSupabaseAdminClient();
  const { data: pays } = await sb
    .from("payments")
    .select("id, status, refunded_mxn")
    .eq("canal_cobro", "connect")
    .gt("platform_fee_mxn", 0)
    .in("status", ["paid", "refunded"])
    .order("paid_at", { ascending: false })
    .limit(300);
  const pagos = (pays ?? []) as { id: string; status: string; refunded_mxn: number | null }[];
  if (!pagos.length) return out;
  const { data: filas } = await sb
    .from("cfdi_invoices")
    .select("payment_id")
    .eq("tipo", "comision")
    .in("status", ["pending", "stamped"])
    .in("payment_id", pagos.map((p) => p.id));
  const conComision = new Set(((filas ?? []) as { payment_id: string }[]).map((f) => f.payment_id));
  const anota = (id: string, r: ResultadoComision, que: "comisiones" | "egresos") => {
    if (r.ok) out[que] += r.hecho ? 1 : 0;
    else if (r.reintentar) out.esperando += 1;
    else out.errores.push(`${id.slice(0, 8)}: ${r.error}`);
  };
  let hechos = 0;
  for (const p of pagos) {
    if (hechos >= limit) break;
    if (!conComision.has(p.id)) {
      if (p.status !== "paid") continue; // devuelto completo antes de facturar: no hay comisión que facturar
      anota(p.id, await emitirComisionDePago(p.id), "comisiones");
      hechos += 1;
    }
    if (Number(p.refunded_mxn ?? 0) > 0) anota(p.id, await documentarDevolucionDeComision(p.id), "egresos");
  }
  return out;
}
