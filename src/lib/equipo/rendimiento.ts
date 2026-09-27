import "server-only";

// RENDIMIENTO DEL EQUIPO (F3) — lo que mueve cada quien, mes a mes.
//
// Sólo lo ve uno@numanhub.com (la casa entera NO: es la nómina de la gente).
// Una operadora ve lo de SU equipo sin comisiones: lo que le paga a cada quien
// lo arregla ella; numan no lo calcula.
//
// Todo se DERIVA: del libro de atribuciones (0071), de `payments` (con su
// `vendedor_id` congelado), de las tarjetas del CRM y de las encuestas. No
// hay una tabla de rendimiento que alguien tenga que mantener. Lo que no
// tiene dato sale `null` y la pantalla lo dice; nunca un cero que afirme.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { leerLibro } from "@/lib/equipo/atribucion";
import { carteraDe, aQuienPaso, type FilaLibro } from "@/lib/equipo/atribucion-reglas";
import { fetchOperadorasPlataforma } from "@/lib/plataforma/operadoras";
import { caidasPorMotivo, claveMes, comisionCaminante, comisionNuman, mesesDesde, npsDe, type EtapaOperadora, type LineaCuenta, type Mes, type PagoParaComision } from "@/lib/equipo/comisiones";


export type FilaNumanDatos = {
  tomadas: number;
  etapas: Record<EtapaOperadora, number>;
  /** Días promedio de tomar la solicitud a la firma, de las firmadas este mes; null si ninguna. */
  dias: number | null;
  genera: number;
  dev: number;
  /** No hay registro de pagos al equipo todavía: null, y se dice. */
  pag: null;
  ops: [string, string, string][];
  cuenta: LineaCuenta[];
  baja: string | null;
  a: string | null;
};

export type FilaCamDatos = {
  tarjetas: number;
  /** Sin historial de etapas por tarjeta no se sabe cuánto tardó en contestar: null. */
  rapidas: number | null;
  pagadas: number;
  lugares: number;
  monto: number;
  nps: number | null;
  caidas: [string, number][];
  /** No existe el dato de qué embajador dio de alta quién: null. */
  emb: number | null;
  dev: number;
  porDev: number;
  sinFecha: number;
  pag: null;
  cuenta: LineaCuenta[];
  pubs: number | null;
  baja: string | null;
  a: string | null;
};

export type RendimientoMes = {
  mes: Mes;
  numan: Record<string, FilaNumanDatos>;
  cam: Record<string, FilaCamDatos>;
};

export type Rendimiento = {
  meses: Mes[];
  porMes: RendimientoMes[];
  nombres: Record<string, string>;
};

const ETAPA_VACIA = (): Record<EtapaOperadora, number> => ({ llamada: 0, expediente: 0, firmar: 0, armando: 0, vendiendo: 0 });

/** La etapa de una operadora, en las cinco palabras de la lámina. */
function etapaCorta(o: { etapa: string; convenioFirmadoAt: string | null; experienciasPublicadas: number }): EtapaOperadora {
  if (o.etapa === "vendiendo") return "vendiendo";
  if (o.etapa === "llego" || o.etapa === "en_llamada") return "llamada";
  if (o.etapa === "expediente") return "expediente";
  if (!o.convenioFirmadoAt) return "firmar";
  return "armando";
}

const ETIQUETA: Record<EtapaOperadora, string> = { llamada: "Llamada", expediente: "Expediente", firmar: "Por firmar", armando: "Armando", vendiendo: "Vendiendo" };

