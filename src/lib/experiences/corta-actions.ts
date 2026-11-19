"use server";

// EL ALTA RÁPIDA, del lado del servidor: guarda la experiencia que sale de la
// lista corta (lib/experiences/corta.ts) y, si se dio, su primera fecha.
//
// No tiene permisos propios: guardar pasa por `saveExperience` (que atribuye la
// experiencia a quien la crea y no deja pisar una ajena) y la fecha por
// `crearSalida`. Publicar pasa por `setExperienceStatus`, con los candados de
// siempre. Aquí sólo se arma y se encadena.

import { revalidatePath } from "next/cache";
import { operadorDelAlcance } from "@/lib/admin/queries";
import { crearSalida, setExperienceStatus } from "@/lib/admin/eventos-actions";
import { puedeEntrarAlPanel } from "@/lib/auth/authorization";
import { saveExperience } from "@/lib/experiences/actions";
import { etiquetaDeSalida, experienciaDesdeCorta, faltantesDeCorta, type ExperienciaCorta, type FaltanteDeCorta } from "@/lib/experiences/corta";
import type { ContactoDueno } from "@/lib/experiences/empty";
import { CLAUSULAS_ESTANDAR } from "@/lib/legal/clausulas-estandar";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PrimeraSalida = {
  /** YYYY-MM-DD. Vacío = la experiencia se guarda sin fecha (se agrega luego en Salidas). */
  inicio: string;
  /** YYYY-MM-DD. Vacío = sale y regresa el mismo día. */
  fin: string;
  puntoEncuentro: string;
};

export type ResultadoAltaRapida =
  | { ok: true; slug: string; conFecha: boolean; avisos: string[] }
  | { ok: false; error: string; faltantes?: FaltanteDeCorta[] };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** El contacto de la operadora que crea, para que la página nazca invitando a escribirle a ELLA. */
async function contactoDeQuienCrea(): Promise<ContactoDueno | undefined> {
  const operatorId = await operadorDelAlcance();
  if (!operatorId) return undefined;
  // Cliente de servicio: la RLS de `operators` sólo expone las públicas, y una
  // operadora recién dada de alta todavía no lo es.
  const { data } = await createSupabaseAdminClient().from("operators").select("email, instagram, whatsapp").eq("id", operatorId).maybeSingle();
  if (!data) return undefined;
  return { email: data.email ?? undefined, instagram: data.instagram ?? undefined, whatsapp: data.whatsapp ?? undefined };
}

export async function crearExperienciaRapida(c: ExperienciaCorta, salida: PrimeraSalida): Promise<ResultadoAltaRapida> {
  if (!(await puedeEntrarAlPanel())) return { ok: false, error: "No autorizado. Inicia sesión." };

  const faltantes = faltantesDeCorta(c);
  if (faltantes.length) return { ok: false, error: "Todavía falta algo para guardar.", faltantes };

  const inicio = (salida.inicio || "").trim();
  const fin = (salida.fin || "").trim() || inicio;
  if (inicio) {
    if (!FECHA.test(inicio) || !FECHA.test(fin)) return { ok: false, error: "La fecha de la salida no se entiende." };
    if (fin < inicio) return { ok: false, error: "La salida no puede terminar antes de empezar." };
    const hoy = new Date(Date.now() - 6 * 3600_000).toISOString().slice(0, 10);
    if (inicio < hoy) return { ok: false, error: "La fecha de la salida ya pasó." };
  }

  const exp = experienciaDesdeCorta(c, { dueno: await contactoDeQuienCrea(), clausulas: CLAUSULAS_ESTANDAR });
  const guardada = await saveExperience(exp, { expectedSlug: null });
  if (!guardada.ok) {
    return {
      ok: false,
      error:
        guardada.code === "slug_exists"
          ? "Ya existe una experiencia con ese nombre. Cámbiale el nombre a ésta, o edita la que ya existe."
          : guardada.error,
    };
  }

  const avisos: string[] = [];
  if (!CLAUSULAS_ESTANDAR.length) {
    avisos.push("El deslinde quedó apagado: todavía no hay un texto estándar. Complétalo en «Agregar más detalle» antes de publicar.");
  }

  let conFecha = false;
  if (inicio) {
    const sb = createSupabaseAdminClient();
    const { data: fila } = await sb.from("experiences").select("id").eq("slug", guardada.slug).maybeSingle();
    if (!fila) {
      avisos.push("La experiencia se guardó, pero no pude crear la fecha. Agrégala en Salidas.");
    } else {
      const cupo = c.cupo.trim() ? Number(c.cupo.trim()) : null;
      const r = await crearSalida({
        experienceId: fila.id as string,
        slug: guardada.slug,
        label: etiquetaDeSalida(inicio, fin),
        // La hora es la de la oferta, en hora del centro de México.
        startsAt: `${inicio}T${c.horaInicio.trim()}:00-06:00`,
        endsAt: `${fin}T${c.horaTermino.trim()}:00-06:00`,
        capacityTotal: cupo,
      });
      if (!r.ok) {
        avisos.push(`La experiencia se guardó, pero la fecha no: ${r.error} Agrégala en Salidas.`);
      } else {
        conFecha = true;
        const punto = salida.puntoEncuentro.trim();
        if (punto && r.slotId) {
          const { error } = await sb.from("experience_slots").update({ punto_encuentro: punto, punto_encuentro_hora: c.horaInicio.trim() }).eq("id", r.slotId);
          if (error) avisos.push("La fecha se creó, pero el punto de encuentro no se guardó. Ponlo en Salidas.");
        }
      }
    }
  }

  revalidatePath("/caminante/admin");
  revalidatePath("/caminante/admin/salidas");
  return { ok: true, slug: guardada.slug, conFecha, avisos };
}

/** Publica la experiencia recién creada. Pasa por los candados de siempre; si alguno está cerrado, dice cuál. */
export async function publicarExperienciaRapida(slug: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await puedeEntrarAlPanel())) return { ok: false, error: "No autorizado. Inicia sesión." };
  const { data: fila } = await createSupabaseAdminClient().from("experiences").select("id").eq("slug", slug).maybeSingle();
  if (!fila) return { ok: false, error: "No encontré esa experiencia." };
  const r = await setExperienceStatus({ experienceId: fila.id as string, slug, status: "published" });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}
