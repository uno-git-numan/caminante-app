"use server";

// Alta y edición de los COMPLEMENTOS desde el formulario de experiencia.
//
// Viven en su propia tabla (0054) y no en el jsonb de la experiencia porque una
// reserva apunta a la fila: `reservation_complements.complement_id` es una FK.
// Por eso lo que se quita NO se borra — se apaga. Borrar el tren rompería la
// reserva de quien ya lo compró, y el roster de esa salida dejaría de saber que
// esa persona viaja con tren.

import { alcanceActual, alcanzaSlug } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ComplementoEdit = {
  /** Vacío = nuevo. */
  id?: string;
  nombre: string;
  descripcion: string;
  /** Lo que paga el cliente, por persona o de una vez. */
  precio: string;
  precioPorPersona: boolean;
  /** Lo que cuesta proveerlo. Nunca sale al navegador del cliente. */
  costo: string;
  costoPorPersona: boolean;
  obligatorio: boolean;
};

const num = (s: string): number => {
  const n = Number(String(s ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export async function guardarComplementos(
  slug: string,
  lista: ComplementoEdit[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const alcance = await alcanceActual();
  if (!(await alcanzaSlug(alcance, slug))) {
    return { ok: false, error: "Esa experiencia no es tuya." };
  }

  const sb = createSupabaseAdminClient();
  const { data: exp } = await sb.from("experiences").select("id").eq("slug", slug).maybeSingle();
  if (!exp) return { ok: false, error: "No se encontró la experiencia." };
  const experienceId = exp.id as string;

  // Un complemento sin nombre no es nada: se ignora en vez de guardar basura.
  const limpios = lista.filter((c) => c.nombre.trim());

  const { data: previos } = await sb
    .from("experience_complements")
    .select("id")
    .eq("experience_id", experienceId);
  const vivos = new Set(limpios.map((c) => c.id).filter(Boolean) as string[]);
  const aApagar = ((previos ?? []) as { id: string }[])
    .map((p) => p.id)
    .filter((id) => !vivos.has(id));

  for (const c of limpios) {
    // Los CHECK de la 0054 exigen coherencia: en 'por_persona' el monto va en
    // la tarifa y el fijo queda en 0, y al revés. No es cosmético — la 0055
    // cerró justo el hueco de mandar la mitad de esta pareja.
    const fila = {
      experience_id: experienceId,
      nombre: c.nombre.trim(),
      descripcion: c.descripcion.trim() || null,
      precio_modo: c.precioPorPersona ? "por_persona" : "unico",
      precio_mxn: c.precioPorPersona ? 0 : num(c.precio),
      precio_tarifa_mxn: c.precioPorPersona ? num(c.precio) : null,
      costo_modo: c.costoPorPersona ? "por_persona" : "unico",
      costo_mxn: c.costoPorPersona ? 0 : num(c.costo),
      costo_tarifa_mxn: c.costoPorPersona ? num(c.costo) : null,
      obligatorio: !!c.obligatorio,
      activo: true,
    };
    const { error } = c.id
      ? await sb.from("experience_complements").update(fila).eq("id", c.id)
      : await sb.from("experience_complements").insert(fila);
    if (error) return { ok: false, error: error.message };
  }

  if (aApagar.length) {
    const { error } = await sb
      .from("experience_complements")
      .update({ activo: false })
      .in("id", aApagar);
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

/** Lo ya guardado, en la forma que edita el formulario. */
export async function leerComplementos(slug: string): Promise<ComplementoEdit[]> {
  const alcance = await alcanceActual();
  if (!(await alcanzaSlug(alcance, slug))) return [];
  const sb = createSupabaseAdminClient();
  const { data: exp } = await sb.from("experiences").select("id").eq("slug", slug).maybeSingle();
  if (!exp) return [];
  const { data } = await sb
    .from("experience_complements")
    .select(
      "id, nombre, descripcion, precio_modo, precio_mxn, precio_tarifa_mxn, costo_modo, costo_mxn, costo_tarifa_mxn, obligatorio",
    )
    .eq("experience_id", exp.id as string)
    .eq("activo", true)
    .order("orden", { ascending: true });
  return ((data ?? []) as Record<string, unknown>[]).map((f) => ({
    id: f.id as string,
    nombre: (f.nombre as string) ?? "",
    descripcion: (f.descripcion as string) ?? "",
    precioPorPersona: f.precio_modo === "por_persona",
    precio: String(f.precio_modo === "por_persona" ? (f.precio_tarifa_mxn ?? 0) : (f.precio_mxn ?? 0)),
    costoPorPersona: f.costo_modo === "por_persona",
    costo: String(f.costo_modo === "por_persona" ? (f.costo_tarifa_mxn ?? 0) : (f.costo_mxn ?? 0)),
    obligatorio: !!f.obligatorio,
  }));
}
