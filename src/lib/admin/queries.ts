// Capa de lectura del dashboard de admin. TODAS las agregaciones viven aquí
// (fuente única de las fórmulas de KPI). Solo se usa detrás del gate de
// /caminante/admin/* — lecturas con service-role (bypassa RLS a propósito).
//
// Escala: las tablas son chicas (<100 filas) → se trae todo y se agrega en JS.
// Si algo pasa de ~500 filas, mover esa agregación a una vista/RPC en Postgres.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HOLDING_STATUSES } from "@/lib/experiences/availability";
import type { Experience } from "@/lib/experiences/types";

// Zona horaria de negocio: cortes de mes y "próximas salidas" se calculan aquí.
const TZ = "America/Mexico_City";

// ── Helpers de fecha/dinero ──────────────────────────────────────────────

// "YYYY-MM-DD" del instante dado EN CDMX (en-CA da ISO-like).
export function cdmxDay(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function formatMXN(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatFechaCorta(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-MX", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDiaMes(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", { timeZone: TZ, day: "numeric", month: "short" });
}

const METODOS: Record<string, string> = {
  stripe: "Stripe",
  transfer: "Transferencia",
  cash: "Efectivo",
};
export function metodoLabel(m: string | null): string {
  return m ? METODOS[m] || m : "—";
}

// Nombre legible de una experiencia desde su data jsonb.
export function experienceTitle(data: Partial<Experience> | null, slug: string): string {
  if (!data) return slug;
  const full = [data.title, data.titleAccent].filter(Boolean).join(" ").trim();
  return data.cardTitle || full || data.subtitle || slug;
}

export function iniciales(nombre: string): string {
  const parts = nombre.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

// ── Tipos del panorama ───────────────────────────────────────────────────

export type PagoLinea = { nombre: string; monto: number; metodo: string; fecha: string };
export type PersonaFirma = { nombre: string; firmado: boolean; fecha: string | null };
export type Deudor = { nombre: string; debe: number };

export type SlotDetail = {
  personas: PersonaFirma[]; // titulares de reservas que apartan lugar
  pagos: PagoLinea[];
  deudores: Deudor[]; // total_amount_mxn > pagado (targets en 0 no cuentan)
  cobrado: number;
  faltante: number;
};

export type UpcomingSlot = {
  slotId: string;
  experienceSlug: string;
  experienceNombre: string;
  experienceStatus: string; // published | draft
  label: string;
  startsAt: string | null;
  slotStatus: string; // open | closed | cancelled
  capacity: number | null; // null = sin tope
  taken: number;
  available: number | null;
  ingresos: number;
  deslindes: number; // registrations (titulares que firmaron)
  titulares: number; // reservas HOLDING (firmas esperadas)
  detail: SlotDetail;
};

export type OverviewKpis = {
  ingresosTotal: number;
  ingresosMes: number;
  mesLabel: string;
  ingresosPorExperiencia: { nombre: string; monto: number }[];
  ultimosPagos: PagoLinea[];
  sparkMeses: number[]; // ingresos de los últimos 7 meses (viejo → actual)
  reservasPorEstado: Record<string, number>;
  personasApuntadas: number; // HISTÓRICO: Σ num_people de reservas que apartan (todas las fechas)
  personasPorOperar: number; // Σ num_people PAGADAS de salidas FUTURAS (la gente que hay que operar)
  deslindesFirmados: number;
  satisfaccion: {
    avgStars: number | null;
    avgNps: number | null;
    respondidas: number;
    invitadas: number;
    distEstrellas: { etiqueta: string; n: number }[];
    ultimas: { texto: string; stars: number | null; fecha: string }[];
  };
};

export type AdminOverview = {
  kpis: OverviewKpis;
  proximas: UpcomingSlot[];
  pasadas: UpcomingSlot[]; // salidas ya ocurridas (más reciente primero)
};

// ── Filas crudas (privadas) ──────────────────────────────────────────────

type ExpRow = { id: string; slug: string; status: string; data: Partial<Experience> | null };
type SlotRow = {
  id: string;
  experience_id: string;
  label: string | null;
  starts_at: string | null;
  capacity_total: number | null;
  status: string;
};
type ResvRow = {
  id: string;
  experience_id: string;
  slot_id: string | null;
  contact_id: string;
  num_people: number;
  total_amount_mxn: number;
  status: string;
};
type PayRow = {
  reservation_id: string;
  contact_id: string | null;
  amount_mxn: number;
  status: string;
  method: string | null;
  paid_at: string | null;
};
type RegRow = { reservation_id: string; contact_id: string; signed_at: string | null };
type FbRow = {
  status: string;
  overall_stars: number | null;
  nps: number | null;
  loved_text: string | null;
  submitted_at: string | null;
};
type ContactRow = { id: string; full_name: string | null; email: string };

// ── Panorama ─────────────────────────────────────────────────────────────

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const sb = createSupabaseAdminClient();
  const [exps, slots, resvs, pays, regs, fbs, contacts] = (await Promise.all([
    sb.from("experiences").select("id, slug, status, data"),
    sb
      .from("experience_slots")
      .select("id, experience_id, label, starts_at, capacity_total, status"),
    sb
      .from("reservations")
      .select("id, experience_id, slot_id, contact_id, num_people, total_amount_mxn, status"),
    sb.from("payments").select("reservation_id, contact_id, amount_mxn, status, method, paid_at"),
    sb.from("registrations").select("reservation_id, contact_id, signed_at"),
    sb.from("experience_feedback").select("status, overall_stars, nps, loved_text, submitted_at"),
    sb.from("contacts").select("id, full_name, email"),
  ]).then((rs) => rs.map((r) => (r.data || []) as unknown[]))) as [
    ExpRow[],
    SlotRow[],
    ResvRow[],
    PayRow[],
    RegRow[],
    FbRow[],
    ContactRow[],
  ];

  // Índices
  const expById = new Map(exps.map((e) => [e.id, e]));
  const resvById = new Map(resvs.map((r) => [r.id, r]));
  const nombreDe = new Map(contacts.map((c) => [c.id, c.full_name || c.email]));
  const regsByResv = new Map(regs.map((g) => [g.reservation_id, g]));

  // Pagos válidos (paid excluye refunded/pending por definición del filtro)
  const paidPays = pays
    .filter((p) => p.status === "paid")
    .sort((a, b) => (b.paid_at || "").localeCompare(a.paid_at || ""));

  const hoyMesCdmx = cdmxDay(new Date()).slice(0, 7);
  const ingresosTotal = paidPays.reduce((s, p) => s + Number(p.amount_mxn || 0), 0);
  const ingresosMes = paidPays
    .filter((p) => p.paid_at && cdmxDay(p.paid_at).slice(0, 7) === hoyMesCdmx)
    .reduce((s, p) => s + Number(p.amount_mxn || 0), 0);
  const mesLabel = new Date().toLocaleDateString("es-MX", {
    timeZone: TZ,
    month: "long",
    year: "numeric",
  });

  // Ingresos por experiencia (pago → reserva → experiencia)
  const porExp = new Map<string, number>();
  for (const p of paidPays) {
    const eid = resvById.get(p.reservation_id)?.experience_id;
    if (eid) porExp.set(eid, (porExp.get(eid) || 0) + Number(p.amount_mxn || 0));
  }
  const ingresosPorExperiencia = [...porExp.entries()]
    .map(([eid, monto]) => {
      const e = expById.get(eid);
      return { nombre: experienceTitle(e?.data ?? null, e?.slug || "?"), monto };
    })
    .sort((a, b) => b.monto - a.monto);

  // Últimos pagos (con nombre)
  const pagoLinea = (p: PayRow): PagoLinea => ({
    nombre:
      (p.contact_id && nombreDe.get(p.contact_id)) ||
      (resvById.get(p.reservation_id)?.contact_id
        ? nombreDe.get(resvById.get(p.reservation_id)!.contact_id) || "—"
        : "—"),
    monto: Number(p.amount_mxn || 0),
    metodo: metodoLabel(p.method),
    fecha: formatDiaMes(p.paid_at),
  });
  const ultimosPagos = paidPays.slice(0, 5).map(pagoLinea);

  // Spark: ingresos de los últimos 7 meses (viejo → actual), CDMX
  const now = new Date();
  const meses: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
    meses.push(cdmxDay(d).slice(0, 7));
  }
  const porMes = new Map<string, number>(meses.map((m) => [m, 0]));
  for (const p of paidPays) {
    if (!p.paid_at) continue;
    const m = cdmxDay(p.paid_at).slice(0, 7);
    if (porMes.has(m)) porMes.set(m, (porMes.get(m) || 0) + Number(p.amount_mxn || 0));
  }
  const sparkMeses = meses.map((m) => porMes.get(m) || 0);

  // Reservas por estado + personas en holding (histórico) + por operar (pagadas, futuras)
  const reservasPorEstado: Record<string, number> = {};
  let personasApuntadas = 0;
  let personasPorOperar = 0;
  const nowIso = new Date().toISOString();
  const slotStart = new Map(slots.map((s) => [s.id, s.starts_at || ""]));
  const PAGADAS = ["paid", "partially_paid"];
  for (const r of resvs) {
    reservasPorEstado[r.status] = (reservasPorEstado[r.status] || 0) + 1;
    if (HOLDING_STATUSES.includes(r.status)) personasApuntadas += r.num_people || 0;
    // por operar = pagó y su salida aún no pasa (sin slot no se puede fechar → fuera)
    if (
      PAGADAS.includes(r.status) &&
      r.slot_id &&
      (slotStart.get(r.slot_id) || "") >= nowIso
    ) {
      personasPorOperar += r.num_people || 0;
    }
  }

  // Satisfacción
  const submitted = fbs
    .filter((f) => f.status === "submitted")
    .sort((a, b) => (b.submitted_at || "").localeCompare(a.submitted_at || ""));
  const stars = submitted.map((f) => f.overall_stars).filter((v): v is number => v != null);
  const npss = submitted.map((f) => f.nps).filter((v): v is number => v != null);
  const avg = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((a, b) => a + Number(b), 0) / xs.length) * 10) / 10 : null;
  const bucket = (lo: number, hi: number) => stars.filter((s) => s >= lo && s < hi).length;
  const distEstrellas = [
    { etiqueta: "5 estrellas", n: bucket(4.75, 5.01) },
    { etiqueta: "4 estrellas", n: bucket(3.75, 4.75) },
    { etiqueta: "3 estrellas", n: bucket(2.75, 3.75) },
    { etiqueta: "2 o menos", n: bucket(0, 2.75) },
  ];
  const ultimas = submitted
    .filter((f) => (f.loved_text || "").trim())
    .slice(0, 4)
    .map((f) => ({
      texto: `“${(f.loved_text || "").trim()}”`,
      stars: f.overall_stars,
      fecha: formatDiaMes(f.submitted_at),
    }));

  // Agregados POR SALIDA
  const ingresosPorSlot = new Map<string, number>();
  const pagosPorSlot = new Map<string, PagoLinea[]>();
  for (const p of paidPays) {
    const slotId = resvById.get(p.reservation_id)?.slot_id;
    if (!slotId) continue;
    ingresosPorSlot.set(slotId, (ingresosPorSlot.get(slotId) || 0) + Number(p.amount_mxn || 0));
    const arr = pagosPorSlot.get(slotId) || [];
    arr.push(pagoLinea(p));
    pagosPorSlot.set(slotId, arr);
  }
  const pagadoPorResv = new Map<string, number>();
  for (const p of paidPays) {
    pagadoPorResv.set(
      p.reservation_id,
      (pagadoPorResv.get(p.reservation_id) || 0) + Number(p.amount_mxn || 0),
    );
  }
  const holdingPorSlot = new Map<string, ResvRow[]>();
  for (const r of resvs) {
    if (r.slot_id && HOLDING_STATUSES.includes(r.status)) {
      const arr = holdingPorSlot.get(r.slot_id) || [];
      arr.push(r);
      holdingPorSlot.set(r.slot_id, arr);
    }
  }

  // Salidas: próximas (desde hoy CDMX, ascendente) y pasadas (descendente).
  // Incluye drafts — el admin ve todo; el status de la experiencia sale como badge.
  const hoy = cdmxDay(new Date());
  const mapSlot = (s: SlotRow): UpcomingSlot => {
      const exp = expById.get(s.experience_id);
      const holding = holdingPorSlot.get(s.id) || [];
      const taken = holding.reduce((n, r) => n + (r.num_people || 0), 0);

      const personas: PersonaFirma[] = holding
        .map((r) => {
          const reg = regsByResv.get(r.id);
          return {
            nombre: nombreDe.get(r.contact_id) || "—",
            firmado: !!reg,
            fecha: reg ? formatDiaMes(reg.signed_at) : null,
          };
        })
        .sort((a, b) => Number(b.firmado) - Number(a.firmado));

      const deudores: Deudor[] = holding
        .map((r) => ({
          nombre: nombreDe.get(r.contact_id) || "—",
          debe: Math.max(0, Number(r.total_amount_mxn || 0) - (pagadoPorResv.get(r.id) || 0)),
        }))
        .filter((d) => d.debe > 0);

      const cobrado = ingresosPorSlot.get(s.id) || 0;
      const faltante = deudores.reduce((n, d) => n + d.debe, 0);
      const deslindes = holding.filter((r) => regsByResv.has(r.id)).length;

      return {
        slotId: s.id,
        experienceSlug: exp?.slug || "?",
        experienceNombre: experienceTitle(exp?.data ?? null, exp?.slug || "?"),
        experienceStatus: exp?.status || "?",
        label: s.label || formatFechaCorta(s.starts_at),
        startsAt: s.starts_at,
        slotStatus: s.status,
        capacity: s.capacity_total,
        taken,
        available: s.capacity_total === null ? null : Math.max(0, s.capacity_total - taken),
        ingresos: cobrado,
        deslindes,
        titulares: holding.length,
        detail: { personas, pagos: pagosPorSlot.get(s.id) || [], deudores, cobrado, faltante },
      };
  };

  const vivos = slots.filter((s) => s.starts_at && s.status !== "cancelled");
  const proximas = vivos
    .filter((s) => cdmxDay(s.starts_at!) >= hoy)
    .sort((a, b) => (a.starts_at || "").localeCompare(b.starts_at || ""))
    .map(mapSlot);
  const pasadas = vivos
    .filter((s) => cdmxDay(s.starts_at!) < hoy)
    .sort((a, b) => (b.starts_at || "").localeCompare(a.starts_at || ""))
    .map(mapSlot);

  return {
    kpis: {
      ingresosTotal,
      ingresosMes,
      mesLabel,
      ingresosPorExperiencia,
      ultimosPagos,
      sparkMeses,
      reservasPorEstado,
      personasApuntadas,
      personasPorOperar,
      deslindesFirmados: regs.length,
      satisfaccion: {
        avgStars: avg(stars),
        avgNps: avg(npss),
        respondidas: submitted.length,
        invitadas: fbs.length,
        distEstrellas,
        ultimas,
      },
    },
    proximas,
    pasadas,
  };
}

