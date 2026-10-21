// EL TABLERO DEL CRM — quién está preguntando y todavía no paga.
//
// LA UNIDAD ES PERSONA × SALIDA, no persona. Alguien puede estar interesado en
// Barrancas y ser ya viajero de Hongos: son dos cosas distintas y no se pisan.
//
// Las tres primeras etapas se mueven a mano. Las tres últimas NO: Pagado cae
// con el pago (Stripe o registrado a mano), Preparando cuando la salida está a
// dos semanas, y Viajó cuando pasa la fecha (lib/comunidad/automatico.ts).
// Nadie puede declarar pagado a quien no pagó — el dinero lo dice el banco, no
// un arrastre.
//
// Cada tarjeta trae lo que su panel necesita (lámina «Comunidad», etapas 01 a
// 06): la solicitud que la trajo, su salida —con la liga privada si la tiene—,
// cuánto falta por pagar, el grupo de WhatsApp, su llamada, la ventana de
// WhatsApp y la encuesta. Se arma en UNA pasada con consultas acotadas a las
// tarjetas del alcance; el panel no vuelve al servidor para leer.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { experienceTitle, operadoraQueMiro } from "@/lib/admin/queries";
import { cdmxDay, formatDiaMes, iniciales } from "@/lib/admin/formato";
import type { Experience } from "@/lib/experiences/types";
import type { EtapaId } from "@/lib/comunidad/etapas";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://caminante.numanhub.com";
/** Reservas que apartan lugar (mismo criterio que availability.ts). */
const APARTAN = new Set(["confirmed", "paid", "partially_paid", "completed"]);

export type Tarjeta = {
  id: string;
  stage: EtapaId;
  persona: string;
  iniciales: string;
  experiencia: string;
  salida: string | null;
  personas: number;
  origen: string;
  /** Días desde que entró a la etapa actual. */
  diasQuieta: number;
  /** Más de una semana sin moverse: hay que escribirle. */
  fria: boolean;
  motivoCaida: string | null;
  telefono: string | null;
  email: string | null;
  /** La operadora dueña (0070): decide quién la puede llevar. */
  operatorId: string | null;

  // ── lo que el panel necesita ──
  contactId: string;
  experienceId: string;
  slug: string;
  /** «25 ago»: cuándo entró al tablero. */
  llegoEl: string;
  /** La solicitud de fecha que la trajo, si vino de ahí. */
  solicitud: { fecha: string | null; nota: string | null; privado: boolean } | null;
  /** Su salida, cuando ya la tiene. La liga es la pública o la privada (?grupo=). */
  salidaInfo: {
    id: string;
    label: string;
    inicio: string | null;
    fin: string | null;
    privada: boolean;
    link: string;
    puntoEncuentro: string | null;
  } | null;
  grupoUrl: string | null;
  /** Lo que ha apartado y pagado ESTA persona en ESTA salida. Null sin reserva. */
  pago: { lugares: number; suman: number; pagado: number; falta: number } | null;
  reservationId: string | null;
  /** Para completar el pago: /reservar/<slug>(?grupo=token). */
  pagarUrl: string;
  deslindeFirmado: boolean;
  encuesta: { estado: "sin" | "invitada" | "contesto"; stars: number | null; nps: number | null; publicable: boolean };
  /** La próxima llamada agendada (o la última, si ya pasó). */
  llamada: { url: string; startsAt: string; pasada: boolean } | null;
  /** WhatsApp: si escribió en las últimas 24 h, se le puede redactar libre. */
  waVentana: { abierta: boolean; cierraEn: string | null };
};

export type Cita = {
  id: string;
  cardId: string;
  dow: string; // «jue»
  dia: string; // «4»
  mes: string; // «sep»
  hora: string; // «6:00 p.m.»
  persona: string;
  personas: number;
  servicio: string; // «Zoom» · «Meet» · «Video»
};

export type Tablero = { tarjetas: Tarjeta[]; caidas: Tarjeta[]; total: number; agenda: Cita[] };

const ORIGEN: Record<string, string> = {
  solicitud: "Solicitud de grupo",
  whatsapp: "Llegó por WhatsApp",
  embajador: "La trajo un embajador",
  manual: "Alta a mano",
};

