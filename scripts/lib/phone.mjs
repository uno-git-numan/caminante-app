// Normaliza teléfonos del CRM a E.164 para WhatsApp Cloud API.
// La data real de All Clients trae: +52 con espacios/paréntesis, 52 sin +, 10 dígitos
// pelones (MX), +1 de EUA, y marcas Unicode invisibles (bidi) pegadas al número.
// Reusable: el broadcast de hoy y el bot de WhatsApp mañana usan esta misma función.

// Zero-width, marcas bidi, isolates y BOM que Notion a veces guarda dentro del número.
const INVISIBLE = /[​-‏‪-‮⁦-⁩﻿]/g;

export function normalizePhone(raw) {
  if (!raw) return { e164: null, reason: "vacío" };

  const cleaned = String(raw).replace(INVISIBLE, "").trim();
  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return { e164: null, reason: "sin dígitos" };

  // EUA/Canadá: +1 + 10 dígitos.
  if (digits.length === 11 && digits.startsWith("1")) {
    return { e164: "+" + digits, country: "US" };
  }

  // México con código país: 52[1]XXXXXXXXXX. El "1" de móvil (521) ya no se usa en
  // WhatsApp → se quita; lo que importa son los 10 dígitos nacionales.
  if (digits.startsWith("52")) {
    let rest = digits.slice(2);
    if (rest.length === 11 && rest.startsWith("1")) rest = rest.slice(1); // 521… legacy
    if (rest.length === 10) return { e164: "+52" + rest, country: "MX" };
    return { e164: null, reason: `MX con ${rest.length} dígitos (esperaba 10)` };
  }

  // 10 dígitos pelones → se asume MX (los de EUA en la base vienen con +1 explícito).
  if (digits.length === 10) return { e164: "+52" + digits, country: "MX" };

  return { e164: null, reason: `formato no reconocido (${digits.length} dígitos)` };
}

// Primer nombre para la variable {{1}} del template ("Gil Perez Alonso" → "Gil").
export function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "";
}
