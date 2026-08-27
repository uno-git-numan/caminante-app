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
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { puedeEditarExperiencia, puedeEditarSlot } from "@/lib/auth/alcance";
import { fetchSlotAvailability } from "@/lib/experiences/availability";
import { listaParaPublicar } from "@/lib/experiences/flujo-venta";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

const OK: AdminActionResult = { ok: true };
const fail = (error: string): AdminActionResult => ({ ok: false, error });

async function requireAdmin(): Promise<AdminActionResult | null> {
  if (!(await isCurrentUserAdmin())) return fail("Solo el admin puede hacer esto.");
  return null;
}

// Las dos guardas del OPERADOR: dicen que sí a la casa siempre, y al operador
// solo sobre lo suyo. Se resuelven contra la BASE con el id que llega, nunca
// contra un campo del formulario — el id viaja en un `<input hidden>` y
// cambiarlo es abrir el inspector.
async function requireExperiencia(experienceId: string): Promise<AdminActionResult | null> {
  if (!(await puedeEditarExperiencia(experienceId))) return fail("Esa experiencia no es tuya.");
  return null;
}
async function requireSalida(slotId: string): Promise<AdminActionResult | null> {
  if (!(await puedeEditarSlot(slotId))) return fail("Esa salida no es tuya.");
  return null;
}

function revalidateAdmin(slug?: string) {
  revalidatePath("/caminante/admin");
  revalidatePath("/caminante/admin/eventos");
  if (slug) revalidatePath(`/caminante/admin/eventos/${slug}`);
}

// ── Salidas (experience_slots) ───────────────────────────────────────────
//
// UNA SALIDA ES UN OBJETO PROPIO: la experiencia es la plantilla atemporal y la
// salida es la instancia que se vende. Por eso crear una salida es un acto
// propio (`crearSalida`) y no un renglón de la lista del formulario.
//
// ⚠️ Y por eso `saveExperienceSlots` dejó de cerrar por ausencia. Mientras el
// formulario era la única puerta, «lo que no venga en la lista se cierra»
// funcionaba. Con dos puertas, una salida creada aquí no aparecería en la lista
// del formulario y el próximo guardado de esa experiencia la habría cerrado sin
// decir nada. Hoy el cierre viaja por id, siempre.

/**
 * Crea UNA salida. Es la primitiva de la pantalla «Salidas».
 *
 * Nace `open` y `public`: crear una salida ES ponerla a la venta — para eso se
 * crea. Lo que decide si el público la ve es que su EXPERIENCIA esté publicada,
 * y eso se avisa arriba, en la pantalla, no se resuelve callado aquí.
 */