// ── Eventos (gestión) ────────────────────────────────────────────────────

export type EventoResumen = {
  id: string;
  slug: string;
  nombre: string;
  status: string; // published | draft
  operadorNombre: string | null;
  salidasAbiertas: number;
  proximaLabel: string | null;
  ingresos: number; // histórico de la experiencia
  personas: number; // Σ num_people HOLDING (todas sus salidas)
};

export type SlotAdmin = {
  id: string;
  label: string;
  startsAt: string | null; // ISO
  startsAtInput: string; // "YYYY-MM-DDTHH:mm" en CDMX para <input datetime-local>
  capacity: number | null;
  priceMxn: number | null;
  status: string;
  visibility: string; // 'public' | 'private' (grupo con link cerrado)
  accessToken: string | null; // token del link privado (para re-copiarlo)
  taken: number;
  pasada: boolean;
  encInvitadas: number; // encuestas creadas para esta salida
  encRespondidas: number;
  encStars: number | null; // promedio general de las respondidas
};

export type OperadorRow = {
  id: string;
  name: string;
  email: string;
  commissionPct: number | null;
};

export type EventoDetalle = {
  id: string;
  slug: string;
  nombre: string;
  status: string;
  precioBase: string | null; // texto del price.amount
  operatorId: string | null;
  registroActivo: boolean;
  slots: SlotAdmin[];
  operadores: OperadorRow[];
};

