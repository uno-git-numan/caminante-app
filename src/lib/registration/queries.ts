import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchSlotAvailability } from "@/lib/experiences/availability";
import type { Experience } from "@/lib/experiences/types";
import type { DependentOption, MedicalProfileData, RegistrationPrefill, SlotOption } from "./types";

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
    .select("id, label, status, starts_at")
    .eq("experience_id", data.id)
    .eq("status", "open")
    .order("starts_at", { ascending: true });

  // Disponibilidad EN VIVO desde reservations (paid + registrados apartan), no del
  // contador seats_taken. null = salida sin tope → nunca "agotada".
  const avail = await fetchSlotAvailability(data.id as string);
  const slots: SlotOption[] = (slotRows || []).map((s) => ({
    id: s.id as string,
    label: (s.label as string) || "",
    seatsAvailable: avail.get(s.id as string)?.available ?? null,
    status: s.status as string,
  }));

  return { experienceId: data.id as string, experience, slots };
}

// Salida FIJA cuando el deslinde se firma sobre una reserva ya hecha: la fecha ya
// se eligió al reservar, no debe volver a preguntarse. Devuelve la salida de esa
// reserva (validando que pertenezca a la experiencia y no esté cancelada) para
// mostrarla bloqueada. null → no se bloquea (flujo normal con selector).
export async function fetchReservationLock(
  reservationId: string,
  experienceId: string,
): Promise<{ slotId: string; slotLabel: string } | null> {
  const sb = createSupabaseAdminClient();
  const { data: r } = await sb
    .from("reservations")
    .select("id, slot_id, status, experience_id")
    .eq("id", reservationId)
    .maybeSingle();
  if (!r || r.experience_id !== experienceId) return null;
  const holding = ["requested", "confirmed", "partially_paid", "paid", "completed"];
  if (!holding.includes(r.status as string)) return null;
  if (!r.slot_id) return null;
  const { data: s } = await sb
    .from("experience_slots")
    .select("label")
    .eq("id", r.slot_id as string)
    .maybeSingle();
  return { slotId: r.slot_id as string, slotLabel: (s?.label as string) || "" };
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

function mapDependent(row: Record<string, unknown>): DependentOption {
  const s = (k: string) => (row[k] as string | null) || "";
  return {
    id: row.id as string,
    fullName: s("full_name"),
    birthDate: s("birth_date"),
    relationship: s("relationship"),
    bloodType: s("blood_type"),
    conditions: s("conditions"),
    medications: s("medications"),
    allergies: s("allergies"),
    dietaryRestrictions: s("dietary_restrictions"),
    fitnessNotes: s("fitness_notes"),
    emergencyName: s("emergency_name"),
    emergencyRelationship: s("emergency_relationship"),
    emergencyPhone: s("emergency_phone"),
  };
}

// Participantes guardados por un titular (para reusar en el formulario). Admin
// client: corre en el server component con el user ya verificado.
export async function fetchDependentsForContact(
  contactId: string,
): Promise<DependentOption[]> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("dependents")
    .select("*")
    .eq("guardian_contact_id", contactId)
    .order("full_name", { ascending: true });
  return (data || []).map((d) => mapDependent(d as Record<string, unknown>));
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

  const dependents = await fetchDependentsForContact(contact.id as string);

  return {
    fullName: (contact.full_name as string | null) || "",
    birthDate: (contact.birth_date as string | null) || "",
    email: (contact.email as string | null) || "",
    phone: (contact.phone as string | null) || "",
    city: (contact.city as string | null) || "",
    medical: mapMedical(medical as Record<string, unknown> | null),
    medicalUpdatedAt: (medical?.updated_at as string | null) || null,
    dependents,
  };
}
