import "server-only";

// EL NÚCLEO DE EMISIÓN: timbra el CFDI de ingreso de UN pago ya cobrado.
//
// Lo llaman dos puertas: la autofactura pública por token (`actions.ts`, quien
// compró sin cuenta) y «Facturar» en Mi espacio (`lib/perfil/facturacion-actions.ts`,
// con la ficha fiscal guardada). Las dos validan QUIÉN pide; aquí se valida QUÉ
// se factura y se timbra una sola vez (índice único pending/stamped por pago).
//
// Modelo Airbnb (MAPA-FACTURACION.md §0): la factura al cliente la emite la
// OPERADORA de la experiencia con su CSD. Fase 1: sólo la casa puede emitir
// (su organización es la de FACTURAPI_SECRET_KEY); una venta de operadora
// externa devuelve «todavía no» hasta la Fase 2 (una organización por operadora).
//
// Conceptos: el viaje por persona (precio de lista; el descuento del código va
// como `discount`) + cada complemento con su nombre. Lo que suma es EXACTAMENTE
// lo que el cliente pagó, o no se timbra.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  CLAVE_PROD_SERV_EXPERIENCIA,
  crearFacturaIngreso,
  descargarCFDI,
  enviarCFDIPorCorreo,
  facturacionActiva,
  type Concepto,
  type ReceptorFiscal,
} from "@/lib/facturacion/facturapi";
import { esCpValido, esRfcValido, regimenCompatible, usoCfdiValido } from "@/lib/facturacion/catalogos";
import type { Experience } from "@/lib/experiences/types";

export type ResultadoEmision = { ok: true; invoiceId: string; uuid: string } | { ok: false; error: string };

const r2 = (x: number) => Math.round(x * 100) / 100;

/** Valida la ficha del receptor con los catálogos antes de gastar un timbre. */
export function validarReceptor(r: ReceptorFiscal): string | null {
  if (!esRfcValido(r.rfc)) return "El RFC no es válido.";
  if (!r.razonSocial.trim()) return "Falta la razón social (nombre fiscal, exacto como en tu constancia).";
  if (!regimenCompatible(r.rfc, r.regimenFiscal)) return "El régimen fiscal no corresponde a ese RFC.";
  if (!usoCfdiValido(r.usoCfdi)) return "El uso de CFDI no es válido.";
  if (!esCpValido(r.codigoPostal)) return "El código postal debe tener 5 dígitos.";
  if (!r.email.includes("@")) return "El correo no es válido.";
  return null;
}

type Pago = {
  id: string;
  reservation_id: string | null;
  contact_id: string | null;
  amount_mxn: number | null;
  status: string;
  status_cfdi: string;
  method: string | null;
};

/**
 * ¿Este pago se puede facturar ahora, y por qué no si no? Lo lee también la
 * pantalla, para no ofrecer un botón que va a fallar.
 */
export async function estadoFacturable(pay: Pago): Promise<{ ok: true } | { ok: false; motivo: string; porEmitir: boolean }> {
  if (pay.status !== "paid") return { ok: false, motivo: "Sólo se factura un pago cobrado.", porEmitir: false };
  if (pay.status_cfdi === "emitido") return { ok: false, motivo: "Este pago ya tiene factura.", porEmitir: false };
  if (pay.status_cfdi !== "por-emitir") return { ok: false, motivo: "Este pago ya no se puede facturar por separado.", porEmitir: false };
  if (!(Number(pay.amount_mxn) > 0)) return { ok: false, motivo: "El monto no permite facturación.", porEmitir: false };
  if (!facturacionActiva()) return { ok: false, motivo: "La facturación en línea aún no está activa.", porEmitir: true };
  const emisor = await emisorDePago(pay);
  if (!emisor.ok) return { ok: false, motivo: emisor.error, porEmitir: true };
  return { ok: true };
}

/**
 * Quién emite: la operadora de la experiencia. Fase 1: sólo la casa (su
 * organización es la de la llave en env). Fase 2: `operators.facturapi_org_id`.
 */
