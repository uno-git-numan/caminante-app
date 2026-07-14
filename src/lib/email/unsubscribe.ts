import { createHmac } from "node:crypto";

// Baja de mailing firmada (para List-Unsubscribe de un clic). El link lleva el
// contact id + una firma HMAC (secreto = service-role key, server-only) para que
// nadie pueda dar de baja a otro. La baja pone contacts.mailing_unsubscribed_at
// (regla: las bajas son sagradas; solo el propio usuario las revierte).
const SITE = "https://caminante.numanhub.com";

function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.RESEND_API_KEY || "caminante";
}

export function signContact(contactId: string): string {
  return createHmac("sha256", secret()).update(contactId).digest("hex").slice(0, 24);
}

export function verifyContact(contactId: string, sig: string): boolean {
  if (!contactId || !sig) return false;
  const good = signContact(contactId);
  // comparación de longitud fija (evita timing trivial)
  return sig.length === good.length && sig === good;
}

export function unsubscribeUrl(contactId: string): string {
  return `${SITE}/caminante/api/unsubscribe?c=${encodeURIComponent(contactId)}&s=${signContact(contactId)}`;
}
