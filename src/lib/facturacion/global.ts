import "server-only";

// LA FACTURA GLOBAL A PÚBLICO EN GENERAL (0076, rehecha el 17 nov 2026), por
// emisor y por mes.
//
// Cada organización que puede emitir factura en UNA global los pagos de cada
// mes CERRADO que nadie facturó. La arma la plataforma con sus propios pagos
// (global-plan.ts): un concepto «Venta» por pago, por lo neto, con su folio; se
// timbra como CFDI de ingreso a XAXX010101000 con el nodo `global`. NO se usan
// los recibos de Facturapi ($599/mes por organización). Aquí se deja el renglón
// en `cfdi_globales`, se archiva el XML/PDF y los pagos que entraron quedan
// `publico-general` apuntando a la global.
//
// El cron corre TODOS los días (13:00 UTC = 7:00 CDMX). El día 1 sale la global
// del mes que acaba de cerrar, fechada el último día de ese mes. Los demás días
// casi nunca hay nada; si aparece un pago de un mes ya facturado —una
// transferencia capturada tarde— sale una global COMPLEMENTARIA de ese mismo
// mes (D21 de legal) y se avisa a la casa para que lo sepa la contadora. Si la
// corrida del día 1 falló, la siguiente la recoge sola.
//
// Por qué no choca con la autofactura: un pago sólo se factura por separado
// hasta el fin de su mes (`enPlazoParaFacturar`, en `estadoFacturable`), y la
// global sólo toma meses ya cerrados.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { cpFiscalDe, emisoresActivos, facturapiDe, type Emisor } from "@/lib/facturacion/emisor";
import { inicioDelCorte } from "@/lib/facturacion/corte";
import { MAX_RENGLONES_GLOBAL, mesDeCobro, modoDeGlobal, periodoAnterior, periodoDeMes, planGlobal, type PagoParaGlobal, type Periodo } from "@/lib/facturacion/global-plan";
import { notifyFacturaGlobal } from "@/lib/notifications/notify-admin";

export type ResultadoGlobal = {
  emisor: string;
  periodo: string;
  ok: boolean;
  complementaria?: boolean;
  uuid?: string;
  pagos?: number;
  total?: number;
  error?: string;
  nada?: boolean;
  fuera?: number;
};

/**
 * Los pagos `por-emitir` de los meses cerrados (desde el corte hasta el fin del
 * mes anterior), agrupados por mes y por la operadora de su experiencia. La
 * operadora `null` son las ventas de la casa (experiencia sin operadora). Un
 * pago sin reserva o sin experiencia no tiene emisor: no entra.
 */
async function pendientesPorMesYOperadora(ultimoCerrado: Periodo): Promise<Map<string, Map<string | null, PagoParaGlobal[]>>> {
  const sb = createSupabaseAdminClient();
  const { data: pays, error } = await sb
    .from("payments")
    .select("id, folio, reservation_id, amount_mxn, refunded_mxn, status, status_cfdi, paid_at, method")
    .eq("status_cfdi", "por-emitir")
    .gte("paid_at", inicioDelCorte().toISOString())
    .lte("paid_at", new Date(ultimoCerrado.hasta).toISOString())
    .order("paid_at", { ascending: true })
    .limit(MAX_RENGLONES_GLOBAL * 2);
  if (error) throw new Error(`No se pudieron leer los pagos por facturar: ${error.message}`);
  const pagos = (pays ?? []) as (PagoParaGlobal & { reservation_id: string | null })[];
  const out = new Map<string, Map<string | null, PagoParaGlobal[]>>();
  const resvIds = [...new Set(pagos.map((p) => p.reservation_id).filter(Boolean))] as string[];
  if (!resvIds.length) return out;
  const { data: resvs, error: e2 } = await sb.from("reservations").select("id, experience_id").in("id", resvIds);
  if (e2) throw new Error(`No se pudieron leer las reservas: ${e2.message}`);
  const expDe = new Map(((resvs ?? []) as { id: string; experience_id: string | null }[]).map((r) => [r.id, r.experience_id]));
  const expIds = [...new Set([...expDe.values()].filter(Boolean))] as string[];
  const { data: exps, error: e3 } = expIds.length ? await sb.from("experiences").select("id, operator_id").in("id", expIds) : { data: [], error: null };
  if (e3) throw new Error(`No se pudieron leer las experiencias: ${e3.message}`);
  const opDe = new Map(((exps ?? []) as { id: string; operator_id: string | null }[]).map((x) => [x.id, x.operator_id]));
  for (const p of pagos) {
    const mes = mesDeCobro(p.paid_at);
    const exp = p.reservation_id ? expDe.get(p.reservation_id) : null;
    if (!mes || !exp || !opDe.has(exp)) continue;
    const op = opDe.get(exp) ?? null;
    const delMes = out.get(mes) ?? new Map<string | null, PagoParaGlobal[]>();
    delMes.set(op, [...(delMes.get(op) ?? []), p]);
    out.set(mes, delMes);
  }
  return out;
}

