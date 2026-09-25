import "server-only";

// LA LISTA DEL EQUIPO — lo que ve quien lo administra (la casa: todos; una
// operadora: los suyos). Sin dinero ni atribución todavía (0071+).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { facultadesDe, type Facultad } from "@/lib/equipo/facultades";

export type MiembroEnPantalla = {
  id: string;
  email: string;
  nombre: string;
  numan: boolean;
  facultades: Facultad[];
  activo: boolean;
  altaAt: string;
  bajaAt: string | null;
  operadoras: { id: string; nombre: string }[];
};

export async function fetchEquipo(soloOperadora?: string): Promise<MiembroEnPantalla[]> {
  const sb = createSupabaseAdminClient();
  const [{ data: staff }, { data: rel }, { data: ops }] = await Promise.all([
    sb.from("staff").select("id, email, nombre, numan, facultades, activo, alta_at, baja_at").order("alta_at"),
    sb.from("staff_operadoras").select("staff_id, operator_id"),
    sb.from("operators").select("id, name"),
  ]);
  const nombreDe = new Map(((ops ?? []) as { id: string; name: string | null }[]).map((o) => [o.id, o.name || "Operadora"]));
  const porStaff = new Map<string, { id: string; nombre: string }[]>();
  for (const r of (rel ?? []) as { staff_id: string; operator_id: string }[]) {
    if (!porStaff.has(r.staff_id)) porStaff.set(r.staff_id, []);
    porStaff.get(r.staff_id)!.push({ id: r.operator_id, nombre: nombreDe.get(r.operator_id) ?? "Operadora" });
  }
  type Fila = { id: string; email: string; nombre: string; numan: boolean; facultades: unknown; activo: boolean; alta_at: string; baja_at: string | null };
  const todos = ((staff ?? []) as Fila[]).map((f) => ({
    id: f.id,
    email: f.email,
    nombre: f.nombre,
    numan: f.numan === true,
    facultades: facultadesDe(f.facultades),
    activo: f.activo === true,
    altaAt: f.alta_at,
    bajaAt: f.baja_at,
    operadoras: porStaff.get(f.id) ?? [],
  }));
  // Una operadora sólo ve a quien trabaja para ella, y de esa persona sólo lo
  // que le atañe: si además es de numan o de otra, no es asunto suyo.
  if (!soloOperadora) return todos;
  return todos
    .filter((m) => m.activo && m.operadoras.some((o) => o.id === soloOperadora))
    .map((m) => ({ ...m, numan: false, operadoras: m.operadoras.filter((o) => o.id === soloOperadora) }));
}
