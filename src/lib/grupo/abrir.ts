"use server";

// ABRIR UN GRUPO PRIVADO DESDE SALIDAS (23 nov 2026).
//
// Luis: «+salida → elegir experiencia → elegir fechas → elegir anfitrión (lista
// de clientes), y abrir la fecha y el link privado». Hasta hoy un grupo privado
// sólo se abría desde la tarjeta de la persona en el tablero de Comunidad, y
// quien llegaba a Salidas a «agregar una salida» sólo podía crear públicas.
//
// La salida la crea `crearSalidaPrivada` (salida-privada.ts), la misma que usa
// el tablero. Aquí sólo van los permisos y la decisión de avisar.

import { revalidatePath } from "next/cache";
import { puedeEditarExperiencia } from "@/lib/auth/alcance";
import { fetchPersonas } from "@/lib/admin/queries";
import { avisarAlAnfitrionDe, crearSalidaPrivada } from "./salida-privada";

export type GrupoAbierto =
  | { ok: true; link: string; label: string; anfitrion: string; aviso: string | null }
  | { ok: false; error: string };

export async function abrirGrupoPrivado(input: {
  experienceId: string;
  inicio: string;
  fin: string;
  anfitrionContactId: string;
  /** Vacío = sin tope propio. */
  cupo: string;
  /** Mandarle ahora la liga por WhatsApp y correo. Apagado, sólo se abre. */
  avisar: boolean;
}): Promise<GrupoAbierto> {
  if (!(await puedeEditarExperiencia(input.experienceId))) return { ok: false, error: "Esa experiencia no es tuya." };

  const inicio = (input.inicio || "").trim();
  const fin = (input.fin || "").trim() || inicio;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return { ok: false, error: "La salida necesita fecha de inicio." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fin) || fin < inicio) return { ok: false, error: "La salida no puede terminar antes de empezar." };
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
  if (inicio < hoy) return { ok: false, error: "Esa fecha ya pasó." };

  const cupoTxt = (input.cupo || "").trim();
  const cupo = cupoTxt === "" ? null : Number(cupoTxt);
  if (cupo != null && (!Number.isInteger(cupo) || cupo < 1)) return { ok: false, error: "El cupo es un número de lugares, o vacío si no hay tope." };

  // ⚠️ EL ANFITRIÓN SE VERIFICA CONTRA LA LISTA DE QUIEN MIRA, no contra el id
  // que llegó: el id viaja en un <select> y cambiarlo es abrir el inspector. Una
  // operadora sólo puede poner de anfitrión a alguien de SUS clientes;
  // `fetchPersonas` ya trae la lista podada por alcance.
  const persona = (await fetchPersonas()).find((p) => p.id === input.anfitrionContactId);
  if (!persona) return { ok: false, error: "Elige al anfitrión de tu lista de clientes." };

  const r = await crearSalidaPrivada({ experienceId: input.experienceId, inicio, fin, anfitrionContactId: persona.id, cupo });
  if (!r.ok) return r;

  const aviso = input.avisar ? await avisarAlAnfitrionDe(r.salida.token) : null;
  revalidatePath("/caminante/admin/salidas");
  revalidatePath("/caminante/admin/comunidad");
  return { ok: true, link: r.salida.link, label: r.salida.label, anfitrion: persona.nombre || "el anfitrión", aviso };
}
