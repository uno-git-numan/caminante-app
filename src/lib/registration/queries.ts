import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import type { MedicalProfileData, RegistrationPrefill, SlotOption } from "./types";

export type RegistrationContext = {
  experienceId: string;
  experience: Experience;
  slots: SlotOption[];
};

// Contexto de la página de registro: experiencia publicada con registro activo
// + sus salidas abiertas. Lecturas vía server client (RLS public read).
export async function fetchRegistrationContext(
  slug: string,
): Promise<RegistrationContext | null> {
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("experiences")
    .select("id, data")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data?.data) return null;

  const experience = data.data as Experience;
  if (!experience.registration?.active) return null;

  const { data: slotRows } = await sb
    .from("experience_slots")
    .select("id, label, seats_available, status, starts_at")
    .eq("experience_id", data.id)
    .eq("status", "open")
    .order("starts_at", { ascending: true });

  const slots: SlotOption[] = (slotRows || []).map((s) => ({
    id: s.id as string,
    label: (s.label as string) || "",
    // null = salida sin tope (capacity_total NULL). NO colapsar a 0: eso la
    // mostraría "agotada". La columna generada seats_available es NULL en ese caso.
    seatsAvailable: s.seats_available === null ? null : (s.seats_available as number),
    status: s.status as string,
  }));

  return { experienceId: data.id as string, experience, slots };
}

function mapMedical(row: Record<string, unknown> | null): MedicalProfileData | null {
  if (!row) return null;
  const s = (k: string) => (row[k] as string | null) || "";
  return {
    bloodType: s("blood_type"),
    conditions: s("conditions"),
    medications: s("medications"),
    allergies: s("allergies"),
    dietaryRestrictions: s("dietary_restrictions"),
    fitnessNotes: s("fitness_notes"),
    emergencyName: s("emergency_name"),
    emergencyRelationship: s("emergency_relationship"),
    emergencyPhone: s("emergency_phone"),
    gender: s("gender"),
    curp: s("curp"),
    nationality: s("nationality"),
    governmentId: s("government_id"),
    occupation: s("occupation"),
    beneficiaryName: s("beneficiary_name"),
    beneficiaryRelationship: s("beneficiary_relationship"),
    beneficiaryPhone: s("beneficiary_phone"),
  };
}

// Prefill para usuarios con sesión ("confirma y firma"). Admin client porque
// corre en el server component con el user ya verificado por getCurrentUser().
export async function fetchPrefillForUser(
  userId: string,
): Promise<RegistrationPrefill | null> {
  const sb = createSupabaseAdminClient();
  const { data: contact } = await sb
    .from("contacts")
    .select("id, full_name, birth_date, email, phone, city")
    .eq("user_id", userId)
    .maybeSingle();
  if (!contact) return null;

  const { data: medical } = await sb
    .from("medical_profiles")
    .select("*")
    .eq("contact_id", contact.id)
    .maybeSingle();

  return {
    fullName: (contact.full_name as string | null) || "",
    birthDate: (contact.birth_date as string | null) || "",
    email: (contact.email as string | null) || "",
    phone: (contact.phone as string | null) || "",
    city: (contact.city as string | null) || "",
    medical: mapMedical(medical as Record<string, unknown> | null),
    medicalUpdatedAt: (medical?.updated_at as string | null) || null,
  };
}
