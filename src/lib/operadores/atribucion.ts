// ATRIBUCIÓN — ¿quién trajo a este cliente?
//
// De esto depende qué escala de comisión aplica (ver `comision.ts`), así que es
// dinero: se trata con el mismo cuidado que un cobro.
//
// ── Por qué una cookie y no solo el link ─────────────────────────────────────
// Propagar por URL ya se hace con `?grupo=<token>`, y para eso alcanza porque
// el cliente compra en la misma visita. Aquí no: aterriza en el portal del
// operador, navega, se va, y vuelve dos días después por otro lado. Si la
// atribución viaja solo en el link se pierde en el primer clic que no la lleve.
//
// ── ⚠️ DÓNDE SE PONE: en el MIDDLEWARE, no en la página ──────────────────────
// Un Server Component NO puede escribir cookies en Next 15 — solo pueden las
// server actions, los route handlers y el middleware. El portal del operador
// (`/caminante/o/[slug]`) es un Server Component, así que la cookie la tiene que
// poner `src/middleware.ts`.
//
// Eso es territorio delicado: el middleware es el que casi tumbó el sitio el 11
// de agosto. Reglas al tocarlo (las cuida el guardián de invariantes):
//   · sigue llamando a `updateSession`;
//   · sigue sin meterse con `/caminante/auth/` (ahí se pierde el PKCE).
//
// ── Sobre la firma ───────────────────────────────────────────────────────────
// La cookie va HttpOnly y firmada con HMAC, mismo patrón que la baja del
// boletín. Sin firma, alguien con la consola abierta podría escribirla; el daño
// sería que Caminante se cobre MENOS a sí misma en esa venta (nunca un dato
// expuesto ni un perjuicio al cliente), pero cerrar el hueco cuesta cuatro
// líneas y no hay razón para dejarlo abierto.

import { createHmac, timingSafeEqual } from "node:crypto";
import { ATRIB_COOKIE, ATRIB_DIAS } from "@/lib/operadores/atribucion-cookie";
import type { Escala } from "@/lib/operadores/comision";

const secreto = (): string =>
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.RESEND_API_KEY || "caminante";

const firma = (cuerpo: string): string =>
  createHmac("sha256", secreto()).update(cuerpo).digest("hex").slice(0, 24);

/** Día epoch (UTC). Basta el día: la ventana es de 60. */
const hoy = (): number => Math.floor(Date.now() / 86_400_000);

/** El valor que va en la cookie: `<operador>.<día>.<firma>` */
export function armarAtribucion(operatorId: string): string {
  const cuerpo = `${operatorId}.${hoy()}`;
  return `${cuerpo}.${firma(cuerpo)}`;
}

/**
 * Lee la cookie y devuelve el operador que trajo al cliente, o null.
 * Devuelve null también si la firma no cuadra o si ya venció.
 */
export function leerAtribucion(valor: string | undefined | null): string | null {
  if (!valor) return null;
  const partes = valor.split(".");
  if (partes.length !== 3) return null;
  const [operatorId, diaStr, sig] = partes;
  const cuerpo = `${operatorId}.${diaStr}`;
  const esperada = firma(cuerpo);
  // Comparación en tiempo constante: es una firma, no un string cualquiera.
  if (sig.length !== esperada.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(esperada))) return null;
  const dia = Number(diaStr);
  if (!Number.isFinite(dia)) return null;
  if (hoy() - dia > ATRIB_DIAS) return null; // venció
  return operatorId || null;
}

/**
 * QUÉ ESCALA APLICA.
 *
 * ⚠️ La cookie solo baja la comisión cuando nombra al MISMO operador que es
 * dueño de la experiencia. Si trae al operador A y la experiencia es de B, la
 * venta es de Caminante: A no trajo a ese cliente a la salida de B.
 *
 * Sin cookie, o sin operador dueño, la venta es de Caminante.
 */
export function escalaPara(
  operadorDeLaExperiencia: string | null | undefined,
  atribuidoA: string | null,
): Escala {
  if (!operadorDeLaExperiencia || !atribuidoA) return "venta";
  return atribuidoA === operadorDeLaExperiencia ? "plataforma" : "venta";
}

/** Opciones de la cookie, para quien la escriba (el middleware). */
export const OPCIONES_ATRIB = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ATRIB_DIAS * 24 * 60 * 60,
};

export { ATRIB_COOKIE, ATRIB_DIAS };
