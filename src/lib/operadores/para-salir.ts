import "server-only";

// LO QUE LE FALTA A UNA SALIDA PARA REALIZARSE — el candado, movido.
//
// Convenio v3.5, Anexo B y Sexta c) (23 nov 2026): para publicar y vender basta
// el expediente de arranque. Las pólizas, la credencial del guía y la
// autorización del sitio «se entregan antes del inicio de la primera salida de
// cada actividad y se mantienen vigentes en cada salida; sin ellos la salida no
// se realiza».
//
// O sea que el candado que antes detenía la PUBLICACIÓN ahora cuida la SALIDA,
// y un candado que nadie ve no cuida nada. Esto es lo que lo hace visible:
//
//   · en Salidas, cada salida futura de una operadora dice qué le falta;
//   · en Mi alta, la lista de arriba lo trae con la fecha de su próxima salida;
//   · por correo, a la operadora y a la casa, a 14, 7, 3 y 1 día.
//
// ⚠️ NO TIENE SU PROPIA IDEA DE «FALTA». Arma el expediente con
// `armarExpediente` —la función de Mi alta— y de ahí lee. Lo único propio es
// la fecha: un documento que vence ANTES de la salida no la cubre.
//
// La casa (`es_la_casa`) no tiene expediente: nada que avisar.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { armarExpediente, declaracionesDeNoAplica, type Expediente } from "./expediente";
import { nombreDeActividad, requisitosDe } from "./actividades";
import { CDMX } from "@/lib/fecha/zona";

/** A cuántos días de la salida se avisa por correo. Una vez por umbral: el cron es diario. */
export const AVISOS_A_DIAS = [14, 7, 3, 1] as const;

/**
 * Qué le falta a UNA salida, por nombre. Puro.
 *
 * @param fecha el día en que inicia, `YYYY-MM-DD`. Un documento entregado que
 *   vence antes de ese día cuenta como faltante para ESTA salida.
 */
export function faltaParaSalir(e: Expediente, actividad: string, fecha: string | null): string[] {
  const noCubre = (d: Expediente["generales"][number]): string | null => {
    // Declaró que ese permiso no aplica a sus salidas (anexo, Cuarta).
    if (d.noAplica) return null;
    if (d.estado === "falta") return d.opcional ? null : d.nombre;
    if (d.estado === "rechazado") return `${d.nombre} (rechazado: hay que corregirlo)`;
    if (d.venceAt && fecha && d.venceAt.slice(0, 10) < fecha) return `${d.nombre} (vence antes de la salida)`;
    if (d.diasParaVencer !== null && d.diasParaVencer < 0) return `${d.nombre} (vencido)`;
    if (d.estado === "en_revision") return null; // entregado: nos toca a nosotros
    return null;
  };

  const out: string[] = [];
  for (const d of e.generales.filter((g) => g.momento === "salida")) {
    const f = noCubre(d);
    if (f) out.push(f);
  }
  const act = e.actividades.find((a) => a.slug === actividad);
  if (act) {
    for (const d of act.propios) {
      const f = noCubre(d);
      if (f) out.push(f);
    }
  } else {
    // Vende con dispensa una actividad que ni declaró: lo propio falta entero.
    for (const d of requisitosDe(actividad).propios) out.push(d.nombre);
    if (!requisitosDe(actividad).propios.length) out.push(`Declarar ${nombreDeActividad(actividad).toLowerCase()} en el expediente`);
  }
  return out;
}

type Par = { operatorId: string; actividad: string | null; fecha: string | null };
const clave = (p: Par) => `${p.operatorId}|${p.actividad ?? ""}|${p.fecha ?? ""}`;

/**
 * Lo que le falta a cada salida, para muchas a la vez (tres consultas en
 * total). La clave del mapa es `claveDeSalida`. Una operadora que es la casa,
 * una salida sin actividad o un error de lectura no aparecen en el mapa: quien
 * pinta no enseña nada, que es distinto de enseñar «no falta nada».
 */
