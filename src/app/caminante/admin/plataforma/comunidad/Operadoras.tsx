import { formatMXN } from "@/lib/admin/formato";
import type { OperadoraPlataforma } from "@/lib/plataforma/operadoras";
import Candados from "./Candados";
import RevisarExpediente from "./RevisarExpediente";
import Dispensas from "./Dispensas";
import type { DispensaEnPantalla, PorRevisar } from "@/lib/operadores/expediente";

// LA BIBLIOTECA DE OPERADORAS — una sola pregunta por renglón: ¿puede vender hoy?
//
// Los seis candados se quedan JUNTOS aunque crucen las tres secciones del panel
// (dos son legales, uno es de dinero, uno de catálogo, dos operativos). Partirlos
// por área habría roto lo único que los hace útiles: ver de un jalón qué falta.
// Lo que sí se distingue es DE QUIÉN es cada uno — así la ficha deja de ser un
// diagnóstico y se vuelve una lista de pendientes con dueño.

export default function Operadoras({
  ops,
  porRevisar,
  dispensas,
  esCasa = true,
}: {
  ops: OperadoraPlataforma[];
  porRevisar: Map<string, PorRevisar>;
  /** Dispensas sólo la casa (0070): el equipo de numan las ve, no las otorga. */
  esCasa?: boolean;
  dispensas: Map<string, DispensaEnPantalla[]>;
}) {
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
                      ) : o.puedeCobrar ? (
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
                              <div className={o.puedeCobrar ? "verdict" : "verdict no"}>
                                <span className="n">{o.cumplidos}/6</span>
                                <span className="g">
                                  <b>{o.puedeCobrar ? "Puede vender hoy" : "No puede vender hoy"}</b>
                                  <span>
                                    {o.puedeCobrar
                                      ? "Los seis candados están puestos."
                                      : `Le faltan ${6 - o.cumplidos}: ${o.candados
                                          .filter((c) => !c.cumplido)
                                          .map((c) => c.nombre.toLowerCase())
                                          .join(", ")}.`}
                                  </span>
                                </span>
                              </div>
                              <Candados o={o} />
                              {/* Tarea #103. No es candado: no bloquea vender. Pero
                                  una marca a medias apaga su portal y viste el
                                  funnel de Caminante en vez de suyo — y nadie se
                                  entera hasta que ella lo ve. */}
                              <p className="arr">
                                <s>Marca</s>
                                {o.marca.completa ? (
                                  <span>Completa: su portal y su funnel se ven suyos.</span>
                                ) : (
                                  <span>
                                    <b>Incompleta:</b> le falta {o.marca.faltan.join(", ")}. Mientras, su
                                    portal y su funnel se ven de Caminante con su nombre.{" "}
                                    <a href={`/caminante/admin/mi-alta/marca?operadora=${o.id}`}>Capturarla por ella</a>
                                  </span>
                                )}
                              </p>
                              <RevisarExpediente cola={porRevisar.get(o.id)} />
                              {/* La casa sube POR ella. Es la puerta que faltaba
                                  cuando una operadora se atora: el expediente
                                  admite `?operadora=` sólo para la casa. */}
                              <p className="arr">
                                <s>Expediente</s>
                                <span>
                                  <a href={`/caminante/admin/mi-alta/expediente?operadora=${o.id}`}>
                                    Abrir su expediente y subir por ella
                                  </a>
                                </span>
                              </p>
                              {esCasa ? <Dispensas operadorId={o.id} lista={dispensas.get(o.id) ?? []} /> : null}
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
