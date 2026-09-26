import "server-only";

// EL LIBRO DE ATRIBUCIONES (0071) — lo que toca la base.
//
// Tres verbos y una lectura. Todo con el cliente de servicio (la tabla no tiene
// políticas) y todo falla cerrado: si el libro no se puede leer, nadie tiene
// nada, y un pago entra con `vendedor_id` null antes que con uno adivinado.
//
// ⚠️ No hay transacción en supabase-js: transferir es cerrar una fila y abrir
// otra, en ese orden. Si la segunda falla, el objeto queda sin titular (fila
// cerrada con `cierre='transferencia'` y ninguna abierta) — visible, no
// duplicado. El índice único parcial impide lo contrario: dos abiertas.

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { OBJETO, puedeTener, type Objeto, type FilaLibro } from "@/lib/equipo/atribucion-reglas";
import { alcanceActual, equipoDelAlcance } from "@/lib/auth/alcance";
import { correoEnSesion } from "@/lib/auth/authorization";

type Sb = ReturnType<typeof createSupabaseAdminClient>;

export type Titular = { staffId: string; nombre: string; activo: boolean };

/** Quién tiene este objeto HOY, o null. */
export async function titularDe(objeto: Objeto, objetoId: string, sb: Sb = createSupabaseAdminClient()): Promise<Titular | null> {
  const { data, error } = await sb
    .from("staff_atribuciones")
    .select("staff_id, staff(nombre, activo)")
    .eq("objeto", objeto)
    .eq("objeto_id", objetoId)
    .is("hasta", null)
    .maybeSingle();
  if (error || !data) return null;
  const f = data as unknown as { staff_id: string; staff: { nombre: string; activo: boolean } | null };
  return { staffId: f.staff_id, nombre: f.staff?.nombre ?? "", activo: f.staff?.activo === true };
}

/**
 * Abre una fila para `staffId`. Si el objeto ya tiene titular, NO lo pisa:
 * devuelve `{ ok:false, titular }` y quien llama decide (tomar una solicitud
 * que ya es de otro es exactamente lo que no debe pasar en silencio).
 */
export async function atribuir(
  input: { staffId: string; objeto: Objeto; objetoId: string; como: "tomada" | "asignada" | "heredada"; por: string | null },
  sb: Sb = createSupabaseAdminClient(),
): Promise<{ ok: true } | { ok: false; error: string; titular?: Titular }> {
  const titular = await titularDe(input.objeto, input.objetoId, sb);
  if (titular) {
    if (titular.staffId === input.staffId) return { ok: true };
    return { ok: false, error: `Ya la tiene ${titular.nombre || "alguien del equipo"}.`, titular };
  }
  const { error } = await sb.from("staff_atribuciones").insert({
    staff_id: input.staffId,
    objeto: input.objeto,
    objeto_id: input.objetoId,
    como: input.como,
    por: input.por,
  });
  // 23505 = carrera: otra persona la tomó en el mismo instante. Se dice.
  if (error) return { ok: false, error: error.code === "23505" ? "Alguien la acaba de tomar." : error.message };
  return { ok: true };
}

/** Cierra la fila abierta del objeto (si la hay) con ese cierre. */
export async function cerrarAtribucion(
  objeto: Objeto,
  objetoId: string,
  cierre: "transferencia" | "baja" | "resuelta" | "soltada",
  sb: Sb = createSupabaseAdminClient(),
): Promise<{ ok: boolean; habia: boolean; staffId: string | null }> {
  const t = await titularDe(objeto, objetoId, sb);
  if (!t) return { ok: true, habia: false, staffId: null };
  const { error } = await sb
    .from("staff_atribuciones")
    .update({ hasta: new Date().toISOString(), cierre })
    .eq("objeto", objeto)
    .eq("objeto_id", objetoId)
    .is("hasta", null);
  return { ok: !error, habia: true, staffId: t.staffId };
}

/**
 * Pasa el objeto de quien lo tenga a `aStaffId`. `cierre` dice por qué
 * (`transferencia` normal, `baja` cuando quien lo tenía sale del equipo).
 */