export async function faltaParaSalirDe(pares: Par[]): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  const ids = [...new Set(pares.filter((p) => p.actividad).map((p) => p.operatorId))];
  if (!ids.length) return out;

  const sb = createSupabaseAdminClient();
  const [{ data: ops, error: e1 }, { data: acts, error: e2 }, { data: docs, error: e3 }] = await Promise.all([
    sb.from("operators").select("id, tipo_persona, es_la_casa").in("id", ids),
    sb.from("operator_activities").select("operator_id, actividad, estado, motivo").in("operator_id", ids),
    sb.from("operator_documents").select("operator_id, actividad, documento, estado, motivo, vence_at").in("operator_id", ids),
  ]);
  if (e1 || e2 || e3) {
    console.error("faltaParaSalirDe:", e1 ?? e2 ?? e3);
    return out;
  }

  const noAplica = await declaracionesDeNoAplica(ids);
  const expedientes = new Map<string, Expediente>();
  for (const o of (ops ?? []) as { id: string; tipo_persona: string | null; es_la_casa: boolean | null }[]) {
    if (o.es_la_casa === true) continue;
    const suyas = <T extends { operator_id: string }>(filas: T[] | null) => (filas ?? []).filter((f) => f.operator_id === o.id);
    expedientes.set(
      o.id,
      armarExpediente(
        suyas(acts as { operator_id: string; actividad: string; estado: string; motivo: string | null }[] | null),
        suyas(docs as ({ operator_id: string } & Parameters<typeof armarExpediente>[1][number])[] | null),
        undefined,
        o.tipo_persona === "fisica" || o.tipo_persona === "moral" ? o.tipo_persona : null,
        noAplica.get(o.id),
      ),
    );
  }

  for (const p of pares) {
    const e = expedientes.get(p.operatorId);
    if (!e || !p.actividad) continue;
    out.set(clave(p), faltaParaSalir(e, p.actividad, p.fecha));
  }
  return out;
}

export const claveDeSalida = clave;

/** El día de hoy en CDMX, `YYYY-MM-DD`. */
const hoyCdmx = (ahora: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: CDMX }).format(ahora);
const diaCdmx = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: CDMX }).format(new Date(iso));
const diasEntre = (de: string, a: string) =>
  Math.round((Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10)) - Date.UTC(+de.slice(0, 4), +de.slice(5, 7) - 1, +de.slice(8, 10))) / 86_400_000);

export type AvisoDeSalida = {
  operatorId: string;
  operadora: string;
  email: string | null;
  experiencia: string;
  salida: string;
  dias: number;
  faltan: string[];
};

/**
 * Las salidas que HOY tocan aviso: abiertas, de una operadora que no es la
 * casa, que inician exactamente a 14, 7, 3 o 1 día, y a las que les falta algo.
 * El cron es diario, así que cada umbral avisa una sola vez sin guardar estado.
 */
export async function salidasPorAvisar(ahora = new Date()): Promise<AvisoDeSalida[]> {
  const sb = createSupabaseAdminClient();
  const hoy = hoyCdmx(ahora);
  const hasta = new Date(ahora.getTime() + 16 * 86_400_000).toISOString();
  const { data: slots, error } = await sb
    .from("experience_slots")
    .select("id, experience_id, label, starts_at, status, cancelada_at")
    .gte("starts_at", ahora.toISOString())
    .lte("starts_at", hasta);
  if (error || !slots?.length) return [];

  type Slot = { id: string; experience_id: string; label: string | null; starts_at: string; status: string; cancelada_at: string | null };
  const vivas = (slots as Slot[]).filter((s) => !s.cancelada_at && s.status !== "cancelled");
  const { data: exps } = await sb
    .from("experiences")
    .select("id, slug, status, operator_id, actividad, data")
    .in("id", [...new Set(vivas.map((s) => s.experience_id))]);
  type Exp = { id: string; slug: string; status: string; operator_id: string | null; actividad: string | null; data: { cardTitle?: string; title?: string } | null };
  const porId = new Map(((exps ?? []) as Exp[]).map((e) => [e.id, e]));

  const candidatas = vivas
    .map((s) => ({ s, e: porId.get(s.experience_id), dias: diasEntre(hoy, diaCdmx(s.starts_at)) }))
    .filter((x): x is { s: Slot; e: Exp; dias: number } =>
      !!x.e && x.e.status === "published" && !!x.e.operator_id && (AVISOS_A_DIAS as readonly number[]).includes(x.dias));
  if (!candidatas.length) return [];

  const falta = await faltaParaSalirDe(
    candidatas.map(({ s, e }) => ({ operatorId: e.operator_id!, actividad: e.actividad, fecha: diaCdmx(s.starts_at) })),
  );
  const { data: ops } = await sb
    .from("operators")
    .select("id, name, email")
    .in("id", [...new Set(candidatas.map((c) => c.e.operator_id!))]);
  const op = new Map(((ops ?? []) as { id: string; name: string | null; email: string | null }[]).map((o) => [o.id, o]));

  const out: AvisoDeSalida[] = [];
  for (const { s, e, dias } of candidatas) {
    const faltan = falta.get(clave({ operatorId: e.operator_id!, actividad: e.actividad, fecha: diaCdmx(s.starts_at) }));
    if (!faltan?.length) continue;
    const o = op.get(e.operator_id!);
    out.push({
      operatorId: e.operator_id!,
      operadora: o?.name || "Operadora",
      email: o?.email ?? null,
      experiencia: (e.data?.cardTitle || e.data?.title || e.slug).trim(),
      salida: s.label ?? "",
      dias,
      faltan,
    });
  }
  return out;
}
