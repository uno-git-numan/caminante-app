import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Estados de reserva que APARTAN un lugar (decisión: solo paid + registrados).
//   confirmed = registro firmado (web)
//   paid      = pagó por WhatsApp/Stripe
//   attended  = ya asistió
// 'requested' (link enviado sin pagar) y 'cancelled' NO apartan lugar.
export const HOLDING_STATUSES = ["paid", "confirmed", "attended"];

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
    const row = e as unknown as { id: string; slug: string; data: { capacity?: number } | null };
    out.set(row.id, {
      slug: row.slug,
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
