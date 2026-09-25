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

  const { data: ops, error: e2 } = await sb
    .from("staff_operadoras")
    .select("operator_id, operators(id, name, slug, estado)")
    .eq("staff_id", fila.id);
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
  };
}