async function globalDe(emisor: Emisor, periodo: Periodo, pagos: PagoParaGlobal[]): Promise<ResultadoGlobal> {
  const sb = createSupabaseAdminClient();
  const nombre = emisor.nombre;
  const res = { emisor: nombre, periodo: periodo.clave };
  const plan = planGlobal(pagos, periodo);
  if (!plan.renglones.length) return { ...res, ok: true, nada: true, fuera: plan.fuera.length };
  if (plan.renglones.length > MAX_RENGLONES_GLOBAL) {
    return { ...res, ok: false, error: `${plan.renglones.length} operaciones en el periodo: pasa del tope de ${MAX_RENGLONES_GLOBAL} conceptos de un CFDI. Hay que partir la global.` };
  }

  // Lo que ya hay de este emisor y este mes: una en proceso detiene; las ya
  // timbradas vuelven a ésta complementaria.
  const { data: previas, error: prevErr } = await sb
    .from("cfdi_globales")
    .select("id, status, created_at")
    .eq("periodo_desde", periodo.desdeFecha)
    .eq("periodo_hasta", periodo.hastaFecha)
    .filter("emisor_operator_id", emisor.operatorId ? "eq" : "is", emisor.operatorId ?? null)
    .in("status", ["pending", "stamped"]);
  if (prevErr) return { ...res, ok: false, error: prevErr.message };
  const filas = (previas ?? []) as { id: string; status: string; created_at: string }[];
  const enProceso = filas.find((f) => f.status === "pending");
  if (enProceso) {
    const vieja = Date.now() - new Date(enProceso.created_at).getTime() > 3600_000;
    return vieja
      ? { ...res, ok: false, error: "Una global de este mes quedó a medias (en proceso desde hace más de una hora): revisar en Facturapi si se timbró antes de volver a correrla." }
      : { ...res, ok: true, nada: true };
  }
  const modo = modoDeGlobal(periodo, emisor.operatorId, filas.filter((f) => f.status === "stamped").length);

  const cpEmisor = await cpFiscalDe(emisor);
  if (!cpEmisor) return { ...res, ok: false, error: "Falta el código postal fiscal del emisor." };

  const { data: fila, error: insErr } = await sb
    .from("cfdi_globales")
    .insert({ emisor_operator_id: emisor.operatorId, periodo_desde: periodo.desdeFecha, periodo_hasta: periodo.hastaFecha, periodicidad: "month", status: "pending" })
    .select("id")
    .single();
  if (insErr || !fila) return { ...res, ok: false, error: insErr?.message ?? "No se pudo registrar la global." };
  const globalId = fila.id as string;
  const api = facturapiDe(emisor);

  try {
    const factura = await api.crearFacturaGlobal({
      cpEmisor,
      renglones: plan.renglones.map((r) => ({ folio: r.folio, netoConIva: r.neto })),
      formaPago: plan.formaPago,
      periodicidad: "month",
      mes: periodo.mes,
      anio: periodo.anio,
      fecha: modo.fecha,
      idempotencyKey: modo.idempotencyKey,
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
    const fueraDePlazo = !modo.complementaria && !modo.fecha;
    const avisos = [
      descuadre ? `La global se timbró por $${factura.total} y los pagos suman $${plan.total}: revisar.` : null,
      fueraDePlazo ? "Pasaron más de 72 horas del cierre del mes: la global salió con fecha de hoy, no del mes que factura." : null,
    ].filter(Boolean) as string[];
    // Aviso a la casa, para que lo sepa la contadora (D21). Best-effort.
    await notifyFacturaGlobal({ emisor: nombre, periodo: periodo.clave, pagos: plan.renglones.length, totalMxn: factura.total, uuid: factura.uuid, complementaria: modo.complementaria, avisos }).catch(() => {});
    return {
      ...res,
      ok: !avisos.length,
      complementaria: modo.complementaria,
      uuid: factura.uuid,
      pagos: plan.renglones.length,
      total: factura.total,
      fuera: plan.fuera.length,
      ...(avisos.length ? { error: avisos.join(" ") } : {}),
    };
  } catch (e) {
    const crudo = (e as Error).message;
    // Facturapi contesta 409 cuando la llave de idempotencia ya se usó en un
    // timbrado exitoso (probado en sandbox el 17 nov 2026): NO duplica, pero
    // tampoco devuelve la factura. Regla de legal: nunca generar una llave nueva
    // para el mismo emisor, mes y modo; se busca la factura y se anota.
    const msg = /idempotency key/i.test(crudo)
      ? `Facturapi ya había recibido esta misma global (identificador ${modo.idempotencyKey}) y no la volvió a timbrar. Búscala en Facturapi por ese identificador externo: si quedó timbrada, hay que anotarla a mano en la plataforma; no se pide con otra llave.`
      : crudo;
    await sb.from("cfdi_globales").update({ status: "error", error: msg.slice(0, 500) }).eq("id", globalId);
    return { ...res, ok: false, error: msg };
  }
}

/**
 * Las globales que tocan hoy: por cada mes cerrado con pagos sin facturar y por
 * cada emisor que puede emitir. La primera de un mes es la global; las
 * siguientes, complementarias.
 */
export async function facturasGlobalesPendientes(hoy = new Date()): Promise<ResultadoGlobal[]> {
  const emisores = await emisoresActivos();
  if (!emisores.length) return [];
  const porMes = await pendientesPorMesYOperadora(periodoAnterior(hoy));
  const out: ResultadoGlobal[] = [];
  for (const clave of [...porMes.keys()].sort()) {
    const [anio, mes] = clave.split("-").map(Number);
    const periodo = periodoDeMes(anio, mes);
    const delMes = porMes.get(clave)!;
    for (const e of emisores) {
      // La casa lleva también las ventas de experiencias sin operadora asignada.
      const pagos = [...(e.operatorId ? delMes.get(e.operatorId) ?? [] : []), ...(e.esLaCasa ? delMes.get(null) ?? [] : [])];
      if (pagos.length) out.push(await globalDe(e, periodo, pagos));
    }
  }
  return out;
}
