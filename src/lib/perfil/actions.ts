"use server";

// Actions de "Mi espacio": wrappers FormData sobre la lógica existente de
// crm/actions (que ya valida sesión y resuelve el contact propio) + alta de
// acompañante. Mismo patrón que el dashboard: redirect con ?ok / ?error.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { updateContactProfile, updateMedicalProfile } from "@/lib/crm/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const VOLVER = "/caminante/perfil";

function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

function volver(ok: boolean, msg?: string): never {
  const q = ok ? "ok=1" : `error=${encodeURIComponent(msg || "No se pudo guardar.")}`;
  revalidatePath(VOLVER);
  redirect(`${VOLVER}?${q}`);
}

export async function guardarDatosAction(fd: FormData): Promise<void> {
  const r = await updateContactProfile({
    fullName: s(fd, "fullName"),
    phone: s(fd, "phone"),
    city: s(fd, "city"),
    birthDate: s(fd, "birthDate"),
    mailingOptIn: fd.get("mailingOptIn") === "on",
  });
  volver(r.ok, r.ok ? undefined : r.error);
}

export async function guardarMedicoAction(fd: FormData): Promise<void> {
  const r = await updateMedicalProfile({
    bloodType: s(fd, "bloodType"),
    allergies: s(fd, "allergies"),
    conditions: s(fd, "conditions"),
    medications: s(fd, "medications"),
    dietaryRestrictions: s(fd, "dietaryRestrictions"),
    emergencyName: s(fd, "emergencyName"),
    emergencyRelationship: s(fd, "emergencyRelationship"),
    emergencyPhone: s(fd, "emergencyPhone"),
  });
  volver(r.ok, r.ok ? undefined : r.error);
}

export async function agregarAcompananteAction(fd: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/caminante/login?next=%2Fcaminante%2Fperfil");

  const nombre = s(fd, "fullName");
  if (!nombre) volver(false, "Escribe el nombre de tu acompañante.");

  const sb = createSupabaseAdminClient();
  const { data: contact } = await sb
    .from("contacts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!contact) volver(false, "No encontramos tu expediente. Escríbenos por WhatsApp.");

  // Dedupe por (guardián, nombre) — mismo criterio que el deslinde.
  const { data: existing } = await sb
    .from("dependents")
    .select("id")
    .eq("guardian_contact_id", contact.id)
    .ilike("full_name", nombre)
    .maybeSingle();

  const row = {
    guardian_contact_id: contact.id,
    full_name: nombre,
    relationship: s(fd, "relationship") || null,
    birth_date: s(fd, "birthDate") || null,
  };
  const { error } = existing
    ? await sb.from("dependents").update(row).eq("id", existing.id)
    : await sb.from("dependents").insert(row);
  volver(!error, error?.message);
}
