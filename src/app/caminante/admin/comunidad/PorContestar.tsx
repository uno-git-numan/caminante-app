import SolicitudCard, { type SolicitudView } from "./SolicitudCard";
import EmbajadorCard, { type EmbAppView } from "./EmbajadorCard";
import type { EmbRow, SolRow, Solicitudes as Datos } from "@/lib/comunidad/solicitudes";

// LO QUE ESPERA RESPUESTA — arriba del tablero, dentro del CRM.
//
// Era una pestaña propia («Solicitudes») con cuatro tipos revueltos. Dos no
// eran de NUMAN sino de la plataforma —quién quiere operar sobre Caminante y a
// quién se le abre el panel— y se fueron al Pipeline del sombrero Caminante.
//
// Lo que queda sí es de quien opera, y por eso vive PEGADO al tablero en vez de
// en una bandeja aparte: un cliente que pide una fecha es una tarjeta del CRM
// que todavía no existe, y un embajador es alguien que quiere traer clientes a
// este mismo tablero. Mandarlos a otra pestaña era pedirle a Luis que
// recordara visitarla.

const TZ = "America/Mexico_City";
const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: TZ });

function titulo(r: SolRow): string {
  return (
    [r.experiences?.data?.title, r.experiences?.data?.titleAccent].filter(Boolean).join(" ").trim() ||
    r.experiences?.data?.docTitle ||
    r.experiences?.slug ||
    "—"
  );
}

export default function PorContestar({ d }: { d: Datos }) {
  if (d.pendientes === 0) return null;

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
    fecha: fmt(r.created_at),
  });

  return (
    <div className="sec" style={{ marginTop: 18 }}>
      <div className="sec-head">
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Por contestar
          </span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            {d.pendientes === 1 ? "Alguien espera" : `${d.pendientes} esperan`}{" "}
            <em className="ac">un sí o un no.</em>
          </h2>
          <p className="desc">
            Van antes del tablero porque son tarjetas que todavía no existen: en cuanto se aprueban,
            caen solas en <b>01 Llegó</b>.
          </p>
        </div>
      </div>

      {d.nuevas.length ? (
        <div style={{ display: "grid", gap: 14, marginBottom: d.embPend.length ? 22 : 0 }}>
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
              createdAt: fmt(r.created_at),
            };
            return <SolicitudCard key={r.id} s={s} />;
          })}
        </div>
      ) : null}

      {d.embPend.length ? (
        <>
          <p className="xh4">Embajadores que aplicaron</p>
          <p className="subtitle" style={{ marginBottom: 12 }}>
            Aprobar lo da de alta como <b>aliado</b> para la atribución de sus ventas. No le abre el
            panel: eso es otra cosa y todavía no existe su pipeline.
          </p>
          <div style={{ display: "grid", gap: 12 }}>
            {d.embPend.map((r) => (
              <EmbajadorCard key={r.id} app={aVista(r)} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
