// Helpers de CRM compartidos por el registro, el perfil, el confirm de auth y
// el sync a Notion. Una sola fuente para la normalización y el dedupe — las
// mismas reglas que la skill /sincronizar-registros (cascada user_id → correo
// → teléfono; enriquecer solo campos vacíos; las bajas de mailing son sagradas).
//
// Todas las funciones reciben el client como parámetro (service-role para
// escrituras) — este módulo no importa "use server" ni crea clients propios.

import type { SupabaseClient } from "@supabase/supabase-js";

export type ContactRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  birth_date: string | null;
  source: string | null;
  lifecycle_stage: string;
  user_id: string | null;
  mailing_opt_in: boolean;
  mailing_unsubscribed_at: string | null;
  notion_page_url: string | null;
};

export function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

// Últimos 10 dígitos sin lada mexicana (52 / 521). "+52 55 1234 5678",
// "5512345678" y "52 1 55-1234-5678" comparan iguales.
export function normalizePhoneMX(phone: string | null | undefined): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const without = digits.replace(/^521?/, "");
  const last10 = (without.length >= 10 ? without : digits).slice(-10);
  return last10.length === 10 ? last10 : null;
}

export type ContactInput = {
  email: string;
  fullName?: string;
  phone?: string;
  city?: string;
  birthDate?: string; // ISO date
  source?: string;
  newsletterOptIn?: boolean;
  userId?: string | null;
};

type FindOrCreateResult =
  | { ok: true; contact: ContactRow; created: boolean }
  | { ok: false; error: string };

// Cascada de dedupe: user_id (si hay sesión) → lower(email) → teléfono
// normalizado. Match = enriquecer SOLO campos vacíos (jamás pisar lo que ya
// hay); mailing_opt_in solo se enciende — y nunca si hay una baja registrada.
export async function findOrCreateContact(
  sb: SupabaseClient,
  input: ContactInput,
): Promise<FindOrCreateResult> {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Correo inválido." };
  }

  let contact: ContactRow | null = null;

  if (input.userId) {
    const { data } = await sb
      .from("contacts")
      .select("*")
      .eq("user_id", input.userId)
      .maybeSingle();
    contact = (data as ContactRow | null) ?? null;
  }

  if (!contact) {
    const { data } = await sb
      .from("contacts")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    contact = (data as ContactRow | null) ?? null;
  }

  if (!contact) {
    const wanted = normalizePhoneMX(input.phone);
    if (wanted) {
      // El teléfono en BD está crudo: traer candidatos con teléfono y comparar
      // normalizado en JS (base chica; phone_normalized indexado = mejora futura).
      const { data: candidates } = await sb
        .from("contacts")
        .select("*")
        .not("phone", "is", null);
      contact =
        ((candidates as ContactRow[] | null) || []).find(
          (c) => normalizePhoneMX(c.phone) === wanted,
        ) ?? null;
    }
  }

  if (contact) {
    const patch: Record<string, unknown> = {};
    if (!contact.full_name && input.fullName) patch.full_name = input.fullName.trim();
    if (!contact.phone && input.phone) patch.phone = input.phone.trim();
    if (!contact.city && input.city) patch.city = input.city.trim();
    if (!contact.birth_date && input.birthDate) patch.birth_date = input.birthDate;
    if (!contact.email && email) patch.email = email;
    if (contact.user_id == null && input.userId) patch.user_id = input.userId;
    // opt-in solo se ENCIENDE, y nunca por encima de una baja explícita
    if (input.newsletterOptIn && !contact.mailing_opt_in && !contact.mailing_unsubscribed_at) {
      patch.mailing_opt_in = true;
    }
    if (contact.lifecycle_stage === "lead" || contact.lifecycle_stage === "subscriber") {
      // registrarse a una experiencia lo vuelve customer-track; lo maneja quien llama
    }
    if (Object.keys(patch).length > 0) {
      const { data, error } = await sb
        .from("contacts")
        .update(patch)
        .eq("id", contact.id)
        .select("*")
        .single();
      if (error) return { ok: false, error: error.message };
      contact = data as ContactRow;
    }
    return { ok: true, contact, created: false };
  }

  const insertRow = {
    email,
    full_name: input.fullName?.trim() || null,
    phone: input.phone?.trim() || null,
    city: input.city?.trim() || null,
    birth_date: input.birthDate || null,
    source: input.source || "registro web",
    lifecycle_stage: "lead",
    user_id: input.userId ?? null,
    mailing_opt_in: !!input.newsletterOptIn,
  };
  const { data: created, error: insertError } = await sb
    .from("contacts")
    .insert(insertRow)
    .select("*")
    .single();

  if (!insertError) {
    return { ok: true, contact: created as ContactRow, created: true };
  }

  // Race contra el unique de lower(email): otro insert ganó — re-leer y usar ese.
  if (insertError.code === "23505") {
    const { data: existing } = await sb
      .from("contacts")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      return { ok: true, contact: existing as ContactRow, created: false };
    }
  }
  return { ok: false, error: insertError.message };
}

// Liga el user de Supabase Auth con su contact por correo — solo si el contact
// no está ligado a nadie (jamás "roba" un contact de otro user). Se llama desde
// el confirm del magic link y, lazy, desde /caminante/perfil.
export async function ensureContactLink(
  sb: SupabaseClient,
  user: { id: string; email?: string | null },
): Promise<void> {
  const email = normalizeEmail(user.email || "");
  if (!email) return;
  await sb
    .from("contacts")
    .update({ user_id: user.id })
    .eq("email", email)
    .is("user_id", null);
}
