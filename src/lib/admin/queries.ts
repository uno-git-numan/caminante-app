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
  personasApuntadas: number;
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

  // Reservas por estado + personas en holding
  const reservasPorEstado: Record<string, number> = {};
  let personasApuntadas = 0;
  for (const r of resvs) {
    reservasPorEstado[r.status] = (reservasPorEstado[r.status] || 0) + 1;
    if (HOLDING_STATUSES.includes(r.status)) personasApuntadas += r.num_people || 0;
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
