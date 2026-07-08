"use server";

// Aprobar/rechazar solicitudes de fecha (slot_requests) desde el panel.
// Aprobar CREA la salida real: privada (con access_token → link cerrado de
// grupo) o abierta (pública, aparece en la web al instante). Inserta DIRECTO
// en experience_slots — no pasa por saveExperienceSlots (eso es del form).
// Cada action re-verifica isCurrentUserAdmin() (el gate del layout no cubre
// actions invocadas directo).

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const SITE = "https://caminante.numanhub.com";

export type AprobarResult =
  | {
      ok: true;
      slotId: string;
      visibility: "public" | "private";
      /** Link canónico a compartir (privado: con ?grupo=; abierto: página pública). */
      link: string;
      /** Mensaje listo para WhatsApp (botón copiar). */
      waMessage: string;
      /** true si la solicitud ya estaba aprobada (se re-muestra el link, no se duplica). */
      yaAprobada: boolean;
    }
  | { ok: false; error: string };

export type AprobarInput = {
  requestId: string;
  label: string;
  startsAt: string; // "YYYY-MM-DD" (se guarda a mediodía UTC, como el form)
  endsAt?: string | null; // "YYYY-MM-DD" — la encuesta automática +24h lo necesita
  capacity?: number | null; // null = sin tope
  priceMxn?: number | null; // null = precio base de la experiencia
  visibility: "public" | "private";
};

type RequestRow = {
  id: string;
  experience_id: string;
  contact_id: string;
  num_people: number;
  status: string;
  created_slot_id: string | null;
  experiences: { slug: string; data: { title?: string; titleAccent?: string; docTitle?: string } | null } | null;
  contacts: { full_name: string | null } | null;
};

function buildMensaje(opts: {
  nombre: string | null;
  titulo: string;
  label: string;
  visibility: "public" | "private";
  capacity: number | null;
  link: string;
}): string {
  const hola = `¡Hola${opts.nombre ? " " + opts.nombre.split(" ")[0] : ""}! 🌿`;
  const cupo = opts.capacity ? ` (cupo ${opts.capacity})` : "";
  if (opts.visibility === "private") {
    return (
      `${hola} Tu fecha para ${opts.titulo} está lista: ${opts.label}.\n` +
      `Cada quien aparta su lugar pagando aquí${cupo}:\n${opts.link}\n\n` +
      `El link es exclusivo de tu grupo. Cualquier duda, aquí estoy.`
    );
  }
  return (
    `${hola} Abrimos la fecha que pediste para ${opts.titulo}: ${opts.label}.\n` +
    `Aparta tu lugar aquí${cupo}:\n${opts.link}\n\n` +
    `La salida es abierta — comparte el link con quien quieras.`
  );
}

export async function approveSlotRequest(input: AprobarInput): Promise<AprobarResult> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const sb = createSupabaseAdminClient();

  const { data: req } = await sb
    .from("slot_requests")
    .select(
      "id, experience_id, contact_id, num_people, status, created_slot_id, experiences(slug, data), contacts(full_name)",
    )
    .eq("id", input.requestId)
    .maybeSingle();
  if (!req) return { ok: false, error: "No encontré la solicitud." };
  const r = req as unknown as RequestRow;
  const slug = r.experiences?.slug ?? "";
  const titulo =
    [r.experiences?.data?.title, r.experiences?.data?.titleAccent].filter(Boolean).join(" ").trim() ||
    r.experiences?.data?.docTitle ||
    slug;

  // Idempotencia: ya aprobada → re-armar el link del slot existente, sin duplicar.
  if (r.status === "approved" && r.created_slot_id) {
    const { data: slot } = await sb
      .from("experience_slots")
      .select("id, label, capacity_total, visibility, access_token")
      .eq("id", r.created_slot_id)
      .maybeSingle();
    if (!slot) return { ok: false, error: "La solicitud ya estaba aprobada pero su salida no existe." };
    const vis = (slot.visibility as "public" | "private") || "public";
    const link =
      vis === "private"
        ? `${SITE}/caminante/experiencias/${slug}?grupo=${slot.access_token}`
        : `${SITE}/caminante/experiencias/${slug}`;
    return {
      ok: true,
      slotId: slot.id as string,
      visibility: vis,
      link,
      waMessage: buildMensaje({
        nombre: r.contacts?.full_name ?? null,
        titulo,
        label: (slot.label as string) || "",
        visibility: vis,
        capacity: (slot.capacity_total as number | null) ?? null,
        link,
      }),
      yaAprobada: true,
    };
  }
  if (r.status !== "new") return { ok: false, error: "Esta solicitud ya fue resuelta." };

  const label = input.label.trim();
  if (!label) return { ok: false, error: "La salida necesita una etiqueta (ej. “Dic 5-7”)." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startsAt)) {
    return { ok: false, error: "La salida necesita fecha de inicio." };
  }

  const accessToken =
    input.visibility === "private" ? randomBytes(16).toString("base64url") : null;

  const { data: slot, error: insErr } = await sb
    .from("experience_slots")
    .insert({
      experience_id: r.experience_id,
      label,
      starts_at: `${input.startsAt}T12:00:00Z`,
      ends_at: input.endsAt ? `${input.endsAt}T23:00:00Z` : null,
      capacity_total: input.capacity ?? null,
      price_mxn: input.priceMxn ?? null,
      status: "open",
      visibility: input.visibility,
      access_token: accessToken,
      seats_taken: 0,
    })
    .select("id")
    .single();
  if (insErr) return { ok: false, error: insErr.message };

  const { error: upErr } = await sb
    .from("slot_requests")
    .update({ status: "approved", created_slot_id: slot.id, resolved_at: new Date().toISOString() })
    .eq("id", r.id)
    .eq("status", "new");
  if (upErr) return { ok: false, error: `La salida se creó pero no pude marcar la solicitud: ${upErr.message}` };

  // OJO: aquí NO se hace revalidatePath — refrescaría la página al instante y
  // la tarjeta (con el link y el mensaje listos para copiar) desaparecería
  // antes de que el admin los copie. La lista se actualiza al navegar.

  const link =
    input.visibility === "private"
      ? `${SITE}/caminante/experiencias/${slug}?grupo=${accessToken}`
      : `${SITE}/caminante/experiencias/${slug}`;
  return {
    ok: true,
    slotId: slot.id as string,
    visibility: input.visibility,
    link,
    waMessage: buildMensaje({
      nombre: r.contacts?.full_name ?? null,
      titulo,
      label,
      visibility: input.visibility,
      capacity: input.capacity ?? null,
      link,
    }),
    yaAprobada: false,
  };
}

export async function rejectSlotRequest(requestId: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await isCurrentUserAdmin())) return { ok: false, error: "No autorizado." };
  const sb = createSupabaseAdminClient();
  const { error } = await sb
    .from("slot_requests")
    .update({ status: "rejected", resolved_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "new"); // solo desde 'new' (no pisa aprobadas)
  if (error) return { ok: false, error: error.message };
  revalidatePath("/caminante/admin/solicitudes");
  return { ok: true };
}
