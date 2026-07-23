// Solicitudes: bandeja única del admin con DOS tipos —
//  · Solicitud operador (admin_whitelist is_active=false): dar acceso al panel.
//  · Solicitud cliente (slot_requests): pedir nueva fecha → nace la salida real.
// Antes "Accesos" era su propia sección; se fundió aquí (un solo lugar para todo
// lo que llega "pidiendo algo"). El contenido de la experiencia NO se toca aquí.
import AdminShell from "../ui/AdminShell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import SolicitudCard, { type SolicitudView } from "./SolicitudCard";
import AccesoCard from "./AccesoCard";
import EmbajadorCard, { type EmbAppView } from "./EmbajadorCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Solicitudes · Admin" };

type Row = {
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

type WLRow = { email: string; is_active: boolean; note: string | null; created_at: string };

type EmbRow = {
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

// Aplicaciones de embajador — best-effort: si la tabla aún no existe (0029 sin
// aplicar), la página no se cae; la sección sale vacía con la nota.
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

const TZ = "America/Mexico_City";
function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: TZ });
}
function titulo(r: Row): string {
  return (
    [r.experiences?.data?.title, r.experiences?.data?.titleAccent].filter(Boolean).join(" ").trim() ||
    r.experiences?.data?.docTitle ||
    r.experiences?.slug ||
    "—"
  );
}
function nombreDeNota(note: string | null): string {
  const m = /solicitud operador:\s*(.+)/i.exec(note || "");
  return m ? m[1].trim() : "";
}

