import "server-only";

// «TUS FACTURAS» en Mi espacio: cada pago de la persona con su estado fiscal.
// Se deriva de `payments` + `cfdi_invoices`; no hay una tabla de «facturas del
// cliente». Un pago es de la persona si la reserva es suya o si el pago apunta a
// su contacto (links especiales y cobros por WhatsApp).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { estadoFacturable } from "@/lib/facturacion/emitir";
import type { Experience } from "@/lib/experiences/types";

export type MiFactura = {
  paymentId: string;
  titulo: string;
  salida: string | null;
  fecha: string; // "12 jun 2026" — cuándo pagó
  montoMxn: number;
  metodo: "tarjeta" | "transferencia" | "efectivo" | "otro";
  /** devuelto: el pago se devolvió (total o parcial) */
  devueltoMxn: number;
  estado: "facturable" | "pendiente" | "emitida" | "global" | "no-facturable";
  /** por qué no se puede facturar ahora (estado pendiente / no-facturable) */
  motivo: string | null;
  factura: { uuid: string; xmlUrl: string | null; pdfUrl: string | null; emitidaEl: string } | null;
};

const fmtFecha = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", day: "numeric", month: "short", year: "numeric" })
    .format(new Date(iso))
    .replace(".", "");

const metodoDe = (m: string | null): MiFactura["metodo"] =>
  m === "stripe" ? "tarjeta" : m === "transfer" ? "transferencia" : m === "cash" ? "efectivo" : "otro";

export async function fetchMisFacturas(contactId: string): Promise<MiFactura[]> {
  const sb = createSupabaseAdminClient();
  const { data: resvs } = await sb.from("reservations").select("id").eq("contact_id", contactId);
  const resvIds = ((resvs ?? []) as { id: string }[]).map((r) => r.id);
  const filtro = resvIds.length ? `contact_id.eq.${contactId},reservation_id.in.(${resvIds.join(",")})` : `contact_id.eq.${contactId}`;
  const { data: pays } = await sb
    .from("payments")
    .select("id, reservation_id, contact_id, amount_mxn, refunded_mxn, status, status_cfdi, method, paid_at, created_at")
    .or(filtro)
    .in("status", ["paid", "refunded"])
    .order("paid_at", { ascending: false });
  const pagos = (pays ?? []) as {
    id: string; reservation_id: string | null; contact_id: string | null; amount_mxn: number | null; refunded_mxn: number | null;
    status: string; status_cfdi: string; method: string | null; paid_at: string | null; created_at: string;
  }[];
  if (!pagos.length) return [];

  const [{ data: resvRows }, { data: invs }] = await Promise.all([
    sb
      .from("reservations")
      .select("id, experience_id, slot_id, experiences ( data ), experience_slots ( label )")
      .in("id", pagos.map((p) => p.reservation_id).filter(Boolean) as string[]),
    sb
      .from("cfdi_invoices")
      .select("payment_id, uuid_cfdi, xml_url, pdf_url, stamped_at, status")
      .in("payment_id", pagos.map((p) => p.id))
      .eq("status", "stamped"),
  ]);
  type ResvRow = { id: string; experiences: { data: Partial<Experience> | null } | { data: Partial<Experience> | null }[] | null; experience_slots: { label: string | null } | { label: string | null }[] | null };
  const uno = <T,>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x);
  const porResv = new Map(((resvRows ?? []) as ResvRow[]).map((r) => [r.id, r]));
  const porPago = new Map(((invs ?? []) as { payment_id: string; uuid_cfdi: string; xml_url: string | null; pdf_url: string | null; stamped_at: string }[]).map((i) => [i.payment_id, i]));

  const out: MiFactura[] = [];
  for (const p of pagos) {
    const r = p.reservation_id ? porResv.get(p.reservation_id) : null;
    const data = uno(r?.experiences ?? null)?.data ?? null;
    const titulo = data?.cardTitle || [data?.title, data?.titleAccent].filter(Boolean).join(" ").trim().replace(/[.\s]+$/, "") || "Experiencia Caminante";
    const salida = uno(r?.experience_slots ?? null)?.label ?? null;
    const inv = porPago.get(p.id) ?? null;
    let factura: MiFactura["factura"] = null;
    if (inv) {
      const [x, d] = await Promise.all([
        inv.xml_url ? sb.storage.from("cfdi").createSignedUrl(inv.xml_url, 3600) : Promise.resolve({ data: null }),
        inv.pdf_url ? sb.storage.from("cfdi").createSignedUrl(inv.pdf_url, 3600) : Promise.resolve({ data: null }),
      ]);
      factura = { uuid: inv.uuid_cfdi, xmlUrl: x.data?.signedUrl ?? null, pdfUrl: d.data?.signedUrl ?? null, emitidaEl: fmtFecha(inv.stamped_at) };
    }
    let estado: MiFactura["estado"];
    let motivo: string | null = null;
    if (p.status_cfdi === "emitido" || inv) estado = "emitida";
    else if (p.status_cfdi === "publico-general") estado = "global";
    else if (p.status_cfdi === "no-facturable" || p.status === "refunded") {
      estado = "no-facturable";
      motivo = p.status === "refunded" ? "Pago devuelto." : "Este pago no se factura por separado.";
    } else {
      const f = await estadoFacturable({ id: p.id, reservation_id: p.reservation_id, contact_id: p.contact_id, amount_mxn: p.amount_mxn, status: p.status, status_cfdi: p.status_cfdi, method: p.method });
      if (f.ok) estado = "facturable";
      else {
        estado = f.porEmitir ? "pendiente" : "no-facturable";
        motivo = f.motivo;
      }
    }
    out.push({
      paymentId: p.id,
      titulo,
      salida,
      fecha: fmtFecha(p.paid_at ?? p.created_at),
      montoMxn: Number(p.amount_mxn || 0),
      metodo: metodoDe(p.method),
      devueltoMxn: Number(p.refunded_mxn || 0),
      estado,
      motivo,
      factura,
    });
  }
  return out;
}
