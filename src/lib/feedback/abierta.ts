"use server";

// ENCUESTA ABIERTA POR SALIDA — la segunda puerta (5 ago 2026).
//
// La primera puerta es el token personal que sale por correo +24h. Deja fuera a
// todo el que no pagó: en hongos (26 jul) fueron 18 personas y solo 7 tenían
// link. Esta puerta es UN link por SALIDA que Luis manda al grupo de WhatsApp.
//
// ⚠️ Por qué NO se puede mandar el token de alguien al grupo: `submitFeedback`
// hace UPDATE sobre la fila de ese token, así que cada respuesta pisaría la
// anterior y todas quedarían firmadas por la misma persona.
//
// DISEÑO: esta puerta **no responde la encuesta** — solo identifica a quien
// llega (nombre + correo), le consigue SU fila y lo manda al link personal de
// siempre. Así el formulario de la encuesta y `submitFeedback` quedan INTACTOS:
// una sola UI y un solo camino de escritura, que es lo que no debe divergir.
//
// Reuso: si el correo ya tiene fila en ESA salida —el titular que perdió el
// correo, o alguien que vuelve a entrar— se reusa su fila (el índice único
// parcial `(slot_id, contact_id)` de la 0031 lo garantiza). Nadie se duplica.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact } from "@/lib/crm/contacts";
import type { Experience } from "@/lib/experiences/types";

export type SalidaEncuesta = {
  slotToken: string;
  slotLabel: string;
  locationLabel: string;
  experienceTitle: string;
};

const TOKEN_OK = /^[A-Za-z0-9_-]{10,64}$/;

// Contexto para pintar la portada del link abierto. `null` = token inválido,
// salida inexistente o encuesta apagada (mismo criterio que usa el cron).
export async function fetchSalidaEncuesta(slotToken: string): Promise<SalidaEncuesta | null> {
  if (!slotToken || !TOKEN_OK.test(slotToken)) return null;
  const sb = createSupabaseAdminClient();
  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, label, experiences(data)")
    .eq("feedback_token", slotToken)
    .maybeSingle();
  if (!slot) return null;

  const exp = (slot.experiences as { data?: Experience } | null)?.data;
  const cfg = exp?.feedback;
  if (!cfg?.active) return null;

  return {
    slotToken,
    slotLabel: (slot.label as string) || "",
    locationLabel: cfg.locationLabel || "",
    experienceTitle: exp ? `${exp.title ?? ""} ${exp.titleAccent ?? ""}`.trim() : "",
  };
}

export type EntrarResult = { ok: true; token: string } | { ok: false; error: string };

// Identifica a quien llega por el link del grupo y devuelve SU token personal.
// No escribe respuestas: eso lo sigue haciendo `submitFeedback`.
export async function entrarEncuestaAbierta(input: {
  slotToken: string;
  fullName: string;
  email: string;
}): Promise<EntrarResult> {
  const nombre = (input.fullName || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const correo = (input.email || "").trim().toLowerCase().slice(0, 200);
  if (nombre.length < 2) return { ok: false, error: "Escribe tu nombre." };
  if (!correo.includes("@") || correo.length < 5) return { ok: false, error: "Escribe un correo válido." };
  if (!TOKEN_OK.test(input.slotToken)) return { ok: false, error: "Este enlace no es válido." };

  const sb = createSupabaseAdminClient();
  const { data: slot } = await sb
    .from("experience_slots")
    .select("id, experience_id, experiences(data)")
    .eq("feedback_token", input.slotToken)
    .maybeSingle();
  if (!slot) return { ok: false, error: "Esta encuesta ya no está disponible." };

  const cfg = (slot.experiences as { data?: Experience } | null)?.data?.feedback;
  if (!cfg?.active) return { ok: false, error: "Esta encuesta ya está cerrada." };

  // Dedupe en cascada con el MISMO helper del registro: no abrimos un segundo
  // criterio de identidad en el CRM.
  const res = await findOrCreateContact(sb, {
    fullName: nombre,
    email: correo,
    source: "encuesta-abierta",
  });
  if (!res.ok) return { ok: false, error: res.error };
  const contactId = res.contact.id as string;

  // ¿Ya tiene fila en esta salida? (titular que perdió el correo, o repite)
  const { data: existente } = await sb
    .from("experience_feedback")
    .select("token")
    .eq("slot_id", slot.id)
    .eq("contact_id", contactId)
    .maybeSingle();
  const yaTiene = (existente as { token?: string } | null)?.token;
  if (yaTiene) return { ok: true, token: yaTiene };

  const { data: creada, error } = await sb
    .from("experience_feedback")
    .insert({
      reservation_id: null, // un acompañante no compró: por eso la 0031 la hizo nullable
      contact_id: contactId,
      experience_id: slot.experience_id,
      slot_id: slot.id,
      location_label: cfg.locationLabel || null,
      status: "invited",
      source: "abierta",
      feedback_version: cfg.version || "v1",
    })
    .select("token")
    .single();
  if (error || !creada) {
    console.error("entrarEncuestaAbierta insert:", error);
    return { ok: false, error: "No pudimos abrir tu encuesta. Inténtalo de nuevo." };
  }
  return { ok: true, token: creada.token as string };
}