// "YYYY-MM-DDTHH:mm" en CDMX (para prellenar datetime-local)
function cdmxInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("en-CA", { timeZone: TZ });
  const hora = d.toLocaleTimeString("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${fecha}T${hora}`;
}

export async function fetchEventos(): Promise<EventoResumen[]> {
  const sb = createSupabaseAdminClient();
  const [exps, slots, resvs, pays, ops] = (await Promise.all([
    sb.from("experiences").select("id, slug, status, data, operator_id"),
    sb.from("experience_slots").select("id, experience_id, label, starts_at, status"),
    sb.from("reservations").select("id, experience_id, num_people, status"),
    sb.from("payments").select("reservation_id, amount_mxn, status"),
    sb.from("operators").select("id, name"),
  ]).then((rs) => rs.map((r) => (r.data || []) as unknown[]))) as [
    (ExpRow & { operator_id: string | null })[],
    SlotRow[],
    (ResvRow & { experience_id: string })[],
    PayRow[],
    { id: string; name: string }[],
  ];

  const opName = new Map(ops.map((o) => [o.id, o.name]));
  const resvExp = new Map(resvs.map((r) => [r.id, r.experience_id]));
  const hoy = cdmxDay(new Date());

  return exps
    .map((e) => {
      const misSlots = slots.filter((s) => s.experience_id === e.id);
      const abiertas = misSlots.filter(
        (s) => s.status === "open" && s.starts_at && cdmxDay(s.starts_at) >= hoy,
      );
      const proxima = abiertas.sort((a, b) => (a.starts_at || "").localeCompare(b.starts_at || ""))[0];
      const ingresos = pays
        .filter((p) => p.status === "paid" && resvExp.get(p.reservation_id) === e.id)
        .reduce((s, p) => s + Number(p.amount_mxn || 0), 0);
      const personas = resvs
        .filter((r) => r.experience_id === e.id && HOLDING_STATUSES.includes(r.status))
        .reduce((s, r) => s + (r.num_people || 0), 0);
      return {
        id: e.id,
        slug: e.slug,
        nombre: experienceTitle(e.data, e.slug),
        status: e.status,
        operadorNombre: e.operator_id ? opName.get(e.operator_id) || null : null,
        salidasAbiertas: abiertas.length,
        proximaLabel: proxima?.label || (proxima ? formatFechaCorta(proxima.starts_at) : null),
        ingresos,
        personas,
      };
    })
    .sort((a, b) => (a.status === b.status ? b.ingresos - a.ingresos : a.status === "published" ? -1 : 1));
}

export async function fetchEventoDetalle(slug: string): Promise<EventoDetalle | null> {
  const sb = createSupabaseAdminClient();
  const { data: exp } = await sb
    .from("experiences")
    .select("id, slug, status, data, operator_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!exp) return null;
  const data = (exp.data as Partial<Experience> | null) ?? null;

  const [{ data: slotRows }, { data: ops }] = await Promise.all([
    sb
      .from("experience_slots")
      .select("id, label, starts_at, capacity_total, price_mxn, status, visibility, access_token")
      .eq("experience_id", exp.id)
      .order("starts_at", { ascending: true }),
    sb.from("operators").select("id, name, email, commission_pct").order("name"),
  ]);

  const avail = await fetchSlotOccupancy(exp.id as string);
  const enc = await fetchSlotFeedbackStats(exp.id as string);
  const hoy = cdmxDay(new Date());

  return {
    id: exp.id as string,
    slug: exp.slug as string,
    nombre: experienceTitle(data, exp.slug as string),
    status: exp.status as string,
    precioBase: data?.price?.amount || null,
    operatorId: (exp.operator_id as string | null) ?? null,
    registroActivo: !!data?.registration?.active,
    slots: ((slotRows || []) as {
      id: string;
      label: string | null;
      starts_at: string | null;
      capacity_total: number | null;
      price_mxn: number | null;
      status: string;
      visibility: string | null;
      access_token: string | null;
    }[]).map((s) => ({
      id: s.id,
      label: s.label || "",
      startsAt: s.starts_at,
      startsAtInput: cdmxInput(s.starts_at),
      capacity: s.capacity_total,
      priceMxn: s.price_mxn != null ? Number(s.price_mxn) : null,
      status: s.status,
      visibility: s.visibility || "public",
      accessToken: s.access_token,
      taken: avail.get(s.id) || 0,
      pasada: !!s.starts_at && cdmxDay(s.starts_at) < hoy,
      encInvitadas: enc.get(s.id)?.invitadas || 0,
      encRespondidas: enc.get(s.id)?.respondidas || 0,
      encStars: enc.get(s.id)?.stars ?? null,
    })),
    operadores: ((ops || []) as {
      id: string;
      name: string;
      email: string;
      commission_pct: number | null;
    }[]).map((o) => ({
      id: o.id,
      name: o.name,
      email: o.email,
      commissionPct: o.commission_pct != null ? Number(o.commission_pct) : null,
    })),
  };
}

// Encuestas por SALIDA de una experiencia. La salida sale de experience_feedback.slot_id
// (0031); las respuestas viejas, anteriores a esa migración, se resuelven por su reserva.
// Best-effort: si la columna no existe todavía, el evento se muestra sin encuesta.
async function fetchSlotFeedbackStats(
  experienceId: string,
): Promise<Map<string, { invitadas: number; respondidas: number; stars: number | null }>> {
  const sb = createSupabaseAdminClient();
  const out = new Map<string, { invitadas: number; respondidas: number; stars: number | null }>();
  const { data, error } = await sb
    .from("experience_feedback")
    .select("slot_id, reservation_id, status, overall_stars")
    .eq("experience_id", experienceId);
  if (error || !data) return out;

  const sinSlot = (data as { slot_id: string | null; reservation_id: string | null }[])
    .filter((f) => !f.slot_id && f.reservation_id)
    .map((f) => f.reservation_id as string);
  const slotByResv = new Map<string, string | null>();
  if (sinSlot.length) {
    const { data: rs } = await sb.from("reservations").select("id, slot_id").in("id", sinSlot);
    for (const r of (rs || []) as { id: string; slot_id: string | null }[]) slotByResv.set(r.id, r.slot_id);
  }

  const acc = new Map<string, number[]>();
  for (const f of data as {
    slot_id: string | null;
    reservation_id: string | null;
    status: string;
    overall_stars: number | null;
  }[]) {
    const sid = f.slot_id ?? (f.reservation_id ? slotByResv.get(f.reservation_id) : null);
    if (!sid) continue;
    const cur = out.get(sid) || { invitadas: 0, respondidas: 0, stars: null };
    cur.invitadas += 1;
    if (f.status === "submitted") {
      cur.respondidas += 1;
      if (f.overall_stars != null) acc.set(sid, [...(acc.get(sid) || []), Number(f.overall_stars)]);
    }
    out.set(sid, cur);
  }
  for (const [sid, xs] of acc) {
    const cur = out.get(sid);
    if (cur) cur.stars = Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
  }
  return out;
}

// Ocupación (Σ num_people HOLDING) por slot de una experiencia.
async function fetchSlotOccupancy(experienceId: string): Promise<Map<string, number>> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("reservations")
    .select("slot_id, num_people, status")
    .eq("experience_id", experienceId)
    .in("status", HOLDING_STATUSES);
  const m = new Map<string, number>();
  for (const r of (data || []) as { slot_id: string | null; num_people: number }[]) {
    if (r.slot_id) m.set(r.slot_id, (m.get(r.slot_id) || 0) + (r.num_people || 0));
  }
  return m;
}

// ── Reservas (F3) ────────────────────────────────────────────────────────

export type ParticipanteLinea = { nombre: string; relacion: string };

export type ReservaAdmin = {
  id: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoPhone: string;
  contactoCity: string;
  experienciaNombre: string;
  experienciaSlug: string;
  salidaLabel: string;
  numPeople: number;
  total: number;
  pagado: number;
  debe: number;
  estado: string;
  canal: string;
  creada: string; // ISO
  deslindeFirmado: boolean;
  deslindeFecha: string | null;
  participantes: ParticipanteLinea[];
  pagos: PagoLinea[];
};

