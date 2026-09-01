"use client";

import { useState } from "react";
import { ETAPAS } from "@/lib/plataforma/etapas";
import type { OperadoraPlataforma } from "@/lib/plataforma/operadoras";
import { formatMXN } from "@/lib/admin/formato";
import Cajon from "../../ui/Cajon";
import Candados, { LlaveDeDuenos } from "./Candados";

// EL PIPELINE DE ALTAS — el mismo tablero del CRM de Caminante, otra unidad.
//
// Allá era persona × salida; aquí es OPERADORA × ALTA. Las columnas 01 a 03
// salen del funnel que ya existe (`operator_applications.status`) y las tres
// últimas se DEDUCEN del estado real: nadie las mueve a mano, así que no se
// pueden desincronizar de la realidad.
//
// La 06 es la que justifica el tablero. En una plataforma el problema no es
// firmar operadoras: es que dejen de vender sin que nadie se entere. Una
// operadora aprobada hace dos meses y con cero ventas no aparece en ninguna
// otra pantalla — se ve perfectamente bien en la lista de operadoras.
//
// La tarjeta ABRE. Antes no: se veía pulsable y no hacía nada, que es peor que
// no parecerlo, porque enseña a no confiar en la pantalla.

export default function Pipeline({ ops }: { ops: OperadoraPlataforma[] }) {
  // La casa no está en el pipeline: no se da de alta a sí misma.
  const externas = ops.filter((o) => !o.esLaCasa);
  const [abierta, setAbierta] = useState<string | null>(null);
  const sel = externas.find((o) => o.id === abierta) ?? null;

  const pendientes = sel ? sel.candados.filter((c) => !c.cumplido) : [];
  const mios = pendientes.filter((c) => c.toca === "casa");

  return (
    <>
      <div className="sec-head" style={{ marginTop: 18 }}>
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Pipeline
          </span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            El mismo tablero, <em className="ac">otra unidad.</em>
          </h2>
          <p className="desc">
            Las columnas y las tarjetas son las del CRM de NUMAN. Ahí la unidad era persona por
            salida; aquí es operadora por alta. Las tres últimas etapas no se mueven a mano: se
            deducen de lo que pasa. <b>Picar una tarjeta abre su ficha.</b>
          </p>
        </div>
      </div>

      <Cajon
        abierta={!!sel}
        cerrar={() => setAbierta(null)}
        ficha={
          sel && {
            iniciales: sel.iniciales,
            titulo: sel.nombre,
            subtitulo: (
              <>
                {sel.rfc ? `RFC ${sel.rfc}` : "Sin RFC"}
                {sel.comisionPct !== null ? (
                  <>
                    {" · comisión "}
                    <span className="sal">{sel.comisionPct}%</span>
                  </>
                ) : (
                  " · sin comisión definida"
                )}
              </>
            ),
            banda: ETAPAS.find((e) => e.clave === sel.etapa)?.nombre ?? "Operadora externa",
            bandaDer: `${sel.cumplidos} de 6 candados`,
            cuerpo: (
              <>
                <div className={sel.puedeCobrar ? "verdict" : "verdict no"}>
                  <span className="n">{sel.cumplidos}/6</span>
                  <span className="g">
                    <b>{sel.puedeCobrar ? "Puede vender hoy" : "No puede vender hoy"}</b>
                    <span>
                      {pendientes.length === 0 ? (
                        <>Todo listo. Lo único que falta es que venda.</>
                      ) : (
                        <>
                          Faltan {pendientes.length}{" "}
                          {pendientes.length === 1 ? "candado" : "candados"}
                          {mios.length > 0 ? (
                            <>
                              , y <b>{mios.length === pendientes.length ? "todos" : mios.length}</b>{" "}
                              {mios.length === 1 ? "me toca" : "me tocan"} a mí
                            </>
                          ) : (
                            <>, y todos se le piden a él</>
                          )}
                          .
                        </>
                      )}
                    </span>
                  </span>
                </div>

                <Candados o={sel} />
                <LlaveDeDuenos />

                {/* Lo vendido antes del arranque no genera comisión y no se suma
                    nunca. Decirlo aquí evita la pregunta de por qué el histórico
                    y la comisión no cuadran. */}
                {sel.comisionDesde ? (
                  <p className="arr">
                    <s>Arranque de comisión</s>
                    <span>Su comisión arranca el</span>
                    <b>
                      {new Date(sel.comisionDesde).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "America/Mexico_City",
                      })}
                      .
                    </b>
                    <span>Lo vendido antes de esa fecha no genera comisión y no se suma nunca.</span>
                  </p>
                ) : null}

                <p className="xh4">Lo que lleva vendido</p>
                <div className="locks">
                  <span className="lk">
                    <span className="g">
                      Este mes
                      <small>{formatMXN(sel.vendidoMes)}</small>
                    </span>
                  </span>
                  <span className="lk">
                    <span className="g">
                      Histórico
                      <small>{formatMXN(sel.vendidoHistorico)}</small>
                    </span>
                  </span>
                  <span className="lk">
                    <span className="g">
                      Experiencias
                      <small>
                        {sel.experienciasPublicadas} publicadas · {sel.experienciasBorrador} en
                        borrador
                      </small>
                    </span>
                  </span>
                </div>
              </>
            ),
          }
        }
      >
        <div className="cmboard">
          <div className="cmtrack">
            {ETAPAS.map((e) => {
              const dentro = externas.filter((o) => o.etapa === e.clave);
              const angosta = e.clave === "se_salieron";
              const dormida = e.clave === "dormido";
              return (
                <div
                  key={e.clave}
                  className={`cmcol${angosta ? " lost" : ""}${dormida ? " sleep" : ""}`}
                >
                  <div className="cmcol-hd">
                    <span className="no">{e.num}</span>
                    <h3>{e.nombre}</h3>
                    <span className="ct">{dentro.length}</span>
                    <span className="how">{e.como}</span>
                  </div>
                  <div className="cmcol-bd">
                    {dentro.length === 0 ? (
                      <div className="empty">nadie</div>
                    ) : (
                      dentro.map((o) => (
                        <div
                          key={o.id}
                          className={`cmc${dormida ? " sleep" : ""}${o.id === abierta ? " picked" : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setAbierta(o.id)}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault();
                              setAbierta(o.id);
                            }
                          }}
                        >
                          <div className="hd">
                            <span className="av">{o.iniciales}</span>
                            <span className="nm">
                              <b>{o.nombre}</b>
                              <small>
                                {o.diasEsperando === 0
                                  ? "hoy"
                                  : `${o.diasEsperando} ${o.diasEsperando === 1 ? "día" : "días"}`}
                              </small>
                            </span>
                            {/* Una operadora dada de alta a mano no tiene solicitud.
                                Fingirle una fecha de funnel que nunca ocurrió es lo
                                que hacía que todas se vieran de «día 1». */}
                            <span className="age">
                              {o.solicitudAt ? "por solicitud" : "entró por fuera"}
                            </span>
                          </div>
                          {/* .cmtag es el chip; .cmch era un contenedor de botones
                              que no existe en el entregable — de ahí el texto
                              crecido y sin píldora que se veía sucio. */}
                          <div className="met">
                            {o.candados
                              .filter((c) => c.clave !== "experiencia")
                              .map((c) => (
                                <span key={c.clave} className="cmtag">
                                  {c.nombre.split(" ")[0]}{" "}
                                  <span className="k">{c.cumplido ? "ok" : "no"}</span>
                                </span>
                              ))}
                          </div>
                          <p className="cmnext">
                            <s>{"//"}</s>
                            <span>
                              {o.candados.find((c) => !c.cumplido && c.toca === "casa")
                                ? `Me toca: ${o.candados
                                    .filter((c) => !c.cumplido && c.toca === "casa")
                                    .map((c) => c.nombre.toLowerCase())
                                    .join(" y ")}.`
                                : o.candados.find((c) => !c.cumplido)
                                  ? `Pedirle: ${o.candados
                                      .filter((c) => !c.cumplido)
                                      .map((c) => c.nombre.toLowerCase())
                                      .join(" y ")}.`
                                  : "Todo listo. Sólo falta que venda."}
                            </span>
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Cajon>

      <p className="mut" style={{ fontSize: 12.5, marginTop: 12 }}>
        La <b>06 Dormido</b> se prende sola a los sesenta días sin vender. No es la columna de las
        que perdiste —ésa es la 07— sino la de las que dejaron de vender sin que nadie se enterara.
      </p>
    </>
  );
}