const TZ = "America/Mexico_City";

function servicioDe(url: string): string {
  if (/zoom\.us/i.test(url)) return "Zoom";
  if (/meet\.google/i.test(url)) return "Meet";
  if (/teams\.microsoft/i.test(url)) return "Teams";
  return "Video";
}

function horasRestantes(desde: string, ahora: number): string | null {
  const fin = new Date(desde).getTime() + 24 * 3600 * 1000;
  const h = Math.floor((fin - ahora) / 3600000);
  if (h <= 0) return null;
  return h >= 1 ? `Cierra en ${h} h` : "Cierra en menos de una hora";
}

export async function fetchTablero(): Promise<Tablero> {
  const sb = createSupabaseAdminClient();
  const operatorId = await operadoraQueMiro();

  const [{ data: cards }, { data: exps }, { data: slots }, { data: contacts }] = await Promise.all([
    sb.from("crm_cards").select("*").order("stage_changed_at", { ascending: true }),
    sb.from("experiences").select("id, slug, data, operator_id"),
    sb
      .from("experience_slots")
      .select("id, label, starts_at, ends_at, visibility, access_token, punto_encuentro"),
    sb.from("contacts").select("id, full_name, email, phone"),
  ]);

  type Exp = { id: string; slug: string; data: Partial<Experience> | null; operator_id: string | null };
  const expPorId = new Map(((exps ?? []) as Exp[]).map((e) => [e.id, e]));
  // ALCANCE: el operador ve SUS tarjetas. Se poda antes de contar nada.
  const mias = new Set(
    ((exps ?? []) as Exp[]).filter((e) => !operatorId || e.operator_id === operatorId).map((e) => e.id),
  );
  type SlotRow = {
    id: string; label: string | null; starts_at: string | null; ends_at: string | null;
    visibility: string | null; access_token: string | null; punto_encuentro: string | null;
  };
  const slotPorId = new Map(((slots ?? []) as SlotRow[]).map((s) => [s.id, s]));
  const persona = new Map(
    ((contacts ?? []) as { id: string; full_name: string | null; email: string | null; phone: string | null }[])
      .map((c) => [c.id, c]),
  );

  const filas = ((cards ?? []) as Record<string, unknown>[]).filter((c) => mias.has(String(c.experience_id)));
  const cardIds = filas.map((c) => String(c.id));
  const contactIds = [...new Set(filas.map((c) => String(c.contact_id)))];
  const requestIds = filas.map((c) => c.slot_request_id).filter(Boolean) as string[];

  // Lo demás, acotado a estas tarjetas. Vacío → consultas que no se hacen.
  const [{ data: reqs }, { data: resvs }, { data: calls }, { data: convs }, { data: fbs }] = await Promise.all([
    requestIds.length
      ? sb.from("slot_requests").select("id, desired_date, nota, group_type, created_slot_id").in("id", requestIds)
      : Promise.resolve({ data: [] as unknown[] }),
    contactIds.length
      ? sb
          .from("reservations")
          .select("id, contact_id, experience_id, slot_id, num_people, total_amount_mxn, status")
          .in("contact_id", contactIds)
      : Promise.resolve({ data: [] as unknown[] }),
    cardIds.length
      ? sb.from("crm_calls").select("id, card_id, url, starts_at").in("card_id", cardIds).order("starts_at")
      : Promise.resolve({ data: [] as unknown[] }),
    contactIds.length
      ? sb.from("conversations").select("contact_id, last_inbound_at").in("contact_id", contactIds)
      : Promise.resolve({ data: [] as unknown[] }),
    contactIds.length
      ? sb
          .from("experience_feedback")
          .select("contact_id, experience_id, status, overall_stars, nps, testimonial_consent, publish_status")
          .in("contact_id", contactIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  type Resv = {
    id: string; contact_id: string; experience_id: string; slot_id: string | null;
    num_people: number | null; total_amount_mxn: number | null; status: string;
  };
  const reservas = ((resvs ?? []) as Resv[]).filter((r) => APARTAN.has(r.status));
  const resvIds = reservas.map((r) => r.id);
  const [{ data: pays }, { data: regs }] = await Promise.all([
    resvIds.length
      ? sb.from("payments").select("reservation_id, amount_mxn, status").in("reservation_id", resvIds)
      : Promise.resolve({ data: [] as unknown[] }),
    resvIds.length
      ? sb.from("registrations").select("reservation_id, signed_at").in("reservation_id", resvIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);
  const pagadoPorResv = new Map<string, number>();
  for (const p of (pays ?? []) as { reservation_id: string; amount_mxn: number | null; status: string }[]) {
    if (p.status !== "paid") continue;
    pagadoPorResv.set(p.reservation_id, (pagadoPorResv.get(p.reservation_id) ?? 0) + Number(p.amount_mxn || 0));
  }
  const firmadas = new Set(
    ((regs ?? []) as { reservation_id: string; signed_at: string | null }[])
      .filter((g) => g.signed_at)
      .map((g) => g.reservation_id),
  );
  type Req = { id: string; desired_date: string | null; nota: string | null; group_type: string; created_slot_id: string | null };
  const reqPorId = new Map(((reqs ?? []) as Req[]).map((r) => [r.id, r]));
  type Call = { id: string; card_id: string; url: string; starts_at: string };
  const llamadasPorCard = new Map<string, Call[]>();
  for (const c of (calls ?? []) as Call[]) {
    llamadasPorCard.set(c.card_id, [...(llamadasPorCard.get(c.card_id) ?? []), c]);
  }
  const inbound = new Map(
    ((convs ?? []) as { contact_id: string; last_inbound_at: string | null }[]).map((c) => [c.contact_id, c.last_inbound_at]),
  );
  type Fb = {
    contact_id: string; experience_id: string; status: string; overall_stars: number | null;
    nps: number | null; testimonial_consent: boolean | null; publish_status: string | null;
  };
  const fbPorClave = new Map<string, Fb>();
  for (const f of (fbs ?? []) as Fb[]) {
    const k = `${f.contact_id}|${f.experience_id}`;
    // La contestada gana sobre la sólo invitada.
    if (!fbPorClave.has(k) || f.status === "submitted") fbPorClave.set(k, f);
  }

  const ahora = Date.now();
  const todas: Tarjeta[] = filas.map((c) => {
    const p = persona.get(String(c.contact_id));
    const nombre = (p?.full_name || p?.email || "—").trim();
    const dias = Math.floor((ahora - new Date(String(c.stage_changed_at)).getTime()) / 86400000);
    const exp = expPorId.get(String(c.experience_id));
    const slug = exp?.slug ?? "";
    const req = c.slot_request_id ? reqPorId.get(String(c.slot_request_id)) ?? null : null;
    // La salida: la de la tarjeta, o la que nació de su solicitud.
    const slotId = (c.slot_id as string | null) ?? req?.created_slot_id ?? null;
    const slot = slotId ? slotPorId.get(slotId) ?? null : null;
    const privada = slot?.visibility === "private" && !!slot.access_token;
    const grupoQ = privada ? `?grupo=${slot!.access_token}` : "";
    const link = slot ? `${SITE}/caminante/experiencias/${slug}${grupoQ}` : "";

    // Su reserva en esta salida (o en la experiencia, si la tarjeta no tiene salida).
    const suyas = reservas.filter(
      (r) => r.contact_id === String(c.contact_id) && r.experience_id === String(c.experience_id) && (!slotId || r.slot_id === slotId),
    );
    const reserva = suyas[0] ?? null;
    const pago = suyas.length
      ? (() => {
          const lugares = suyas.reduce((n, r) => n + (r.num_people || 1), 0);
          const suman = suyas.reduce((n, r) => n + Number(r.total_amount_mxn || 0), 0);
          const pagado = suyas.reduce((n, r) => n + (pagadoPorResv.get(r.id) ?? 0), 0);
          return { lugares, suman, pagado, falta: Math.max(0, suman - pagado) };
        })()
      : null;

    const llamadas = llamadasPorCard.get(String(c.id)) ?? [];
    const proxima = llamadas.find((l) => new Date(l.starts_at).getTime() >= ahora) ?? llamadas[llamadas.length - 1] ?? null;
    const ultimaEntrada = inbound.get(String(c.contact_id)) ?? null;
    const cierraEn = ultimaEntrada ? horasRestantes(ultimaEntrada, ahora) : null;
    const fb = fbPorClave.get(`${String(c.contact_id)}|${String(c.experience_id)}`) ?? null;

    return {
      id: String(c.id),
      stage: String(c.stage) as EtapaId,
      persona: nombre,
      iniciales: iniciales(nombre),
      experiencia: exp ? experienceTitle(exp.data, exp.slug) : "—",
      salida: slot?.label ?? null,
      personas: Number(c.num_people) || 1,
      origen: ORIGEN[String(c.origen)] ?? String(c.origen),
      diasQuieta: Math.max(0, dias),
      // Siete días sin moverse. No es un número mágico: es una semana sin
      // contestarle a alguien que preguntó.
      fria: dias >= 7 && !["viajo", "pagado", "preparando"].includes(String(c.stage)),
      motivoCaida: (c.motivo_caida as string) ?? null,
      telefono: p?.phone ?? null,
      email: p?.email ?? null,
      operatorId: (c.operator_id as string | null) ?? null,

      contactId: String(c.contact_id),
      experienceId: String(c.experience_id),
      slug,
      llegoEl: formatDiaMes(String(c.created_at)),
      solicitud: req ? { fecha: req.desired_date, nota: req.nota, privado: req.group_type !== "open" } : null,
      salidaInfo: slot
        ? {
            id: slot.id,
            label: slot.label || formatDiaMes(slot.starts_at),
            inicio: slot.starts_at,
            fin: slot.ends_at,
            privada,
            link,
            puntoEncuentro: slot.punto_encuentro,
          }
        : null,
      grupoUrl: (c.grupo_whatsapp_url as string | null) ?? null,
      pago,
      reservationId: reserva?.id ?? (c.reservation_id as string | null) ?? null,
      pagarUrl: `${SITE}/caminante/reservar/${slug}${grupoQ}`,
      deslindeFirmado: suyas.some((r) => firmadas.has(r.id)),
      encuesta: fb
        ? {
            estado: fb.status === "submitted" ? "contesto" : "invitada",
            stars: fb.overall_stars != null ? Number(fb.overall_stars) : null,
            nps: fb.nps != null ? Number(fb.nps) : null,
            publicable: !!fb.testimonial_consent && fb.publish_status === "approved",
          }
        : { estado: "sin", stars: null, nps: null, publicable: false },
      llamada: proxima
        ? { url: proxima.url, startsAt: proxima.starts_at, pasada: new Date(proxima.starts_at).getTime() < ahora }
        : null,
      waVentana: { abierta: !!cierraEn, cierraEn },
    };
  });

  // Tu agenda: las llamadas que vienen, de todas las tarjetas del alcance.
  const porId = new Map(todas.map((t) => [t.id, t]));
  const agenda: Cita[] = ((calls ?? []) as Call[])
    .filter((c) => new Date(c.starts_at).getTime() >= ahora - 3600000 && porId.has(c.card_id))
    .map((c) => {
      const d = new Date(c.starts_at);
      const t = porId.get(c.card_id)!;
      const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-MX", { timeZone: TZ, ...o }).format(d);
      return {
        id: c.id,
        cardId: c.card_id,
        dow: f({ weekday: "short" }).replace(".", ""),
        dia: f({ day: "numeric" }),
        mes: f({ month: "short" }).replace(".", ""),
        hora: f({ hour: "numeric", minute: "2-digit", hour12: true }),
        persona: t.persona,
        personas: t.personas,
        servicio: servicioDe(c.url),
      };
    });

  return {
    tarjetas: todas.filter((t) => t.stage !== "caido"),
    caidas: todas.filter((t) => t.stage === "caido"),
    total: todas.length,
    agenda,
  };
}

/** Para las acciones: el día (CDMX) de un instante. */
export const diaDe = (iso: string): string => cdmxDay(iso);