export default async function SolicitudesPage() {
  const sb = createSupabaseAdminClient();
  const [{ data: reqData }, { data: wlData }, emb] = await Promise.all([
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
  ]);

  const rows = (reqData ?? []) as unknown as Row[];
  const nuevas = rows.filter((r) => r.status === "new");
  const resueltas = rows.filter((r) => r.status !== "new");

  const wl = (wlData ?? []) as WLRow[];
  const opPend = wl.filter((r) => !r.is_active);
  const opActivos = wl.filter((r) => r.is_active);

  const embPend = emb.rows.filter((r) => r.status === "pending");
  const embResueltas = emb.rows.filter((r) => r.status !== "pending");
  const aVista = (r: EmbRow): EmbAppView => ({
    id: r.id,
    nombre: r.full_name,
    email: r.email,
    whatsapp: r.whatsapp,
    perfil: r.profile_kind,
    links: r.social_links,
    experiencia: r.experience,
    porque: r.why_caminante,
    conociste: r.referral_source,
    fecha: fmtFecha(r.created_at),
  });

  return (
    <AdminShell active="solicitudes">
      <div className="sec-head">
        <span className="eyebrow"><span className="sl">{"//"}</span> Solicitudes</span>
        <h1 className="display">
          Lo que <em className="ac">piden.</em>
        </h1>
        <p className="subtitle">
          Todo lo que llega pidiendo algo: <b>embajadores</b> que aplican al programa,{" "}
          <b>operadores</b> que quieren acceso al panel y <b>clientes</b> que piden una nueva fecha.
        </p>
      </div>

      {/* ── Solicitud embajador (programa curado) ── */}
      <div className="sec-head" style={{ marginTop: 8 }}>
        <span className="eyebrow"><span className="sl">{"//"}</span> Solicitud embajador</span>
        <p className="subtitle">
          Aplicaciones al <b>programa de embajadores</b> (curado: aplicación → llamada de 30 min →
          convenio). Aprobar lo da de alta como <b>aliado</b> para la atribución de sus ventas y le
          manda el correo de bienvenida; rechazar manda un «por ahora no» amable. Ninguna de las dos
          le da acceso al panel.
        </p>
      </div>

      {!emb.tablaLista ? (
        <div className="empty">
          La tabla de aplicaciones aún no existe — aplica la migración <b>0029_ambassador_applications</b> en el SQL Editor.
        </div>
      ) : embPend.length === 0 ? (
        <div className="empty">Sin aplicaciones de embajador pendientes.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {embPend.map((r) => (
            <EmbajadorCard key={r.id} app={aVista(r)} />
          ))}
        </div>
      )}

      {embResueltas.length ? (
        <>
          <div className="sec-head" style={{ marginTop: 24 }}>
            <span className="eyebrow"><span className="sl">{"//"}</span> Historial de embajadores</span>
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr><th>Nombre</th><th>Correo</th><th>Perfil</th><th>Estado</th><th>Fecha</th></tr>
                </thead>
                <tbody>
                  {embResueltas.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.full_name}</td>
                      <td className="mut">{r.email}</td>
                      <td className="mut">{r.profile_kind}</td>
                      <td>
                        {r.status === "approved" ? (
                          <span className="chip c-paid">Embajador</span>
                        ) : (
                          <span className="chip c-canc">Rechazada</span>
                        )}
                      </td>
                      <td className="mut">{fmtFecha(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* ── Solicitud operador (acceso al panel) ── */}
      <div className="sec-head" style={{ marginTop: 8 }}>
        <span className="eyebrow"><span className="sl">{"//"}</span> Solicitud operador</span>
        <p className="subtitle">
          Quien se registra como <b>operador</b> queda aquí en espera. Aprobar le da acceso al panel
          (crear/editar experiencias, cobrar, gestionar). El acceso <b>nunca</b> es automático.
        </p>
      </div>

      {opPend.length === 0 ? (
        <div className="empty">Sin solicitudes de acceso pendientes.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {opPend.map((r) => (
            <AccesoCard key={r.email} email={r.email} nombre={nombreDeNota(r.note)} />
          ))}
        </div>
      )}

      {opActivos.length ? (
        <>
          <div className="sec-head" style={{ marginTop: 24 }}>
            <span className="eyebrow"><span className="sl">{"//"}</span> Operadores activos</span>
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Correo</th>
                    <th>Nota</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {opActivos.map((r) => (
                    <tr key={r.email}>
                      <td style={{ fontWeight: 500 }}>{r.email}</td>
                      <td className="mut">{r.note || "—"}</td>
                      <td><span className="chip c-paid">Activo</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mut" style={{ fontSize: 12.5, marginTop: 10 }}>
            Para quitarle el acceso a alguien, desactívalo en Supabase (admin_whitelist · is_active=false).
          </p>
        </>
      ) : null}

      {/* ── Solicitud cliente (nueva fecha) ── */}
      <div className="sec-head" style={{ marginTop: 40 }}>
        <span className="eyebrow"><span className="sl">{"//"}</span> Solicitud cliente</span>
        <p className="subtitle">
          Cada solicitud viene de la web (&quot;Solicitar nueva fecha&quot;). Aprobarla crea la salida
          real: <b>privada</b> te da un link exclusivo para el grupo (mándalo por WhatsApp);{" "}
          <b>abierta</b> aparece en la página al instante.
        </p>
      </div>

      {nuevas.length === 0 ? (
        <div className="empty">Sin solicitudes pendientes. Cuando llegue una, también te avisamos por WhatsApp y correo.</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {nuevas.map((r) => {
            const s: SolicitudView = {
              id: r.id,
              cliente: r.contacts?.full_name || "Sin nombre",
              email: r.contacts?.email || "—",
              whatsapp: r.contacts?.phone || "—",
              experiencia: titulo(r),
              slug: r.experiences?.slug || "",
              desiredDate: r.desired_date,
              nota: r.nota,
              personas: r.num_people,
              groupType: r.group_type === "open" ? "open" : "private",
              createdAt: fmtFecha(r.created_at),
            };
            return <SolicitudCard key={r.id} s={s} />;
          })}
        </div>
      )}

      {resueltas.length > 0 ? (
        <>
          <div className="sec-head" style={{ marginTop: 34 }}>
            <span className="eyebrow"><span className="sl">{"//"}</span> Historial</span>
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Experiencia</th>
                    <th className="num">Personas</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th className="num right">Resuelta</th>
                  </tr>
                </thead>
                <tbody>
                  {resueltas.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.contacts?.full_name || "—"}</td>
                      <td>{titulo(r)}</td>
                      <td className="num">{r.num_people}</td>
                      <td>{r.group_type === "open" ? "Abierta" : "Privada"}</td>
                      <td>
                        {r.status === "approved" ? (
                          <span className="chip c-paid">Aprobada</span>
                        ) : (
                          <span className="chip c-canc">Rechazada</span>
                        )}
                      </td>
                      <td className="num right">{r.resolved_at ? fmtFecha(r.resolved_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mut" style={{ fontSize: 12.5, marginTop: 10 }}>
            El link de una salida privada aprobada se re-copia desde{" "}
            <b>Eventos → la experiencia → su salida</b>.
          </p>
        </>
      ) : null}
    </AdminShell>
  );
}
