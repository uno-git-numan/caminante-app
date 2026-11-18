import "server-only";

// QUIÉN EMITE cada comprobante y con qué llave.
//
// Modelo Airbnb (MAPA-FACTURACION.md §0): la factura al cliente —y la global
// donde cae si nadie la pide— la emite la OPERADORA de la experiencia,
// desde SU organización de Facturapi. La casa (NUMAN HUB hoy; DRUIDAS cuando
// exista) usa la organización de `FACTURAPI_SECRET_KEY`; cada operadora externa
// la suya (`operators.facturapi_org_id` + su llave cifrada, 0076). Sandbox:
// mientras la llave de la casa sea `sk_test_`, las operadoras usan su llave Test.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { descifrar } from "@/lib/facturacion/crypto";
import { facturaLaCasa } from "@/lib/facturacion/quien-factura";
import { clienteFacturapi, facturacionClientesActiva, llaveDeLaCasa, modoPrueba } from "@/lib/facturacion/facturapi";

export type Emisor = {
  operatorId: string | null; // null = la casa sin fila (no debería pasar; se trata como casa)
  nombre: string;
  esLaCasa: boolean;
  key: string;
};

export type EmisorResuelto = { ok: true; emisor: Emisor } | { ok: false; error: string; porEmitir: boolean };

type OpRow = {
  id: string;
  name: string;
  es_la_casa: boolean | null;
  facturapi_org_id: string | null;
  facturapi_live_key_enc: string | null;
  facturapi_test_key_enc: string | null;
  facturapi_csd_at: string | null;
  facturacion_portal_at: string | null;
  facturapi_manifiesto_at: string | null;
  estado: string | null;
  convenio_firmado_at: string | null;
};

const COLS = "id, name, es_la_casa, facturapi_org_id, facturapi_live_key_enc, facturapi_test_key_enc, facturapi_csd_at, facturacion_portal_at, facturapi_manifiesto_at, estado, convenio_firmado_at";

function emisorDeFila(op: OpRow | null): EmisorResuelto {
  // Todo lo de aquí es facturación a CLIENTES: llave + interruptor (lib/facturacion/corte.ts).
  if (!facturacionClientesActiva()) return { ok: false, error: "La facturación en línea aún no está activa.", porEmitir: true };
  // D22: factura la casa si la venta es suya, si no tiene operadora o si la
  // operadora NO ha firmado convenio (NUMAN vende a nombre propio; quien-factura.ts).
  if (facturaLaCasa(op)) {
    const esLaFilaDeLaCasa = Boolean(op?.es_la_casa);
    return { ok: true, emisor: { operatorId: esLaFilaDeLaCasa ? op!.id : null, nombre: esLaFilaDeLaCasa ? op!.name : "Caminante", esLaCasa: true, key: llaveDeLaCasa() } };
  }
  if (!op) return { ok: false, error: "No pudimos leer a la operadora.", porEmitir: true };
  const enc = modoPrueba() ? op.facturapi_test_key_enc : op.facturapi_live_key_enc;
  // Los candados de D20: la operadora ACTIVÓ la facturación (aceptó el §1 bis),
  // su CSD está en Facturapi y firmó ella su carta manifiesto. Desactivar o dar
  // de baja el CSD apaga esto al instante: Caminante deja de emitir a su nombre.
  if (op.estado === "baja") return { ok: false, error: `${op.name} ya no opera en la plataforma: sus comprobantes los emite ella por su cuenta.`, porEmitir: false };
  if (!op.facturacion_portal_at || !op.facturapi_org_id || !enc || !op.facturapi_csd_at || !op.facturapi_manifiesto_at) {
    return { ok: false, error: `La factura de esta experiencia la emite ${op.name}; estará disponible cuando su facturación quede conectada.`, porEmitir: true };
  }
  try {
    return { ok: true, emisor: { operatorId: op.id, nombre: op.name, esLaCasa: false, key: descifrar(enc) } };
  } catch {
    return { ok: false, error: `La llave de facturación de ${op.name} no se pudo leer.`, porEmitir: true };
  }
}

