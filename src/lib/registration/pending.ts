// Deslindes PENDIENTES de firma: reservas en HOLDING (apartan lugar) de
// experiencias con el deslinde activo, que aún NO tienen una firma
// (registrations). Alimenta el recordatorio por correo desde el panel.
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HOLDING_STATUSES } from "@/lib/experiences/availability";
import { experienceTitle } from "@/lib/admin/queries";
import type { Experience } from "@/lib/experiences/types";

export type DeslindePendiente = {
  reservationId: string;
  nombre: string;
  email: string | null;
  slug: string;
  experiencia: string;
  salidaLabel: string;
};

export async function fetchDeslindesPendientes(): Promise<DeslindePendiente[]> {
  try {
    const sb = createSupabaseAdminClient();
    const [exps, resvs, regs, contacts, slots] = await Promise.all([
      sb.from("experiences").select("id, slug, data"),
      sb.from("reservations").select("id, contact_id, experience_id, status, slot_id"),
      sb.from("registrations").select("reservation_id"),
      sb.from("contacts").select("id, full_name, email"),
      sb.from("experience_slots").select("id, label"),
    ]);

    const activo = new Map<string, { slug: string; nombre: string }>();
    for (const e of (exps.data ?? []) as { id: string; slug: string; data: Experience }[]) {
      if (e.data?.registration?.active) {
        activo.set(e.id, { slug: e.slug, nombre: experienceTitle(e.data, e.slug) });
      }
    }
    const firmados = new Set((regs.data ?? []).map((r) => (r as { reservation_id: string }).reservation_id));
    const cById = new Map(
      ((contacts.data ?? []) as { id: string; full_name: string | null; email: string | null }[]).map((c) => [c.id, c]),
    );
    const labelBySlot = new Map(
      ((slots.data ?? []) as { id: string; label: string | null }[]).map((s) => [s.id, s.label || ""]),
    );

    const out: DeslindePendiente[] = [];
    for (const r of (resvs.data ?? []) as {
      id: string; contact_id: string; experience_id: string; status: string; slot_id: string | null;
    }[]) {
      const exp = activo.get(r.experience_id);
      if (!exp || !HOLDING_STATUSES.includes(r.status) || firmados.has(r.id)) continue;
      const c = cById.get(r.contact_id);
      out.push({
        reservationId: r.id,
        nombre: c?.full_name || c?.email || "—",
        email: c?.email ?? null,
        slug: exp.slug,
        experiencia: exp.nombre,
        salidaLabel: (r.slot_id && labelBySlot.get(r.slot_id)) || "",
      });
    }
    return out;
  } catch {
    return [];
  }
}
