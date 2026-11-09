import "server-only";

// LA FACTURA GLOBAL A PÚBLICO EN GENERAL (0076), por emisor y por mes.
//
// El día 1 (cron, dentro de las 72 h que marca el SAT) cada organización que
// puede emitir factura en UNA global todos sus recibos `open` del mes anterior:
// Facturapi los agrupa, timbra a XAXX010101000 y marca los recibos como
// `invoiced_globally`. Aquí se deja el renglón en `cfdi_globales`, se archiva el
// XML/PDF y los pagos cuyo recibo entró quedan `publico-general` apuntando a la
// global (ya no se pueden facturar individual: el portal lo dice así).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emisoresActivos, facturapiDe, type Emisor } from "@/lib/facturacion/emisor";

const TZ_OFFSET = "-06:00"; // CDMX sin horario de verano desde 2022

/** El mes anterior al de `hoy`, en fechas ISO con huso de CDMX. */
export function periodoAnterior(hoy = new Date()): { desde: string; hasta: string; mes: string; anio: number; desdeFecha: string; hastaFecha: string } {
  const y = hoy.getUTCFullYear();
  const m = hoy.getUTCMonth(); // 0-11, mes actual
  const inicio = new Date(Date.UTC(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1, 1));
  const fin = new Date(Date.UTC(y, m, 0)); // último día del mes anterior
  const ymd = (d: Date) => d.toISOString().slice(0, 10);
  return {
    desde: `${ymd(inicio)}T00:00:00.000${TZ_OFFSET}`,
    hasta: `${ymd(fin)}T23:59:59.999${TZ_OFFSET}`,
    mes: String(inicio.getUTCMonth() + 1).padStart(2, "0"),
    anio: inicio.getUTCFullYear(),
    desdeFecha: ymd(inicio),
    hastaFecha: ymd(fin),
  };
}

export type ResultadoGlobal = { emisor: string; ok: boolean; uuid?: string; recibos?: number; total?: number; error?: string; nada?: boolean };

async function globalDe(emisor: Emisor, periodo: ReturnType<typeof periodoAnterior>): Promise<ResultadoGlobal> {
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

  const { data: fila, error: insErr } = await sb
    .from("cfdi_globales")
    .insert({ emisor_operator_id: emisor.operatorId, periodo_desde: periodo.desdeFecha, periodo_hasta: periodo.hastaFecha, periodicidad: "month", status: "pending" })
    .select("id")
    .single();
  if (insErr || !fila) return { emisor: nombre, ok: false, error: insErr?.message ?? "No se pudo registrar la global." };
  const globalId = fila.id as string;
  const api = facturapiDe(emisor);

  try {
    const factura = await api.facturaGlobal({ desde: periodo.desde, hasta: periodo.hasta, periodicidad: "month", mes: periodo.mes, anio: periodo.anio });
    if (!factura) {
      await sb.from("cfdi_globales").delete().eq("id", globalId);
      return { emisor: nombre, ok: true, nada: true };
    }
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
    // Qué recibos entraron: los del periodo que ahora están `invoiced_globally`
    // y cuyo pago sigue `por-emitir` (los facturados a un cliente ya no lo están).
    const recibos = await api.listarRecibos({ desde: periodo.desde, hasta: periodo.hasta, status: "invoiced_globally", limit: 500 });
    const ids = recibos.map((r) => r.id);
    let absorbidos = 0;
    if (ids.length) {
      const { data: pagos } = await sb.from("payments").select("id").in("facturapi_receipt_id", ids).eq("status_cfdi", "por-emitir");
      const pagoIds = ((pagos ?? []) as { id: string }[]).map((p) => p.id);
      if (pagoIds.length) {
        await sb.from("payments").update({ status_cfdi: "publico-general", cfdi_global_id: globalId }).in("id", pagoIds);
        absorbidos = pagoIds.length;
      }
    }
    await sb
      .from("cfdi_globales")
      .update({ status: "stamped", facturapi_id: factura.id, uuid_cfdi: factura.uuid, total_mxn: factura.total, recibos: absorbidos, xml_url: xmlPath, pdf_url: pdfPath, stamped_at: new Date().toISOString() })
      .eq("id", globalId);
    return { emisor: nombre, ok: true, uuid: factura.uuid, recibos: absorbidos, total: factura.total };
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from("cfdi_globales").update({ status: "error", error: msg.slice(0, 500) }).eq("id", globalId);
    return { emisor: nombre, ok: false, error: msg };
  }
}

/** La global del mes anterior para cada emisor que puede emitir. */
export async function facturasGlobalesDelMesAnterior(hoy = new Date()): Promise<ResultadoGlobal[]> {
  const periodo = periodoAnterior(hoy);
  const out: ResultadoGlobal[] = [];
  for (const e of await emisoresActivos()) out.push(await globalDe(e, periodo));
  return out;
}
