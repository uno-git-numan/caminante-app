"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { findOrCreateContact, normalizePhoneMX } from "@/lib/crm/contacts";
import type { Experience } from "@/lib/experiences/types";
import type { MedicalProfileData, RegistrationInput, RegistrationResult } from "./types";

// Sin transacciones multi-tabla en supabase-js: el orden (contact → medical →
// reservation → registration → sync_log) deja estados intermedios benignos y
// cada paso es idempotente — un retry del usuario completa el flujo.
export async function submitRegistration(
  input: RegistrationInput,
): Promise<RegistrationResult> {
  // 1 · Validación server-side (no confiar en el client)
  const fullName = (input.fullName || "").trim();
  const email = (input.email || "").trim().toLowerCase();
  const signatureName = (input.signatureName || "").trim();
  if (!fullName) return { ok: false, error: "Falta tu nombre completo." };
  if (!email.includes("@")) return { ok: false, error: "Escribe un correo válido." };
  if (!normalizePhoneMX(input.phone)) {
    return { ok: false, error: "Escribe un WhatsApp válido (10 dígitos)." };
  }
  if (!input.birthDate) return { ok: false, error: "Falta tu fecha de nacimiento." };
  if (input.waiverAccepted !== true) {
    return { ok: false, error: "Debes aceptar la Carta de Responsabilidad para continuar." };
  }
  if (input.privacyConsent !== true) {
    return { ok: false, error: "Debes aceptar el Aviso de Privacidad para continuar." };
  }
  if (!signatureName) {
    return { ok: false, error: "Escribe tu nombre completo como firma." };
  }
  const minors = (input.minors || []).filter((m) => (m.name || "").trim());

  // 2 · Re-fetch de la experiencia (published + registro activo). La versión y
  //     URL del deslinde salen DEL SERVIDOR, nunca del payload del cliente.
  const reader = await createSupabaseServerClient();
  const { data: expRow } = await reader
    .from("experiences")
    .select("id, data")
    .eq("slug", input.slug)
    .eq("status", "published")
    .maybeSingle();
  const experience = (expRow?.data as Experience | undefined) ?? undefined;
  if (!expRow || !experience?.registration?.active) {
    return { ok: false, error: "El registro de esta experiencia no está disponible." };
  }
  const experienceId = expRow.id as string;
  const { waiverVersion, waiverDocUrl } = experience.registration;

  const sb = createSupabaseAdminClient();
  const numPeople = 1 + minors.length;

  // 3 · Salida elegida
  let slotId: string | null = null;
  let slotLabel = (input.slotLabel || "").trim();
  if (input.slotId) {
    const { data: slot } = await sb
      .from("experience_slots")
      .select("id, label, status, seats_available")
      .eq("id", input.slotId)
      .eq("experience_id", experienceId)
      .maybeSingle();
    if (!slot || slot.status !== "open") {
      return { ok: false, error: "Esa salida ya no está disponible. Elige otra fecha." };
    }
    // seats_available NULL = salida sin tope → no se valida cupo. Solo se valida
    // cuando capacity_total es finito.
    const avail = slot.seats_available as number | null;
    if (avail !== null && avail < numPeople) {
      return { ok: false, error: "Esa salida ya no tiene lugares suficientes." };
    }
    slotId = slot.id as string;
    slotLabel = (slot.label as string) || slotLabel;
  }
  if (!slotLabel) {
    slotLabel = experience.datesBadge?.big || experience.datesBadge?.label || "Por confirmar";
  }

  // 4 · Contact (dedupe en cascada + enriquecer vacíos)
  const user = await getCurrentUser();
  const contactRes = await findOrCreateContact(sb, {
    email,
    fullName,
    phone: input.phone,
    city: input.city,
    birthDate: input.birthDate,
    source: `registro web · ${input.slug}`,
    newsletterOptIn: input.newsletterOptIn,
    userId: user?.id ?? null,
  });
  if (!contactRes.ok) return { ok: false, error: contactRes.error };
  const contact = contactRes.contact;

  // 5 · Perfil médico vivo (lo que la plataforma recuerda)
  const m = input.medical || ({} as MedicalProfileData);
  const medicalRow = {
    contact_id: contact.id,
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
  };
  const { error: medError } = await sb
    .from("medical_profiles")
    .upsert(medicalRow, { onConflict: "contact_id" });
  if (medError) return { ok: false, error: medError.message };

  // 6 · Reserva: reusar la existente (avanzando, nunca retrocediendo) o crear
  let reservationId: string | null = null;
  let createdReservation = false;
  {
    let query = sb
      .from("reservations")
      .select("id, status, slot_id")
      .eq("contact_id", contact.id)
      .eq("experience_id", experienceId)
      .neq("status", "cancelled");
    query = slotId ? query.eq("slot_id", slotId) : query.is("slot_id", null);
    const { data: existing } = await query.maybeSingle();

    if (existing) {
      reservationId = existing.id as string;
      if (existing.status === "requested") {
        await sb.from("reservations").update({ status: "confirmed" }).eq("id", reservationId);
      }
      // partially_paid / paid / completed: no se tocan (nunca retroceder)
    } else {
      const { data: created, error: resError } = await sb
        .from("reservations")
        .insert({
          experience_id: experienceId,
          slot_id: slotId,
          contact_id: contact.id,
          num_people: numPeople,
          status: "confirmed",
          channel: "web",
          notes: slotId ? null : `Salida: ${slotLabel}`,
        })
        .select("id")
        .single();
      if (resError) return { ok: false, error: resError.message };
      reservationId = created.id as string;
      createdReservation = true;

      // Cupo: solo al CREAR la reserva (reusar no re-incrementa). El check de
      // capacidad del 0007 es la red de seguridad contra el race del sobrecupo.
      if (slotId) {
        const { data: slotNow } = await sb
          .from("experience_slots")
          .select("seats_taken")
          .eq("id", slotId)
          .single();
        const { error: seatError } = await sb
          .from("experience_slots")
          .update({ seats_taken: ((slotNow?.seats_taken as number) ?? 0) + numPeople })
          .eq("id", slotId);
        if (seatError) {
          // Sobrecupo: revertir la reserva recién creada y avisar
          await sb.from("reservations").delete().eq("id", reservationId);
          return { ok: false, error: "Esa salida se llenó justo ahora. Elige otra fecha." };
        }
      }
    }
  }

  // 7 · Snapshot legal congelado (append-only). Si ya firmó esta versión, el
  //     unique lo detiene → tratamos como éxito idempotente (doble click).
  const signedAt = new Date().toISOString();
  const identitySnapshot = {
    full_name: fullName,
    birth_date: input.birthDate,
    email,
    phone: input.phone.trim(),
    city: (input.city || "").trim(),
    slot_label: slotLabel,
  };
  const { error: regError } = await sb.from("registrations").insert({
    reservation_id: reservationId,
    contact_id: contact.id,
    experience_id: experienceId,
    waiver_version: waiverVersion,
    waiver_doc_url: waiverDocUrl || null,
    signature_name: signatureName,
    signed_at: signedAt,
    waiver_accepted: true,
    privacy_consent: true,
    image_consent: !!input.imageConsent,
    newsletter_opt_in: !!input.newsletterOptIn,
    minors,
    medical_snapshot: medicalRow,
    identity_snapshot: identitySnapshot,
  });
  if (regError && regError.code !== "23505") {
    return { ok: false, error: regError.message };
  }
  const alreadySigned = regError?.code === "23505";

  // 8 · Cola de sync a Notion — SOLO datos comerciales (jamás médicos: LFPDPPP)
  if (!alreadySigned) {
    await sb.from("notion_sync_log").insert({
      entity: "reservation",
      entity_id: reservationId,
      action: "registered",
      status: "pending",
      payload: {
        slug: input.slug,
        contact_id: contact.id,
        full_name: fullName,
        email,
        phone: input.phone.trim(),
        city: (input.city || "").trim(),
        slot_label: slotLabel,
        num_people: numPeople,
        newsletter_opt_in: !!input.newsletterOptIn,
        waiver_version: waiverVersion,
        signed_at: signedAt,
        created_reservation: createdReservation,
      },
    });
  }

  return {
    ok: true,
    hasSession: !!user,
    waiverVersion,
    signedAt,
    slotLabel,
    stripeLink: experience.stripeLink || null,
  };
}