export async function fetchRendimiento(opts: { soloOperadora?: string } = {}): Promise<Rendimiento> {
  const sb = createSupabaseAdminClient();
  const [libro, { data: staff }, { data: rel }, { data: pagosRaw }, operadoras] = await Promise.all([
    leerLibro(sb),
    sb.from("staff").select("id, nombre, activo, alta_at, baja_at"),
    sb.from("staff_operadoras").select("staff_id, operator_id"),
    sb
      .from("payments")
      .select("id, paid_at, amount_mxn, refunded_mxn, platform_fee_mxn, vendedor_id, status, reservations(operator_id, slot_id, num_people, experience_id, experience_slots(starts_at, label), experiences(slug), operators(name))")
      .in("status", ["paid", "refunded"])
      .not("paid_at", "is", null),
    opts.soloOperadora ? Promise.resolve([]) : fetchOperadorasPlataforma(),
  ]);
  type Fila = { id: string; nombre: string; activo: boolean; alta_at: string; baja_at: string | null };
  const personas = ((staff ?? []) as Fila[]).filter((f) => {
    if (!opts.soloOperadora) return true;
    return ((rel ?? []) as { staff_id: string; operator_id: string }[]).some((r) => r.staff_id === f.id && r.operator_id === opts.soloOperadora);
  });
  const nombres: Record<string, string> = Object.fromEntries(personas.map((p) => [p.id, p.nombre]));

  type PagoRaw = {
    id: string; paid_at: string; amount_mxn: number; refunded_mxn: number | null; platform_fee_mxn: number | null; vendedor_id: string | null;
    reservations: { operator_id: string | null; slot_id: string | null; num_people: number | null; experience_id: string | null; experience_slots: { starts_at: string; label: string | null } | null; experiences: { slug: string | null } | null; operators: { name: string | null } | null } | null;
  };
  const pagos: PagoParaComision[] = ((pagosRaw ?? []) as unknown as PagoRaw[]).map((p) => ({
    id: p.id,
    paid_at: p.paid_at,
    amount_mxn: Number(p.amount_mxn) || 0,
    refunded_mxn: Number(p.refunded_mxn) || 0,
    platform_fee_mxn: p.platform_fee_mxn == null ? null : Number(p.platform_fee_mxn),
    operator_id: p.reservations?.operator_id ?? null,
    vendedor_id: p.vendedor_id,
    slot_starts_at: p.reservations?.experience_slots?.starts_at ?? null,
    num_people: Number(p.reservations?.num_people) || 1,
    etiqueta: p.reservations?.operators?.name ?? p.reservations?.experiences?.slug ?? "venta",
  }));

  // Los meses: desde el primer asiento del equipo (o del libro) hasta hoy.
  const primero = [...personas.map((p) => p.alta_at), ...libro.map((f) => f.desde)].sort()[0] ?? null;
  const meses = mesesDesde(primero ? claveMes(primero) : null);

  // Nombres de lo que hay en el libro (solicitudes y tarjetas), una consulta por tipo.
  const idsDe = (o: FilaLibro["objeto"]) => [...new Set(libro.filter((f) => f.objeto === o).map((f) => f.objeto_id))];
  const [{ data: sols }, { data: cards }, { data: fb }] = await Promise.all([
    idsDe("solicitud").length ? sb.from("operator_applications").select("id, nombre_operadora, operator_id").in("id", idsDe("solicitud")) : Promise.resolve({ data: [] }),
    idsDe("tarjeta").length ? sb.from("crm_cards").select("id, stage, motivo_caida, reservation_id, created_at").in("id", idsDe("tarjeta")) : Promise.resolve({ data: [] }),
    sb.from("experience_feedback").select("reservation_id, nps").eq("status", "submitted"),
  ]);
  const tarjeta = new Map(((cards ?? []) as { id: string; stage: string; motivo_caida: string | null; reservation_id: string | null; created_at: string }[]).map((c) => [c.id, c]));
  const npsPorReserva = new Map(((fb ?? []) as { reservation_id: string; nps: number | null }[]).map((f) => [f.reservation_id, f.nps]));
  const operadoraDeSolicitud = new Map(((sols ?? []) as { id: string; operator_id: string | null }[]).map((s) => [s.id, s.operator_id]));
  const opPorId = new Map(operadoras.map((o) => [o.id, o]));

  const porMes: RendimientoMes[] = meses.map((mes) => {
    const numanCom = comisionNuman(pagos, libro, mes);
    const camCom = comisionCaminante(pagos, mes);
    const numan: Record<string, FilaNumanDatos> = {};
    const cam: Record<string, FilaCamDatos> = {};
    for (const p of personas) {
      const enMes = p.alta_at < mes.hasta && (!p.baja_at || p.baja_at >= mes.desde);
      if (!enMes) continue;
      const cartera = carteraDe(libro, p.id);
      const filasMes = libro.filter((f) => f.staff_id === p.id && f.desde >= mes.desde && f.desde < mes.hasta);
      const baja = p.baja_at && p.baja_at >= mes.desde && p.baja_at < mes.hasta ? p.baja_at : null;
      const a = baja ? aQuienPaso(libro, p.id).map((id) => nombres[id] ?? "alguien del equipo").join(" y ") || null : null;

      // ── numan: sus operadoras ──
      if (!opts.soloOperadora) {
        const ops = cartera.operadora.map((id) => opPorId.get(id)).filter((o): o is NonNullable<typeof o> => !!o);
        const enSolicitud = cartera.solicitud.map((id) => opPorId.get(operadoraDeSolicitud.get(id) ?? "")).filter((o): o is NonNullable<typeof o> => !!o);
        const todas = [...ops, ...enSolicitud];
        if (todas.length || filasMes.some((f) => f.objeto === "solicitud" || f.objeto === "operadora") || numanCom.has(p.id) || cartera.solicitud.length) {
          const etapas = ETAPA_VACIA();
          for (const o of todas) etapas[etapaCorta(o)]++;
          for (let i = 0; i < cartera.solicitud.length - enSolicitud.length; i++) etapas.llamada++;
          // Días hasta la firma: de las que firmaron ESTE mes, desde que se tomó su solicitud.
          const firmadas = ops.filter((o) => o.convenioFirmadoAt && o.convenioFirmadoAt >= mes.desde && o.convenioFirmadoAt < mes.hasta);
          const dias = firmadas.length
            ? Math.round(
                firmadas.reduce((acc, o) => {
                  const desde = libro.filter((f) => f.objeto === "operadora" && f.objeto_id === o.id).map((f) => f.desde).sort()[0];
                  return acc + (desde ? (new Date(o.convenioFirmadoAt!).getTime() - new Date(desde).getTime()) / 86_400_000 : 0);
                }, 0) / firmadas.length,
              )
            : null;
          const c = numanCom.get(p.id);
          numan[p.id] = {
            tomadas: filasMes.filter((f) => f.objeto === "solicitud").length,
            etapas,
            dias,
            genera: c?.genera ?? 0,
            dev: c?.dev ?? 0,
            pag: null,
            ops: todas.map((o) => {
              const e = etapaCorta(o);
              const det =
                e === "vendiendo" ? `${o.experienciasPublicadas} publicada${o.experienciasPublicadas === 1 ? "" : "s"}` :
                e === "firmar" ? "Convenio sin firmar" :
                e === "armando" ? `Firmó el ${o.convenioFirmadoAt!.slice(0, 10)} · ${o.experienciasBorrador} en borrador` :
                e === "expediente" ? `${o.cumplidos} de ${o.candados.length} candados` : "Solicitud en curso";
              return [o.nombre, ETIQUETA[e], det] as [string, string, string];
            }),
            cuenta: c?.cuenta ?? [],
            baja,
            a,
          };
        }
      }

      // ── Caminante / la operadora: sus tarjetas y sus lugares ──
      const mias = [...cartera.tarjeta, ...libro.filter((f) => f.staff_id === p.id && f.objeto === "tarjeta" && f.hasta !== null).map((f) => f.objeto_id)]
        .map((id) => tarjeta.get(id))
        .filter((t): t is NonNullable<typeof t> => !!t && t.created_at >= mes.desde && t.created_at < mes.hasta);
      const c = camCom.get(p.id);
      if (mias.length || filasMes.some((f) => f.objeto === "tarjeta" || f.objeto === "grupo") || c) {
        const notas = mias.map((t) => (t.reservation_id ? npsPorReserva.get(t.reservation_id) : undefined)).filter((n) => n !== undefined);
        cam[p.id] = {
          tarjetas: filasMes.filter((f) => f.objeto === "tarjeta").length,
          rapidas: null,
          pagadas: mias.filter((t) => ["pagado", "preparando", "viajo"].includes(t.stage)).length,
          lugares: c?.lugares ?? 0,
          monto: c?.monto ?? 0,
          nps: npsDe(notas),
          caidas: caidasPorMotivo(mias.filter((t) => t.stage === "caido").map((t) => t.motivo_caida)),
          emb: null,
          dev: c?.dev ?? 0,
          porDev: c?.porDev ?? 0,
          sinFecha: c?.sinFecha ?? 0,
          pag: null,
          cuenta: c?.cuenta ?? [],
          pubs: null,
          baja,
          a,
        };
      }
    }
    return { mes, numan, cam };
  });

  return { meses, porMes, nombres };
}
