"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { findOrCreateContact, normalizePhoneMX } from "@/lib/crm/contacts";
import { fetchSlotAvailability } from "@/lib/experiences/availability";
import { notifyNuevaReserva } from "@/lib/notifications/notify-admin";
import type { Experience } from "@/lib/experiences/types";
import type {
  MedicalProfileData,
  ParticipantInput,
  RegistrationInput,
  RegistrationResult,
} from "./types";

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

  // 3 · Reserva + salida. Dos caminos:
  //   (a) reservationId de una reserva YA pagada (self-serve web): atamos el
  //       deslinde a ESA reserva. El pago ya fijó cupo/num_people → no re-chequear
  //       disponibilidad ni tocar el status.
  //   (b) sin reservationId: validamos la salida + disponibilidad en vivo, y más
  //       abajo reusamos/creamos la reserva.
  let reservationId: string | null = null;
  let createdReservation = false;
  let slotId: string | null = null;
  let slotLabel = (input.slotLabel || "").trim();

  if (input.reservationId) {
    const { data: paid } = await sb
      .from("reservations")
      .select("id, slot_id, status")
      .eq("id", input.reservationId)
      .eq("experience_id", experienceId)
      .neq("status", "cancelled")
      .maybeSingle();
    if (paid) {
      reservationId = paid.id as string;
      slotId = (paid.slot_id as string | null) ?? null;
      if (slotId) {
        const { data: slot } = await sb
          .from("experience_slots")
          .select("label")
          .eq("id", slotId)
          .maybeSingle();
        slotLabel = (slot?.label as string) || slotLabel;
      }
    }
  }

  if (!reservationId && input.slotId) {
    const { data: slot } = await sb
      .from("experience_slots")
      .select("id, label, status")
      .eq("id", input.slotId)
      .eq("experience_id", experienceId)
      .maybeSingle();
    if (!slot || slot.status !== "open") {
      return { ok: false, error: "Esa salida ya no está disponible. Elige otra fecha." };
    }
    // Disponibilidad EN VIVO (paid + registrados apartan). available NULL = sin tope.
    const avail = await fetchSlotAvailability(experienceId);
    const a = avail.get(slot.id as string);
    if (a && a.available !== null && a.available < numPeople) {
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

  // 6 · Reserva: si NO venía de un pago, reusar la existente (avanzando, nunca
  //     retrocediendo) o crear una nueva 'confirmed'.
  if (!reservationId) {
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

  // 6.5 · Participantes (OPCIONAL): perfil reutilizable por acompañante bajo el
  //       titular. Dedupe por (guardián, nombre) para no duplicar en re-submits.
  //       Su médico es sensible → vive aquí y en el snapshot, jamás en Notion.
  const participantsInput: ParticipantInput[] = (input.participants || []).filter(
    (p) => (p.fullName || "").trim(),
  );
  const frozenParticipants: Array<Record<string, unknown>> = [];
  for (const p of participantsInput) {
    const depRow = {
      guardian_contact_id: contact.id,
      full_name: (p.fullName || "").trim(),
      birth_date: p.birthDate?.trim() || null,
      relationship: p.relationship?.trim() || null,
      blood_type: p.bloodType?.trim() || null,
      conditions: p.conditions?.trim() || null,
      medications: p.medications?.trim() || null,
      allergies: p.allergies?.trim() || null,
      dietary_restrictions: p.dietaryRestrictions?.trim() || null,
      fitness_notes: p.fitnessNotes?.trim() || null,
      emergency_name: p.emergencyName?.trim() || null,
      emergency_relationship: p.emergencyRelationship?.trim() || null,
      emergency_phone: p.emergencyPhone?.trim() || null,
    };

    // Reusar el dependiente indicado (solo si es del titular) o casar por nombre.
    let dependentId = (p.dependentId || "").trim() || null;
    if (dependentId) {
      const { data: owned } = await sb
        .from("dependents")
        .select("id")
        .eq("id", dependentId)
        .eq("guardian_contact_id", contact.id)
        .maybeSingle();
      if (!owned) dependentId = null;
    }
    if (!dependentId) {
      const { data: match } = await sb
        .from("dependents")
        .select("id")
        .eq("guardian_contact_id", contact.id)
        .ilike("full_name", depRow.full_name)
        .maybeSingle();
      if (match) dependentId = match.id as string;
    }

    if (dependentId) {
      await sb.from("dependents").update(depRow).eq("id", dependentId);
    } else {
      const { data: ins } = await sb
        .from("dependents")
        .insert(depRow)
        .select("id")
        .single();
      dependentId = (ins?.id as string) ?? null;
    }

    frozenParticipants.push({
      dependent_id: dependentId,
      full_name: depRow.full_name,
      birth_date: depRow.birth_date,
      relationship: depRow.relationship,
      medical_snapshot: {
        blood_type: depRow.blood_type,
        conditions: depRow.conditions,
        medications: depRow.medications,
        allergies: depRow.allergies,
        dietary_restrictions: depRow.dietary_restrictions,
        fitness_notes: depRow.fitness_notes,
        emergency_name: depRow.emergency_name,
        emergency_relationship: depRow.emergency_relationship,
        emergency_phone: depRow.emergency_phone,
      },
    });
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
    participants: frozenParticipants,
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

  // 9 · Aviso al admin SOLO si esta firma creó una reserva NUEVA que aparta
  //     cupo sin pago (el flujo pagado ya avisó desde el webhook). Best-effort.
  if (createdReservation) {
    await notifyNuevaReserva({
      cliente: fullName,
      experiencia:
        experience.cardTitle ||
        [experience.title, experience.titleAccent].filter(Boolean).join(" ").trim() ||
        input.slug,
      salida: slotLabel,
      personas: numPeople,
      montoMxn: 0,
      metodo: "Registro con deslinde (sin pago aún)",
      canal: "web",
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