/** El emisor de un pago: la operadora de la experiencia de su reserva. */
export async function emisorDePago(paymentId: string): Promise<EmisorResuelto> {
  const sb = createSupabaseAdminClient();
  const { data: pay } = await sb.from("payments").select("reservation_id").eq("id", paymentId).maybeSingle();
  if (!pay?.reservation_id) return { ok: false, error: "Este pago no está ligado a una reserva.", porEmitir: false };
  const { data: resv } = await sb.from("reservations").select("experience_id").eq("id", pay.reservation_id as string).maybeSingle();
  if (!resv) return { ok: false, error: "No encontramos la reserva de este pago.", porEmitir: false };
  const { data: exp } = await sb.from("experiences").select("operator_id").eq("id", resv.experience_id as string).maybeSingle();
  const opId = (exp?.operator_id as string | null) ?? null;
  if (!opId) return emisorDeFila(null);
  const { data: op, error } = await sb.from("operators").select(COLS).eq("id", opId).maybeSingle();
  // ⚠️ Una experiencia CON operadora cuya fila no se pudo leer NO es de la casa:
  // caer en `emisorDeFila(null)` timbraría con el RFC de NUMAN la venta de otra.
  if (error || !op) return { ok: false, error: "No pudimos leer a la operadora de esta experiencia.", porEmitir: true };
  return emisorDeFila(op as OpRow);
}

/** El emisor por operadora (para la global de fin de mes). */
export async function emisorDeOperadora(operatorId: string): Promise<EmisorResuelto> {
  const sb = createSupabaseAdminClient();
  const { data: op, error } = await sb.from("operators").select(COLS).eq("id", operatorId).maybeSingle();
  if (error || !op) return { ok: false, error: "No pudimos leer a esa operadora.", porEmitir: true };
  return emisorDeFila(op as OpRow);
}

/** Todas las operadoras que hoy pueden emitir (la casa + las conectadas). */
export async function emisoresActivos(): Promise<Emisor[]> {
  if (!facturacionClientesActiva()) return [];
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("operators").select(COLS).or("es_la_casa.eq.true,facturapi_org_id.not.is.null");
  const out: Emisor[] = [];
  for (const op of (data ?? []) as OpRow[]) {
    // Una operadora sin convenio no es emisora: sus ventas las factura la casa,
    // que ya entra por su propia fila (no se duplica).
    if (!op.es_la_casa && facturaLaCasa(op)) continue;
    const r = emisorDeFila(op);
    if (r.ok) out.push(r.emisor);
  }
  return out;
}

export const facturapiDe = (e: Emisor) => clienteFacturapi(e.key);

export type DatosFiscalesEmisor = { rfc: string | null; razonSocial: string | null; regimen: string | null; cp: string | null };

/** RFC, razón social, régimen y CP fiscal de quien emite: van en el comprobante del cliente (D21). */
export async function datosFiscalesDe(emisor: Emisor): Promise<DatosFiscalesEmisor> {
  const sb = createSupabaseAdminClient();
  const q = sb.from("operators").select("rfc, razon_social, regimen_fiscal, cp_fiscal");
  const { data } = emisor.operatorId ? await q.eq("id", emisor.operatorId).maybeSingle() : await q.eq("es_la_casa", true).limit(1).maybeSingle();
  const o = (data ?? {}) as Record<string, string | null>;
  const t = (x: string | null | undefined) => (x ?? "").trim() || null;
  return { rfc: t(o.rfc), razonSocial: t(o.razon_social), regimen: t(o.regimen_fiscal), cp: t(o.cp_fiscal) };
}

/** El CP fiscal del emisor = lugar de expedición, y domicilio del receptor «público en general». */
export async function cpFiscalDe(emisor: Emisor): Promise<string | null> {
  return (await datosFiscalesDe(emisor)).cp;
}
