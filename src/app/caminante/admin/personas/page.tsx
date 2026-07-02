import AdminShell from "../ui/AdminShell";
import { fetchPersonas, formatMXN, iniciales } from "@/lib/admin/queries";
import type { PersonaAdmin } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Personas · Admin — Caminante" };

const etapas: Record<string, string> = {
  lead: "Lead",
  subscriber: "Suscriptor",
  customer: "Cliente",
};

function Row({ p }: { p: PersonaAdmin }) {
  const xid = `pe-${p.id.slice(0, 8)}`;
  return (
    <>
      <tr className="xhead" data-x={xid}>
        <td style={{ fontWeight: 500 }}>
          {p.nombre} <span className="chev2">▾</span>
        </td>
        <td className="mut">{p.email || p.phone || "—"}</td>
        <td>
          <span className={`chip ${p.etapa === "customer" ? "c-paid" : "c-sol"}`}>
            {etapas[p.etapa] || p.etapa}
          </span>
        </td>
        <td className="num">{p.numReservas}</td>
        <td className="num">{p.deslindes}</td>
        <td className="num right">{p.totalPagado ? formatMXN(p.totalPagado) : "—"}</td>
      </tr>
      <tr className="xdetail">
        <td colSpan={6}>
          <div className="xbody" id={xid}>
            <div className="xpad" style={{ padding: "18px 4px" }}>
              <div className="detail">
                <div>
                  <div className="xh4">Contacto</div>
                  <dl className="dl">
                    <dt>Correo</dt>
                    <dd>{p.email || "—"}</dd>
                    <dt>WhatsApp</dt>
                    <dd>{p.phone || "—"}</dd>
                    <dt>Ciudad</dt>
                    <dd>{p.city || "—"}</dd>
                    {p.tags.length ? (
                      <>
                        <dt>Tags</dt>
                        <dd>{p.tags.join(", ")}</dd>
                      </>
                    ) : null}
                  </dl>
                  {p.dependientes.length ? (
                    <>
                      <div className="xh4">Participantes guardados</div>
                      <div className="pchips">
                        {p.dependientes.map((d, i) => (
                          <span className="pchip ok" key={i}>
                            <span className="av">{iniciales(d.nombre)}</span>
                            {d.nombre}
                            {d.relacion ? <span className="dt">{d.relacion}</span> : null}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : null}
                  {p.notionUrl ? (
                    <div className="act-row">
                      <a href={p.notionUrl} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-sm">
                        Ver en Notion
                      </a>
                    </div>
                  ) : null}
                </div>
                <div>
                  <div className="xh4">Sus reservas</div>
                  <div className="wlist">
                    {p.reservas.map((r, i) => (
                      <div className="wl" key={i}>
                        <span>
                          {r.experiencia} <span className="mut">· {r.salida}</span>
                        </span>
                        <span className="m">{r.monto ? formatMXN(r.monto) : "—"}</span>
                        <span className="me">
                          {r.personas} pers · {r.estado}
                        </span>
                        <span className="d" />
                      </div>
                    ))}
                    {!p.reservas.length ? (
                      <div className="wl">
                        <span className="mut">Sin reservas aún</span>
                        <span className="m" />
                        <span className="me" />
                        <span className="d" />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

export default async function PersonasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const personas = await fetchPersonas(q || "");

  return (
    <AdminShell active="personas">
      <section className="sec">
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Personas
            </span>
            <h1 className="display">
              Tu <em className="ac">gente.</em>
            </h1>
            <div className="desc">Toca una persona para su historial, participantes y CRM.</div>
          </div>
        </div>

        <form method="get" className="filters no-print">
          <input name="q" defaultValue={q || ""} placeholder="Buscar por nombre, correo o teléfono…" />
          <button className="btn btn-ghost btn-sm" type="submit">
            Buscar
          </button>
        </form>

        <div className="card" style={{ overflow: "hidden" }}>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Contacto</th>
                  <th>Etapa</th>
                  <th className="num">Reservas</th>
                  <th className="num">Deslindes</th>
                  <th className="right">Total pagado</th>
                </tr>
              </thead>
              <tbody>
                {personas.map((p) => (
                  <Row key={p.id} p={p} />
                ))}
                {personas.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty" style={{ border: 0 }}>
                        Sin resultados.
                      </div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>
          {personas.length} personas · Los datos médicos completos viven en el roster de cada salida.
        </p>
      </section>
    </AdminShell>
  );
}
