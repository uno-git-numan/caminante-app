"use server";

// Acciones de escritura del dashboard de admin (gestión de EVENTOS: salidas,
// operador, publicación). Separado de actions.ts (marketplace dormido, no tocar).
//
// SEGURIDAD: el gate del layout NO protege server actions invocadas directo →
// cada acción re-verifica isCurrentUserAdmin() ANTES de tocar la base.
// GUARDAS de negocio:
//   - Las salidas NUNCA se borran: se cierran (status) para conservar historia.
//   - 'cancelled' solo si la salida no tiene reservas que apartan lugar.
//   - capacity_total nunca por debajo de la ocupación actual.
// Cada write revalida las rutas del admin afectadas.

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { fetchSlotAvailability } from "@/lib/experiences/availability";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

const OK: AdminActionResult = { ok: true };
const fail = (error: string): AdminActionResult => ({ ok: false, error });

async function requireAdmin(): Promise<AdminActionResult | null> {
  if (!(await isCurrentUserAdmin())) return fail("Solo el admin puede hacer esto.");
  return null;
}

function revalidateAdmin(slug?: string) {
  revalidatePath("/caminante/admin");
  revalidatePath("/caminante/admin/eventos");
  if (slug) revalidatePath(`/caminante/admin/eventos/${slug}`);
}

// ── Salidas (experience_slots) ───────────────────────────────────────────

export async function createSlot(input: {
  experienceId: string;
  slug: string;
  label: string;
  startsAt: string; // ISO
  endsAt?: string | null;
  capacityTotal: number | null; // null = sin tope
  priceMxn: number | null; // null = precio base de la experiencia
}): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const label = (input.label || "").trim();
  if (!label) return fail("Ponle una etiqueta a la salida (ej. “Dom 26 jul”).");
  if (!input.startsAt || Number.isNaN(Date.parse(input.startsAt))) {
    return fail("La fecha de la salida no es válida.");
  }
  if (
    input.capacityTotal !== null &&
    (!Number.isInteger(input.capacityTotal) || input.capacityTotal < 0)
  ) {
    return fail("El cupo debe ser un entero positivo (o vacío para sin tope).");
  }
  if (input.priceMxn !== null && input.priceMxn <= 0) {
    return fail("El precio debe ser mayor a cero (o vacío para usar el precio base).");
  }

  const sb = createSupabaseAdminClient();
  const { data: exp } = await sb
    .from("experiences")
    .select("id")
    .eq("id", input.experienceId)
    .maybeSingle();
  if (!exp) return fail("La experiencia no existe.");

  const { error } = await sb.from("experience_slots").insert({
    experience_id: input.experienceId,
    label,
    starts_at: input.startsAt,
    ends_at: input.endsAt || null,
    capacity_total: input.capacityTotal,
    price_mxn: input.priceMxn,
    status: "open",
  });
  if (error) return fail(error.message);
  revalidateAdmin(input.slug);
  return OK;
}

export async function updateSlot(input: {
  slotId: string;
  slug: string;
  label?: string;
  startsAt?: string;
  endsAt?: string | null;
  capacityTotal?: number | null;
  priceMxn?: number | null;
  status?: "open" | "closed" | "cancelled";
}): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const sb = createSupabaseAdminClient();
  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, experience_id, status")
    .eq("id", input.slotId)
    .maybeSingle();
  if (!slot) return fail("Esa salida no existe.");

  // Ocupación actual (reservas que apartan) — para las guardas.
  const avail = await fetchSlotAvailability(slot.experience_id as string);
  const taken = avail.get(input.slotId)?.taken ?? 0;

  const patch: Record<string, unknown> = {};
  if (input.label !== undefined) {
    const l = input.label.trim();
    if (!l) return fail("La etiqueta no puede quedar vacía.");
    patch.label = l;
  }
  if (input.startsAt !== undefined) {
    if (Number.isNaN(Date.parse(input.startsAt))) return fail("Fecha inválida.");
    patch.starts_at = input.startsAt;
  }
  if (input.endsAt !== undefined) patch.ends_at = input.endsAt || null;
  if (input.capacityTotal !== undefined) {
    if (input.capacityTotal !== null) {
      if (!Number.isInteger(input.capacityTotal) || input.capacityTotal < 0) {
        return fail("El cupo debe ser un entero positivo (o vacío para sin tope).");
      }
      if (input.capacityTotal < taken) {
        return fail(
          `No puedes bajar el cupo a ${input.capacityTotal}: ya hay ${taken} lugares tomados.`,
        );
      }
    }
    patch.capacity_total = input.capacityTotal;
  }
  if (input.priceMxn !== undefined) {
    if (input.priceMxn !== null && input.priceMxn <= 0) return fail("Precio inválido.");
    patch.price_mxn = input.priceMxn;
  }
  if (input.status !== undefined) {
    if (!["open", "closed", "cancelled"].includes(input.status)) return fail("Estado inválido.");
    if (input.status === "cancelled" && taken > 0) {
      return fail(
        `Esta salida tiene ${taken} lugares apartados: ciérrala (deja de venderse) en vez de cancelarla, y resuelve esas reservas primero.`,
      );
    }
    patch.status = input.status;
  }
  if (Object.keys(patch).length === 0) return fail("Nada que actualizar.");

  const { error } = await sb.from("experience_slots").update(patch).eq("id", input.slotId);
  if (error) return fail(error.message);
  revalidateAdmin(input.slug);
  return OK;
}

