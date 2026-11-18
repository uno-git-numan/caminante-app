import "server-only";

// LA BONIFICACIÓN DEL 20 % (D23 de legal, §5; LFPC 92 Bis y 92 Ter).
//
// Cuando una salida se cancela por causa de quien opera, a cada persona pagada
// se le devuelve el 100 % por el procesador (eso lo hace `reembolsos.ts`) y
// ADEMÁS se le debe el 20 % de lo que pagó. El procesador no devuelve más de lo
// cobrado, así que ese 20 % es un segundo movimiento: una transferencia que
// hace Luis. Aquí sólo se calcula, se avisa y se registra que ya se pagó.
//
//   · Se crea al registrar la cancelación como imputable. Con fuerza mayor no.
//   · La cuenta del cliente NO se guarda: quedan la fecha, el importe, los
//     últimos 4 dígitos y la clave de rastreo (LFPDPPP art. 7).
//   · Se recupera de la operadora (convenio, Quinta §3 y §9); en una
//     experiencia de la casa es costo de la casa (`operator_id` NULL).
//   · NO va en el CFDI de egreso de la venta: el egreso no puede exceder al
//     ingreso. Cómo se documenta lo confirma la contadora (M24).

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { bonificacionDe, venceBonificacion } from "@/lib/cancelacion/politica";
import { experienceTitle } from "@/lib/admin/queries";
import { notifyBonificaciones } from "@/lib/notifications/notify-admin";
import type { Experience } from "@/lib/experiences/types";

const r2 = (x: number) => Math.round(x * 100) / 100;

export type BonificacionPorPagar = {
  id: string;
  nombre: string;
  experiencia: string;
  salida: string;
  /** La operadora de la que se recupera; null = costo de la casa. */
  operadora: string | null;
  pagado: number;
  monto: number;
  /** YYYY-MM-DD. */
  venceEl: string;
  vencida: boolean;
};

export type BonificacionPagada = BonificacionPorPagar & {
  pagadaEl: string;
  pagadoReal: number;
  ultimos4: string;
  claveRastreo: string;
};

/**
 * Crea la bonificación «por pagar» de cada reserva pagada de una salida que se
 * cancela por causa de quien opera. Una por reserva (índice único): repetir la
 * llamada no duplica. Avisa a la casa con el total y la fecha límite.
 */
export async function crearBonificaciones(
  sb: SupabaseClient,
  i: { slotId: string; porReserva: Map<string, number>; canceladaAt: string; quien: string | null },
): Promise<{ ok: true; creadas: number; total: number; venceEl: string | null } | { ok: false; error: string }> {
  const filas = [...i.porReserva.entries()].filter(([, pagado]) => pagado > 0);
  if (!filas.length) return { ok: true, creadas: 0, total: 0, venceEl: null };

  let venceEl: string;
  try {
    venceEl = venceBonificacion(i.canceladaAt);
  } catch (e) {
    // Año sin lista de días de descanso: la fecha límite no se adivina.
    return { ok: false, error: `No se pudo calcular la fecha límite de la bonificación: ${(e as Error).message}` };
  }

  const { data: slot } = await sb.from("experience_slots").select("label, experience_id").eq("id", i.slotId).maybeSingle();
  const { data: exp } = slot?.experience_id
    ? await sb.from("experiences").select("slug, data, operator_id").eq("id", slot.experience_id as string).maybeSingle()
    : { data: null };
  // La casa no se cobra a sí misma: sólo se apunta una operadora que no lo sea.
  let operatorId: string | null = null;
  if (exp?.operator_id) {
    const { data: op } = await sb.from("operators").select("id, es_la_casa").eq("id", exp.operator_id as string).maybeSingle();
    if (op && op.es_la_casa !== true) operatorId = op.id as string;
  }

  const renglones = filas.map(([reservationId, pagado]) => ({
    reservation_id: reservationId,
    slot_id: i.slotId,
    operator_id: operatorId,
    pagado_mxn: r2(pagado),
    monto_mxn: bonificacionDe(pagado),
    vence_el: venceEl,
    creada_por: i.quien,
  }));
  const { data: creadas, error } = await sb
    .from("bonificaciones")
    .upsert(renglones, { onConflict: "reservation_id", ignoreDuplicates: true })
    .select("id, monto_mxn");
  if (error) return { ok: false, error: `No se pudieron crear las bonificaciones: ${error.message}.` };

  const nuevas = (creadas ?? []) as { id: string; monto_mxn: number }[];
  const total = r2(nuevas.reduce((s, b) => s + Number(b.monto_mxn || 0), 0));
  if (nuevas.length) {
    await notifyBonificaciones({
      experiencia: experienceTitle((exp?.data ?? null) as Partial<Experience> | null, (exp?.slug as string) ?? ""),
      salida: (slot?.label as string | null) ?? "",
      personas: nuevas.length,
      totalMxn: total,
      venceEl,
    }).catch((e) => console.error("notifyBonificaciones:", (e as Error).message));
  }
  return { ok: true, creadas: nuevas.length, total, venceEl };
}

