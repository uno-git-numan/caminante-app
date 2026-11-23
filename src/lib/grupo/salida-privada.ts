import "server-only";

// LA SALIDA DE UN GRUPO PRIVADO — una sola forma de nacer.
//
// Un grupo privado se abre desde dos puertas: la tarjeta de la persona en el
// tablero de Comunidad (`tablero-actions.ts`, la de siempre) y, desde el 23 nov
// de 2026, «+ Agregar salida» en Salidas (`abrir.ts`; Luis: «me gusta que se
// abra desde el CRM, pero igual hagamos la posibilidad de abrirlo desde
// salidas»). Las dos crean LO MISMO, y por eso lo crean aquí: una salida
// privada con su liga, su anfitrión adentro y su fecha límite para apartar.
// Dos copias de este insert acabarían naciendo distintas.

import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchEspacio, ligaDelEspacio } from "./espacio";
import { avisarAnfitriona } from "./mensajes";

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** «Ene 22–23», «12 Dic», «30 Ene – 2 Feb». */
export function etiquetaDeFechas(inicio: string, fin: string): string {
  const f = (ymd: string, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...o }).format(new Date(`${ymd}T12:00:00Z`));
  const mes = (ymd: string) => f(ymd, { month: "short" }).replace(".", "");
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  if (inicio === fin) return `${f(inicio, { day: "numeric" })} ${cap(mes(inicio))}`;
  if (mes(inicio) === mes(fin)) return `${cap(mes(inicio))} ${f(inicio, { day: "numeric" })}–${f(fin, { day: "numeric" })}`;
  return `${f(inicio, { day: "numeric" })} ${cap(mes(inicio))} – ${f(fin, { day: "numeric" })} ${cap(mes(fin))}`;
}

/**
 * La fecha límite para apartar con la que nace un grupo: dos semanas antes de
 * salir, y nunca antes de mañana. Se edita después en «Su espacio».
 */
export function fechaLimiteInicial(inicio: string, ahora = new Date()): string | null {
  const hoyYmd = ahora.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
  const manana = new Date(Date.parse(`${hoyYmd}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
  const dosSemanasAntes = new Date(Date.parse(`${inicio}T12:00:00Z`) - 14 * 86400000).toISOString().slice(0, 10);
  return dosSemanasAntes > manana ? dosSemanasAntes : manana < inicio ? manana : null;
}

export type SalidaPrivada = { slotId: string; label: string; token: string; link: string };

/**
 * Crea la salida privada y mete al anfitrión a su espacio. NO avisa a nadie y
 * NO revisa permisos: eso es de quien llama.
 */
export async function crearSalidaPrivada(input: {
  experienceId: string;
  inicio: string;
  fin: string;
  anfitrionContactId: string;
  /** Lugares del grupo. `null` = sin tope propio. */
  cupo: number | null;
  minimo?: number | null;
}): Promise<{ ok: true; salida: SalidaPrivada } | { ok: false; error: string }> {
  if (!YMD.test(input.inicio) || !YMD.test(input.fin)) return { ok: false, error: "La salida necesita fechas válidas." };
  if (input.fin < input.inicio) return { ok: false, error: "La salida no puede terminar antes de empezar." };

  const sb = createSupabaseAdminClient();
  const token = randomBytes(16).toString("base64url");
  const label = etiquetaDeFechas(input.inicio, input.fin);
  const { data: slot, error } = await sb
    .from("experience_slots")
    .insert({
      experience_id: input.experienceId,
      label,
      starts_at: `${input.inicio}T12:00:00Z`,
      ends_at: `${input.fin}T23:00:00Z`,
      capacity_total: input.cupo,
      // Sin precio propio: hereda el de la experiencia.
      price_mxn: null,
      status: "open",
      visibility: "private",
      access_token: token,
      anfitrion_contact_id: input.anfitrionContactId,
      fecha_limite: fechaLimiteInicial(input.inicio),
      minimo: input.minimo ?? null,
    })
    .select("id, label")
    .single();
  if (error || !slot) {
    console.error("crearSalidaPrivada:", error);
    return { ok: false, error: "No se pudo abrir la salida." };
  }
  // El anfitrión ya está ADENTRO de su espacio: su lugar nace con la salida.
  await sb
    .from("grupo_lugares")
    .upsert({ slot_id: slot.id, contact_id: input.anfitrionContactId, rol: "anfitrion" }, { onConflict: "slot_id,contact_id", ignoreDuplicates: true });

  return { ok: true, salida: { slotId: slot.id as string, label: String(slot.label), token, link: ligaDelEspacio(token) } };
}

/**
 * Le manda al anfitrión los dos mensajes («eres la anfitriona» y el texto para
 * su grupo) y dice, en una frase, por dónde le llegaron. Nunca lanza.
 */
export async function avisarAlAnfitrionDe(token: string): Promise<string> {
  try {
    const e = await fetchEspacio(token);
    const r = e ? await avisarAnfitriona(e) : null;
    return !r
      ? "No se pudo mandar el aviso; la liga está en su ficha."
      : r.whatsapp && r.correo
        ? "Le llegó por WhatsApp y correo con la liga y el mensaje para su grupo."
        : r.correo
          ? "Le llegó por correo con la liga y el mensaje para su grupo (WhatsApp no salió: la plantilla no está aprobada o no hay número real)."
          : r.whatsapp
            ? "Le llegó por WhatsApp con la liga y el mensaje para su grupo."
            : "No le llegó ni por correo ni por WhatsApp: mándaselo desde su ficha.";
  } catch (err) {
    console.error("avisarAnfitriona:", err);
    return "No se pudo mandar el aviso; la liga está en su ficha.";
  }
}
