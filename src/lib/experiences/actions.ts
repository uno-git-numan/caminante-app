"use server";

import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { alcanceActual, esOperador, alcanzaSlug } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { actividadListaParaPublicar, rutaDelCandado } from "@/lib/operadores/candado-actividad";
import type { Experience } from "./types";

export type SaveResult =
  | {
      ok: true;
      slug: string;
      status: Experience["status"];
      // Se pidió publicar y el expediente de esa actividad no lo permite: la
      // experiencia SE GUARDÓ COMPLETA como borrador y aquí va por qué, más a
      // dónde mandar a quien la escribió. Nunca se pierde trabajo por un
      // candado.
      candado?: { mensaje: string; ruta: string; nombre: string | null };
    }
  // code "slug_exists": el slug ya existe y NO es el que se está editando →
  // guardar lo sobrescribiría. El form pide confirmación y reintenta con
  // allowOverwrite. Cualquier otro fallo va sin code.
  | { ok: false; error: string; code?: "slug_exists" };

export type SaveOpts = {
  // El slug que se está editando legítimamente (modo edición). Guardar sobre
  // ESE mismo slug no es colisión. En modo crear = null → cualquier slug
  // existente es colisión.
  expectedSlug?: string | null;
  // Confirmado por el admin: sobrescribir la experiencia existente.
  allowOverwrite?: boolean;
};

export async function saveExperience(
  exp: Experience,
  opts: SaveOpts = {},
): Promise<SaveResult> {
  // La casa guarda cualquier experiencia; un operador, solo las suyas — y las
  // NUEVAS, que nacen atribuidas a él (ver más abajo).
  const alcance = await alcanceActual();
  if (!alcance) {
    return { ok: false, error: "No autorizado. Inicia sesión." };
  }
  const slug = (exp.slug || "").trim();
  if (!slug) {
    return { ok: false, error: "Falta el identificador (slug)." };
  }
  if (!exp.title?.trim() && !exp.titleAccent?.trim()) {
    return { ok: false, error: "Falta el título de la experiencia." };
  }

  const sb = createSupabaseAdminClient();

  // ⚠️ El permiso se resuelve contra la fila QUE YA EXISTE, no contra lo que
  // manda el formulario. Si se confiara en el payload, un operador podría
  // mandar el slug de una experiencia ajena y sobrescribirla entera — este
  // action hace `upsert` por slug.
  const { data: previa } = await sb
    .from("experiences")
    .select("operator_id")
    .eq("slug", slug)
    .maybeSingle();
  const dueñoPrevio = (previa as { operator_id: string | null } | null)?.operator_id ?? null;

  if (esOperador(alcance)) {
    // Existe y no es suya ⇒ no. Existe y es suya, o no existe ⇒ adelante.
    if (previa && dueñoPrevio !== alcance.operatorId) {
      return { ok: false, error: "Esa experiencia no es tuya." };
    }
  }

  // Guarda anti-sobrescritura: si el slug ya existe (en CUALQUIER estado — por
  // eso el cliente admin, no fetchExperienceBySlug que filtra published) y no
  // es el que se edita, bloquear hasta que el admin confirme.
  if (!opts.allowOverwrite && slug !== (opts.expectedSlug ?? null)) {
    const { data: existente } = await sb
      .from("experiences")
      .select("slug, status")
      .eq("slug", slug)
      .maybeSingle();
    if (existente) {
      const est = existente.status === "published" ? "publicada" : "en borrador";
      return {
        ok: false,
        code: "slug_exists",
        error: `Ya existe una experiencia ${est} con el identificador «${slug}». Guardar la sobrescribiría por completo.`,
      };
    }
  }

  // La atribución se ESCRIBE aquí cuando la crea un operador. Si se dejara para
  // después («ya se la asigno luego»), la experiencia nacería de la casa: no se
  // vería en su panel, su funnel saldría con la marca de Caminante y —lo que no
  // tiene arreglo— la 0016 congela el operador AL VENDER, así que cualquier
  // reserva anterior a la asignación queda sin atribuir para siempre.
  // Quién la opera, resuelto YA (la fila que existe manda; si nace ahora y la
  // crea un operador, es suya). El candado de actividad lo necesita antes de
  // decidir el estado, y tomarlo del payload sería regalarle el bypass.
  const dueño = previa ? dueñoPrevio : esOperador(alcance) ? alcance.operatorId : null;
  const actividad = (exp.actividad ?? "").trim() || null;

  // ⚠️ EL CANDADO NO TIRA EL TRABAJO. Si se pidió publicar y el expediente de
  // esa actividad no está aprobado, la experiencia se guarda entera —igual de
  // completa— pero en borrador, y se devuelve a dónde ir. Rechazar el guardado
  // castigaría por intentar publicar, que es justo lo que queremos que hagan.
  let status = exp.status;
  let candado: { mensaje: string; ruta: string; nombre: string | null } | undefined;
  if (exp.status === "published") {
    const veredicto = await actividadListaParaPublicar(dueño, actividad);
    if (!veredicto.ok) {
      status = "draft";
      candado = {
        mensaje: veredicto.mensaje,
        ruta: rutaDelCandado(slug, veredicto.actividad),
        nombre: veredicto.nombre,
      };
    }
  }

  const row: Record<string, unknown> = {
    slug,
    status,
    actividad,
    data: { ...exp, slug, status, actividad },
  };
  if (esOperador(alcance) && !previa) row.operator_id = alcance.operatorId;

  const { error } = await sb.from("experiences").upsert(row, { onConflict: "slug" });
  if (error) {
    return { ok: false, error: error.message };
  }
  return candado ? { ok: true, slug, status, candado } : { ok: true, slug, status };
}