type Fila = {
  id: string;
  reservation_id: string;
  slot_id: string | null;
  operator_id: string | null;
  pagado_mxn: number;
  monto_mxn: number;
  vence_el: string;
  estado: string;
  pagada_el: string | null;
  pagado_real_mxn: number | null;
  cuenta_ultimos4: string | null;
  clave_rastreo: string | null;
};

/** Las bonificaciones de la casa: las que faltan por pagar y las últimas pagadas. Sólo para la casa. */
export async function bonificacionesDeLaCasa(): Promise<{ porPagar: BonificacionPorPagar[]; pagadas: BonificacionPagada[] }> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("bonificaciones")
    .select("id, reservation_id, slot_id, operator_id, pagado_mxn, monto_mxn, vence_el, estado, pagada_el, pagado_real_mxn, cuenta_ultimos4, clave_rastreo")
    .order("vence_el", { ascending: true });
  // Antes de la 0090 la tabla no existe: no hay nada que enseñar, no es un error de la pantalla.
  if (error || !data?.length) return { porPagar: [], pagadas: [] };
  const filas = data as Fila[];

  const resvIds = [...new Set(filas.map((f) => f.reservation_id))];
  const slotIds = [...new Set(filas.map((f) => f.slot_id).filter((x): x is string => !!x))];
  const opIds = [...new Set(filas.map((f) => f.operator_id).filter((x): x is string => !!x))];
  const [{ data: resvs }, { data: slots }, { data: ops }] = await Promise.all([
    sb.from("reservations").select("id, contact_id, experience_id").in("id", resvIds),
    slotIds.length ? sb.from("experience_slots").select("id, label").in("id", slotIds) : Promise.resolve({ data: [] }),
    opIds.length ? sb.from("operators").select("id, name").in("id", opIds) : Promise.resolve({ data: [] }),
  ]);
  const rs = (resvs ?? []) as { id: string; contact_id: string; experience_id: string }[];
  const [{ data: contactos }, { data: exps }] = await Promise.all([
    sb.from("contacts").select("id, full_name, email").in("id", [...new Set(rs.map((r) => r.contact_id))]),
    sb.from("experiences").select("id, slug, data").in("id", [...new Set(rs.map((r) => r.experience_id))]),
  ]);
  const rById = new Map(rs.map((r) => [r.id, r]));
  const cById = new Map(((contactos ?? []) as { id: string; full_name: string | null; email: string | null }[]).map((c) => [c.id, c]));
  const eById = new Map(((exps ?? []) as { id: string; slug: string; data: Partial<Experience> | null }[]).map((e) => [e.id, e]));
  const sById = new Map(((slots ?? []) as { id: string; label: string | null }[]).map((s) => [s.id, s.label ?? ""]));
  const oById = new Map(((ops ?? []) as { id: string; name: string }[]).map((o) => [o.id, o.name]));

  const hoy = new Date(Date.now() - 6 * 3600_000).toISOString().slice(0, 10);
  const base = (f: Fila): BonificacionPorPagar => {
    const r = rById.get(f.reservation_id);
    const c = r ? cById.get(r.contact_id) : null;
    const e = r ? eById.get(r.experience_id) : null;
    return {
      id: f.id,
      nombre: c?.full_name || c?.email || "—",
      experiencia: e ? experienceTitle(e.data, e.slug) : "—",
      salida: f.slot_id ? sById.get(f.slot_id) ?? "" : "",
      operadora: f.operator_id ? oById.get(f.operator_id) ?? null : null,
      pagado: Number(f.pagado_mxn),
      monto: Number(f.monto_mxn),
      venceEl: f.vence_el,
      vencida: f.vence_el < hoy,
    };
  };
  return {
    porPagar: filas.filter((f) => f.estado === "por-pagar").map(base),
    pagadas: filas
      .filter((f) => f.estado === "pagada")
      .map((f) => ({
        ...base(f),
        vencida: false,
        pagadaEl: f.pagada_el as string,
        pagadoReal: Number(f.pagado_real_mxn),
        ultimos4: f.cuenta_ultimos4 as string,
        claveRastreo: f.clave_rastreo as string,
      }))
      .sort((a, b) => (a.pagadaEl < b.pagadaEl ? 1 : -1))
      .slice(0, 20),
  };
}

/** La bonificación de una reserva, para el correo que avisa la cancelación. null si no hay. */
export async function bonificacionDeReserva(sb: SupabaseClient, reservationId: string): Promise<{ monto: number; venceEl: string } | null> {
  const { data } = await sb.from("bonificaciones").select("monto_mxn, vence_el").eq("reservation_id", reservationId).maybeSingle();
  return data ? { monto: Number(data.monto_mxn), venceEl: data.vence_el as string } : null;
}
