"use server";

import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Alta/edición de las salidas (fechas + cupo) de una experiencia DESDE EL FORM,
// sin SQL manual. Escribe `experience_slots`, que es de donde lee
// /caminante/api/availability (capacity_total + reservas) y el bloqueo de registro.

export type AdminSlotInput = {
  id?: string; // si viene → edita; si no → crea
  label: string; // "Jun 12-15"
  startsAt: string; // ISO datetime (NOT NULL en BD)
  endsAt?: string | null; // ISO datetime — NECESARIO para la encuesta automática +24h
  capacity?: number | null; // null = salida sin tope
  priceMxn?: number | null; // precio por persona (opcional; si no, usa el de la experiencia)
};

export type AdminSlot = {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number | null;
  priceMxn: number | null;
  status: string;
  visibility: string; // 'public' | 'private' (privada = grupo con link cerrado)
  seatsTaken: number;
};

export type SlotsResult = { ok: true } | { ok: false; error: string };

async function experienceIdBySlug(
  sb: ReturnType<typeof createSupabaseAdminClient>,
  slug: string,
): Promise<string | null> {
  const { data } = await sb.from("experiences").select("id").eq("slug", slug).maybeSingle();
  return (data?.id as string) ?? null;
}

// Salidas existentes de una experiencia (para precargar la sección "Fechas & cupo").
export async function fetchSlotsForAdmin(slug: string): Promise<AdminSlot[]> {
  if (!(await isCurrentUserAdmin())) return [];
  const sb = createSupabaseAdminClient();
  const expId = await experienceIdBySlug(sb, slug);
  if (!expId) return [];
  const { data } = await sb
    .from("experience_slots")
    .select("id, label, starts_at, ends_at, capacity_total, price_mxn, status, visibility, seats_taken")
    .eq("experience_id", expId)
    .order("starts_at", { ascending: true });
  return (data ?? []).map((s) => {
    const r = s as Record<string, unknown>;
    return {
      id: r.id as string,
      label: (r.label as string) ?? "",
      startsAt: (r.starts_at as string) ?? "",
      endsAt: (r.ends_at as string) ?? null,
      capacity: (r.capacity_total as number) ?? null,
      priceMxn: (r.price_mxn as number) ?? null,
      status: (r.status as string) ?? "open",
      visibility: (r.visibility as string) ?? "public",
      seatsTaken: (r.seats_taken as number) ?? 0,
    };
  });
}

// Crea/edita las salidas; las que ya no estén en la lista se CIERRAN (status=closed),
// no se borran — así no se orfanan reservas existentes. Idempotente.
export async function saveExperienceSlots(
  slug: string,
  slots: AdminSlotInput[],
): Promise<SlotsResult> {
  if (!(await isCurrentUserAdmin())) {
    return { ok: false, error: "No autorizado. Inicia sesión como admin." };
  }
  const sb = createSupabaseAdminClient();
  const expId = await experienceIdBySlug(sb, slug);
  if (!expId) return { ok: false, error: "No encontré la experiencia (¿ya la guardaste?)." };

  // Validación: cada salida necesita label + fecha de inicio (NOT NULL en BD).
  for (const s of slots) {
    if (!s.label?.trim()) return { ok: false, error: "Cada salida necesita una etiqueta (label)." };
    if (!s.startsAt) return { ok: false, error: `La salida "${s.label}" necesita fecha de inicio.` };
  }

  const keepIds: string[] = [];

  for (const s of slots) {
    const fields = {
      experience_id: expId,
      label: s.label.trim(),
      starts_at: s.startsAt,
      ends_at: s.endsAt ?? null,
      capacity_total: s.capacity ?? null,
      price_mxn: s.priceMxn ?? null,
      status: "open",
    };
    // Fila sin id: antes de insertar, buscar una salida ABIERTA idéntica
    // (misma fecha y label) que aún no esté en keepIds — guardar dos veces sin
    // recargar ya NO duplica la fecha (bug de los "4 de agosto repetidos").
    let id = s.id ?? null;
    if (!id) {
      const { data: dup } = await sb
        .from("experience_slots")
        .select("id")
        .eq("experience_id", expId)
        .eq("status", "open")
        .eq("visibility", "public")
        .eq("starts_at", s.startsAt)
        .eq("label", fields.label);
      id = (dup ?? []).map((d) => d.id as string).find((x) => !keepIds.includes(x)) ?? null;
    }
    if (id) {
      // editar: NO tocar seats_taken (lo maneja el flujo de reservas)
      const { error } = await sb.from("experience_slots").update(fields).eq("id", id).eq("experience_id", expId);
      if (error) return { ok: false, error: error.message };
      keepIds.push(id);
    } else {
      const { data, error } = await sb
        .from("experience_slots")
        .insert({ ...fields, seats_taken: 0 })
        .select("id")
        .single();
      if (error) return { ok: false, error: error.message };
      keepIds.push(data.id as string);
    }
  }

  // Cerrar (no borrar) las salidas ABIERTAS PÚBLICAS que el form ya no incluye.
  // Las cerradas/canceladas conservan su estado y las PRIVADAS (grupos con
  // link) no se tocan: el form no las conoce — se operan en Solicitudes/Eventos.
  let q = sb
    .from("experience_slots")
    .update({ status: "closed" })
    .eq("experience_id", expId)
    .eq("status", "open")
    .eq("visibility", "public");
  if (keepIds.length > 0) q = q.not("id", "in", `(${keepIds.join(",")})`);
  const { error: closeErr } = await q;
  if (closeErr) return { ok: false, error: closeErr.message };

  return { ok: true };
}
