// Firma de un pago para el link de autofactura. NO es "use server" a propósito:
// exporta helpers síncronos que usan tanto la página (server component) como la
// acción de timbrado. El token prueba que quien abre /caminante/facturacion?p=…
// viene de SU pantalla de éxito (o pasó por el lookup correo+monto, que también
// genera un token válido). HMAC con la service-role key (server-only, siempre
// presente) — sin env var nueva.

import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  return s;
}

export function firmarPago(paymentId: string): string {
  return createHmac("sha256", secret()).update(`cfdi:${paymentId}`).digest("hex").slice(0, 40);
}

export function tokenValido(paymentId: string, token: string): boolean {
  if (!paymentId || !token) return false;
  const esperado = firmarPago(paymentId);
  if (token.length !== esperado.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(esperado));
  } catch {
    return false;
  }
}
