import "server-only";

// QUIÉN DEL EQUIPO ES ESTE CORREO — la lectura de `staff` (0070).
//
// Dos consultas con el cliente de servicio (las tablas no tienen políticas):
// la fila activa por correo, y sus operadoras. Si la tabla todavía no existe
// —la migración la aplica Luis a mano— o la lectura falla, la respuesta es
// «no es del equipo», que es fallar cerrado: nadie gana un asiento por un
// error de red.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { facultadesDe, type Facultad } from "@/lib/equipo/facultades";

export type OperadoraDelEquipo = { id: string; nombre: string; slug: string | null };

export type EquipoEnSesion = {
  staffId: string;
  nombre: string;
  /** Trabaja para la plataforma. */
  numan: boolean;
  facultades: Facultad[];
  /** Las operadoras para las que trabaja (Druidas: Caminante y Kéntro). */
  operadoras: OperadoraDelEquipo[];
  /**
   * La operadora de la que es DUEÑA (su fila en `operators` con panel), si la
   * hay. Cat es dueña de Nomádika y equipo de Caminante con el mismo correo:
   * con el sombrero de la suya es dueña plena; con el de otra, equipo.
   */
  duena: OperadoraDelEquipo | null;
};

export async function equipoDe(email: string): Promise<EquipoEnSesion | null> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("staff")
    .select("id, nombre, numan, facultades")
    .eq("email", email.toLowerCase())
    .eq("activo", true)
    .maybeSingle();
  if (error || !data) return null;
  const fila = data as { id: string; nombre: string; numan: boolean; facultades: unknown };

  const [{ data: ops, error: e2 }, { data: propia }] = await Promise.all([
    sb.from("staff_operadoras").select("operator_id, operators(id, name, slug, estado)").eq("staff_id", fila.id),
    sb.from("operators").select("id, name, slug").eq("email", email.toLowerCase()).eq("panel_activo", true).neq("estado", "baja").maybeSingle(),
  ]);
  const d = propia as { id: string; name: string | null; slug: string | null } | null;
  const duena: OperadoraDelEquipo | null = d ? { id: d.id, nombre: d.name || "Operadora", slug: d.slug } : null;
  // Sin poder leer sus operadoras no se le da ninguna: mejor un asiento de
  // numan (si lo tiene) que uno de una operadora que no se pudo confirmar.
  const operadoras: OperadoraDelEquipo[] = e2
    ? []
    : ((ops ?? []) as unknown as { operators: { id: string; name: string | null; slug: string | null; estado: string | null } | null }[])
        .map((r) => r.operators)
        .filter((o): o is NonNullable<typeof o> => !!o && o.estado !== "baja")
        .map((o) => ({ id: o.id, nombre: o.name || "Operadora", slug: o.slug }));

  return {
    staffId: fila.id,
    nombre: fila.nombre,
    numan: fila.numan === true,
    facultades: facultadesDe(fila.facultades),
    operadoras,
    duena,
  };
}
