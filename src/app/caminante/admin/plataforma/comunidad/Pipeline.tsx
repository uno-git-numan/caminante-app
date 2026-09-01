import { ETAPAS, type OperadoraPlataforma } from "@/lib/plataforma/operadoras";

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

export default function Pipeline({ ops }: { ops: OperadoraPlataforma[] }) {
  // La casa no está en el pipeline: no se da de alta a sí misma.
  const externas = ops.filter((o) => !o.esLaCasa);

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
            deducen de lo que pasa.
          </p>
        </div>
      </div>

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
                    <div key={o.id} className={`cmc${dormida ? " sleep" : ""}`}>
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
                      <div className="met">
                        {o.candados
                          .filter((c) => c.clave !== "experiencia")
                          .map((c) => (
                            <span key={c.clave} className={c.cumplido ? "cmch ok" : "cmch"}>
                              {c.nombre.split(" ")[0]} <b>{c.cumplido ? "ok" : "no"}</b>
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

      <p className="mut" style={{ fontSize: 12.5, marginTop: 12 }}>
        La <b>06 Dormido</b> se prende sola a los sesenta días sin vender. No es la columna de las
        que perdiste —ésa es la 07— sino la de las que dejaron de vender sin que nadie se enterara.
      </p>
    </>
  );
}
