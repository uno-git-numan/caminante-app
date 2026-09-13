"use server";

// FIRMAR — el convenio y los anexos por actividad.
//
// ⚠️ EL OPERADOR SALE DE LA SESIÓN, NUNCA DEL FORMULARIO. Misma regla que en el
// expediente: si el `operatorId` viniera del cliente, cualquiera podría firmar
// a nombre de otra operadora. Y aquí pesa más, porque lo que queda es un rastro
// legal que después se usa para cobrar y para deslindar.
//
// ⚠️ LO QUE SE FIRMA ES EL TEXTO, NO UNA LIGA. El cliente manda el hash de lo
// que se le pintó en pantalla y el servidor lo compara contra el suyo. Si no
// coincide, no se firma: leyó otra cosa.

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { operadorDelAlcance } from "@/lib/admin/queries";
import { correoEnSesion } from "@/lib/auth/authorization";
import { firmarConvenio } from "./convenio";
import { firmarAnexo } from "./subconvenio";

const RUTA = "/caminante/admin/mi-alta/convenio";

export type ResFirma = { ok: true } | { ok: false; error: string };

/** IP y user-agent del que firma. Sin atribución, una firma electrónica no vale gran cosa. */
async function rastro(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return {
    ip: fwd ? fwd.split(",")[0].trim() : h.get("x-real-ip"),
    userAgent: h.get("user-agent"),
  };
}

/**
 * ⚠️ EL CORREO SALE DE LA SESIÓN, NO DEL FORMULARIO — misma razón que el
 * `operatorId`, y por el mismo camino.
 *
 * Venía de un `<input type="hidden">` que la pantalla llenaba con el correo de
 * la SOLICITUD del funnel. Kéntro nunca pasó por el funnel (se dio de alta a
 * mano), así que el campo salía VACÍO y la firma se guardaba con
 * `firmante_email: ''`: un rastro legal, append-only y por tanto imposible de
 * corregir, sin nadie a quien atribuirlo. Medido en producción el 13 sep 2026.
 *
 * Y aunque estuviera lleno, un campo oculto lo pone el cliente: firmarías con
 * el correo que quisieras. El de la sesión ya lo validó `getUser()` y es, además,
 * el de la persona que de verdad está firmando — no el de quien llenó un
 * formulario meses antes.
 */
async function leerFirmante(fd: FormData) {
  return {
    firmanteNombre: String(fd.get("nombre") ?? "").trim(),
    firmanteEmail: (await correoEnSesion()) ?? "",
    firmantePuesto: String(fd.get("puesto") ?? "").trim() || null,
    // Las dos casillas nacen sin marcar y el botón es aparte: nada se acepta
    // por omisión. Aquí sólo se leen; quien las exige es el servidor.
    aceptado: fd.get("aceptado") === "on",
    facultadesDeclaradas: fd.get("facultades") === "on",
  };
}

export async function firmarConvenioAction(fd: FormData): Promise<ResFirma> {
  const operatorId = await operadorDelAlcance();
  if (!operatorId) return { ok: false, error: "Solo una operadora firma su convenio." };

  const r = await firmarConvenio({
    operadorId: operatorId,
    version: String(fd.get("version") ?? ""),
    hashMostrado: String(fd.get("hash") ?? ""),
    ...(await leerFirmante(fd)),
    ...(await rastro()),
  });
  if (r.ok) revalidatePath(RUTA);
  return r;
}

export async function firmarAnexoAction(fd: FormData): Promise<ResFirma> {
  const operatorId = await operadorDelAlcance();
  if (!operatorId) return { ok: false, error: "Solo una operadora firma sus anexos." };

  const r = await firmarAnexo({
    operadorId: operatorId,
    actividad: String(fd.get("actividad") ?? ""),
    hashMostrado: String(fd.get("hash") ?? ""),
    ...(await leerFirmante(fd)),
    ...(await rastro()),
  });
  if (r.ok) {
    revalidatePath(RUTA);
    // El anexo abre la puerta de publicar esa actividad: la pantalla del
    // expediente y el tablero de la casa tienen que enterarse el mismo día.
    revalidatePath("/caminante/admin/mi-alta/expediente");
    revalidatePath("/caminante/admin/plataforma/comunidad");
  }
  return r;
}