export async function crearSalida(input: {
  experienceId: string;
  slug: string;
  label: string;
  startsAt: string;
  endsAt?: string | null;
  capacityTotal?: number | null;
  priceMxn?: number | null;
}): Promise<AdminActionResult & { slotId?: string }> {
  const guard = await requireExperiencia(input.experienceId);
  if (guard) return guard;

  const label = input.label.trim();
  if (!label) return fail("La salida necesita una etiqueta (cómo se muestra la fecha).");
  if (!input.startsAt || Number.isNaN(Date.parse(input.startsAt))) {
    return fail("La salida necesita una fecha de inicio válida.");
  }
  // ⚠️ Mismo guard que en updateSlot y en slots-admin: `ends_at` dispara la
  // encuesta automática (+24h), así que un mes mal tecleado manda «¿cómo te
  // fue?» ANTES del viaje. Ya pasó con una salida de volcanes.
  if (input.endsAt) {
    const fin = Date.parse(input.endsAt);
    if (Number.isNaN(fin)) return fail("Fecha de fin inválida.");
    if (fin < Date.parse(input.startsAt)) {
      return fail("La salida no puede terminar antes de empezar. Revisa el mes o el año.");
    }
  }
  if (input.capacityTotal != null && (!Number.isInteger(input.capacityTotal) || input.capacityTotal < 0)) {
    return fail("El cupo debe ser un entero positivo (o vacío para sin tope).");
  }
  if (input.priceMxn != null && input.priceMxn <= 0) return fail("Precio inválido.");

  const sb = createSupabaseAdminClient();

  // No crear dos veces la misma fecha. Pasó con «los 4 de agosto repetidos»:
  // guardar dos veces sin recargar duplicaba la salida, y una fecha duplicada
  // parte el cupo en dos y descuadra el roster.
  const { data: yaExiste } = await sb
    .from("experience_slots")
    .select("id")
    .eq("experience_id", input.experienceId)
    .eq("starts_at", input.startsAt)
    .eq("status", "open")
    .eq("visibility", "public")
    .maybeSingle();
  if (yaExiste) {
    return fail("Ya existe una salida abierta con esa fecha de inicio para esta experiencia.");
  }

  const { data, error } = await sb
    .from("experience_slots")
    .insert({
      experience_id: input.experienceId,
      label,
      starts_at: input.startsAt,
      ends_at: input.endsAt || null,
      capacity_total: input.capacityTotal ?? null,
      price_mxn: input.priceMxn ?? null,
      status: "open",
      visibility: "public",
      seats_taken: 0,
    })
    .select("id")
    .single();
  if (error || !data) return fail(error?.message ?? "No se pudo crear la salida.");

  revalidateAdmin(input.slug);
  revalidatePath("/caminante/admin/salidas");
  return { ok: true, slotId: data.id as string };
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
  const guard = await requireSalida(input.slotId);
  if (guard) return guard;

  const sb = createSupabaseAdminClient();
  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, experience_id, status, starts_at") // starts_at: para validar que el fin no sea anterior
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
  if (input.endsAt !== undefined) {
    // ⚠️ El fin no puede ser anterior al inicio: `ends_at` dispara la ENCUESTA
    // automática (+24h) — una fecha invertida manda "¿cómo te fue?" antes del
    // viaje. Se compara contra el inicio NUEVO si viene en el mismo patch, y si
    // no contra el guardado. (Ver el mismo guard en slots-admin.ts.)
    if (input.endsAt) {
      const fin = Date.parse(input.endsAt);
      if (Number.isNaN(fin)) return fail("Fecha de fin inválida.");
      const iniRaw = (patch.starts_at as string | undefined) ?? (slot.starts_at as string | null);
      const ini = iniRaw ? Date.parse(iniRaw) : NaN;
      if (!Number.isNaN(ini) && fin < ini) {
        return fail("La salida no puede terminar antes de empezar. Revisa el mes o el año.");
      }
    }
    patch.ends_at = input.endsAt || null;
  }
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
  const guard = await requireExperiencia(input.experienceId);
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
  // REGLA DE LUIS: nada se publica sin TODO prendido — deslinde completo (caso
  // Enyd, 9 jul) y encuesta activa (caso hongos, 3 ago). Este camino antes no
  // validaba nada y era el bypass del gate del formulario.
  if (input.status === "published") {
    const flujo = listaParaPublicar(row.data as import("@/lib/experiences/types").Experience);
    if (!flujo.ok) {
      return fail(
        `No se puede publicar todavía: ${flujo.faltantes.join(" ")} ` +
          `Complétalo en el formulario de la experiencia.`,
      );
    }
  }
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

// ── Eliminar experiencia ─────────────────────────────────────────────────
// GUARDA DURA: solo se puede eliminar si NO tiene reservas (de ningún estado).
// Con reservas la historia comercial/legal se conserva → el camino es "Pasar a
// borrador" (la despublica sin borrar nada). Si está limpia, se borran sus
// salidas y la fila. El deslinde/registros ni se tocan (una experiencia con
// registros siempre tiene reservas → cae en la guarda).
export async function deleteExperience(input: {
  experienceId: string;
}): Promise<AdminActionResult> {
  const guard = await requireExperiencia(input.experienceId);
  if (guard) return guard;

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experiences")
    .select("id, slug")
    .eq("id", input.experienceId)
    .maybeSingle();
  if (!row) return fail("La experiencia no existe.");

  const { count, error: cntErr } = await sb
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("experience_id", input.experienceId);
  if (cntErr) return fail(cntErr.message);
  if ((count ?? 0) > 0) {
    return fail(
      `No se puede eliminar: tiene ${count} reserva${count === 1 ? "" : "s"} (la historia se conserva). Usa "Pasar a borrador" para quitarla del sitio.`,
    );
  }

  const { error: slotErr } = await sb
    .from("experience_slots")
    .delete()
    .eq("experience_id", input.experienceId);
  if (slotErr) return fail(slotErr.message);
  const { error } = await sb.from("experiences").delete().eq("id", input.experienceId);
  if (error) return fail(error.message);

  revalidateAdmin(row.slug as string);
  revalidatePath(`/caminante/experiencias/${row.slug}`);
  return OK;
}

// ── Wrappers de <form action> (FormData → acción → redirect con feedback) ──
// El feedback viaja como ?ok= / ?error= en la URL del evento (la página lo pinta).

function str(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}
// "" → null (sin tope / precio base); número inválido → NaN (lo cacha la guarda)
function numOrNull(fd: FormData, k: string): number | null {
  const s = str(fd, k);
  return s === "" ? null : Number(s.replace(/[^0-9.]/g, ""));
}
function volver(slug: string, r: AdminActionResult, okMsg: string): never {
  const q = r.ok ? `ok=${encodeURIComponent(okMsg)}` : `error=${encodeURIComponent(r.error)}`;
  redirect(`/caminante/admin/eventos/${slug}?${q}`);
}

export async function setSlotStatusAction(fd: FormData): Promise<void> {
  const slug = str(fd, "slug");
  const status = str(fd, "status") as "open" | "closed" | "cancelled";
  const r = await updateSlot({ slotId: str(fd, "slotId"), slug, status });
  volver(slug, r, status === "open" ? "Salida reabierta." : "Salida cerrada.");
}

export async function assignOperatorAction(fd: FormData): Promise<void> {
  const slug = str(fd, "slug");
  const operatorId = str(fd, "operatorId") || null;
  let r: AdminActionResult = await assignOperator({
    experienceId: str(fd, "experienceId"),
    slug,
    operatorId,
  });
  // comisión del operador (opcional, viaja junto)
  const pct = numOrNull(fd, "commissionPct");
  if (r.ok && operatorId) {
    r = await updateOperatorCommission({ operatorId, commissionPct: pct });
  }
  volver(slug, r, "Operador guardado.");
}

export async function createOperatorAction(fd: FormData): Promise<void> {
  const slug = str(fd, "slug");
  const r = await createOperator({
    name: str(fd, "name"),
    email: str(fd, "email"),
    commissionPct: numOrNull(fd, "commissionPct"),
  });
  if (r.ok && r.operatorId && str(fd, "experienceId")) {
    await assignOperator({ experienceId: str(fd, "experienceId"), slug, operatorId: r.operatorId });
  }
  volver(slug, r, "Operador creado y asignado.");
}

export async function setExperienceStatusAction(fd: FormData): Promise<void> {
  const slug = str(fd, "slug");
  const r = await setExperienceStatus({
    experienceId: str(fd, "experienceId"),
    slug,
    status: str(fd, "status") as "draft" | "published",
  });
  volver(slug, r, str(fd, "status") === "published" ? "Experiencia publicada." : "Pasada a borrador.");
}

export async function deleteExperienceAction(fd: FormData): Promise<void> {
  const slug = str(fd, "slug");
  // confirmación explícita: el checkbox del form debe venir marcado
  if (str(fd, "confirmar") !== "si") {
    volver(slug, fail("Marca la casilla de confirmación para eliminar."), "");
  }
  const r = await deleteExperience({ experienceId: str(fd, "experienceId") });
  if (r.ok) {
    // la página del evento ya no existe → a la lista con el aviso
    redirect(`/caminante/admin/eventos?ok=${encodeURIComponent("Experiencia eliminada.")}`);
  }
  volver(slug, r, "");
}
