import "server-only";

// Trae las filas del reporte mensual de retenciones. El cálculo vive en
// reporte-retenciones.ts (puro, con pruebas); aquí sólo se lee la base.
//
// ⚠️ Lee CURP y CLABE COMPLETAS de operator_fiscal_privado: este módulo sólo lo
// usan la pantalla de la casa y la descarga del CSV, las dos detrás de
// `getCurrentRole() === "admin"`. Ninguna pantalla de operadora lo importa.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Domicilio } from "@/lib/operadores/fiscal-privado";
import { armarReporte, type DevolucionRetenida, type OperadoraFiscal, type ReporteMes, type VentaRetenida } from "./reporte-retenciones";

/** Límites UTC holgados del mes (CDMX es UTC−6 todo el año desde 2022); el filtro fino lo hace `mesCdmx`. */
function rango(mes: string): { desde: string; hasta: string } {
  const [y, m] = mes.split("-").map(Number);
  const desde = new Date(Date.UTC(y, m - 1, 1) - 86_400_000).toISOString();
  const hasta = new Date(Date.UTC(y, m, 1) + 2 * 86_400_000).toISOString();
  return { desde, hasta };
}

export const MES_VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function reporteRetenciones(mes: string): Promise<ReporteMes & { nombres: Map<string, string> }> {
  if (!MES_VALIDO.test(mes)) throw new Error("Mes inválido (AAAA-MM).");
  const sb = createSupabaseAdminClient();
  const { desde, hasta } = rango(mes);

  const [{ data: pagos }, { data: devs }] = await Promise.all([
    sb
      .from("payments")
      .select("id, paid_at, amount_mxn, isr_retenido_mxn, iva_retenido_mxn, retencion_regla, reservations(operator_id)")
      .eq("canal_cobro", "connect")
      .not("isr_retenido_mxn", "is", null)
      .gte("paid_at", desde)
      .lt("paid_at", hasta),
    sb
      .from("reembolsos")
      .select("payment_id, monto_mxn, confirmado_at, payments(amount_mxn, isr_retenido_mxn, iva_retenido_mxn, canal_cobro, reservations(operator_id))")
      .eq("estado", "confirmado")
      .gte("confirmado_at", desde)
      .lt("confirmado_at", hasta),
  ]);

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
      regla: (p.retencion_regla as string | null) ?? null,
    });
  }

  const devoluciones: DevolucionRetenida[] = [];
  for (const d of (devs ?? []) as Record<string, unknown>[]) {
    const pg = (Array.isArray(d.payments) ? d.payments[0] : d.payments) as Record<string, unknown> | null;
    // Sólo devoluciones de ventas que retuvieron: las demás no corrigen nada.
    if (!pg || pg.canal_cobro !== "connect" || pg.isr_retenido_mxn == null || !d.confirmado_at) continue;
    const op = opDe(pg.reservations);
    if (!op) continue;
    devoluciones.push({
      paymentId: d.payment_id as string,
      operatorId: op,
      confirmadoAt: d.confirmado_at as string,
      monto: Number(d.monto_mxn ?? 0),
      cobradoVenta: Number(pg.amount_mxn ?? 0),
      isrVenta: Number(pg.isr_retenido_mxn ?? 0),
      ivaVenta: Number(pg.iva_retenido_mxn ?? 0),
    });
  }

  // TODAS las operadoras externas en Connect (18-J III: aun sin cobro en el
  // mes), más cualquiera que aparezca en las ventas aunque ya no tenga cuenta.
  const conMovimiento = new Set([...ventas, ...devoluciones].map((x) => x.operatorId));
  const { data: ops } = await sb
    .from("operators")
    .select("id, name, razon_social, rfc, tipo_persona, stripe_account_id, propia");
  const elegidas = ((ops ?? []) as { id: string; name: string | null; razon_social: string | null; rfc: string | null; tipo_persona: string | null; stripe_account_id: string | null; propia: boolean | null }[])
    .filter((o) => (o.stripe_account_id && !o.propia) || conMovimiento.has(o.id));

  const ids = elegidas.map((o) => o.id);
  const { data: priv } = ids.length
    ? await sb.from("operator_fiscal_privado").select("operator_id, curp, domicilio_fiscal, banco, clabe").in("operator_id", ids)
    : { data: [] };
  const privDe = new Map(((priv ?? []) as { operator_id: string; curp: string | null; domicilio_fiscal: Domicilio | null; banco: string | null; clabe: string | null }[]).map((x) => [x.operator_id, x]));

  const operadoras: OperadoraFiscal[] = elegidas
    .map((o) => {
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
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const rep = armarReporte(mes, operadoras, ventas, devoluciones);
  return { ...rep, nombres: new Map(operadoras.map((o) => [o.id, o.nombre])) };
}
