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
//
// ── GRUPO PRIVADO DESDE AQUÍ (23 nov 2026) ──────────────────────────────────
// Luis: «+salida → elegir experiencia → elegir fechas → elegir anfitrión (lista
// de clientes), y abrir la fecha y el link privado». Un grupo privado sólo se
// podía abrir desde la tarjeta de la persona en el tablero de Comunidad; quien
// venía aquí a «agregar una salida» sólo podía crear públicas. El paso 03
// pregunta para quién es: abierta al público (el formulario de siempre) o de
// un grupo, y entonces se elige al anfitrión y la pantalla devuelve la liga.
// La salida la crea la misma función que usa el tablero (lib/grupo/salida-privada.ts).

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearSalidaAction } from "@/lib/admin/eventos-actions";
import { abrirGrupoPrivado, type GrupoAbierto } from "@/lib/grupo/abrir";

type Exp = { id: string; slug: string; nombre: string };
type Cliente = { id: string; nombre: string };

// ⚠️ Este componente OWNS el .sec-head y recibe el título como children. No es
// un capricho: el entregable pone el panel de alta FUERA y DESPUÉS del
// encabezado, y meterlo dentro lo convertía en un tercer hijo flex con
// width:100% que saltaba de renglón. Cerrado y todo, aportaba su alto + 26px
// de margen + los 16px de gap: casi cien pixeles de hueco entre el título y
// las pastillas, que es justo lo que se veía mal.
export default function NuevaSalida({
  experiencias,
  clientes = [],
  children,
}: {
  experiencias: Exp[];
  /** Entre quiénes se elige al anfitrión de un grupo privado. */
  clientes?: Cliente[];
  /** El bloque de título del encabezado, renderizado en el servidor. */
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [elegida, setElegida] = useState<Exp | null>(experiencias[0] ?? null);
  const [variosDias, setVariosDias] = useState(false);
  const [fecha, setFecha] = useState("");
  const [fin, setFin] = useState("");
  const [cupo, setCupo] = useState("");
  // Para quién es: abierta al público, o de un grupo con su anfitrión.
  const [privada, setPrivada] = useState(false);
  const [anfitrion, setAnfitrion] = useState("");
  const [avisar, setAvisar] = useState(false);
  const [resultado, setResultado] = useState<GrupoAbierto | null>(null);
  const [copiada, setCopiada] = useState(false);
  const [abriendo, start] = useTransition();

  const abrirGrupo = () => {
    setResultado(null);
    if (!elegida) return setResultado({ ok: false, error: "Elige la experiencia." });
    if (!fecha) return setResultado({ ok: false, error: "La salida necesita una fecha." });
    if (!anfitrion) return setResultado({ ok: false, error: "Elige al anfitrión." });
    start(async () => {
      const r = await abrirGrupoPrivado({
        experienceId: elegida.id,
        inicio: fecha,
        fin: variosDias ? fin : "",
        anfitrionContactId: anfitrion,
        cupo,
        avisar,
      });
      setResultado(r);
      if (r.ok) router.refresh();
    });
  };

  const copiar = (liga: string) =>
    navigator.clipboard?.writeText(liga).then(() => {
      setCopiada(true);
      setTimeout(() => setCopiada(false), 1500);
    });

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
                    <input type="date" name="fecha" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
                    {variosDias ? (
                      <>
                        <span className="mut" style={{ fontSize: 12.5 }}>a</span>
                        <input type="date" name="fin" value={fin} min={fecha || undefined} onChange={(e) => setFin(e.target.value)} />
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
                    ¿Para quién es?
                    <small>
                      Abierta: cualquiera la compra en el sitio. De un grupo: sólo entra quien tiene la liga, y el
                      anfitrión invita a los suyos.
                    </small>
                  </div>
                  <div className="salpick">
                    <button type="button" className={!privada ? "on" : undefined} onClick={() => setPrivada(false)}>
                      Abierta al público
                    </button>
                    <button type="button" className={privada ? "on" : undefined} onClick={() => setPrivada(true)}>
                      Grupo privado
                    </button>
                  </div>
                  {privada ? (
                    <div className="mini-form">
                      <label className="mut" style={{ fontSize: 12.5 }}>
                        Anfitrión{" "}
                        <select value={anfitrion} onChange={(e) => setAnfitrion(e.target.value)} style={{ minWidth: 220 }}>
                          <option value="">— elige de tus clientes —</option>
                          {clientes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label
                        className="mut"
                        style={{ fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <input
                          type="checkbox"
                          checked={avisar}
                          onChange={(e) => setAvisar(e.target.checked)}
                          style={{ width: "auto", minWidth: 0 }}
                        />{" "}
                        Mandarle su liga ahora (WhatsApp y correo)
                      </label>
                    </div>
                  ) : null}
                  {privada && !clientes.length ? (
                    <p className="mut" style={{ fontSize: 12.5, marginTop: 8 }}>
                      Todavía no tienes clientes en tu lista. El anfitrión tiene que ser alguien que ya vino contigo;
                      si es nuevo, ábrelo desde su tarjeta en Comunidad.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="salstep">
                <span className="no">04</span>
                <div>
                  <div className="h">
                    ¿Cuántos lugares?
                    <small>El cupo se puede mover después; lo ya vendido nunca se toca.</small>
                  </div>
                  <div className="mini-form">
                    <input
                      type="number"
                      name="cupo"
                      min={1}
                      placeholder="sin tope"
                      style={{ width: 110 }}
                      value={cupo}
                      onChange={(e) => setCupo(e.target.value)}
                    />
                    <span className="mut" style={{ fontSize: 12.5 }}>
                      lugares · precio heredado de la experiencia
                    </span>
                  </div>
                </div>
              </div>

              <div className="salstep">
                <span className="no">05</span>
                {privada ? (
                  <div>
                    <div className="h">
                      Abrir el grupo
                      <small>
                        Nace con su liga privada y con el anfitrión ya adentro. La fecha límite para pagar queda dos
                        semanas antes de la salida; se mueve después en «Su espacio».
                      </small>
                    </div>
                    <div className="act-row">
                      <button className="btn btn-orange" type="button" disabled={abriendo} onClick={abrirGrupo}>
                        {abriendo ? "Abriendo…" : "Abrir el grupo y darme la liga"}
                      </button>
                      <button className="btn btn-ghost" type="button" onClick={() => setAbierto(false)}>
                        Cancelar
                      </button>
                    </div>
                    {resultado && !resultado.ok ? (
                      <p className="mut" style={{ fontSize: 12.5, marginTop: 10, color: "#b33517" }}>{resultado.error}</p>
                    ) : null}
                    {resultado?.ok ? (
                      <div style={{ marginTop: 12 }}>
                        <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                          Grupo abierto: <b>{resultado.label}</b> · anfitrión <b>{resultado.anfitrion}</b>.{" "}
                          {resultado.aviso ?? "No se le mandó nada: la liga es ésta."}
                        </p>
                        <div className="salfoot" style={{ marginTop: 8, paddingTop: 0, borderTop: 0 }}>
                          <div className="sallk">
                            <span>{resultado.link.replace(/^https?:\/\//, "")}</span>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copiar(resultado.link)}>
                              {copiada ? "Copiada" : "Copiar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