// ── Operadores ───────────────────────────────────────────────────────────

export async function assignOperator(input: {
  experienceId: string;
  slug: string;
  operatorId: string | null; // null = quitar
}): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const sb = createSupabaseAdminClient();
  if (input.operatorId) {
    const { data: op } = await sb
      .from("operators")
      .select("id")
      .eq("id", input.operatorId)
      .maybeSingle();
    if (!op) return fail("Ese operador no existe.");
  }
  const { error } = await sb
    .from("experiences")
    .update({ operator_id: input.operatorId })
    .eq("id", input.experienceId);
  if (error) return fail(error.message);
  revalidateAdmin(input.slug);
  return OK;
}

export async function createOperator(input: {
  name: string;
  email: string;
  commissionPct: number | null; // null = por definir
}): Promise<AdminActionResult & { operatorId?: string }> {
  const guard = await requireAdmin();
  if (guard) return guard;

  const name = (input.name || "").trim();
  const email = (input.email || "").trim().toLowerCase();
  if (!name) return fail("Falta el nombre del operador.");
  if (!email.includes("@")) return fail("Correo del operador inválido.");
  if (input.commissionPct !== null && (input.commissionPct < 0 || input.commissionPct > 100)) {
    return fail("La comisión debe estar entre 0 y 100 (o vacía = por definir).");
  }

  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("operators")
    .insert({ name, email, commission_pct: input.commissionPct })
    .select("id")
    .single();
  if (error) return fail(error.message);
  revalidateAdmin();
  return { ok: true, operatorId: data.id as string };
}

export async function updateOperatorCommission(input: {
  operatorId: string;
  commissionPct: number | null;
}): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (input.commissionPct !== null && (input.commissionPct < 0 || input.commissionPct > 100)) {
    return fail("La comisión debe estar entre 0 y 100 (o vacía = por definir).");
  }
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("operators")
    .update({ commission_pct: input.commissionPct })
    .eq("id", input.operatorId);
  if (error) return fail(error.message);
  revalidateAdmin();
  return OK;
}

// ── Publicar / despublicar experiencia ───────────────────────────────────

export async function setExperienceStatus(input: {
  experienceId: string;
  slug: string;
  status: "draft" | "published";
}): Promise<AdminActionResult> {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!["draft", "published"].includes(input.status)) return fail("Estado inválido.");

  const sb = createSupabaseAdminClient();
  // El status vive en la columna Y dentro del jsonb data (lectores usan ambos).
  const { data: row } = await sb
    .from("experiences")
    .select("data")
    .eq("id", input.experienceId)
    .maybeSingle();
  if (!row) return fail("La experiencia no existe.");
  const data = { ...(row.data as Record<string, unknown>), status: input.status };
  const { error } = await sb
    .from("experiences")
    .update({ status: input.status, data })
    .eq("id", input.experienceId);
  if (error) return fail(error.message);
  revalidateAdmin(input.slug);
  revalidatePath(`/caminante/experiencias/${input.slug}`);
  return OK;
}
