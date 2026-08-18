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
// La cookie va HttpOnly y firmada con HMAC. Sin firma, alguien con la consola
// abierta podría escribirla; el daño sería que Caminante se cobre MENOS a sí
// misma en esa venta (nunca un dato expuesto ni un perjuicio al cliente), pero
// cerrar el hueco cuesta poco y no hay razón para dejarlo abierto.
//
// ⚠️ SE FIRMA CON WEB CRYPTO, NO CON `node:crypto`. La primera versión usaba
// `createHmac` como el resto de la casa (`lib/email/unsubscribe`) y ESO HABRÍA
// TRONADO EN PRODUCCIÓN: quien pone la cookie es el middleware, el middleware
// corre en el **Edge runtime**, y ahí `node:crypto` no existe. Habría fallado
// con el primer visitante del portal de un operador.
//
// Se descartaron las otras dos salidas:
//   · Ponerle `runtime = "nodejs"` al middleware — ese archivo es el que refresca
//     la sesión de Supabase (invariantes #1 y #2) y su ausencia causó el
//     incidente de sesiones muertas del 11 ago. No se le cambia el runtime por
//     una cookie de atribución.
//   · Sacar la firma del middleware — no se puede: firmar es justo lo que hace
//     al ponerla.
//
// `crypto.subtle` existe en Edge **y** en Node 18+, así que una sola
// implementación corre en los dos lados. El costo es que firmar y verificar se
// vuelven async — que aquí no molesta: los dos llamadores ya lo son.

import { ATRIB_COOKIE as _C } from "@/lib/operadores/atribucion-cookie";
import { ATRIB_COOKIE, ATRIB_DIAS } from "@/lib/operadores/atribucion-cookie";
import type { Escala } from "@/lib/operadores/comision";

const secreto = (): string =>
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.RESEND_API_KEY || "caminante";

async function firma(cuerpo: string): Promise<string> {
  const enc = new TextEncoder();
  const llave = await crypto.subtle.importKey(
    "raw",
    enc.encode(secreto()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", llave, enc.encode(cuerpo));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

/** Comparación en tiempo constante. `timingSafeEqual` es de node:crypto y aquí
 *  no existe, así que se hace a mano: se recorre TODO sin cortar al primer
 *  byte distinto. */
function igualesEnTiempoConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

/** Día epoch (UTC). Basta el día: la ventana es de 60. */
const hoy = (): number => Math.floor(Date.now() / 86_400_000);

/** El valor que va en la cookie: `<operador>.<día>.<firma>` */
export async function armarAtribucion(operatorId: string): Promise<string> {
  const cuerpo = `${operatorId}.${hoy()}`;
  return `${cuerpo}.${await firma(cuerpo)}`;
}

/**
 * Lee la cookie y devuelve el operador que trajo al cliente, o null.
 * Devuelve null también si la firma no cuadra o si ya venció.
 */
export async function leerAtribucion(valor: string | undefined | null): Promise<string | null> {
  if (!valor) return null;
  const partes = valor.split(".");
  if (partes.length !== 3) return null;
  const [operatorId, diaStr, sig] = partes;
  const esperada = await firma(`${operatorId}.${diaStr}`);
  if (!igualesEnTiempoConstante(sig, esperada)) return null;
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