export type ReservasFiltro = { slug?: string; estado?: string; q?: string };

export async function fetchReservas(f: ReservasFiltro = {}): Promise<{
  reservas: ReservaAdmin[];
  experiencias: { slug: string; nombre: string }[];
}> {
  const sb = createSupabaseAdminClient();
  const [resvs, contacts, exps, slots, pays, regs] = (await Promise.all([
    sb
      .from("reservations")
      .select(
        "id, experience_id, slot_id, contact_id, num_people, total_amount_mxn, status, channel, created_at",
      )
      .order("created_at", { ascending: false }),
    sb.from("contacts").select("id, full_name, email, phone, city"),
    sb.from("experiences").select("id, slug, data"),
    sb.from("experience_slots").select("id, label, starts_at"),
    sb.from("payments").select("reservation_id, contact_id, amount_mxn, status, method, paid_at"),
    sb.from("registrations").select("reservation_id, signed_at, participants, minors"),
  ]).then((rs) => rs.map((r) => (r.data || []) as unknown[]))) as [
    {
      id: string;
      experience_id: string;
      slot_id: string | null;
      contact_id: string;
      num_people: number;
      total_amount_mxn: number;
      status: string;
      channel: string;
      created_at: string;
    }[],
    { id: string; full_name: string | null; email: string | null; phone: string | null; city: string | null }[],
    ExpRow[],
    { id: string; label: string | null; starts_at: string | null }[],
    (PayRow & { method: string | null })[],
    {
      reservation_id: string;
      signed_at: string;
      participants: { full_name?: string; relationship?: string }[] | null;
      minors: { name?: string; relationship?: string }[] | null;
    }[],
  ];

  const cById = new Map(contacts.map((c) => [c.id, c]));
  const eById = new Map(exps.map((e) => [e.id, e]));
  const sById = new Map(slots.map((s) => [s.id, s]));
  const regByResv = new Map(regs.map((g) => [g.reservation_id, g]));
  const paysByResv = new Map<string, (PayRow & { method: string | null })[]>();
  for (const p of pays) {
    const arr = paysByResv.get(p.reservation_id) || [];
    arr.push(p);
    paysByResv.set(p.reservation_id, arr);
  }

  const experiencias = exps
    .map((e) => ({ slug: e.slug, nombre: experienceTitle(e.data, e.slug) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const q = (f.q || "").trim().toLowerCase();

  const reservas = resvs
    .map((r): ReservaAdmin => {
      const c = cById.get(r.contact_id);
      const e = eById.get(r.experience_id);
      const s = r.slot_id ? sById.get(r.slot_id) : undefined;
      const reg = regByResv.get(r.id);
      const misPagos = (paysByResv.get(r.id) || []).sort((a, b) =>
        (b.paid_at || "").localeCompare(a.paid_at || ""),
      );
      const pagado = misPagos
        .filter((p) => p.status === "paid")
        .reduce((n, p) => n + Number(p.amount_mxn || 0), 0);
      const total = Number(r.total_amount_mxn || 0);
      const parts: ParticipanteLinea[] = (
        reg?.participants?.length
          ? reg.participants.map((p) => ({ nombre: p.full_name || "—", relacion: p.relationship || "" }))
          : (reg?.minors || []).map((m) => ({ nombre: m.name || "—", relacion: m.relationship || "" }))
      ).filter((p) => p.nombre !== "—");
      return {
        id: r.id,
        contactoNombre: c?.full_name || "—",
        contactoEmail: c?.email || "",
        contactoPhone: c?.phone || "",
        contactoCity: c?.city || "",
        experienciaNombre: e ? experienceTitle(e.data, e.slug) : "?",
        experienciaSlug: e?.slug || "?",
        salidaLabel: s?.label || (s ? formatFechaCorta(s.starts_at) : "—"),
        numPeople: r.num_people || 1,
        total,
        pagado,
        debe: Math.max(0, total - pagado),
        estado: r.status,
        canal: r.channel,
        creada: r.created_at,
        deslindeFirmado: !!reg,
        deslindeFecha: reg ? formatDiaMes(reg.signed_at) : null,
        participantes: parts,
        pagos: misPagos.map((p) => ({
          nombre:
            p.status === "refunded"
              ? "Reembolso"
              : p.method === "transfer"
                ? "Transferencia"
                : p.method === "cash"
                  ? "Efectivo"
                  : "Stripe",
          monto: Number(p.amount_mxn || 0),
          metodo: p.status === "refunded" ? "reembolsado" : p.method || "—",
          fecha: formatDiaMes(p.paid_at),
        })),
      };
    })
    .filter((r) => {
      if (f.slug && r.experienciaSlug !== f.slug) return false;
      if (f.estado && r.estado !== f.estado) return false;
      if (q && !(`${r.contactoNombre} ${r.contactoEmail}`.toLowerCase().includes(q))) return false;
      return true;
    });

  return { reservas, experiencias };
}

// ── Personas / CRM (F3) ──────────────────────────────────────────────────

export type PersonaAdmin = {
  id: string;
  nombre: string;
  email: string;
  phone: string;
  city: string;
  etapa: string;
  tags: string[];
  notionUrl: string | null;
  numReservas: number;
  totalPagado: number;
  deslindes: number;
  reservas: { experiencia: string; salida: string; estado: string; monto: number; personas: number }[];
  dependientes: { nombre: string; relacion: string }[];
};

export async function fetchPersonas(q = ""): Promise<PersonaAdmin[]> {
  const sb = createSupabaseAdminClient();
  const [contacts, resvs, exps, slots, pays, regs, deps] = (await Promise.all([
    sb
      .from("contacts")
      .select("id, full_name, email, phone, city, lifecycle_stage, tags, notion_page_url")
      .order("created_at", { ascending: false }),
    sb
      .from("reservations")
      .select("id, contact_id, experience_id, slot_id, num_people, total_amount_mxn, status"),
    sb.from("experiences").select("id, slug, data"),
    sb.from("experience_slots").select("id, label, starts_at"),
    sb.from("payments").select("reservation_id, amount_mxn, status"),
    sb.from("registrations").select("contact_id"),
    sb.from("dependents").select("guardian_contact_id, full_name, relationship"),
  ]).then((rs) => rs.map((r) => (r.data || []) as unknown[]))) as [
    {
      id: string;
      full_name: string | null;
      email: string | null;
      phone: string | null;
      city: string | null;
      lifecycle_stage: string;
      tags: unknown;
      notion_page_url: string | null;
    }[],
    {
      id: string;
      contact_id: string;
      experience_id: string;
      slot_id: string | null;
      num_people: number;
      total_amount_mxn: number;
      status: string;
    }[],
    ExpRow[],
    { id: string; label: string | null; starts_at: string | null }[],
    PayRow[],
    { contact_id: string }[],
    { guardian_contact_id: string; full_name: string; relationship: string | null }[],
  ];

  const eById = new Map(exps.map((e) => [e.id, e]));
  const sById = new Map(slots.map((s) => [s.id, s]));
  const resvByContact = new Map<string, typeof resvs>();
  for (const r of resvs) {
    const arr = resvByContact.get(r.contact_id) || [];
    arr.push(r);
    resvByContact.set(r.contact_id, arr);
  }
  const paidByResv = new Map<string, number>();
  for (const p of pays) {
    if (p.status === "paid") {
      paidByResv.set(p.reservation_id, (paidByResv.get(p.reservation_id) || 0) + Number(p.amount_mxn || 0));
    }
  }
  const regCount = new Map<string, number>();
  for (const g of regs) regCount.set(g.contact_id, (regCount.get(g.contact_id) || 0) + 1);
  const depsByGuardian = new Map<string, { nombre: string; relacion: string }[]>();
  for (const d of deps) {
    const arr = depsByGuardian.get(d.guardian_contact_id) || [];
    arr.push({ nombre: d.full_name, relacion: d.relationship || "" });
    depsByGuardian.set(d.guardian_contact_id, arr);
  }

  const qq = q.trim().toLowerCase();
  return contacts
    .map((c): PersonaAdmin => {
      const mias = resvByContact.get(c.id) || [];
      const totalPagado = mias.reduce((n, r) => n + (paidByResv.get(r.id) || 0), 0);
      return {
        id: c.id,
        nombre: c.full_name || "—",
        email: c.email || "",
        phone: c.phone || "",
        city: c.city || "",
        etapa: c.lifecycle_stage,
        tags: Array.isArray(c.tags) ? (c.tags as string[]) : [],
        notionUrl: c.notion_page_url,
        numReservas: mias.length,
        totalPagado,
        deslindes: regCount.get(c.id) || 0,
        reservas: mias.map((r) => {
          const e = eById.get(r.experience_id);
          const s = r.slot_id ? sById.get(r.slot_id) : undefined;
          return {
            experiencia: e ? experienceTitle(e.data, e.slug) : "?",
            salida: s?.label || "—",
            estado: r.status,
            monto: paidByResv.get(r.id) || 0,
            personas: r.num_people || 1,
          };
        }),
        dependientes: depsByGuardian.get(c.id) || [],
      };
    })
    .filter((p) => !qq || `${p.nombre} ${p.email} ${p.phone}`.toLowerCase().includes(qq))
    .sort((a, b) => b.totalPagado - a.totalPagado || b.numReservas - a.numReservas);
}

// ── Roster por salida (F3) — datos sensibles, SOLO admin ────────────────

export type RosterRow = {
  nombre: string;
  edad: number | null;
  emergencia: string;
  condiciones: string; // alergias / padecimientos / dieta resumidos
  deslinde: boolean;
  fechaFirma: string | null;
  titular: string | null; // null = es el titular; nombre del titular si es acompañante
  // Lo que ESA persona contrató: "Habitación sencilla", "Habitación compartida"…
  // Sale del nivel de precio elegido al pagar. El guía necesita saberlo antes de
  // llegar, no en la recepción del hotel.
  adicional: string | null;
};

export type Roster = {
  slotId: string;
  experienciaNombre: string;
  experienciaSlug: string;
  salidaLabel: string;
  startsAt: string | null;
  rows: RosterRow[];
};

function edadDe(birth: string | null | undefined, ref: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  const r = ref ? new Date(ref) : new Date();
  if (Number.isNaN(b.getTime())) return null;
  let a = r.getFullYear() - b.getFullYear();
  const m = r.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && r.getDate() < b.getDate())) a--;
  return a >= 0 && a < 120 ? a : null;
}

type Snap = Record<string, string | null | undefined>;
// Valores tipo "No"/"Nada"/"Ninguna"/"N/A" son ruido para el guía → se omiten.
function señal(v: string | null | undefined): string {
  const s = (v ?? "").toString().trim();
  return /^(no|nada|ningun[ao]s?|n\/?a|-|—|\.)\.?$/i.test(s) ? "" : s;
}
function resumenMedico(s: Snap | null | undefined): string {
  if (!s) return "—";
  const partes: string[] = [];
  const alergias = señal(s.allergies);
  const condiciones = señal(s.conditions);
  const dieta = señal(s.dietary_restrictions);
  if (alergias) partes.push(`Alergias: ${alergias}`);
  if (condiciones) partes.push(condiciones);
  if (dieta) partes.push(`Dieta: ${dieta}`);
  return partes.length ? partes.join(" · ") : "Ninguna";
}
function emergenciaDe(s: Snap | null | undefined): string {
  if (!s) return "—";
  const n = s.emergency_name?.toString().trim();
  const t = s.emergency_phone?.toString().trim();
  if (!n && !t) return "—";
  return [n, t].filter(Boolean).join(" · ");
}

// El nivel de precio se guarda como texto libre en `reservations.notes`
// ("Nivel: Habitación compartida") — finalize-selfserve lo escribe así y a esa
// nota se le han ido concatenando otras con " · ". Se extrae SOLO ese segmento;
// devolver la nota entera filtraría comentarios internos al roster impreso, que
// va al equipo de guías.
function adicionalDe(notes: string | null | undefined): string | null {
  const m = /Nivel:\s*([^·]+)/i.exec(notes || "");
  const v = m?.[1]?.trim();
  return v || null;
}

export async function fetchRoster(slotId: string): Promise<Roster | null> {
  const sb = createSupabaseAdminClient();
  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, label, starts_at, experience_id")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot) return null;
  const { data: exp } = await sb
    .from("experiences")
    .select("slug, data")
    .eq("id", slot.experience_id)
    .maybeSingle();

  const [{ data: resvs }, { data: regs }] = await Promise.all([
    sb
      .from("reservations")
      .select("id, contact_id, num_people, status, notes")
      .eq("slot_id", slotId)
      .in("status", HOLDING_STATUSES),
    sb
      .from("registrations")
      .select("reservation_id, contact_id, signed_at, medical_snapshot, identity_snapshot, participants")
      .order("signed_at", { ascending: true }),
  ]);

  const regByResv = new Map(
    ((regs || []) as {
      reservation_id: string;
      contact_id: string;
      signed_at: string;
      medical_snapshot: Snap | null;
      identity_snapshot: (Snap & { birth_date?: string; full_name?: string }) | null;
      participants:
        | { full_name?: string; birth_date?: string | null; relationship?: string; medical_snapshot?: Snap }[]
        | null;
    }[]).map((g) => [g.reservation_id, g]),
  );

  const contactIds = ((resvs || []) as { contact_id: string }[]).map((r) => r.contact_id);
  const [{ data: contacts }, { data: medicals }] = await Promise.all([
    contactIds.length
      ? sb.from("contacts").select("id, full_name, birth_date").in("id", contactIds)
      : Promise.resolve({ data: [] as unknown[] } as { data: unknown[] }),
    contactIds.length
      ? sb.from("medical_profiles").select("contact_id, allergies, conditions, dietary_restrictions, emergency_name, emergency_phone").in("contact_id", contactIds)
      : Promise.resolve({ data: [] as unknown[] } as { data: unknown[] }),
  ]);
  const cById = new Map(
    ((contacts || []) as { id: string; full_name: string | null; birth_date: string | null }[]).map((c) => [c.id, c]),
  );
  const medByContact = new Map(
    ((medicals || []) as ({ contact_id: string } & Snap)[]).map((m) => [m.contact_id, m]),
  );

  const rows: RosterRow[] = [];
  for (const r of (resvs || []) as {
    id: string;
    contact_id: string;
    num_people: number;
    notes: string | null;
  }[]) {
    const adicional = adicionalDe(r.notes);
    const c = cById.get(r.contact_id);
    const reg = regByResv.get(r.id);
    const snap: Snap | null = reg?.medical_snapshot || medByContact.get(r.contact_id) || null;
    const birth = (reg?.identity_snapshot?.birth_date as string | undefined) || c?.birth_date || null;
    const titularNombre = c?.full_name || (reg?.identity_snapshot?.full_name as string) || "—";
    rows.push({
      nombre: titularNombre,
      edad: edadDe(birth, slot.starts_at as string | null),
      emergencia: emergenciaDe(snap),
      condiciones: resumenMedico(snap),
      deslinde: !!reg,
      fechaFirma: reg ? formatDiaMes(reg.signed_at) : null,
      titular: null,
      adicional,
    });
    for (const p of reg?.participants || []) {
      rows.push({
        nombre: p.full_name || "—",
        edad: edadDe(p.birth_date || null, slot.starts_at as string | null),
        emergencia: emergenciaDe(p.medical_snapshot),
        condiciones: resumenMedico(p.medical_snapshot),
        deslinde: true, // el titular firmó por el grupo
        fechaFirma: reg ? formatDiaMes(reg.signed_at) : null,
        titular: titularNombre,
        // El nivel se contrató por RESERVA, así que el acompañante duerme donde
        // duerme su titular.
        adicional,
      });
    }
    // Lugares PAGADOS sin acompañante capturado (capturarlos es opcional): el
    // roster debe reflejar el grupo completo — una reserva de 3 son 3 personas
    // en campo aunque solo el titular se haya registrado. Heredan el deslinde
    // del titular (regla: un deslinde por grupo); el nombre delata que faltan
    // sus datos médicos.
    const sinRegistrar = Math.max(0, (r.num_people || 1) - 1 - (reg?.participants?.length || 0));
    for (let i = 0; i < sinRegistrar; i++) {
      rows.push({
        nombre: "Acompañante por registrar",
        edad: null,
        emergencia: "—",
        condiciones: "—",
        deslinde: !!reg,
        fechaFirma: reg ? formatDiaMes(reg.signed_at) : null,
        titular: titularNombre,
        adicional,
      });
    }
  }
  // Agrupar cada grupo junto: titular primero, sus acompañantes después.
  rows.sort((a, b) => {
    const ga = a.titular || a.nombre;
    const gb = b.titular || b.nombre;
    if (ga !== gb) return ga.localeCompare(gb);
    if (!a.titular !== !b.titular) return a.titular ? 1 : -1; // titular arriba
    return a.nombre.localeCompare(b.nombre);
  });

  return {
    slotId,
    experienciaNombre: experienceTitle((exp?.data as Partial<Experience>) ?? null, exp?.slug || "?"),
    experienciaSlug: exp?.slug || "?",
    salidaLabel: (slot.label as string) || formatFechaCorta(slot.starts_at as string | null),
    startsAt: slot.starts_at as string | null,
    rows,
  };
}

// ── Encuesta de satisfacción (F5) ────────────────────────────────────────

export type EncuestaPersona = {
  id: string; // feedback row id — para reenviar su correo
  nombre: string;
  estado: "respondida" | "invitada";
  fecha: string | null; // respondida: submitted_at · invitada: invited_at
  salidaLabel: string;
  token: string; // para armar el link /caminante/feedback/[token]
  email: string | null; // a dónde se reenvía la encuesta
  stars: number | null;
  // Cómo llegó. `source` NO sirve: submitFeedback lo pisa a "web" al enviar.
  // Sin reserva ⇒ entró por el link abierto del grupo (un acompañante).
  via: "correo" | "grupo";
};

export type EncuestaExperiencia = {
  experienceId: string;
  slug: string;
  nombre: string;
  ubicacion: string | null;
  invitadas: number;
  respondidas: number;
  avgStars: number | null;
  avgNps: number | null;
  distEstrellas: { etiqueta: string; n: number }[];
  secciones: { label: string; avg: number; n: number }[];
  abiertas: { texto: string; stars: number | null; iniciales: string; fecha: string }[];
  respuestas: EncuestaRespuesta[]; // una por feedback respondido (para filtrar por rating/fecha)
  personas: EncuestaPersona[];
};

// Una respuesta de satisfacción, para listar/filtrar por estrellas y fecha.
export type EncuestaRespuesta = {
  iniciales: string;
  nombre: string;
  stars: number | null; // overall
  nps: number | null;
  bucket: 5 | 4 | 3; // 5★ / 4★ / ≤3★ (para el filtro)
  fecha: string; // display (día mes)
  fechaIso: string; // orden
  textos: string[]; // respuestas abiertas ya con prefijo ("Por mejorar: …")
  // Las mismas tres, SIN prefijo y por separado: la vista «Comentarios» las
  // agrupa por tipo, y leer los «por mejorar» en bloque es donde aparece el
  // patrón que una respuesta suelta no deja ver.
  loved: string | null;
  mejorar: string | null;
  esperaba: string | null;
  salidaLabel: string; // de QUÉ salida habla — se agrupa por aquí
  via: "correo" | "grupo"; // grupo = acompañante que entró por el link abierto
};

export type TestimonioPendiente = {
  id: string;
  texto: string;
  stars: number | null;
  iniciales: string;
  experiencia: string;
  consent: boolean;
};

export type EncuestaAdmin = {
  experiencias: EncuestaExperiencia[];
  testimoniosPendientes: TestimonioPendiente[];
};

type FbFullRow = {
  id: string;
  experience_id: string;
  // Desde la 0031 una encuesta puede NO tener reserva (link abierto del grupo)
  // y traer su salida directa.
  reservation_id: string | null;
  slot_id: string | null;
  contact_id: string;
  location_label: string | null;
  token: string;
  status: string;
  overall_stars: number | null;
  nps: number | null;
  section_ratings: Record<string, { stars?: number; comment?: string }> | null;
  loved_text: string | null;
  improve_text: string | null;
  expected_gap_text: string | null;
  testimonial_text: string | null;
  testimonial_stars: number | null;
  testimonial_consent: boolean;
  publish_status: string;
  invited_at: string | null;
  submitted_at: string | null;
};

export async function fetchEncuestaAdmin(): Promise<EncuestaAdmin> {
  const sb = createSupabaseAdminClient();
  const [fbs, exps, contacts, resvs, slots] = (await Promise.all([
    sb
      .from("experience_feedback")
      .select(
        "id, experience_id, reservation_id, slot_id, contact_id, location_label, token, status, overall_stars, nps, section_ratings, loved_text, improve_text, expected_gap_text, testimonial_text, testimonial_stars, testimonial_consent, publish_status, invited_at, submitted_at",
      ),
    sb.from("experiences").select("id, slug, data"),
    sb.from("contacts").select("id, full_name, email"),
    sb.from("reservations").select("id, slot_id"),
    sb.from("experience_slots").select("id, label, starts_at"),
  ]).then((rs) => rs.map((r) => (r.data || []) as unknown[]))) as [
    FbFullRow[],
    ExpRow[],
    { id: string; full_name: string | null; email: string }[],
    { id: string; slot_id: string | null }[],
    { id: string; label: string | null; starts_at: string | null }[],
  ];

  const eById = new Map(exps.map((e) => [e.id, e]));
  const cById = new Map(contacts.map((c) => [c.id, c]));
  const slotByResv = new Map(resvs.map((r) => [r.id, r.slot_id]));
  // Sin label la salida quedaba en blanco: la fecha siempre sirve de nombre.
  const labelBySlot = new Map(slots.map((s) => [s.id, s.label || formatFechaCorta(s.starts_at)]));

  const porExp = new Map<string, FbFullRow[]>();
  for (const f of fbs) {
    const arr = porExp.get(f.experience_id) || [];
    arr.push(f);
    porExp.set(f.experience_id, arr);
  }

  const avg = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((a, b) => a + Number(b), 0) / xs.length) * 10) / 10 : null;

  const experiencias: EncuestaExperiencia[] = [];
  for (const [expId, rows] of porExp) {
    const exp = eById.get(expId);
    const data = exp?.data as
      | (Partial<Experience> & {
          feedback?: { locationLabel?: string; sections?: { key: string; label: string }[] };
        })
      | null;
    const submitted = rows.filter((f) => f.status === "submitted");
    const stars = submitted.map((f) => f.overall_stars).filter((v): v is number => v != null);
    const npss = submitted.map((f) => f.nps).filter((v): v is number => v != null);

    const bucket = (lo: number, hi: number) => stars.filter((s) => s >= lo && s < hi).length;
    const distEstrellas = [
      { etiqueta: "5 estrellas", n: bucket(4.75, 5.01) },
      { etiqueta: "4 estrellas", n: bucket(3.75, 4.75) },
      { etiqueta: "3 estrellas", n: bucket(2.75, 3.75) },
      { etiqueta: "2 o menos", n: bucket(0, 2.75) },
    ];

    // Promedio por sección (labels desde la config de la experiencia)
    const labelDe = new Map((data?.feedback?.sections || []).map((s) => [s.key, s.label]));
    const acc = new Map<string, number[]>();
    for (const f of submitted) {
      for (const [key, v] of Object.entries(f.section_ratings || {})) {
        if (v?.stars != null) {
          const arr = acc.get(key) || [];
          arr.push(Number(v.stars));
          acc.set(key, arr);
        }
      }
    }
    const secciones = [...acc.entries()]
      .map(([key, xs]) => ({ label: labelDe.get(key) || key, avg: avg(xs) || 0, n: xs.length }))
      .sort((a, b) => b.avg - a.avg);

    // Respuestas abiertas (lo que más marcó / por mejorar / esperaba y no pasó)
    const abiertas = submitted
      .sort((a, b) => (b.submitted_at || "").localeCompare(a.submitted_at || ""))
      .flatMap((f) => {
        const quien = cById.get(f.contact_id);
        const ini = iniciales(quien?.full_name || quien?.email || "?");
        const out: { texto: string; stars: number | null; iniciales: string; fecha: string }[] = [];
        const push = (t: string | null, pref = "") => {
          const s = (t || "").trim();
          if (s) out.push({ texto: `“${pref}${s}”`, stars: f.overall_stars, iniciales: ini, fecha: formatDiaMes(f.submitted_at) });
        };
        push(f.loved_text);
        push(f.improve_text, "Por mejorar: ");
        push(f.expected_gap_text, "Esperaba: ");
        return out;
      })
      .slice(0, 8);

    // Respuestas (una por feedback respondido) para listar/filtrar por rating y fecha
    const bucketDe = (s: number | null): 5 | 4 | 3 => (s == null ? 3 : s >= 4.75 ? 5 : s >= 3.75 ? 4 : 3);
    const respuestas: EncuestaRespuesta[] = submitted
      .map((f): EncuestaRespuesta => {
        const quien = cById.get(f.contact_id);
        const nombre = quien?.full_name || quien?.email || "—";
        const textos: string[] = [];
        const add = (t: string | null, pref = "") => {
          const s = (t || "").trim();
          if (s) textos.push(`${pref}${s}`);
        };
        add(f.loved_text);
        add(f.improve_text, "Por mejorar: ");
        add(f.expected_gap_text, "Esperaba: ");
        const limpio = (t: string | null) => (t || "").trim() || null;
        return {
          loved: limpio(f.loved_text),
          mejorar: limpio(f.improve_text),
          esperaba: limpio(f.expected_gap_text),
          iniciales: iniciales(nombre),
          nombre,
          stars: f.overall_stars,
          nps: f.nps,
          bucket: bucketDe(f.overall_stars),
          fecha: formatDiaMes(f.submitted_at),
          fechaIso: f.submitted_at || "",
          textos,
          salidaLabel: (() => {
            const sid = f.slot_id ?? (f.reservation_id ? slotByResv.get(f.reservation_id) : null);
            return (sid && labelBySlot.get(sid)) || "";
          })(),
          via: f.reservation_id ? "correo" : "grupo",
        };
      })
      .sort((a, b) => b.fechaIso.localeCompare(a.fechaIso)); // reciente primero

    // Quién respondió / quién no
    const personas: EncuestaPersona[] = rows
      .map((f): EncuestaPersona => {
        const quien = cById.get(f.contact_id);
        // La salida sale de la ENCUESTA (0031) y solo si no, de la reserva: las
        // respuestas del link de grupo no tienen reserva — un acompañante no
        // compró — y antes se quedaban sin salida (caso Alexandra, 8 ago 2026).
        const slotId = f.slot_id ?? (f.reservation_id ? slotByResv.get(f.reservation_id) : null);
        return {
          id: f.id,
          nombre: quien?.full_name || quien?.email || "—",
          estado: f.status === "submitted" ? "respondida" : "invitada",
          fecha: formatDiaMes(f.status === "submitted" ? f.submitted_at : f.invited_at),
          salidaLabel: (slotId && labelBySlot.get(slotId)) || "",
          token: f.token,
          email: quien?.email ?? null,
          stars: f.overall_stars,
          via: f.reservation_id ? "correo" : "grupo",
        };
      })
      .sort((a, b) => Number(b.estado === "respondida") - Number(a.estado === "respondida"));

    experiencias.push({
      experienceId: expId,
      slug: exp?.slug || "?",
      nombre: exp ? experienceTitle(exp.data, exp.slug) : "?",
      ubicacion: rows[0]?.location_label || data?.feedback?.locationLabel || null,
      invitadas: rows.length,
      respondidas: submitted.length,
      avgStars: avg(stars),
      avgNps: avg(npss),
      distEstrellas,
      secciones,
      abiertas,
      respuestas,
      personas,
    });
  }
  experiencias.sort((a, b) => b.respondidas - a.respondidas);

  const testimoniosPendientes: TestimonioPendiente[] = fbs
    .filter((f) => (f.testimonial_text || "").trim() && f.publish_status === "pending")
    .map((f) => {
      const quien = cById.get(f.contact_id);
      const exp = eById.get(f.experience_id);
      return {
        id: f.id,
        texto: (f.testimonial_text || "").trim(),
        stars: f.testimonial_stars,
        iniciales: iniciales(quien?.full_name || quien?.email || "?"),
        experiencia: exp ? experienceTitle(exp.data, exp.slug) : "?",
        consent: !!f.testimonial_consent,
      };
    });

  return { experiencias, testimoniosPendientes };
}

