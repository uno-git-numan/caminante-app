import { formatMXN } from "@/lib/admin/formato";
import type { OperadoraPlataforma } from "@/lib/plataforma/operadoras";

// LA BIBLIOTECA DE OPERADORAS — una sola pregunta por renglón: ¿puede vender hoy?
//
// Los seis candados se quedan JUNTOS aunque crucen las tres secciones del panel
// (dos son legales, uno es de dinero, uno de catálogo, dos operativos). Partirlos
// por área habría roto lo único que los hace útiles: ver de un jalón qué falta.
// Lo que sí se distingue es DE QUIÉN es cada uno — así la ficha deja de ser un
// diagnóstico y se vuelve una lista de pendientes con dueño.

const PALOMA = (
  <svg className="m" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12.6l5.2 5.2L20 6.6" />
  </svg>
);
const TACHE = (
  <svg className="m" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

function Candados({ o }: { o: OperadoraPlataforma }) {
  return (
    <div className="locks">
      {o.candados.map((c) => (
        <span key={c.clave} className={c.cumplido ? "lk ok" : "lk no"}>
          {c.cumplido ? PALOMA : TACHE}
          <span className="g">
            {c.nombre}
            <small>{c.detalle}</small>
          </span>
          {/* El entregable ya traía esta distinción y es lo que vuelve útil la
              ficha: «Yo» es lo que la casa tiene que hacer, «Él» lo que se le
              pide a la operadora. Sin eso, dos operadoras en 2 de 6 se ven
              idénticas y lo que las destraba es distinto. */}
          <span className={c.toca === "casa" ? "own yo" : "own el"}>
            {c.toca === "casa" ? "Yo" : "Él"}
          </span>
        </span>
      ))}
    </div>
  );
}

export default function Operadoras({ ops }: { ops: OperadoraPlataforma[] }) {
  const externas = ops.filter((o) => !o.esLaCasa);
  const casa = ops.filter((o) => o.esLaCasa);

  return (
    <>
      <div className="sec-head" style={{ marginTop: 18 }}>
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Operadoras
          </span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            Una sola pregunta: <em className="ac">¿puede vender hoy?</em>
          </h2>
          <p className="desc">
            Seis candados por operadora. Con que falte uno, no vende. Cada candado dice además de
            quién depende: lo que yo tengo que hacer y lo que le tengo que pedir.
          </p>
        </div>
      </div>

      <div className="tbl-wrap card">
        <table>
          <thead>
            <tr>
              <th>Operadora</th>
              <th>¿Puede vender hoy?</th>
              <th>Candados</th>
              <th className="num">Suyas publicadas</th>
              <th className="num right">Vendido este mes</th>
              <th className="num right">Histórico</th>
            </tr>
          </thead>
          <tbody>
            {[...externas, ...casa].map((o) => {
              const xid = `op-${o.id.slice(0, 8)}`;
              return (
                <>
                  <tr className="xhead" data-x={xid} key={o.id}>
                    <td>
                      <span className="opnm">
                        <span className="av">{o.iniciales}</span>
                        <span>
                          <b>{o.nombre}</b>
                          <small>{o.rfc ?? "sin RFC"}</small>
                        </span>
                      </span>
                    </td>
                    <td>
                      {o.esLaCasa ? (
                        <span className="chip">Es la casa</span>
                      ) : o.puedeVender ? (
                        <span className="chip c-paid">Puede vender</span>
                      ) : (
                        <span className="chip c-canc">No puede vender</span>
                      )}
                    </td>
                    <td>
                      {o.esLaCasa ? (
                        <span className="mut">Sin candados que cumplir</span>
                      ) : (
                        <span className="lockmini">
                          {o.candados.map((c) => (
                            <i key={c.clave} className={c.cumplido ? "ok" : "no"} />
                          ))}
                          <u>{o.cumplidos} de 6</u>
                        </span>
                      )}
                    </td>
                    <td className="num">
                      {o.experienciasPublicadas}
                      {o.experienciasBorrador > 0 ? (
                        <small className="mut" style={{ display: "block", fontSize: 11 }}>
                          {o.experienciasBorrador} en borrador
                        </small>
                      ) : null}
                    </td>
                    <td className="num right">{formatMXN(o.vendidoMes)}</td>
                    <td className="num right">
                      {o.esLaCasa ? (
                        <>
                          {formatMXN(o.vendidoHistorico)}
                          <small className="mut" style={{ display: "block", fontSize: 11 }}>
                            retiene el 100%
                          </small>
                        </>
                      ) : (
                        formatMXN(o.vendidoHistorico)
                      )}
                    </td>
                  </tr>
                  <tr className="xdetail" key={`${o.id}-d`}>
                    <td colSpan={6}>
                      <div className="xbody" id={xid}>
                        <div className="xpad">
                          {o.esLaCasa ? (
                            <div className="verdict">
                              <span className="n">{"//"}</span>
                              <span className="g">
                                <b>No es una operadora externa</b>
                                <span>
                                  Se vende a sí misma y retiene el 100%. No cobra comisión, así que
                                  no tiene candados que cumplir ni fecha de arranque que respetar.
                                </span>
                              </span>
                            </div>
                          ) : (
                            <>
                              <div className={o.puedeVender ? "verdict" : "verdict no"}>
                                <span className="n">{o.cumplidos}/6</span>
                                <span className="g">
                                  <b>{o.puedeVender ? "Puede vender hoy" : "No puede vender hoy"}</b>
                                  <span>
                                    {o.puedeVender
                                      ? "Los seis candados están puestos."
                                      : `Le faltan ${6 - o.cumplidos}: ${o.candados
                                          .filter((c) => !c.cumplido)
                                          .map((c) => c.nombre.toLowerCase())
                                          .join(", ")}.`}
                                  </span>
                                </span>
                              </div>
                              <Candados o={o} />
                              <p className="arr">
                                <s>Arranque de comisión</s>
                                {o.comisionDesde ? (
                                  <>
                                    <span>Su comisión del {o.comisionPct}% arranca el</span>
                                    <b>
                                      {new Date(o.comisionDesde).toLocaleDateString("es-MX", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        timeZone: "America/Mexico_City",
                                      })}
                                      .
                                    </b>
                                    <span>
                                      Lo vendido antes de esa fecha no genera comisión y no se suma
                                      nunca.
                                    </span>
                                  </>
                                ) : (
                                  <span>
                                    Todavía no tiene fecha de arranque. Sin ella no se le devenga
                                    comisión aunque venda.
                                  </span>
                                )}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mut" style={{ fontSize: 12.5, marginTop: 10 }}>
        La casa aparece en la lista porque vende, pero se lee distinto: sin candados y sin comisión.
        No es una operadora a la que haya que revisarle nada.
      </p>
    </>
  );
}
