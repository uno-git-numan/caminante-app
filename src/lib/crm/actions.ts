"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureContactLink, normalizeEmail, normalizePhoneMX } from "./contacts";
import type { MedicalProfileData } from "@/lib/registration/types";

type ActionResult = { ok: true } | { ok: false; error: string };

// Resuelve el contact del user con sesión; lo crea lazy si no existe (caso:
// logueó con un correo que nunca ha registrado nada — su cuenta empieza vacía).
async function ownContactId(): Promise<
  { ok: true; contactId: string } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Inicia sesión para editar tu perfil." };

  const sb = createSupabaseAdminClient();
  await ensureContactLink(sb, user);

  const { data: contact } = await sb
    .from("contacts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (contact) return { ok: true, contactId: contact.id as string };

  const email = normalizeEmail(user.email || "");
  if (!email) return { ok: false, error: "Tu cuenta no tiene correo." };
  const { data: created, error } = await sb
    .from("contacts")
    .insert({ email, user_id: user.id, source: "cuenta web", lifecycle_stage: "lead" })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, contactId: created.id as string };
}

export async function updateContactProfile(input: {
  fullName: string;
  phone: string;
  city: string;
  birthDate: string;
  mailingOptIn: boolean;
}): Promise<ActionResult> {
  const own = await ownContactId();
  if (!own.ok) return own;
  if (input.phone && !normalizePhoneMX(input.phone)) {
    return { ok: false, error: "Escribe un teléfono válido (10 dígitos)." };
  }

  const sb = createSupabaseAdminClient();
  const { data: current } = await sb
    .from("contacts")
    .select("mailing_opt_in, mailing_unsubscribed_at")
    .eq("id", own.contactId)
    .single();

  const patch: Record<string, unknown> = {
    full_name: input.fullName.trim() || null,
    phone: input.phone.trim() || null,
    city: input.city.trim() || null,
    birth_date: input.birthDate || null,
  };
  // El dueño SÍ puede cambiar su suscripción (es el único que puede revertir
  // una baja); re-suscribirse limpia mailing_unsubscribed_at.
  if (input.mailingOptIn && !current?.mailing_opt_in) {
    patch.mailing_opt_in = true;
    patch.mailing_unsubscribed_at = null;
  } else if (!input.mailingOptIn && current?.mailing_opt_in) {
    patch.mailing_opt_in = false;
    patch.mailing_unsubscribed_at = new Date().toISOString();
  }

  const { error } = await sb.from("contacts").update(patch).eq("id", own.contactId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateMedicalProfile(
  m: MedicalProfileData,
): Promise<ActionResult> {
  const own = await ownContactId();
  if (!own.ok) return own;

  const sb = createSupabaseAdminClient();
  const { error } = await sb.from("medical_profiles").upsert(
    {
      contact_id: own.contactId,
      blood_type: m.bloodType?.trim() || null,
      conditions: m.conditions?.trim() || null,
      medications: m.medications?.trim() || null,
      allergies: m.allergies?.trim() || null,
      dietary_restrictions: m.dietaryRestrictions?.trim() || null,
      fitness_notes: m.fitnessNotes?.trim() || null,
      emergency_name: m.emergencyName?.trim() || null,
      emergency_relationship: m.emergencyRelationship?.trim() || null,
      emergency_phone: m.emergencyPhone?.trim() || null,
      gender: m.gender?.trim() || null,
      curp: m.curp?.trim() || null,
      nationality: m.nationality?.trim() || null,
      government_id: m.governmentId?.trim() || null,
      occupation: m.occupation?.trim() || null,
      beneficiary_name: m.beneficiaryName?.trim() || null,
      beneficiary_relationship: m.beneficiaryRelationship?.trim() || null,
      beneficiary_phone: m.beneficiaryPhone?.trim() || null,
    },
    { onConflict: "contact_id" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
