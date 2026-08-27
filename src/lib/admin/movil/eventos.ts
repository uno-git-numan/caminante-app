// Adaptador de la pestaña EVENTOS del panel en el teléfono.
//
// No inventa consultas: reusa las MISMAS que el escritorio —
//   · `fetchEventos()`            → la lista y su orden (publicadas primero)
//   · `fetchEventoDetalle(slug)`  → salidas con ocupación, precio, visibilidad,
//                                    encuesta por salida y catálogo de operadores
//   · `fetchSlotsForAdmin(slug)`  → el `ends_at` de cada salida (el detalle del
//                                    escritorio no lo expone y la hoja de editar
//                                    lo necesita: `ends_at` dispara la encuesta)
//   · `listaParaPublicar()`       → el CANDADO de publicar (deslinde + encuesta)
//   · `evaluarChecklist()`        → el semáforo «Comunicación lista» del formulario
// Si el teléfono y la computadora discreparan en una cifra, el bug sería
// imposible de explicar.
//
// Lo que el mockup traía y aquí NO va (no existe en la base): el conteo «16
// secciones» y sus estados escritos a mano, el «Nivel» de la experiencia, y los
// nombres de quienes apartan lugar en el diálogo de cancelar (ahí va el número
// real de personas, que sí tenemos).

import { fetchEventos, fetchEventoDetalle } from "@/lib/admin/queries";
import { formatFechaCorta } from "@/lib/admin/formato";
import { fetchSlotsForAdmin } from "@/lib/experiences/slots-admin";
import { deslindeListo, encuestaLista, listaParaPublicar } from "@/lib/experiences/flujo-venta";
import { evaluarChecklist } from "@/lib/kit/checklist";
import { draftFromBlocks } from "@/lib/experiences/page-v2";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";

const SITIO = "https://caminante.numanhub.com";

export type SalidaMovil = {
  id: string;
  label: string;
  fecha: string; // "12 jun 2026" — para leer
  /** "YYYY-MM-DD" para los <input type="date"> de la hoja de editar. */
  inicioInput: string;
  finInput: string; // "" = sin fecha de fin capturada
  capacity: number | null; // null = sin tope
  taken: number; // Σ num_people de reservas que apartan
  priceMxn: number | null; // null = usa el precio base de la experiencia
  enVenta: boolean; // status === 'open'
  pasada: boolean;
  privada: boolean;
  linkPrivado: string | null;
  encInvitadas: number;
  encRespondidas: number;
  encStars: number | null;
};

export type OperadorMovil = {
  id: string;
  nombre: string;
  email: string;
  comision: number | null; // null = por definir (bloquea el payout a propósito)
};

/** Un renglón del semáforo «Comunicación lista» (el mismo del formulario). */
export type SeccionMovil = {
  id: string;
  titulo: string;
  detalle: string;
  /** Vocabulario del entregable para <Life>: listo · revisar · falta insumo. */
  estado: "listo" | "revisar" | "falta insumo";
  /** Ancla de la sección del formulario que lo arregla (#s15, #s16…). */
  ancla: string;
  desbloquea: string;
};

export type CandadoMovil = {
  ok: boolean;
  faltaDeslinde: boolean;
  faltaEncuesta: boolean;
  /** Las razones textuales de flujo-venta.ts — se muestran tal cual. */
  faltantes: string[];
};

export type EventoMovil = {
  id: string;
  slug: string;
  nombre: string;
  publicada: boolean;
  operadorId: string | null;
  operadorNombre: string | null;
  operadorComision: number | null;
  precioBase: string | null;
  tiers: { label: string; amount: string }[];
  salidas: SalidaMovil[];
  candado: CandadoMovil;
  secciones: SeccionMovil[];
  seccionesOk: number;
};

export type EventosMovil = {
  eventos: EventoMovil[];
  operadores: OperadorMovil[];
};

const ESTADO: Record<string, SeccionMovil["estado"]> = {
  ok: "listo",
  parcial: "revisar",
  falta: "falta insumo",
};

// El formulario guarda las fechas como "YYYY-MM-DDT12:00:00Z" y las relee con
// slice(0,10). Aquí se hace igual para que el teléfono y el formulario nunca
// muevan un día una salida (convertir a zona horaria aquí sí lo movería).
const soloFecha = (iso: string | null | undefined): string => (iso || "").slice(0, 10);