// ── Dinero (F4) ──────────────────────────────────────────────────────────

export type LedgerLinea = {
  fecha: string;
  persona: string;
  metodo: string;
  monto: number;
  estado: string; // paid | refunded | pending | failed
};

export type PayoutOperador = {
  operador: string;
  email: string;
  bruto: number;
  comision: number; // solo sobre ventas con % congelado
  brutoSinPct: number; // ventas cuyo % quedó "por definir"
  // ⚠️ NULL cuando alguna venta no tiene % congelado. NO es cero ni es el bruto:
  // es "no se puede calcular todavía". Antes se devolvía bruto − 0 y el panel
  // proponía depositarle al operador el 100% de la venta.
  neto: number | null;
  sinAtribuir?: boolean; // fila de ventas sin operator_id — no se paga, se aclara
  lineas: { concepto: string; monto: number; nota: string }[];
};

export type DineroAdmin = {
  mesLabel: string;
  ingresosMes: number;
  ingresosTotal: number;
  sparkMeses: number[];
  pendiente: number;
  pendienteN: number; // reservas por liquidar
  reembolsosMes: number;
  reembolsosN: number;
  porExperiencia: {
    nombre: string;
    monto: number;
    detalle: { salida: string; personas: number; monto: number }[];
  }[];
  payouts: PayoutOperador[];
  ledger: LedgerLinea[];
};

