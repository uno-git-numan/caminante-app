import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// LOS COMPLEMENTOS DE UNA EXPERIENCIA — lo que se agrega y cambia el precio.
//
// El caso que los trajo: la Travesía Barrancas del Cobre se vende con tren y
// sin tren. No son dos productos; es el mismo viaje con una extensión.
//
// Precio y costo viven SEPARADOS en la tabla (migración 0054) porque no son lo
// mismo: uno es lo que paga el cliente y el otro lo que cuesta proveerlo. Aquí
// sólo se lee el precio — el costo es de la cascada de rentabilidad y no tiene
// por qué salir nunca al navegador.

export type Complemento = {
  id: string;
  nombre: string;
  descripcion: string | null;
  /** Lo que paga el cliente. Ya resuelto: si es por persona, es la tarifa. */
  precioUnitario: number;
  porPersona: boolean;
  obligatorio: boolean;
  /** NULL = toda la experiencia. Con valor, sólo esa salida. */
  slotId: string | null;
};

type Fila = {
  id: string; nombre: string; descripcion: string | null;
  precio_modo: string; precio_mxn: string | number; precio_tarifa_mxn: string | number | null;
  obligatorio: boolean; slot_id: string | null; orden: number;
};

const aComplemento = (f: Fila): Complemento => ({
  id: f.id,
  nombre: f.nombre,
  descripcion: f.descripcion,
  porPersona: f.precio_modo === "por_persona",
  precioUnitario:
    f.precio_modo === "por_persona" ? Number(f.precio_tarifa_mxn ?? 0) : Number(f.precio_mxn ?? 0),
  obligatorio: f.obligatorio,
  slotId: f.slot_id,
});

/**
 * Los complementos que aplican a una salida.
 *
 * Un complemento con `slot_id` NULL es de toda la experiencia; con `slot_id` es
 * sólo de esa salida — el tren puede existir en la travesía de marzo y no en la
 * de octubre. Se filtra aquí y no en la vista para que nadie pueda comprar por
 * URL algo que no se ofrece en su fecha.
 */
export async function fetchComplementos(
  experienceId: string,
  slotId?: string | null,
): Promise<Complemento[]> {
  const todos = await fetchTodosLosComplementos(experienceId);
  return todos.filter((c) => c.slotId === null || c.slotId === slotId);
}

/**
 * Todos los complementos activos de la experiencia, con su `slotId` a la vista.
 * La pantalla de reservar los necesita completos: el visitante cambia de salida
 * sin recargar y la lista tiene que responder a eso.
 */
export async function fetchTodosLosComplementos(
  experienceId: string,
): Promise<Complemento[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("experience_complements")
    .select(
      "id, nombre, descripcion, precio_modo, precio_mxn, precio_tarifa_mxn, obligatorio, slot_id, orden",
    )
    .eq("experience_id", experienceId)
    .eq("activo", true)
    .order("orden", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as Fila[]).map(aComplemento);
}

/** Lo que cuesta este complemento para ese número de personas. */
export const precioComplemento = (c: Complemento, personas: number): number =>
  c.porPersona ? c.precioUnitario * personas : c.precioUnitario;

/**
 * Valida lo que el cliente eligió contra lo que REALMENTE se ofrece.
 *
 * ⚠️ Los ids llegan por FormData, o sea del navegador. Nunca se cobra por lo
 * que diga el cliente: se cobra por lo que dice la base. Un id que no está en
 * la lista de su salida simplemente se ignora, y los obligatorios se agregan
 * aunque no vengan marcados.
 */
export function resolverElegidos(
  disponibles: Complemento[],
  idsElegidos: string[],
): Complemento[] {
  const pedidos = new Set(idsElegidos);
  return disponibles.filter((c) => c.obligatorio || pedidos.has(c.id));
}
