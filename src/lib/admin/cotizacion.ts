import "server-only";

// LA COTIZACIÓN: leer y guardar lo que la calculadora edita.
//
// La calculadora NO tiene base de datos propia. Escribe en `experience_costs`
// y en `experiences.cabezas_cortesia`, que es de donde ya lee Recursos. Si
// tuviera tabla aparte habría dos verdades sobre lo que cuesta una salida, y la
// que gobierna el punto de equilibrio sería la que NO estás editando.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { experienceTitle } from "@/lib/admin/queries";
import type { Experience } from "@/lib/experiences/types";
import { reglaComisionDeOperador } from "@/lib/operadores/regla";
import type { Cortesia, LineaCosto, Modo } from "./costeo";
import type { Regla } from "@/lib/operadores/comision";

/** De dónde salió un costo — y, al guardar, a dónde vuelve. */
export type Ambito = "experiencia" | "salida";

/**
 * Una línea de costo con SU ORIGEN pegado.
 *
 * `fetchCotizables` mezcla los costos de la experiencia con los de la salida
 * (los dos aplican, y omitir los primeros cotizaría de menos). Esa mezcla es
 * correcta para CALCULAR y venenosa para GUARDAR: sin saber de dónde vino cada
 * línea, guardar la escribiría entera a nivel salida y la de experiencia
 * quedaría duplicada —una vez heredada, otra copiada—, así que cada
 * abrir-guardar inflaría el costo. Por eso el ámbito viaja con la línea.
 *
 * `id` null = línea nueva que todavía no tiene fila.
 */
export type LineaGuardable = LineaCosto & { id: string | null; ambito: Ambito };

export type SalidaCotizable = {
  slotId: string;
  experienceId: string;
  experiencia: string;
  salida: string;
  /** La etiqueta tal cual, para poder devolverla al guardar. */
  etiqueta: string;
  startsAt: string | null;
  /**
   * ⚠️ Se lee aunque la pantalla no lo muestre: al guardar, `updateSlot` recibe
   * `endsAt` y un undefined aquí lo dejaría en NULL. Y `ends_at` es lo que
   * dispara la encuesta «¿cómo te fue?» — borrarlo al guardar una cotización
   * apagaría la encuesta de esa salida sin que nadie lo notara.
   */
  endsAt: string | null;
  precioMxn: number;
  cupo: number | null;
  operatorId: string | null;
  costos: LineaGuardable[];
  cortesias: Cortesia[];
};

export type OperadorConRegla = {
  id: string;
  nombre: string;
  regla: Regla;
  origen: "convenio" | "pactada" | "escala";
};

const num = (v: unknown): number | null => (v == null ? null : Number(v));

/**
 * El precio publicado viene como texto («$18,560») porque así se muestra.
 * Muchas salidas tienen `price_mxn` en NULL —el cobro real vive en el
 * checkout— y sin este respaldo el cotizador precargaba $0 y la cascada
 * arrancaba en pérdida total antes de que escribieras nada.
 */
const precioDeTexto = (v: unknown): number => {
  const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

export async function fetchCotizables(): Promise<{
  salidas: SalidaCotizable[];
  operadores: OperadorConRegla[];
}> {
  const sb = createSupabaseAdminClient();

  const [{ data: slots }, { data: costos }, { data: ops }] = await Promise.all([
    // ⚠️ La tabla es `experience_slots` y el cupo es `capacity_total`. Y el
    // título NO es una columna: vive dentro del jsonb `data` y se arma con
    // `experienceTitle`, igual que en el resto del panel.
    sb
      .from("experience_slots")
      .select(
        "id, starts_at, ends_at, label, price_mxn, capacity_total, experience_id, experiences(id, slug, data, operator_id, cabezas_cortesia)",
      )
      .order("starts_at", { ascending: false })
      .limit(120),
    sb.from("experience_costs").select("*"),
    sb.from("operators").select("id, name").eq("estado", "activa").order("name"),
  ]);

  const porSlot = new Map<string, LineaGuardable[]>();
  const porExp = new Map<string, LineaGuardable[]>();
  for (const c of (costos ?? []) as Record<string, unknown>[]) {
    const l: LineaGuardable = {
      id: String(c.id),
      ambito: c.slot_id ? "salida" : "experiencia",
      concepto: String(c.concepto ?? ""),
      tipo: (c.tipo as LineaCosto["tipo"]) ?? "variable",
      modo: (c.modo as Modo) ?? "unico",
      montoMxn: num(c.monto_mxn) ?? 0,
      tarifaMxn: num(c.tarifa_mxn),
      escalones: (c.escalones as LineaCosto["escalones"]) ?? null,
      tramos: (c.tramos as LineaCosto["tramos"]) ?? null,
      porcentaje: num(c.porcentaje),
      proporcion: num(c.proporcion),
    };
    const k = c.slot_id ? String(c.slot_id) : null;
    if (k) porSlot.set(k, [...(porSlot.get(k) ?? []), l]);
    else porExp.set(String(c.experience_id), [...(porExp.get(String(c.experience_id)) ?? []), l]);
  }

  const salidas: SalidaCotizable[] = ((slots ?? []) as Record<string, unknown>[]).map((s) => {
    const e = (s.experiences ?? {}) as Record<string, unknown>;
    const expId = String(e.id ?? s.experience_id ?? "");
    return {
      slotId: String(s.id),
      experienceId: expId,
      experiencia: experienceTitle((e.data ?? null) as Partial<Experience> | null, String(e.slug ?? "—")),
      salida: String(s.label ?? s.starts_at ?? ""),
      etiqueta: String(s.label ?? ""),
      startsAt: (s.starts_at as string) ?? null,
      endsAt: (s.ends_at as string) ?? null,
      precioMxn: num(s.price_mxn) || precioDeTexto((e.data as { price?: { amount?: string } } | null)?.price?.amount),
      cupo: num(s.capacity_total),
      operatorId: (e.operator_id as string) ?? null,
      // Los costos de la salida MÁS los de la experiencia: los de experiencia
      // aplican a todas sus fechas, y omitirlos cotizaría de menos.
      costos: [...(porExp.get(expId) ?? []), ...(porSlot.get(String(s.id)) ?? [])],
      cortesias: ((e.cabezas_cortesia as Record<string, unknown>[]) ?? []).map((c) => ({
        rol: String(c.rol ?? "cortesía"),
        cuantas: Number(c.cuantas ?? 0),
        descuentoPct: Number(c.descuento_pct ?? 0),
      })),
    };
  });

  const operadores: OperadorConRegla[] = await Promise.all(
    ((ops ?? []) as { id: string; name: string }[]).map(async (o) => {
      const r = await reglaComisionDeOperador(o.id);
      return { id: o.id, nombre: o.name, regla: r.regla, origen: r.origen };
    }),
  );

  return { salidas, operadores };
}