export async function fetchDinero(): Promise<DineroAdmin> {
  const sb = createSupabaseAdminClient();
  const [pays, resvs, exps, slots, contacts, ops] = (await Promise.all([
    sb.from("payments").select("reservation_id, contact_id, amount_mxn, status, method, paid_at, created_at"),
    sb
      .from("reservations")
      .select("id, experience_id, slot_id, num_people, total_amount_mxn, status, operator_id, commission_pct"),
    sb.from("experiences").select("id, slug, data"),
    sb.from("experience_slots").select("id, label"),
    sb.from("contacts").select("id, full_name, email"),
    sb.from("operators").select("id, name, email, commission_pct"),
  ]).then((rs) => rs.map((r) => (r.data || []) as unknown[]))) as [
    (PayRow & { created_at: string })[],
    (ResvRow & { operator_id: string | null; commission_pct: number | null })[],
    ExpRow[],
    { id: string; label: string | null }[],
    { id: string; full_name: string | null; email: string }[],
    { id: string; name: string; email: string; commission_pct: number | null }[],
  ];

  const rById = new Map(resvs.map((r) => [r.id, r]));
  const eById = new Map(exps.map((e) => [e.id, e]));
  const sById = new Map(slots.map((s) => [s.id, s.label || ""]));
  const cById = new Map(contacts.map((c) => [c.id, c.full_name || c.email]));

  const paid = pays.filter((p) => p.status === "paid");
  const hoyMes = cdmxDay(new Date()).slice(0, 7);
  const ingresosTotal = paid.reduce((s, p) => s + Number(p.amount_mxn || 0), 0);
  const ingresosMes = paid
    .filter((p) => p.paid_at && cdmxDay(p.paid_at).slice(0, 7) === hoyMes)
    .reduce((s, p) => s + Number(p.amount_mxn || 0), 0);
  const mesLabel = new Date().toLocaleDateString("es-MX", { timeZone: TZ, month: "long", year: "numeric" });

  // Spark: últimos 7 meses
  const meses: string[] = [];
  {
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 15);
      meses.push(cdmxDay(m).slice(0, 7));
    }
  }
  const sparkMeses = meses.map((m) =>
    paid
      .filter((p) => p.paid_at && cdmxDay(p.paid_at).slice(0, 7) === m)
      .reduce((s, p) => s + Number(p.amount_mxn || 0), 0),
  );

  // Pendiente de cobro: reservas activas con total > pagado
  const pagadoPorResv = new Map<string, number>();
  for (const p of paid) {
    pagadoPorResv.set(p.reservation_id, (pagadoPorResv.get(p.reservation_id) || 0) + Number(p.amount_mxn || 0));
  }
  let pendiente = 0;
  let pendienteN = 0;
  for (const r of resvs) {
    if (["cancelled", "completed"].includes(r.status)) continue;
    const debe = Math.max(0, Number(r.total_amount_mxn || 0) - (pagadoPorResv.get(r.id) || 0));
    if (debe > 0) {
      pendiente += debe;
      pendienteN++;
    }
  }

  // Reembolsos del mes
  const refunded = pays.filter((p) => p.status === "refunded");
  const refMes = refunded.filter(
    (p) => (p.paid_at || p.created_at) && cdmxDay(p.paid_at || p.created_at).slice(0, 7) === hoyMes,
  );
  const reembolsosMes = refMes.reduce((s, p) => s + Number(p.amount_mxn || 0), 0);

  // Ingresos por experiencia → detalle por salida
  const porExpMap = new Map<string, Map<string, { personas: Set<string>; monto: number }>>();
  for (const p of paid) {
    const r = rById.get(p.reservation_id);
    if (!r) continue;
    const porSalida = porExpMap.get(r.experience_id) || new Map();
    const key = r.slot_id || "singular";
    const acc = porSalida.get(key) || { personas: new Set<string>(), monto: 0 };
    acc.personas.add(r.id);
    acc.monto += Number(p.amount_mxn || 0);
    porSalida.set(key, acc);
    porExpMap.set(r.experience_id, porSalida);
  }
  const numPorResvSlot = new Map<string, number>();
  for (const r of resvs) {
    const key = `${r.experience_id}|${r.slot_id || "singular"}`;
    if (pagadoPorResv.get(r.id)) {
      numPorResvSlot.set(key, (numPorResvSlot.get(key) || 0) + (r.num_people || 0));
    }
  }
  const porExperiencia = [...porExpMap.entries()]
    .map(([expId, porSalida]) => {
      const exp = eById.get(expId);
      const detalle = [...porSalida.entries()].map(([slotKey, acc]) => ({
        salida: slotKey === "singular" ? "Sin salida asignada" : sById.get(slotKey) || "—",
        personas: numPorResvSlot.get(`${expId}|${slotKey}`) || acc.personas.size,
        monto: acc.monto,
      }));
      return {
        nombre: exp ? experienceTitle(exp.data, exp.slug) : "?",
        monto: detalle.reduce((s, d) => s + d.monto, 0),
        detalle: detalle.sort((a, b) => b.monto - a.monto),
      };
    })
    .sort((a, b) => b.monto - a.monto);

  // Payout por operador (comisión CONGELADA por reserva; null = por definir)
  const porOperador = new Map<
    string,
    { bruto: number; comision: number; brutoSinPct: number; lineas: Map<string, { monto: number; personas: number }> }
  >();
  // Las ventas sin operator_id se AGRUPAN aparte en vez de descartarse: eran
  // $384,000 que no aparecían ni como cero. Una cifra que no existe no se
  // puede auditar.
  const SIN_OP = "__sin_operador__";
  for (const p of paid) {
    const r = rById.get(p.reservation_id);
    if (!r) continue;
    const key = r.operator_id || SIN_OP;
    const acc =
      porOperador.get(key) ||
      { bruto: 0, comision: 0, brutoSinPct: 0, lineas: new Map() };
    const monto = Number(p.amount_mxn || 0);
    acc.bruto += monto;
    if (r.commission_pct != null) acc.comision += (monto * Number(r.commission_pct)) / 100;
    else acc.brutoSinPct += monto;
    const exp = eById.get(r.experience_id);
    const concepto = `${exp ? experienceTitle(exp.data, exp.slug) : "?"} · ${r.slot_id ? sById.get(r.slot_id) || "" : "sin salida"}`;
    const lin = acc.lineas.get(concepto) || { monto: 0, personas: 0 };
    lin.monto += monto;
    acc.lineas.set(concepto, lin);
    porOperador.set(key, acc);
  }
  const opById = new Map(ops.map((o) => [o.id, o]));
  const payouts: PayoutOperador[] = [...porOperador.entries()]
    .map(([opId, acc]) => {
      const sinAtribuir = opId === SIN_OP;
      const op = opById.get(opId);
      return {
        operador: sinAtribuir ? "Sin operador asignado" : op?.name || "Operador",
        email: sinAtribuir ? "" : op?.email || "",
        bruto: acc.bruto,
        comision: Math.round(acc.comision * 100) / 100,
        brutoSinPct: acc.brutoSinPct,
        // Con una sola venta sin % congelado el neto queda indefinido. Mejor
        // ningún número que un número que invita a transferir de más.
        neto: acc.brutoSinPct > 0 || sinAtribuir ? null : Math.round((acc.bruto - acc.comision) * 100) / 100,
        sinAtribuir,
        lineas: [...acc.lineas.entries()]
          .map(([concepto, l]) => ({ concepto, monto: l.monto, nota: "" }))
          .sort((a, b) => b.monto - a.monto),
      };
    })
    .sort((a, b) => b.bruto - a.bruto);

  // Ledger (todos los pagos, más reciente primero)
  const ledger: LedgerLinea[] = pays
    .sort((a, b) => (b.paid_at || b.created_at || "").localeCompare(a.paid_at || a.created_at || ""))
    .map((p) => ({
      fecha: formatDiaMes(p.paid_at || p.created_at),
      persona: (p.contact_id && cById.get(p.contact_id)) || "—",
      metodo: metodoLabel(p.method),
      monto: Number(p.amount_mxn || 0),
      estado: p.status,
    }));

  return {
    mesLabel,
    ingresosMes,
    ingresosTotal,
    sparkMeses,
    pendiente,
    pendienteN,
    reembolsosMes,
    reembolsosN: refMes.length,
    porExperiencia,
    payouts,
    ledger,
  };
}