export async function fetchEventosMovil(): Promise<EventosMovil> {
  const base = await fetchEventos(); // lista y orden del escritorio
  const sb = createSupabaseAdminClient();
  // El jsonb completo: lo necesitan el candado (flujo-venta) y el semáforo
  // (checklist). Ninguna de las dos es una cifra que ya calcule otra consulta.
  const { data: rows } = await sb.from("experiences").select("slug, data");
  const dataBySlug = new Map<string, Experience>(
    ((rows || []) as { slug: string; data: Experience | null }[])
      .filter((r) => !!r.data)
      .map((r) => [r.slug, r.data as Experience]),
  );

  const detalles = await Promise.all(
    base.map(async (e) => {
      const [det, slotsForm] = await Promise.all([
        fetchEventoDetalle(e.slug),
        fetchSlotsForAdmin(e.slug),
      ]);
      return { e, det, slotsForm };
    }),
  );

  const operadores: OperadorMovil[] = (detalles.find((d) => d.det)?.det?.operadores || []).map(
    (o) => ({ id: o.id, nombre: o.name, email: o.email, comision: o.commissionPct }),
  );

  const eventos: EventoMovil[] = [];
  for (const { e, det, slotsForm } of detalles) {
    if (!det) continue; // la experiencia se borró entre una consulta y otra
    const exp = dataBySlug.get(e.slug) ?? null;
    const finPorSlot = new Map(slotsForm.map((s) => [s.id, s.endsAt]));

    const salidas: SalidaMovil[] = det.slots
      .filter((s) => s.status !== "cancelled") // canceladas: fuera de la operación diaria
      .map((s) => ({
        id: s.id,
        label: s.label || formatFechaCorta(s.startsAt),
        fecha: formatFechaCorta(s.startsAt),
        inicioInput: soloFecha(s.startsAt),
        finInput: soloFecha(finPorSlot.get(s.id) ?? null),
        capacity: s.capacity,
        taken: s.taken,
        priceMxn: s.priceMxn,
        enVenta: s.status === "open",
        pasada: s.pasada,
        privada: s.visibility === "private",
        linkPrivado:
          s.visibility === "private" && s.accessToken
            ? `${SITIO}/caminante/experiencias/${det.slug}?grupo=${s.accessToken}`
            : null,
        encInvitadas: s.encInvitadas,
        encRespondidas: s.encRespondidas,
        encStars: s.encStars,
      }));

    const flujo = listaParaPublicar(exp);
    const opActual = det.operadores.find((o) => o.id === det.operatorId) || null;

    // El semáforo del formulario, calculado sobre lo GUARDADO. Las guías salen
    // del borrador v2 igual que en ExperienceForm (título = nombre, primer
    // párrafo = su saber); las salidas, de las abiertas y públicas.
    const draft = exp ? draftFromBlocks(exp.page, exp) : null;
    const items = evaluarChecklist({
      photoBank: exp?.photoBank,
      ficha: exp?.ficha,
      registration: exp?.registration,
      feedback: exp?.feedback,
      guias: (draft?.guides || []).map((g) => ({
        name: g.title,
        bio: (g.paragraphs || []).find((x) => x && x.trim()),
      })),
      salidas: slotsForm
        .filter((s) => s.status === "open" && s.visibility === "public")
        .map((s) => ({ date: s.startsAt })),
    });

    eventos.push({
      id: det.id,
      slug: det.slug,
      nombre: det.nombre,
      publicada: det.status === "published",
      operadorId: det.operatorId,
      operadorNombre: opActual?.name ?? e.operadorNombre,
      operadorComision: opActual?.commissionPct ?? null,
      precioBase: det.precioBase,
      tiers: exp?.priceTiers ?? [],
      salidas,
      candado: {
        ok: flujo.ok,
        faltaDeslinde: !deslindeListo(exp).ok,
        faltaEncuesta: !encuestaLista(exp).ok,
        faltantes: flujo.faltantes,
      },
      secciones: items.map((i) => ({
        id: i.id,
        titulo: i.titulo,
        detalle: i.detalle,
        estado: ESTADO[i.estado],
        ancla: i.ancla,
        desbloquea: i.desbloquea,
      })),
      seccionesOk: items.filter((i) => i.estado === "ok").length,
    });
  }

  return { eventos, operadores };
}
