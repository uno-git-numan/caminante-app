import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// LO QUE PIDEN — la carga de la bandeja, separada de su pantalla.
//
// Vivía dentro de `admin/solicitudes/page.tsx`. Cuando la bandeja dejó de ser
// una pestaña y pasó a ser la tercera vista de Comunidad, la pantalla dejó de
// ser quien pregunta: Comunidad carga sus tres vistas de un tirón y le pasa a
// cada una lo suyo. Si el fetch se hubiera quedado en el componente, el
// contador del segmentado habría necesitado UNA SEGUNDA consulta contando lo
// mismo — dos verdades para el mismo número, que es justo como empiezan los
// «dice 5 aquí y 6 allá».
//
// Las dos tablas jóvenes (embajadores 0029, operadores 0041) se piden en
// best-effort a propósito: si la migración no está aplicada la bandeja avisa en
// su lugar en vez de tumbar toda la pantalla de Comunidad.

export type SolRow = {
  id: string;
  desired_date: string | null;
  nota: string | null;
  num_people: number;
  group_type: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  created_slot_id: string | null;
  contacts: { full_name: string | null; email: string | null; phone: string | null } | null;
  experiences: { slug: string; data: { title?: string; titleAccent?: string; docTitle?: string } | null } | null;
};

export type WLRow = { email: string; is_active: boolean; note: string | null; created_at: string };

export type EmbRow = {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  profile_kind: string;
  social_links: string;
  experience: string | null;
  why_caminante: string | null;
  referral_source: string | null;
  status: string;
  created_at: string;
};

export type OpRow = {
  id: string; nombre_operadora: string; responsable: string; email: string; whatsapp: string;
  instagram: string | null; ciudad_estado: string; tipo_operacion: string; descripcion: string;
  antiguedad: string; salidas_ano: string | null; personas_salida: string | null;
  rango_precio: string | null; seguro_rc: string; primeros_auxilios: string; ratio_guias: string;
  incidentes: string; porque: string | null; conociste: string | null; status: string;
  llamada_meet_url: string | null; llamada_at: string | null; expediente: unknown;
  branding: unknown; branding_despues: boolean | null; created_at: string;
};

export type Solicitudes = {
  nuevas: SolRow[];
  resueltas: SolRow[];
  opPend: WLRow[];
  opActivos: WLRow[];
  embPend: EmbRow[];
  embResueltas: EmbRow[];
  embTablaLista: boolean;
  ops: OpRow[];
  opsTablaLista: boolean;
  /** Lo que espera una decisión humana: es el número del segmentado. */
  pendientes: number;
};

async function fetchEmbApps(): Promise<{ rows: EmbRow[]; tablaLista: boolean }> {
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("ambassador_applications")
      .select("id, full_name, email, whatsapp, profile_kind, social_links, experience, why_caminante, referral_source, status, created_at")
      .order("created_at", { ascending: false });
    if (error) return { rows: [], tablaLista: false };
    return { rows: (data ?? []) as EmbRow[], tablaLista: true };
  } catch {
    return { rows: [], tablaLista: false };
  }
}

async function cargarOperadores(): Promise<{ rows: OpRow[]; tablaLista: boolean }> {
  try {
    const sb = createSupabaseAdminClient();
    const { data, error } = await sb
      .from("operator_applications")
      .select(
        "id, nombre_operadora, responsable, email, whatsapp, instagram, ciudad_estado, tipo_operacion, descripcion, antiguedad, salidas_ano, personas_salida, rango_precio, seguro_rc, primeros_auxilios, ratio_guias, incidentes, porque, conociste, status, llamada_meet_url, llamada_at, expediente, branding, branding_despues, created_at",
      )
      .in("status", ["pending", "calling", "docs"])
      .order("created_at", { ascending: false });
    if (error) return { rows: [], tablaLista: false };
    return { rows: (data ?? []) as OpRow[], tablaLista: true };
  } catch {
    return { rows: [], tablaLista: false };
  }
}

export async function fetchSolicitudes(): Promise<Solicitudes> {
  const sb = createSupabaseAdminClient();
  const [{ data: reqData }, { data: wlData }, emb, ops] = await Promise.all([
    sb
      .from("slot_requests")
      .select(
        "id, desired_date, nota, num_people, group_type, status, created_at, resolved_at, created_slot_id, contacts(full_name, email, phone), experiences(slug, data)",
      )
      .order("created_at", { ascending: false }),
    sb
      .from("admin_whitelist")
      .select("email, is_active, note, created_at")
      .order("created_at", { ascending: false }),
    fetchEmbApps(),
    cargarOperadores(),
  ]);

  const rows = (reqData ?? []) as unknown as SolRow[];
  const wl = (wlData ?? []) as WLRow[];

  const nuevas = rows.filter((r) => r.status === "new");
  const opPend = wl.filter((r) => !r.is_active);
  const embPend = emb.rows.filter((r) => r.status === "pending");

  return {
    nuevas,
    resueltas: rows.filter((r) => r.status !== "new"),
    opPend,
    opActivos: wl.filter((r) => r.is_active),
    embPend,
    embResueltas: emb.rows.filter((r) => r.status !== "pending"),
    embTablaLista: emb.tablaLista,
    ops: ops.rows,
    opsTablaLista: ops.tablaLista,
    // Las cuatro cosas que están esperando a que alguien diga sí o no.
    pendientes: nuevas.length + opPend.length + embPend.length + ops.rows.length,
  };
}
