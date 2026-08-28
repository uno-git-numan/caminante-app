// LO QUE PIDEN — la tercera vista de Comunidad.
//
// Era su propia pestaña («Solicitudes»). Dejó de serlo porque una solicitud es
// una persona preguntando: pertenece al mismo lugar donde vive la gente, no a
// una bandeja aparte. Nada del contenido cambió al mudarse —las cuatro tarjetas
// y sus acciones de aprobar/rechazar son las mismas—; lo que cambió es que ya no
// trae su propio `AdminShell` ni su propio fetch: Comunidad la envuelve y le
// pasa los datos ya cargados (`lib/comunidad/solicitudes.ts`).
//
// Cuatro cosas llegan aquí, y conviene no confundirlas:
//   · operadora que quiere operar sobre la plataforma  → llamada, expediente, alta
//   · embajador que aplica al programa curado          → alta como aliado, sin panel
//   · operador pidiendo acceso al panel                → whitelist
//   · cliente pidiendo una nueva fecha                 → nace la salida real
import SolicitudCard, { type SolicitudView } from "./SolicitudCard";
import AccesoCard from "./AccesoCard";
import EmbajadorCard, { type EmbAppView } from "./EmbajadorCard";
import OperadorAppCard, { type OpAppView } from "./OperadorAppCard";
import type { EmbRow, SolRow, Solicitudes as Datos } from "@/lib/comunidad/solicitudes";

const TZ = "America/Mexico_City";
function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: TZ });
}
function titulo(r: SolRow): string {
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

export default function Solicitudes({ d }: { d: Datos }) {
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
    <>
      <div className="sec-head" style={{ marginTop: 18 }}>
        <div>
          <span className="eyebrow"><span className="sl">{"//"}</span> Lo que piden</span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            Alguien está <em className="ac">esperando respuesta.</em>
          </h2>
          <p className="desc">
            <b>Embajadores</b> que aplican al programa, <b>operadores</b> que quieren acceso al panel
            y <b>clientes</b> que piden una nueva fecha.
          </p>
        </div>
      </div>

      {/* ── Solicitud de OPERADOR ── */}
      <div className="sec-head" style={{ marginTop: 8 }}>
        <span className="eyebrow"><span className="sl">{"//"}</span> Solicitud de operador</span>
        <p className="subtitle">
          Quien quiere <b>operar sus propias experiencias</b> sobre la plataforma. El recorrido es
          solicitud → <b>videollamada</b> → <b>expediente</b> de documentos → aprobación. A
          diferencia de un embajador, aprobar aquí <b>le abre el panel completo</b>: reservas, datos
          médicos de clientes y dinero.
        </p>
      </div>

      {!d.opsTablaLista ? (
        <div className="empty">
          Falta aplicar <b>0041_operator_application_branding</b> en el SQL Editor (o la 0035, si es la primera vez).
        </div>
      ) : d.ops.length === 0 ? (
        <div className="empty">Sin solicitudes de operador abiertas.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {d.ops.map((r) => (
            <OperadorAppCard
              key={r.id}
              app={{
                id: r.id,
                nombreOperadora: r.nombre_operadora,
                responsable: r.responsable,
                email: r.email,
                whatsapp: r.whatsapp,
                instagram: r.instagram,
                ciudadEstado: r.ciudad_estado,
                tipo: r.tipo_operacion,
                descripcion: r.descripcion,
                antiguedad: r.antiguedad,
                salidasAno: r.salidas_ano,
                personasSalida: r.personas_salida,
                rangoPrecio: r.rango_precio,
                seguro: r.seguro_rc,
                primerosAuxilios: r.primeros_auxilios,
                ratioGuias: r.ratio_guias,
                incidentes: r.incidentes,
                porque: r.porque,
                conociste: r.conociste,
                status: r.status,
                meetUrl: r.llamada_meet_url,
                llamadaAt: r.llamada_at,
                expediente: Array.isArray(r.expediente)
                  ? (r.expediente as OpAppView["expediente"])
                  : [],
                marca: (r.branding as OpAppView["marca"]) ?? null,
                marcaDespues: r.branding_despues === true,
                fecha: fmtFecha(r.created_at),
              }}
            />
          ))}
        </div>
      )}

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

      {!d.embTablaLista ? (
        <div className="empty">
          La tabla de aplicaciones aún no existe — aplica la migración <b>0029_ambassador_applications</b> en el SQL Editor.
        </div>
      ) : d.embPend.length === 0 ? (
        <div className="empty">Sin aplicaciones de embajador pendientes.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {d.embPend.map((r) => (
            <EmbajadorCard key={r.id} app={aVista(r)} />
          ))}
        </div>
      )}

      {d.embResueltas.length ? (
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
                  {d.embResueltas.map((r) => (
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

      {d.opPend.length === 0 ? (
        <div className="empty">Sin solicitudes de acceso pendientes.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {d.opPend.map((r) => (
            <AccesoCard key={r.email} email={r.email} nombre={nombreDeNota(r.note)} />
          ))}
        </div>
      )}

      {d.opActivos.length ? (
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
                  {d.opActivos.map((r) => (
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

      {d.nuevas.length === 0 ? (
        <div className="empty">Sin solicitudes pendientes. Cuando llegue una, también te avisamos por WhatsApp y correo.</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {d.nuevas.map((r) => {
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

      {d.resueltas.length > 0 ? (
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
                  {d.resueltas.map((r) => (
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
    </>
  );
}
