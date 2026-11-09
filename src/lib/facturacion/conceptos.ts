import "server-only";

// LOS CONCEPTOS DE UN PAGO: lo que va en su recibo y en su factura. Una sola
// función para que el recibo, la factura al cliente y la global digan lo mismo.
//
// Viaje por persona (precio de lista; el código de descuento va como `discount`
// de la línea) + cada complemento con su nombre. Lo que suma tiene que ser
// EXACTAMENTE lo cobrado; si el reparto por persona no cuadra al centavo, cae a
// UN concepto por el total: nunca un comprobante que no cuadre con la caja.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { CLAVE_PROD_SERV_EXPERIENCIA, type Concepto } from "@/lib/facturacion/facturapi";
import type { Experience } from "@/lib/experiences/types";

const r2 = (x: number) => Math.round(x * 100) / 100;

export type PagoParaComprobante = {
  id: string;
  reservation_id: string | null;
  contact_id: string | null;
  amount_mxn: number | null;
  status: string;
  status_cfdi: string;
  method: string | null;
  paid_at: string | null;
  facturapi_receipt_id?: string | null;
};

export type ConceptosDePago = {
  conceptos: Concepto[];
  total: number;
  formaPago: string; // 04 tarjeta · 03 transferencia · 01 efectivo
  titulo: string;
  salida: string | null;
  email: string | null; // del contacto, para mandar el comprobante
  nombre: string | null;
};

export const formaPagoDe = (method: string | null) => (method === "transfer" ? "03" : method === "cash" ? "01" : "04");

export async function conceptosDePago(pay: PagoParaComprobante): Promise<ConceptosDePago> {
  const sb = createSupabaseAdminClient();
  const total = r2(Number(pay.amount_mxn || 0));
  const { data: resv } = pay.reservation_id
    ? await sb.from("reservations").select("id, num_people, experience_id, slot_id, precio_lista_mxn, descuento_mxn").eq("id", pay.reservation_id).maybeSingle()
    : { data: null };
  const [{ data: expRow }, { data: slot }, { data: comps }, { data: contacto }] = await Promise.all([
    resv ? sb.from("experiences").select("slug, data").eq("id", resv.experience_id as string).maybeSingle() : Promise.resolve({ data: null }),
    resv?.slot_id ? sb.from("experience_slots").select("label").eq("id", resv.slot_id as string).maybeSingle() : Promise.resolve({ data: null }),
    resv ? sb.from("reservation_complements").select("nombre_snapshot, personas, precio_mxn").eq("reservation_id", resv.id as string) : Promise.resolve({ data: [] }),
    pay.contact_id ? sb.from("contacts").select("email, full_name").eq("id", pay.contact_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const exp = ((expRow as { data?: unknown } | null)?.data ?? null) as Partial<Experience> | null;
  const titulo = exp?.cardTitle || [exp?.title, exp?.titleAccent].filter(Boolean).join(" ").trim().replace(/[.\s]+$/, "") || "Experiencia Caminante";
  const salida = ((slot as { label?: string | null } | null)?.label ?? "").trim() || null;
  const clave = exp?.fiscal?.claveProdServ || CLAVE_PROD_SERV_EXPERIENCIA;
  const personas = Math.max(1, Number(resv?.num_people) || 1);

  const complementos = ((comps ?? []) as { nombre_snapshot: string; personas: number; precio_mxn: number }[]).filter((c) => Number(c.precio_mxn) > 0);
  const totalComplementos = r2(complementos.reduce((n, c) => n + Number(c.precio_mxn), 0));
  const viajeCobrado = r2(total - totalComplementos);
  const descuento = r2(Number(resv?.descuento_mxn) || 0);

  const conceptos: Concepto[] = [];
  if (viajeCobrado > 0) {
    const unitario = r2((viajeCobrado + descuento) / personas);
    conceptos.push({
      descripcion: [titulo, salida].filter(Boolean).join(" · ") + (personas > 1 ? ` · ${personas} lugares` : ""),
      cantidad: personas,
      precioUnitarioConIva: unitario,
      ...(descuento > 0 ? { descuentoConIva: descuento } : {}),
      claveProdServ: clave,
    });
  }
  for (const c of complementos) {
    const cant = Math.max(1, Number(c.personas) || 1);
    conceptos.push({ descripcion: `${c.nombre_snapshot} · ${titulo}`, cantidad: cant, precioUnitarioConIva: r2(Number(c.precio_mxn) / cant), claveProdServ: clave });
  }
  const suma = r2(conceptos.reduce((n, c) => n + c.cantidad * c.precioUnitarioConIva - (c.descuentoConIva ?? 0), 0));
  if (!conceptos.length || Math.abs(suma - total) > 0.05) {
    conceptos.length = 0;
    conceptos.push({ descripcion: [titulo, salida].filter(Boolean).join(" · "), cantidad: 1, precioUnitarioConIva: total, claveProdServ: clave });
  }
  const c = contacto as { email?: string | null; full_name?: string | null } | null;
  return { conceptos, total, formaPago: formaPagoDe(pay.method), titulo, salida, email: c?.email ?? null, nombre: c?.full_name ?? null };
}
