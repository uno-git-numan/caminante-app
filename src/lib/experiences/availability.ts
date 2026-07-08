import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Token de grupo privado (?grupo=<token> en la URL). SIEMPRE sanitizar con
// esto antes de usarlo en un filtro PostgREST (evita inyección en .or()) o de
// compararlo contra la BD. Formato: base64url de crypto.randomBytes(16).
export function cleanGrupoToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return /^[A-Za-z0-9_-]{10,64}$/.test(t) ? t : null;
}

// Estados del enum reservation_status que APARTAN un lugar (decisión: paid + registrados).
//   confirmed      = registro firmado (web)
//   paid / partially_paid / completed = pagó (WhatsApp/Stripe)
// 'requested' (link enviado sin pagar) y 'cancelled' NO apartan lugar.
// (Ojo: "attended" NO existe en este enum — es un status del Trip Pipeline de Notion.)
export const HOLDING_STATUSES = ["confirmed", "paid", "partially_paid", "completed"];

export type SlotAvailability = {
  capacity: number | null; // null = salida sin tope
  taken: number; // Σ num_people de reservas que apartan
  available: number | null; // null = sin tope; si no, max(0, capacity − taken)
};

export type SlotAvailabilityPublic = {
  id: string;
  label: string;
  startsAt: string | null;
  endsAt: string | null;
  capacity: number | null;
  available: number | null;
  soldOut: boolean;
};

export type ExperienceAvailability = {
  slug: string;
  estado: string | null; // estado de MX (data.estado) — para que destinos filtre por estado
  capacity: number | null; // tope estándar de la experiencia (data.capacity)
  slots: SlotAvailabilityPublic[];
};

// Disponibilidad EN VIVO por salida de UNA experiencia (slotId → disponibilidad),
// calculada desde `reservations` (no del contador `seats_taken`). Usa el service-role
// para poder contar reservas; solo devuelve agregados (cero PII).
export async function fetchSlotAvailability(
  experienceId: string,
): Promise<Map<string, SlotAvailability>> {
  const sb = createSupabaseAdminClient();
  const [{ data: slots }, { data: resv }] = await Promise.all([
    sb.from("experience_slots").select("id, capacity_total").eq("experience_id", experienceId),
    sb
      .from("reservations")
      .select("slot_id, num_people, status")
      .eq("experience_id", experienceId)
      .in("status", HOLDING_STATUSES),
  ]);

  const taken = new Map<string, number>();
  for (const r of resv || []) {
    const sid = (r as { slot_id: string | null }).slot_id;
    if (sid) taken.set(sid, (taken.get(sid) || 0) + (((r as { num_people: number }).num_people) || 0));
  }

  const map = new Map<string, SlotAvailability>();
  for (const s of slots || []) {
    const row = s as { id: string; capacity_total: number | null };
    const cap = row.capacity_total;
    const t = taken.get(row.id) || 0;
    map.set(row.id, {
      capacity: cap,
      taken: t,
      available: cap === null ? null : Math.max(0, cap - t),
    });
  }
  return map;
}

// Salidas ABIERTAS de UNA experiencia (por id) con label + disponibilidad,
// ordenadas por fecha. Sirve a la plantilla v2 tanto en la página pública
// (experiencia ya publicada) como en la vista previa de un borrador — por eso
// NO filtra por status de la experiencia (el llamador ya decidió el acceso).
// Visibilidad: por default SOLO salidas públicas. Con `grupoToken` (ya
// sanitizado con cleanGrupoToken) se revela ADEMÁS la salida privada de ese
// token. `includePrivate` = vistas de admin (preview/print) que ven todo.
export async function fetchOpenSlotsForTemplate(
  experienceId: string,
  opts?: { grupoToken?: string | null; includePrivate?: boolean },
): Promise<SlotAvailabilityPublic[]> {
  const sb = createSupabaseAdminClient();
  const token = cleanGrupoToken(opts?.grupoToken);
  let slotsQuery = sb
    .from("experience_slots")
    .select("id, label, starts_at, ends_at, capacity_total, status")
    .eq("experience_id", experienceId)
    .eq("status", "open")
    .order("starts_at", { ascending: true });
  if (!opts?.includePrivate) {
    slotsQuery = token
      ? slotsQuery.or(`visibility.eq.public,access_token.eq.${token}`)
      : slotsQuery.eq("visibility", "public");
  }
  const [{ data: slots }, { data: resv }] = await Promise.all([
    slotsQuery,
    sb
      .from("reservations")
      .select("slot_id, num_people, status")
      .eq("experience_id", experienceId)
      .in("status", HOLDING_STATUSES),
  ]);

  const taken = new Map<string, number>();
  for (const r of resv || []) {
    const sid = (r as { slot_id: string | null }).slot_id;
    if (sid) taken.set(sid, (taken.get(sid) || 0) + (((r as { num_people: number }).num_people) || 0));
  }

  return (slots || []).map((s) => {
    const row = s as {
      id: string;
      label: string | null;
      starts_at: string | null;
      ends_at: string | null;
      capacity_total: number | null;
    };
    const cap = row.capacity_total;
    const t = taken.get(row.id) || 0;
    const available = cap === null ? null : Math.max(0, cap - t);
    return {
      id: row.id,
      label: row.label || "",
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      capacity: cap,
      available,
      soldOut: available !== null && available <= 0,
    };
  });
}

// Disponibilidad pública de TODAS las experiencias publicadas (para tarjetas del
// home / calendario). Devuelve por slug sus salidas abiertas con cupo y disponibles.
export async function fetchPublicAvailability(): Promise<ExperienceAvailability[]> {
  const sb = createSupabaseAdminClient();
  const { data: exps } = await sb
    .from("experiences")
    .select("id, slug, data")
    .eq("status", "published");
  if (!exps || exps.length === 0) return [];

  const ids = exps.map((e) => (e as { id: string }).id);
  const [{ data: slots }, { data: resv }] = await Promise.all([
    sb
      .from("experience_slots")
      .select("id, experience_id, label, starts_at, ends_at, capacity_total, status")
      .in("experience_id", ids)
      .eq("status", "open")
      .eq("visibility", "public") // las salidas privadas NUNCA salen al público
      .order("starts_at", { ascending: true }),
    sb
      .from("reservations")
      .select("slot_id, num_people, status")
      .in("experience_id", ids)
      .in("status", HOLDING_STATUSES),
  ]);

  const taken = new Map<string, number>();
  for (const r of resv || []) {
    const sid = (r as { slot_id: string | null }).slot_id;
    if (sid) taken.set(sid, (taken.get(sid) || 0) + (((r as { num_people: number }).num_people) || 0));
  }

  const out = new Map<string, ExperienceAvailability>();
  for (const e of exps) {
    const row = e as unknown as {
      id: string;
      slug: string;
      data: { capacity?: number; estado?: string } | null;
    };
    out.set(row.id, {
      slug: row.slug,
      estado: row.data?.estado || null,
      capacity: row.data?.capacity ?? null,
      slots: [],
    });
  }
  for (const s of slots || []) {
    const row = s as {
      id: string;
      experience_id: string;
      label: string | null;
      starts_at: string | null;
      ends_at: string | null;
      capacity_total: number | null;
    };
    const entry = out.get(row.experience_id);
    if (!entry) continue;
    const cap = row.capacity_total;
    const t = taken.get(row.id) || 0;
    const available = cap === null ? null : Math.max(0, cap - t);
    entry.slots.push({
      id: row.id,
      label: row.label || "",
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      capacity: cap,
      available,
      soldOut: available !== null && available <= 0,
    });
  }
  return [...out.values()];
}
