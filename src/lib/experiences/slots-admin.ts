"use server";

import { puedeEditarSlug } from "@/lib/auth/alcance";
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
  // La casa, o el operador dueño de ESA experiencia.
  if (!(await puedeEditarSlug(slug))) return [];
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

// Crea/edita las salidas que se le nombran, y cierra SOLO las que se le pidan
// cerrar explícitamente por id.
//
// ⚠️ ANTES ESTA FUNCIÓN CERRABA POR AUSENCIA: lo que no venía en la lista se daba
// por eliminado. Con una sola puerta de alta —el formulario de la experiencia—
// eso funcionaba. Deja de funcionar en cuanto existe una segunda: una salida
// creada desde la pantalla de Salidas no aparecería en la lista del formulario,
// y el próximo que entrara a esa experiencia a corregir una foto la habría
// CERRADO al guardar. Sin error, sin aviso: simplemente dejaría de venderse.
//
// Por eso el cierre pasó a ser explícito. El formulario manda los ids de las
// filas que la persona quitó a mano, que es lo que de verdad quiso decir. El
// comportamiento visible no cambia; lo que cambia es que la ausencia ya no
// significa nada.
//
// Nada se borra nunca: cerrar conserva la fila y sus reservas.
export async function saveExperienceSlots(
  slug: string,
  slots: AdminSlotInput[],
  opts?: { cerrarIds?: string[] },
): Promise<SlotsResult> {
  // El permiso va por SLUG y contra la base, no contra lo que llegue del form:
  // este action escribe las salidas de la experiencia que le nombren.
  if (!(await puedeEditarSlug(slug))) {
    return { ok: false, error: "No autorizado sobre esa experiencia." };
  }
  const sb = createSupabaseAdminClient();
  const expId = await experienceIdBySlug(sb, slug);
  if (!expId) return { ok: false, error: "No encontré la experiencia (¿ya la guardaste?)." };

  // Validación: cada salida necesita label + fecha de inicio (NOT NULL en BD).
  // ⚠️ Y el fin NUNCA puede ser anterior al inicio: `ends_at` es lo que dispara la
  // ENCUESTA automática (+24h), así que un mes mal tecleado manda el correo
  // "¿cómo te fue?" ANTES del viaje. Pasó de verdad: la salida "Ago 29-30" de
  // volcanes se guardó con ends_at en JULIO (corregido a mano el 3 ago 2026) y
  // el sistema la daba por terminada 4 semanas antes de salir.
  for (const s of slots) {
    if (!s.label?.trim()) return { ok: false, error: "Cada salida necesita una etiqueta (label)." };
    if (!s.startsAt) return { ok: false, error: `La salida "${s.label}" necesita fecha de inicio.` };
    if (s.endsAt) {
      const ini = Date.parse(s.startsAt);
      const fin = Date.parse(s.endsAt);
      if (Number.isNaN(fin)) return { ok: false, error: `La salida "${s.label}" tiene una fecha de fin inválida.` };
      if (!Number.isNaN(ini) && fin < ini) {
        return {
          ok: false,
          error: `La salida "${s.label}" termina antes de empezar (${s.startsAt.slice(0, 10)} → ${s.endsAt.slice(0, 10)}). Revisa el mes o el año.`,
        };
      }
    }
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

  // Cerrar SOLO lo que se pidió cerrar, por id, y nunca algo que se acabe de
  // guardar en esta misma llamada (si alguien quita una fila y vuelve a poner la
  // misma fecha antes de guardar, gana lo que está en pantalla).
  //
  // Se acota a `experience_id` aunque el id ya sea único: un id de otra
  // experiencia llegando por aquí no debe poder cerrar nada.
  const cerrar = (opts?.cerrarIds ?? []).filter((id) => id && !keepIds.includes(id));
  if (cerrar.length > 0) {
    const { error: closeErr } = await sb
      .from("experience_slots")
      .update({ status: "closed" })
      .eq("experience_id", expId)
      .in("id", cerrar);
    if (closeErr) return { ok: false, error: closeErr.message };
  }

  return { ok: true };
}
