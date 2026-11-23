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
import { clausulasEstandar } from "@/lib/legal/clausulas-estandar";
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

/**
 * Quién crea: su contacto (para que la página nazca invitando a escribirle a
 * ELLA) y si sus salidas llevan seguro. El seguro es un HECHO (D28): una
 * operadora con convenio firmado está obligada a la póliza de accidentes en
 * cada salida; la casa no la tiene confirmada, y una operadora sin convenio
 * vende como la casa. Se lee de la base, no del formulario.
 */
async function quienCrea(): Promise<{ dueno?: ContactoDueno; conSeguro: boolean }> {
  const operatorId = await operadorDelAlcance();
  if (!operatorId) return { conSeguro: false };
  // Cliente de servicio: la RLS de `operators` sólo expone las públicas, y una
  // operadora recién dada de alta todavía no lo es.
  const { data } = await createSupabaseAdminClient()
    .from("operators")
    .select("email, instagram, whatsapp, es_la_casa, convenio_firmado_at")
    .eq("id", operatorId)
    .maybeSingle();
  if (!data) return { conSeguro: false };
  return {
    dueno: { email: data.email ?? undefined, instagram: data.instagram ?? undefined, whatsapp: data.whatsapp ?? undefined },
    conSeguro: data.es_la_casa !== true && !!data.convenio_firmado_at,
  };
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

  const quien = await quienCrea();
  // El deslinde estándar de legal para esa actividad, con la variante de
  // seguro y de menores que le toca. null = legal todavía no lo escribe.
  const clausulas = clausulasEstandar({ actividad: c.actividad.trim(), edadMinima: Number(c.edadMinima.trim()) || 0, conSeguro: quien.conSeguro });
  const exp = experienciaDesdeCorta(c, { dueno: quien.dueno, clausulas: clausulas ?? [], conSeguro: quien.conSeguro });
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
  if (!clausulas) {
    avisos.push(
      c.actividad.trim() === "paracaidismo"
        ? "El deslinde quedó apagado: el paracaidismo se publica sólo con tu propia carta de deslinde. Súbela en «Agregar más detalle» y se une con la nuestra."
        : "El deslinde quedó apagado: para esta actividad todavía no hay un deslinde estándar. Avísanos y lo escribimos; mientras, no se puede publicar.",
    );
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
