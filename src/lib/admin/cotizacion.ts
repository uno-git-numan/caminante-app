import "server-only";

// LA COTIZACIÓN: leer y guardar lo que la calculadora edita.
//
// La calculadora NO tiene base de datos propia. Escribe en `experience_costs`
// y en `experiences.cabezas_cortesia`, que es de donde ya lee Recursos. Si
// tuviera tabla aparte habría dos verdades sobre lo que cuesta una salida, y la
// que gobierna el punto de equilibrio sería la que NO estás editando.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { reglaComisionDeOperador } from "@/lib/operadores/regla";
import type { Cortesia, LineaCosto, Modo } from "./costeo";
import type { Regla } from "@/lib/operadores/comision";

export type SalidaCotizable = {
  slotId: string;
  experienceId: string;
  experiencia: string;
  salida: string;
  startsAt: string | null;
  precioMxn: number;
  cupo: number | null;
  operatorId: string | null;
  costos: LineaCosto[];
  cortesias: Cortesia[];
};

export type OperadorConRegla = {
  id: string;
  nombre: string;
  regla: Regla;
  origen: "convenio" | "pactada" | "escala";
};

const num = (v: unknown): number | null => (v == null ? null : Number(v));

export async function fetchCotizables(): Promise<{
  salidas: SalidaCotizable[];
  operadores: OperadorConRegla[];
}> {
  const sb = createSupabaseAdminClient();

  const [{ data: slots }, { data: costos }, { data: ops }] = await Promise.all([
    sb
      .from("slots")
      .select("id, starts_at, label, price_mxn, capacity, experience_id, experiences(id, title, operator_id, cabezas_cortesia)")
      .order("starts_at", { ascending: false })
      .limit(120),
    sb.from("experience_costs").select("*"),
    sb.from("operators").select("id, name").eq("estado", "activa").order("name"),
  ]);

  const porSlot = new Map<string, LineaCosto[]>();
  const porExp = new Map<string, LineaCosto[]>();
  for (const c of (costos ?? []) as Record<string, unknown>[]) {
    const l: LineaCosto = {
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
      experiencia: String(e.title ?? "—"),
      salida: String(s.label ?? s.starts_at ?? ""),
      startsAt: (s.starts_at as string) ?? null,
      precioMxn: num(s.price_mxn) ?? 0,
      cupo: num(s.capacity),
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