export async function transferirAtribucion(
  objeto: Objeto,
  objetoId: string,
  aStaffId: string,
  cierre: "transferencia" | "baja",
  por: string | null,
  sb: Sb = createSupabaseAdminClient(),
): Promise<{ ok: true } | { ok: false; error: string }> {
  const t = await titularDe(objeto, objetoId, sb);
  if (t?.staffId === aStaffId) return { ok: true };
  if (t) {
    const c = await cerrarAtribucion(objeto, objetoId, cierre, sb);
    if (!c.ok) return { ok: false, error: `No se pudo cerrar la ${OBJETO[objeto].uno}.` };
  }
  const { error } = await sb.from("staff_atribuciones").insert({
    staff_id: aStaffId,
    objeto,
    objeto_id: objetoId,
    como: "transferida",
    por,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** El libro entero (abiertas y cerradas). Para las pantallas y las derivaciones puras. */
export async function leerLibro(sb: Sb = createSupabaseAdminClient()): Promise<FilaLibro[]> {
  const { data, error } = await sb
    .from("staff_atribuciones")
    .select("id, staff_id, objeto, objeto_id, desde, hasta, cierre")
    .order("desde");
  if (error) return [];
  return (data ?? []) as FilaLibro[];
}

/**
 * QUIÉN VENDIÓ ESTE PAGO. Se decide al entrar el pago, nunca después: el
 * titular de la tarjeta de esa persona para esa experiencia (con la salida si
 * la tarjeta la tiene; una tarjeta sin fecha también cuenta), y si no hay
 * tarjeta, el titular del grupo (la salida). Null = nadie del equipo.
 */
export async function vendedorParaPago(
  input: { contactId: string; experienceId: string | null; slotId: string | null },
  sb: Sb = createSupabaseAdminClient(),
): Promise<string | null> {
  if (input.experienceId) {
    const { data } = await sb
      .from("crm_cards")
      .select("id, slot_id")
      .eq("contact_id", input.contactId)
      .eq("experience_id", input.experienceId)
      .not("stage", "in", '("caido")')
      .order("created_at", { ascending: false });
    const tarjetas = (data ?? []) as { id: string; slot_id: string | null }[];
    // Primero la de ESA salida, luego la que no tenía fecha.
    const orden = [
      ...tarjetas.filter((t) => input.slotId && t.slot_id === input.slotId),
      ...tarjetas.filter((t) => t.slot_id === null),
    ];
    for (const t of orden) {
      const tit = await titularDe("tarjeta", t.id, sb);
      if (tit) return tit.staffId;
    }
  }
  if (input.slotId) {
    const tit = await titularDe("grupo", input.slotId, sb);
    if (tit) return tit.staffId;
  }
  return null;
}

/**
 * TOMAR ES ACTUAR. Cuando alguien del equipo agenda la llamada de una
 * solicitud o mueve una tarjeta, esa cosa pasa a ser suya si nadie la tenía.
 * Si ya era de otro no se le quita (se actúa, no se arrebata), y la casa no
 * toma nada: la casa asigna. Nunca falla hacia afuera: la acción principal ya
 * ocurrió y una atribución perdida se ve en la pantalla, no en un error.
 */
export async function tomarSiLibre(objeto: Objeto, objetoId: string): Promise<void> {
  const a = await alcanceActual();
  const eq = equipoDelAlcance(a);
  if (!eq) return;
  const sb = createSupabaseAdminClient();
  let operatorId: string | null = null;
  if (objeto === "tarjeta") {
    const { data } = await sb.from("crm_cards").select("operator_id").eq("id", objetoId).maybeSingle();
    operatorId = (data as { operator_id: string | null } | null)?.operator_id ?? null;
  } else if (objeto === "grupo") {
    const { data } = await sb.from("experience_slots").select("experiences(operator_id)").eq("id", objetoId).maybeSingle();
    operatorId = (data as unknown as { experiences: { operator_id: string | null } | null } | null)?.experiences?.operator_id ?? null;
  }
  const persona = { id: eq.staffId, activo: true, numan: eq.numan, facultades: eq.facultades, operadoras: eq.operadoras };
  if (!puedeTener(persona, objeto, operatorId)) return;
  const r = await atribuir({ staffId: eq.staffId, objeto, objetoId, como: "tomada", por: await correoEnSesion() }, sb);
  if (!r.ok && !r.titular) console.error("tomarSiLibre:", objeto, objetoId, r.error);
}
