import "server-only";

// LA FACTURA GLOBAL A PÚBLICO EN GENERAL (0076, rehecha el 17 nov 2026), por
// emisor y por mes.
//
// El día 1 (cron) cada organización que puede emitir factura en UNA global los
// pagos del mes anterior que nadie facturó. La arma la plataforma con sus
// propios pagos (global-plan.ts): un concepto «Venta» por pago, por lo neto, con
// su folio; se timbra como CFDI de ingreso a XAXX010101000 con el nodo `global`.
// NO se usan los recibos de Facturapi ($599/mes por organización). Aquí se deja
// el renglón en `cfdi_globales`, se archiva el XML/PDF y los pagos que entraron
// quedan `publico-general` apuntando a la global.
//
// Por qué no choca con la autofactura: un pago sólo se factura por separado
// hasta el fin de su mes (`enPlazoParaFacturar`, en `estadoFacturable`), y la
// global corre después, sobre el mes ya cerrado.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cpFiscalDe, emisoresActivos, facturapiDe, type Emisor } from "@/lib/facturacion/emisor";
import { inicioDelCorte } from "@/lib/facturacion/corte";
import { MAX_RENGLONES_GLOBAL, fechaDeEmisionGlobal, periodoAnterior, planGlobal, type PagoParaGlobal } from "@/lib/facturacion/global-plan";

export type ResultadoGlobal = { emisor: string; ok: boolean; uuid?: string; pagos?: number; total?: number; error?: string; nada?: boolean; fuera?: number };

type Periodo = ReturnType<typeof periodoAnterior>;

/**
 * Los pagos `por-emitir` del periodo, agrupados por la operadora de su
 * experiencia. La llave `null` son las ventas de la casa (experiencia sin
 * operadora). Un pago sin reserva o sin experiencia no tiene emisor: no entra.
 */
async function pagosPorOperadora(periodo: Periodo): Promise<Map<string | null, PagoParaGlobal[]>> {
  const sb = createSupabaseAdminClient();
  const desde = new Date(Math.max(new Date(periodo.desde).getTime(), inicioDelCorte().getTime())).toISOString();
  const { data: pays, error } = await sb
    .from("payments")
    .select("id, folio, reservation_id, amount_mxn, refunded_mxn, status, status_cfdi, paid_at, method")
    .eq("status_cfdi", "por-emitir")
    .gte("paid_at", desde)
    .lte("paid_at", new Date(periodo.hasta).toISOString())
    .order("paid_at", { ascending: true })
    .limit(MAX_RENGLONES_GLOBAL * 2);
  if (error) throw new Error(`No se pudieron leer los pagos del periodo: ${error.message}`);
  const pagos = (pays ?? []) as (PagoParaGlobal & { reservation_id: string | null })[];
  const resvIds = [...new Set(pagos.map((p) => p.reservation_id).filter(Boolean))] as string[];
  const out = new Map<string | null, PagoParaGlobal[]>();
  if (!resvIds.length) return out;
  const { data: resvs, error: e2 } = await sb.from("reservations").select("id, experience_id").in("id", resvIds);
  if (e2) throw new Error(`No se pudieron leer las reservas: ${e2.message}`);
  const expDe = new Map(((resvs ?? []) as { id: string; experience_id: string | null }[]).map((r) => [r.id, r.experience_id]));
  const expIds = [...new Set([...expDe.values()].filter(Boolean))] as string[];
  const { data: exps, error: e3 } = expIds.length ? await sb.from("experiences").select("id, operator_id").in("id", expIds) : { data: [], error: null };
  if (e3) throw new Error(`No se pudieron leer las experiencias: ${e3.message}`);
  const opDe = new Map(((exps ?? []) as { id: string; operator_id: string | null }[]).map((x) => [x.id, x.operator_id]));
  for (const p of pagos) {
    const exp = p.reservation_id ? expDe.get(p.reservation_id) : null;
    if (!exp || !opDe.has(exp)) continue;
    const op = opDe.get(exp) ?? null;
    out.set(op, [...(out.get(op) ?? []), p]);
  }
  return out;
}

