"use client";

// «+ AGREGAR SALIDA» — el alta, en la pantalla que manda sobre las salidas.
//
// Transcrito del entregable (design/encuesta-v2/dc/salidas.dc.html): pasos
// numerados, la experiencia se elige con píldoras y no con un <select>, porque
// son pocas y verlas todas es más rápido que abrir una lista.
//
// ⚠️ Solo aparecen las experiencias PUBLICADAS. Una salida cuelga de un producto
// que ya está a la venta; ponerle fecha a un borrador crearía algo que el
// público no puede ver y que después nadie entiende por qué no aparece.
//
// El alta vivió un rato en la ficha de la experiencia, como puente mientras
// esta pantalla no existía. Ya no: la ficha muestra sus fechas en SOLO LECTURA
// y todo lo que le pasa a una salida —crearla, cerrarla, reabrirla— pasa aquí.
// Dos puertas sobre el mismo dato terminan discrepando, y eso es justo lo que
// hubo que desarmar cuando las fechas vivían también en el formulario.

import { useState } from "react";
import { crearSalidaAction } from "@/lib/admin/eventos-actions";

type Exp = { id: string; slug: string; nombre: string };

// ⚠️ Este componente OWNS el .sec-head y recibe el título como children. No es
// un capricho: el entregable pone el panel de alta FUERA y DESPUÉS del
// encabezado, y meterlo dentro lo convertía en un tercer hijo flex con
// width:100% que saltaba de renglón. Cerrado y todo, aportaba su alto + 26px
// de margen + los 16px de gap: casi cien pixeles de hueco entre el título y
// las pastillas, que es justo lo que se veía mal.
export default function NuevaSalida({
  experiencias,
  children,
}: {
  experiencias: Exp[];
  /** El bloque de título del encabezado, renderizado en el servidor. */
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [elegida, setElegida] = useState<Exp | null>(experiencias[0] ?? null);
  const [variosDias, setVariosDias] = useState(false);

  return (
    <>
      <div className="sec-head">
        {children}
        {experiencias.length ? (
          <button type="button" className="btn btn-orange" onClick={() => setAbierto((v) => !v)}>
            {abierto ? "Cancelar" : "+ Agregar salida"}
          </button>
        ) : null}
      </div>

      {/* Cerrado NO reserva margen: un panel plegado que empuja el contenido
          hacia abajo se lee como un hueco sin causa. Los 26px del entregable
          están authored para el estado abierto, que es como lo dibujó. */}
      <div className={`xbody${abierto ? " on" : ""}`} style={abierto ? { marginBottom: 26 } : undefined}>
        <div className="card pad">
          <span className="subtitle">Nueva salida</span>
          <form action={crearSalidaAction}>
            <input type="hidden" name="experienceId" value={elegida?.id ?? ""} />
            <input type="hidden" name="slug" value={elegida?.slug ?? ""} />

            <div className="salnew">
              <div className="salstep">
                <span className="no">01</span>
                <div>
                  <div className="h">
                    ¿De qué experiencia?
                    <small>
                      Solo aparecen las publicadas. Una experiencia en borrador no puede tener fechas.
                    </small>
                  </div>
                  <div className="salpick">
                    {experiencias.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        className={elegida?.id === e.id ? "on" : undefined}
                        onClick={() => setElegida(e)}
                      >
                        {e.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="salstep">
                <span className="no">02</span>
                <div>
                  <div className="h">
                    ¿Qué fecha?
                    <small>Un día, o un rango si el viaje dura varios.</small>
                  </div>
                  <div className="mini-form">
                    <input type="date" name="fecha" required />
                    {variosDias ? (
                      <>
                        <span className="mut" style={{ fontSize: 12.5 }}>a</span>
                        <input type="date" name="fin" />
                      </>
                    ) : null}
                    <label
                      className="mut"
                      style={{ fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <input
                        type="checkbox"
                        checked={variosDias}
                        onChange={(e) => setVariosDias(e.target.checked)}
                        style={{ width: "auto", minWidth: 0 }}
                      />{" "}
                      Dura varios días
                    </label>
                  </div>
                </div>
              </div>

              <div className="salstep">
                <span className="no">03</span>
                <div>
                  <div className="h">
                    ¿Cuántos lugares?
                    <small>El cupo se puede mover después; lo ya vendido nunca se toca.</small>
                  </div>
                  <div className="mini-form">
                    <input type="number" name="cupo" min={1} placeholder="sin tope" style={{ width: 110 }} />
                    <span className="mut" style={{ fontSize: 12.5 }}>
                      lugares · precio heredado de la experiencia
                    </span>
                  </div>
                </div>
              </div>

              <div className="salstep">
                <span className="no">04</span>
                <div>
                  <div className="h">
                    Cómo se muestra
                    <small>Vacío = la fecha. Se puede editar después.</small>
                  </div>
                  <div className="mini-form">
                    <input name="etiqueta" placeholder="Oct 8–11" style={{ flex: "1 1 200px" }} />
                  </div>
                  <p className="mut" style={{ fontSize: 12.5, marginTop: 12, lineHeight: 1.5 }}>
                    La salida nace <b>a la venta</b>. El deslinde y la encuesta los hereda de su
                    experiencia: si a ésa le falta alguno, la salida va a aparecer marcada aquí mismo.
                  </p>
                  <div className="act-row">
                    <button className="btn btn-orange" type="submit">
                      Crear salida
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={() => setAbierto(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
