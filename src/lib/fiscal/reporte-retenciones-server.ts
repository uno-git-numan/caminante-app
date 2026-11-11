import "server-only";

// Trae las filas del reporte mensual de retenciones. El cálculo vive en
// reporte-retenciones.ts (puro, con pruebas); aquí sólo se lee la base.
//
// ⚠️ Lee CURP y CLABE COMPLETAS de operator_fiscal_privado: este módulo sólo lo
// usan la pantalla de la casa y la descarga del CSV, las dos detrás de
// `getCurrentRole() === "admin"`. Ninguna pantalla de operadora lo importa.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Domicilio } from "@/lib/operadores/fiscal-privado";
import { armarReporte, type Devolucion, type OperadoraFiscal, type ReporteMes, type VentaRetenida } from "./reporte-retenciones";

/** Límites UTC holgados del mes (CDMX es UTC−6 todo el año desde 2022); el filtro fino lo hace `mesCdmx`. */
function rango(mes: string): { desde: string; hasta: string } {
  const [y, m] = mes.split("-").map(Number);
  const desde = new Date(Date.UTC(y, m - 1, 1) - 86_400_000).toISOString();
  const hasta = new Date(Date.UTC(y, m, 1) + 2 * 86_400_000).toISOString();
  return { desde, hasta };
}

export const MES_VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/;

export type CfdiDelMes = {
  id: string;
  operator_id: string;
  estado: "pendiente" | "timbrado" | "fallido" | "cancelado";
  uuid: string | null;
  facturapi_id: string | null;
  timbrado_at: string | null;
  error: string | null;
  enviado_a: string | null;
};

export async function reporteRetenciones(
  mes: string,
  corte: Date = new Date(),
): Promise<ReporteMes & { nombres: Map<string, string>; cfdis: Map<string, CfdiDelMes> }> {
  if (!MES_VALIDO.test(mes)) throw new Error("Mes inválido (AAAA-MM).");
  const sb = createSupabaseAdminClient();
  const { desde, hasta } = rango(mes);

  const { data: pagos } = await sb
    .from("payments")
    .select("id, paid_at, amount_mxn, isr_retenido_mxn, iva_retenido_mxn, platform_fee_mxn, retencion_regla, medio_pago, reservations(operator_id)")
    .eq("canal_cobro", "connect")
    .not("isr_retenido_mxn", "is", null)
    .gte("paid_at", desde)
    .lt("paid_at", hasta);

  const opDe = (r: unknown): string | null => {
    const x = Array.isArray(r) ? r[0] : r;
    return (x as { operator_id?: string | null } | null)?.operator_id ?? null;
  };

  const ventas: VentaRetenida[] = [];
  for (const p of (pagos ?? []) as Record<string, unknown>[]) {
    const op = opDe(p.reservations);
    if (!op || !p.paid_at) continue;
    ventas.push({
      paymentId: p.id as string,
      operatorId: op,
      paidAt: p.paid_at as string,
      cobrado: Number(p.amount_mxn ?? 0),
      isr: Number(p.isr_retenido_mxn ?? 0),
      iva: Number(p.iva_retenido_mxn ?? 0),
      comision: p.platform_fee_mxn != null ? Number(p.platform_fee_mxn) : null,
      regla: (p.retencion_regla as string | null) ?? null,
      medio: (p.medio_pago as string | null) ?? null,
    });
  }

  // Las devoluciones de ESAS ventas, confirmadas en cualquier fecha: el corte
  // (armarReporte) decide cuáles netean el mes.
  const ids = ventas.map((v) => v.paymentId);
  const { data: devs } = ids.length
    ? await sb.from("reembolsos").select("payment_id, monto_mxn, confirmado_at").eq("estado", "confirmado").in("payment_id", ids)
    : { data: [] };
  const devoluciones: Devolucion[] = ((devs ?? []) as { payment_id: string; monto_mxn: number; confirmado_at: string | null }[])
    .filter((d) => d.confirmado_at)
    .map((d) => ({ paymentId: d.payment_id, confirmadoAt: d.confirmado_at as string, monto: Number(d.monto_mxn ?? 0) }));

  const conVentas = [...new Set(ventas.map((v) => v.operatorId))];
  const { data: ops } = conVentas.length
    ? await sb.from("operators").select("id, name, razon_social, rfc, tipo_persona").in("id", conVentas)
    : { data: [] };
  const { data: priv } = conVentas.length
    ? await sb.from("operator_fiscal_privado").select("operator_id, curp, domicilio_fiscal, banco, clabe").in("operator_id", conVentas)
    : { data: [] };
  const privDe = new Map(((priv ?? []) as { operator_id: string; curp: string | null; domicilio_fiscal: Domicilio | null; banco: string | null; clabe: string | null }[]).map((x) => [x.operator_id, x]));

  const operadoras: OperadoraFiscal[] = ((ops ?? []) as { id: string; name: string | null; razon_social: string | null; rfc: string | null; tipo_persona: string | null }[]).map((o) => {
    const p = privDe.get(o.id);
    return {
      id: o.id,
      nombre: o.razon_social || o.name || o.id,
      rfc: o.rfc,
      tipoPersona: o.tipo_persona,
      curp: p?.curp ?? null,
      domicilio: p?.domicilio_fiscal ?? null,
      banco: p?.banco ?? null,
      clabe: p?.clabe ?? null,
    };
  });

  // El corte de quien ya tiene su CFDI timbrado es su timbrado (legal §3).
  const { data: cfdis } = await sb
    .from("cfdi_retenciones")
    .select("id, operator_id, estado, uuid, facturapi_id, timbrado_at, error, enviado_a")
    .eq("mes", mes)
    .in("estado", ["pendiente", "timbrado", "fallido"]);
  const cfdiDe = new Map<string, CfdiDelMes>();
  for (const c of (cfdis ?? []) as CfdiDelMes[]) {
    // Uno vivo por operadora (índice parcial); un «fallido» sólo si no hay otro.
    const prev = cfdiDe.get(c.operator_id);
    if (!prev || prev.estado === "fallido") cfdiDe.set(c.operator_id, c);
  }
  const cortes = new Map(
    [...cfdiDe.values()].filter((c) => c.estado === "timbrado" && c.timbrado_at).map((c) => [c.operator_id, c.timbrado_at as string]),
  );

  const rep = armarReporte(mes, operadoras, ventas, devoluciones, corte, cortes);
  return { ...rep, nombres: new Map(operadoras.map((o) => [o.id, o.nombre])), cfdis: cfdiDe };
}
