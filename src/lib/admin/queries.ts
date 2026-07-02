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

// Nombre legible de una experiencia desde su data jsonb.
export function experienceTitle(data: Partial<Experience> | null, slug: string): string {
  if (!data) return slug;
  const full = [data.title, data.titleAccent].filter(Boolean).join(" ").trim();
  return data.cardTitle || full || data.subtitle || slug;
}

// ── Tipos del panorama ───────────────────────────────────────────────────

export type OverviewKpis = {
  ingresosTotal: number; // Σ payments.status='paid' (excluye refunded)
  ingresosMes: number; // idem, paid_at dentro del mes actual (CDMX)
  mesLabel: string; // "julio 2026"
  reservasPorEstado: Record<string, number>;
  personasApuntadas: number; // Σ num_people en HOLDING
  deslindesFirmados: number; // count registrations
  satisfaccion: {
    avgStars: number | null;
    avgNps: number | null;
    respondidas: number;
    invitadas: number;
  };
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
  ingresos: number; // Σ pagos pagados atados a reservas de esta salida
  deslindes: number; // registrations de reservas de esta salida
};

export type AdminOverview = {
  kpis: OverviewKpis;
  proximas: UpcomingSlot[];
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
  num_people: number;
  status: string;
};
type PayRow = { reservation_id: string; amount_mxn: number; status: string; paid_at: string | null };
type RegRow = { reservation_id: string };
type FbRow = { status: string; overall_stars: number | null; nps: number | null };

// ── Panorama ─────────────────────────────────────────────────────────────

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const sb = createSupabaseAdminClient();
  const [exps, slots, resvs, pays, regs, fbs] = await Promise.all([
    sb.from("experiences").select("id, slug, status, data"),
    sb.from("experience_slots").select("id, experience_id, label, starts_at, capacity_total, status"),
    sb.from("reservations").select("id, experience_id, slot_id, num_people, status"),
    sb.from("payments").select("reservation_id, amount_mxn, status, paid_at"),
    sb.from("registrations").select("reservation_id"),
    sb.from("experience_feedback").select("status, overall_stars, nps"),
  ]).then((rs) =>
    rs.map((r) => (r.data || []) as unknown[]),
  ) as [ExpRow[], SlotRow[], ResvRow[], PayRow[], RegRow[], FbRow[]];

  // Índices
  const expById = new Map(exps.map((e) => [e.id, e]));
  const resvById = new Map(resvs.map((r) => [r.id, r]));

  // Ingresos (paid excluye refunded por definición del filtro)
  const paidPays = pays.filter((p) => p.status === "paid");
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

  // Reservas por estado + personas en holding
  const reservasPorEstado: Record<string, number> = {};
  let personasApuntadas = 0;
  for (const r of resvs) {
    reservasPorEstado[r.status] = (reservasPorEstado[r.status] || 0) + 1;
    if (HOLDING_STATUSES.includes(r.status)) personasApuntadas += r.num_people || 0;
  }

  // Satisfacción
  const submitted = fbs.filter((f) => f.status === "submitted");
  const stars = submitted.map((f) => f.overall_stars).filter((v): v is number => v != null);
  const npss = submitted.map((f) => f.nps).filter((v): v is number => v != null);
  const avg = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((a, b) => a + Number(b), 0) / xs.length) * 10) / 10 : null;

  // Ingresos y deslindes POR SALIDA (pago → reserva → slot)
  const ingresosPorSlot = new Map<string, number>();
  for (const p of paidPays) {
    const slotId = resvById.get(p.reservation_id)?.slot_id;
    if (slotId) ingresosPorSlot.set(slotId, (ingresosPorSlot.get(slotId) || 0) + Number(p.amount_mxn || 0));
  }
  const deslindesPorSlot = new Map<string, number>();
  for (const g of regs) {
    const slotId = resvById.get(g.reservation_id)?.slot_id;
    if (slotId) deslindesPorSlot.set(slotId, (deslindesPorSlot.get(slotId) || 0) + 1);
  }
  const tomadosPorSlot = new Map<string, number>();
  for (const r of resvs) {
    if (r.slot_id && HOLDING_STATUSES.includes(r.status)) {
      tomadosPorSlot.set(r.slot_id, (tomadosPorSlot.get(r.slot_id) || 0) + (r.num_people || 0));
    }
  }

  // Próximas salidas: desde hoy (CDMX), ordenadas por fecha. Incluye drafts
  // (el admin ve todo) — el status de la experiencia se muestra como badge.
  const hoy = cdmxDay(new Date());
  const proximas: UpcomingSlot[] = slots
    .filter((s) => s.starts_at && cdmxDay(s.starts_at) >= hoy && s.status !== "cancelled")
    .sort((a, b) => (a.starts_at || "").localeCompare(b.starts_at || ""))
    .map((s) => {
      const exp = expById.get(s.experience_id);
      const taken = tomadosPorSlot.get(s.id) || 0;
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
        ingresos: ingresosPorSlot.get(s.id) || 0,
        deslindes: deslindesPorSlot.get(s.id) || 0,
      };
    });

  return {
    kpis: {
      ingresosTotal,
      ingresosMes,
      mesLabel,
      reservasPorEstado,
      personasApuntadas,
      deslindesFirmados: regs.length,
      satisfaccion: {
        avgStars: avg(stars),
        avgNps: avg(npss),
        respondidas: submitted.length,
        invitadas: fbs.length,
      },
    },
    proximas,
  };
}