async function emisorDePago(pay: Pago): Promise<{ ok: true; operatorId: string | null } | { ok: false; error: string }> {
  const sb = createSupabaseAdminClient();
  if (!pay.reservation_id) return { ok: false, error: "Este pago no está ligado a una reserva." };
  const { data: resv } = await sb.from("reservations").select("experience_id").eq("id", pay.reservation_id).maybeSingle();
  if (!resv) return { ok: false, error: "No encontramos la reserva de este pago." };
  const { data: exp } = await sb.from("experiences").select("operator_id").eq("id", resv.experience_id as string).maybeSingle();
  const opId = (exp?.operator_id as string | null) ?? null;
  if (!opId) return { ok: true, operatorId: null }; // sin operadora asignada: la casa
  const { data: op } = await sb.from("operators").select("id, es_la_casa, name").eq("id", opId).maybeSingle();
  if (!op) return { ok: true, operatorId: null };
  if (op.es_la_casa) return { ok: true, operatorId: op.id as string };
  return { ok: false, error: `La factura de esta experiencia la emite ${op.name}; estará disponible cuando su facturación quede conectada.` };
}

/** Emite el CFDI del pago. Idempotente por el índice único de cfdi_invoices. */
export async function emitirCFDIDePago(input: { paymentId: string; receptor: ReceptorFiscal }): Promise<ResultadoEmision> {
  const sb = createSupabaseAdminClient();
  const receptor: ReceptorFiscal = {
    ...input.receptor,
    rfc: input.receptor.rfc.trim().toUpperCase(),
    razonSocial: input.receptor.razonSocial.trim(),
    email: input.receptor.email.trim(),
  };
  const malo = validarReceptor(receptor);
  if (malo) return { ok: false, error: malo };

  const { data: pay } = await sb
    .from("payments")
    .select("id, reservation_id, contact_id, amount_mxn, status, status_cfdi, method")
    .eq("id", input.paymentId)
    .maybeSingle();
  if (!pay) return { ok: false, error: "No encontramos ese pago." };
  const puede = await estadoFacturable(pay as Pago);
  if (!puede.ok) return { ok: false, error: puede.motivo };
  const total = r2(Number(pay.amount_mxn));

  // ── Conceptos ────────────────────────────────────────────────────────────
  const { data: resv } = await sb
    .from("reservations")
    .select("id, num_people, experience_id, slot_id, precio_lista_mxn, descuento_mxn, total_amount_mxn")
    .eq("id", pay.reservation_id as string)
    .maybeSingle();
  const [{ data: expRow }, { data: slot }, { data: comps }] = await Promise.all([
    sb.from("experiences").select("slug, data").eq("id", (resv?.experience_id as string) ?? "").maybeSingle(),
    resv?.slot_id ? sb.from("experience_slots").select("label").eq("id", resv.slot_id as string).maybeSingle() : Promise.resolve({ data: null }),
    resv ? sb.from("reservation_complements").select("nombre_snapshot, personas, precio_mxn").eq("reservation_id", resv.id as string) : Promise.resolve({ data: [] }),
  ]);
  const exp = (expRow?.data ?? null) as Partial<Experience> | null;
  const nombre = exp?.cardTitle || [exp?.title, exp?.titleAccent].filter(Boolean).join(" ").trim().replace(/[.\s]+$/, "") || "Experiencia Caminante";
  const salida = ((slot as { label?: string | null } | null)?.label ?? "").trim();
  const clave = exp?.fiscal?.claveProdServ || CLAVE_PROD_SERV_EXPERIENCIA;
  const personas = Math.max(1, Number(resv?.num_people) || 1);

  const complementos = ((comps ?? []) as { nombre_snapshot: string; personas: number; precio_mxn: number }[]).filter((c) => Number(c.precio_mxn) > 0);
  const totalComplementos = r2(complementos.reduce((n, c) => n + Number(c.precio_mxn), 0));
  // El viaje es lo pagado menos los complementos. Si hubo descuento, el precio
  // de lista va como unitario y el descuento como `discount` de la línea.
  const viajeCobrado = r2(total - totalComplementos);
  const descuento = r2(Number(resv?.descuento_mxn) || 0);
  const conceptos: Concepto[] = [];
  if (viajeCobrado > 0) {
    const unitario = r2((viajeCobrado + descuento) / personas);
    conceptos.push({
      descripcion: [nombre, salida].filter(Boolean).join(" · ") + (personas > 1 ? ` · ${personas} lugares` : ""),
      cantidad: personas,
      precioUnitarioConIva: unitario,
      ...(descuento > 0 ? { descuentoConIva: descuento } : {}),
      claveProdServ: clave,
    });
  }
  for (const c of complementos) {
    const cant = Math.max(1, Number(c.personas) || 1);
    conceptos.push({ descripcion: `${c.nombre_snapshot} · ${nombre}`, cantidad: cant, precioUnitarioConIva: r2(Number(c.precio_mxn) / cant), claveProdServ: clave });
  }
  // Lo que suma tiene que ser lo cobrado, centavo arriba o abajo por el reparto por persona.
  const suma = r2(conceptos.reduce((n, c) => n + c.cantidad * c.precioUnitarioConIva - (c.descuentoConIva ?? 0), 0));
  if (Math.abs(suma - total) > 0.05) {
    // Un solo concepto por el total: nunca una factura que no cuadre con la caja.
    conceptos.length = 0;
    conceptos.push({ descripcion: [nombre, salida].filter(Boolean).join(" · "), cantidad: 1, precioUnitarioConIva: total, claveProdServ: clave });
  }
  const formaPago = pay.method === "transfer" ? "03" : pay.method === "cash" ? "01" : "04";

  // ── Reservar el pago contra doble timbre ────────────────────────────────
  const { data: inv, error: invErr } = await sb
    .from("cfdi_invoices")
    .insert({
      payment_id: pay.id,
      reservation_id: pay.reservation_id,
      contact_id: pay.contact_id,
      rfc: receptor.rfc,
      razon_social: receptor.razonSocial,
      regimen_fiscal: receptor.regimenFiscal,
      uso_cfdi: receptor.usoCfdi,
      codigo_postal: receptor.codigoPostal,
      email: receptor.email,
      total_mxn: total,
      status: "pending",
    })
    .select("id")
    .single();
  if (invErr || !inv) {
    if (invErr?.code === "23505") return { ok: false, error: "Este pago ya está en proceso de facturación." };
    return { ok: false, error: "No pudimos iniciar la factura. Intenta de nuevo." };
  }
  const invoiceId = inv.id as string;

  // ── Timbrar, archivar, marcar, mandar ───────────────────────────────────
  try {
    const factura = await crearFacturaIngreso({ receptor, conceptos, formaPago });
    const now = new Date();
    const base = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${factura.uuid}`;
    let xmlPath: string | null = null;
    let pdfPath: string | null = null;
    try {
      const [xml, pdf] = await Promise.all([descargarCFDI(factura.id, "xml"), descargarCFDI(factura.id, "pdf")]);
      const up1 = await sb.storage.from("cfdi").upload(`${base}.xml`, Buffer.from(xml), { contentType: "application/xml", upsert: true });
      const up2 = await sb.storage.from("cfdi").upload(`${base}.pdf`, Buffer.from(pdf), { contentType: "application/pdf", upsert: true });
      if (!up1.error) xmlPath = `${base}.xml`;
      if (!up2.error) pdfPath = `${base}.pdf`;
    } catch {
      /* el CFDI YA está timbrado: archivar después, no romper */
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
    await enviarCFDIPorCorreo(factura.id, receptor.email);
    return { ok: true, invoiceId, uuid: factura.uuid };
  } catch (e) {
    const msg = (e as Error).message;
    await sb.from("cfdi_invoices").update({ status: "error", error: msg.slice(0, 500) }).eq("id", invoiceId);
    return { ok: false, error: `No se pudo timbrar: ${msg}` };
  }
}
