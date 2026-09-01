import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// LO QUE ESPERA RESPUESTA EN EL CRM DE NUMAN.
//
// Antes esto cargaba CUATRO cosas y las metía en una sola bandeja. Dos de ellas
// no eran de NUMAN sino de la plataforma —quién quiere operar sobre Caminante y
// a quién se le abre el panel— y se mudaron al Pipeline del sombrero Caminante.
// Aprobar una operadora es de la casa; no es algo que una operadora haga.
//
// Aquí se queda lo que sí es de quien opera: el cliente que pide una fecha o un
// grupo privado, y el embajador que quiere traerle gente. Los dos son personas
// que se acercan a MI operación, y por eso viven junto al CRM y no en una
// bandeja aparte.
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

export type Solicitudes = {
  nuevas: SolRow[];
  resueltas: SolRow[];
  embPend: EmbRow[];
  embResueltas: EmbRow[];
  embTablaLista: boolean;
  /** Lo que espera una decisión humana. */
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

export async function fetchSolicitudes(): Promise<Solicitudes> {
  const sb = createSupabaseAdminClient();
  const [{ data: reqData }, emb] = await Promise.all([
    sb
      .from("slot_requests")
      .select(
        "id, desired_date, nota, num_people, group_type, status, created_at, resolved_at, created_slot_id, contacts(full_name, email, phone), experiences(slug, data)",
      )
      .order("created_at", { ascending: false }),
    fetchEmbApps(),
  ]);

  const rows = (reqData ?? []) as unknown as SolRow[];
  const nuevas = rows.filter((r) => r.status === "new");
  const embPend = emb.rows.filter((r) => r.status === "pending");

  return {
    nuevas,
    resueltas: rows.filter((r) => r.status !== "new"),
    embPend,
    embResueltas: emb.rows.filter((r) => r.status !== "pending"),
    embTablaLista: emb.tablaLista,
    // Las dos cosas que esperan a que alguien diga sí o no.
    pendientes: nuevas.length + embPend.length,
  };
}
