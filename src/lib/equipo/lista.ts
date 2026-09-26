import "server-only";

// LA LISTA DEL EQUIPO — lo que ve quien lo administra (la casa: todos; una
// operadora: los suyos), con la cartera de cada quien (0071). Sin dinero
// todavía: la comisión se deriva del libro y de `payments.vendedor_id`, y
// tiene su propia pantalla (Rendimiento, sólo uno@numanhub.com).

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { facultadesDe, type Facultad } from "@/lib/equipo/facultades";
import { leerLibro } from "@/lib/equipo/atribucion";
import { aQuienPaso, carteraDe, type Objeto } from "@/lib/equipo/atribucion-reglas";

export type CosaEnCartera = { objeto: Objeto; id: string; nombre: string; operatorId: string | null };

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
  /** Lo abierto a su nombre hoy, con nombre para la pantalla. */
  cartera: CosaEnCartera[];
  /** Si se dio de baja: a quién pasó su cartera (nombres). Vacío si no tenía. */
  carteraPasoA: string[];
};

export async function fetchEquipo(soloOperadora?: string): Promise<MiembroEnPantalla[]> {
  const sb = createSupabaseAdminClient();
  const [{ data: staff }, { data: rel }, { data: ops }, libro] = await Promise.all([
    sb.from("staff").select("id, email, nombre, numan, facultades, activo, alta_at, baja_at").order("alta_at"),
    sb.from("staff_operadoras").select("staff_id, operator_id"),
    sb.from("operators").select("id, name"),
    leerLibro(sb),
  ]);
  const nombreDe = new Map(((ops ?? []) as { id: string; name: string | null }[]).map((o) => [o.id, o.name || "Operadora"]));
  const porStaff = new Map<string, { id: string; nombre: string }[]>();
  for (const r of (rel ?? []) as { staff_id: string; operator_id: string }[]) {
    if (!porStaff.has(r.staff_id)) porStaff.set(r.staff_id, []);
    porStaff.get(r.staff_id)!.push({ id: r.operator_id, nombre: nombreDe.get(r.operator_id) ?? "Operadora" });
  }
  type Fila = { id: string; email: string; nombre: string; numan: boolean; facultades: unknown; activo: boolean; alta_at: string; baja_at: string | null };
  const filas = (staff ?? []) as Fila[];
  const nombreStaff = new Map(filas.map((f) => [f.id, f.nombre]));

  // Los nombres de lo que hay en el libro, en tres consultas y no una por cosa.
  const abiertas = libro.filter((f) => f.hasta === null);
  const ids = (o: Objeto) => [...new Set(abiertas.filter((f) => f.objeto === o).map((f) => f.objeto_id))];
  const [{ data: sols }, { data: cards }, { data: slots }] = await Promise.all([
    ids("solicitud").length ? sb.from("operator_applications").select("id, nombre_operadora").in("id", ids("solicitud")) : Promise.resolve({ data: [] }),
    ids("tarjeta").length ? sb.from("crm_cards").select("id, operator_id, contacts(full_name), experiences(slug)").in("id", ids("tarjeta")) : Promise.resolve({ data: [] }),
    ids("grupo").length ? sb.from("experience_slots").select("id, label, experiences(slug, operator_id)").in("id", ids("grupo")) : Promise.resolve({ data: [] }),
  ]);
  const nombreCosa = new Map<string, { nombre: string; operatorId: string | null }>();
  for (const s of (sols ?? []) as { id: string; nombre_operadora: string | null }[]) nombreCosa.set(`solicitud:${s.id}`, { nombre: s.nombre_operadora || "Solicitud", operatorId: null });
  for (const c of (cards ?? []) as unknown as { id: string; operator_id: string | null; contacts: { full_name: string | null } | null; experiences: { slug: string | null } | null }[]) {
    nombreCosa.set(`tarjeta:${c.id}`, { nombre: `${c.contacts?.full_name || "Alguien"} · ${c.experiences?.slug || "experiencia"}`, operatorId: c.operator_id });
  }
  for (const g of (slots ?? []) as unknown as { id: string; label: string | null; experiences: { slug: string | null; operator_id: string | null } | null }[]) {
    nombreCosa.set(`grupo:${g.id}`, { nombre: `${g.experiences?.slug || "experiencia"} · ${g.label || "salida"}`, operatorId: g.experiences?.operator_id ?? null });
  }
  const cosa = (objeto: Objeto, id: string): CosaEnCartera => {
    if (objeto === "operadora") return { objeto, id, nombre: nombreDe.get(id) ?? "Operadora", operatorId: id };
    const n = nombreCosa.get(`${objeto}:${id}`);
    return { objeto, id, nombre: n?.nombre ?? objeto, operatorId: n?.operatorId ?? null };
  };

  const todos = filas.map((f) => {
    const c = carteraDe(libro, f.id);
    return {
      id: f.id,
      email: f.email,
      nombre: f.nombre,
      numan: f.numan === true,
      facultades: facultadesDe(f.facultades),
      activo: f.activo === true,
      altaAt: f.alta_at,
      bajaAt: f.baja_at,
      operadoras: porStaff.get(f.id) ?? [],
      cartera: (Object.keys(c) as Objeto[]).flatMap((o) => c[o].map((id) => cosa(o, id))),
      carteraPasoA: f.activo ? [] : aQuienPaso(libro, f.id).map((id) => nombreStaff.get(id) ?? "alguien del equipo"),
    };
  });
  // Una operadora sólo ve a quien trabaja para ella, y de esa persona sólo lo
  // que le atañe: si además es de numan o de otra, no es asunto suyo. Su
  // cartera también se recorta a lo de ESTA operadora.
  if (!soloOperadora) return todos;
  return todos
    .filter((m) => m.activo && m.operadoras.some((o) => o.id === soloOperadora))
    .map((m) => ({
      ...m,
      numan: false,
      operadoras: m.operadoras.filter((o) => o.id === soloOperadora),
      cartera: m.cartera.filter((x) => (x.objeto === "tarjeta" || x.objeto === "grupo") && x.operatorId === soloOperadora),
    }));
}
