import "server-only";

// QUIÉN EMITE cada comprobante y con qué llave.
//
// Modelo Airbnb (MAPA-FACTURACION.md §0): la factura al cliente —y su recibo, y
// la global donde cae si nadie la pide— la emite la OPERADORA de la experiencia,
// desde SU organización de Facturapi. La casa (NUMAN HUB hoy; DRUIDAS cuando
// exista) usa la organización de `FACTURAPI_SECRET_KEY`; cada operadora externa
// la suya (`operators.facturapi_org_id` + su llave cifrada, 0076). Sandbox:
// mientras la llave de la casa sea `sk_test_`, las operadoras usan su llave Test.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { descifrar } from "@/lib/facturacion/crypto";
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
};

const COLS = "id, name, es_la_casa, facturapi_org_id, facturapi_live_key_enc, facturapi_test_key_enc, facturapi_csd_at";

function emisorDeFila(op: OpRow | null): EmisorResuelto {
  // Todo lo de aquí es facturación a CLIENTES: llave + interruptor (lib/facturacion/corte.ts).
  if (!facturacionClientesActiva()) return { ok: false, error: "La facturación en línea aún no está activa.", porEmitir: true };
  if (!op || op.es_la_casa) {
    return { ok: true, emisor: { operatorId: op?.id ?? null, nombre: op?.name ?? "Caminante", esLaCasa: true, key: llaveDeLaCasa() } };
  }
  const enc = modoPrueba() ? op.facturapi_test_key_enc : op.facturapi_live_key_enc;
  if (!op.facturapi_org_id || !enc || !op.facturapi_csd_at) {
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
  const { data: op } = await sb.from("operators").select(COLS).eq("id", opId).maybeSingle();
  return emisorDeFila((op as OpRow | null) ?? null);
}

/** El emisor por operadora (para la global de fin de mes). */
export async function emisorDeOperadora(operatorId: string): Promise<EmisorResuelto> {
  const sb = createSupabaseAdminClient();
  const { data: op } = await sb.from("operators").select(COLS).eq("id", operatorId).maybeSingle();
  return emisorDeFila((op as OpRow | null) ?? null);
}

/** Todas las operadoras que hoy pueden emitir (la casa + las conectadas). */
export async function emisoresActivos(): Promise<Emisor[]> {
  if (!facturacionClientesActiva()) return [];
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("operators").select(COLS).or("es_la_casa.eq.true,facturapi_org_id.not.is.null");
  const out: Emisor[] = [];
  for (const op of (data ?? []) as OpRow[]) {
    const r = emisorDeFila(op);
    if (r.ok) out.push(r.emisor);
  }
  return out;
}

export const facturapiDe = (e: Emisor) => clienteFacturapi(e.key);