// ── Salidas candidatas al LINK ABIERTO de encuesta (el que va al grupo) ──────
// Solo salidas que YA terminaron y cuya experiencia tiene la encuesta activa:
// un link de una salida futura no tendría a quién preguntarle. Best-effort: si
// la 0031 no está aplicada (`feedback_token` no existe) devuelve [] y el panel
// muestra el vacío en vez de romperse.
export type SalidaLinkAbierto = {
  id: string;
  label: string;
  experiencia: string;
  token: string | null;
  respuestas: number;
};

export async function fetchSalidasParaLinkAbierto(): Promise<SalidaLinkAbierto[]> {
  try {
    const sb = createSupabaseAdminClient();
    const ahora = new Date().toISOString();
    const [{ data: slots }, { data: fbs }] = await Promise.all([
      sb
        .from("experience_slots")
        .select("id, label, ends_at, feedback_token, experiences(slug, data)")
        .not("ends_at", "is", null)
        .lte("ends_at", ahora)
        .order("ends_at", { ascending: false })
        .limit(30),
      sb.from("experience_feedback").select("slot_id, status"),
    ]);
    if (!slots) return [];

    const respondidas = new Map<string, number>();
    for (const f of (fbs ?? []) as { slot_id: string | null; status: string }[]) {
      if (f.slot_id && f.status === "submitted") {
        respondidas.set(f.slot_id, (respondidas.get(f.slot_id) ?? 0) + 1);
      }
    }

    return (slots as unknown as {
      id: string;
      label: string;
      feedback_token: string | null;
      experiences: { slug: string; data: Experience } | null;
    }[])
      .filter((s) => s.experiences?.data?.feedback?.active === true)
      .map((s) => ({
        id: s.id,
        label: s.label || "—",
        experiencia: experienceTitle(s.experiences?.data ?? null, s.experiences?.slug ?? ""),
        token: s.feedback_token,
        respuestas: respondidas.get(s.id) ?? 0,
      }));
  } catch {
    return [];
  }
}