async function globalDe(emisor: Emisor, periodo: Periodo, pagos: PagoParaGlobal[]): Promise<ResultadoGlobal> {
  const sb = createSupabaseAdminClient();
  const nombre = emisor.nombre;
  // Ya se hizo para este emisor y periodo: no dos veces.
  const { data: ya } = await sb
    .from("cfdi_globales")
    .select("id, status")
    .eq("periodo_desde", periodo.desdeFecha)
    .eq("periodo_hasta", periodo.hastaFecha)
    .filter("emisor_operator_id", emisor.operatorId ? "eq" : "is", emisor.operatorId ?? null)
    .in("status", ["pending", "stamped"])
    .maybeSingle();
  if (ya) return { emisor: nombre, ok: true, nada: true };

  const plan = planGlobal(pagos, periodo);
  if (!plan.renglones.length) return { emisor: nombre, ok: true, nada: true, fuera: plan.fuera.length };
  if (plan.renglones.length > MAX_RENGLONES_GLOBAL) {
    return { emisor: nombre, ok: false, error: `${plan.renglones.length} operaciones en el periodo: pasa del tope de ${MAX_RENGLONES_GLOBAL} conceptos de un CFDI. Hay que partir la global.` };
  }
  const cpEmisor = await cpFiscalDe(emisor);
  if (!cpEmisor) return { emisor: nombre, ok: false, error: "Falta el código postal fiscal del emisor." };

  const { data: fila, error: insErr } = await sb
    .from("cfdi_globales")
    .insert({ emisor_operator_id: emisor.operatorId, periodo_desde: periodo.desdeFecha, periodo_hasta: periodo.hastaFecha, periodicidad: "month", status: "pending" })
    .select("id")
    .single();
  if (insErr || !fila) return { emisor: nombre, ok: false, error: insErr?.message ?? "No se pudo registrar la global." };
  const globalId = fila.id as string;
  const api = facturapiDe(emisor);
  // Con fecha del mes que factura (pedido de la contadora), si aún se puede.
  const fecha = fechaDeEmisionGlobal(periodo);

  try {
    const factura = await api.crearFacturaGlobal({
      cpEmisor,
      renglones: plan.renglones.map((r) => ({ folio: r.folio, netoConIva: r.neto })),
      formaPago: plan.formaPago,
      periodicidad: "month",
      mes: periodo.mes,
      anio: periodo.anio,
      fecha,
      idempotencyKey: `global-${emisor.operatorId ?? "casa"}-${periodo.desdeFecha}`,
    });
    const base = `${periodo.anio}/${periodo.mes}/global-${factura.uuid}`;
    let xmlPath: string | null = null;
    let pdfPath: string | null = null;
    try {
      const [xml, pdf] = await Promise.all([api.descargarCFDI(factura.id, "xml"), api.descargarCFDI(factura.id, "pdf")]);
      const up1 = await sb.storage.from("cfdi").upload(`${base}.xml`, Buffer.from(xml), { contentType: "application/xml", upsert: true });
      const up2 = await sb.storage.from("cfdi").upload(`${base}.pdf`, Buffer.from(pdf), { contentType: "application/pdf", upsert: true });
      if (!up1.error) xmlPath = `${base}.xml`;
      if (!up2.error) pdfPath = `${base}.pdf`;
    } catch {
      /* timbrada ya; archivar después */
    }
    // Los pagos que entraron: `publico-general`, apuntando a la global y con lo
    // devuelto que ya iba descontado (un egreso posterior sólo ampara lo demás).
    for (const r of plan.renglones) {
      await sb
        .from("payments")
        .update({ status_cfdi: "publico-general", cfdi_global_id: globalId, devuelto_al_facturar_mxn: r.devuelto || null })
        .eq("id", r.paymentId)
        .eq("status_cfdi", "por-emitir");
    }
    await sb
      .from("cfdi_globales")
      .update({ status: "stamped", facturapi_id: factura.id, uuid_cfdi: factura.uuid, total_mxn: factura.total, pagos: plan.renglones.length, xml_url: xmlPath, pdf_url: pdfPath, stamped_at: new Date().toISOString() })
      .eq("id", globalId);
    // Lo que timbró Facturapi tiene que ser lo que sumamos: si no, se dice.
    const descuadre = Math.abs(factura.total - plan.total) > 0.05;
    const avisos = [
      descuadre ? `La global se timbró por $${factura.total} y los pagos suman $${plan.total}: revisar.` : null,
      fecha ? null : "Pasaron más de 72 horas del cierre del mes: la global salió con fecha de hoy, no del mes que factura. Avisar a la contadora.",
    ].filter(Boolean);
    return {
      emisor: nombre,
      ok: !avisos.length,
      uuid: factura.uuid,
      pagos: plan.renglones.length,
      total: factura.total,
      fuera: plan.fuera.length,
      ...(avisos.length ? { error: avisos.join(" ") } : {}),
    };
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from("cfdi_globales").update({ status: "error", error: msg.slice(0, 500) }).eq("id", globalId);
    return { emisor: nombre, ok: false, error: msg };
  }
}

/** La global del mes anterior para cada emisor que puede emitir. */
export async function facturasGlobalesDelMesAnterior(hoy = new Date()): Promise<ResultadoGlobal[]> {
  const emisores = await emisoresActivos();
  if (!emisores.length) return [];
  const periodo = periodoAnterior(hoy);
  const porOperadora = await pagosPorOperadora(periodo);
  const out: ResultadoGlobal[] = [];
  for (const e of emisores) {
    // La casa lleva también las ventas de experiencias sin operadora asignada.
    const pagos = [...(e.operatorId ? porOperadora.get(e.operatorId) ?? [] : []), ...(e.esLaCasa ? porOperadora.get(null) ?? [] : [])];
    out.push(await globalDe(e, periodo, pagos));
  }
  return out;
}
