"use client";

// Aplicación de OPERADOR en 4 pasos — transcripción de
// `design/operadores/dc/Operadores 2 Aplicacion.html`.
//
// El entregable llevaba la pila de pasos en JS suelto (`step`, `paint()`,
// `validate()`); aquí eso lo lleva el estado de React. El MARCADO y las clases
// son los del diseño: `.opa-fld`, `.opa-cards`, `.opa-rc`, `.opa-prog`, y el
// `.opa-fld.err` que enciende el `.errmsg` de ese campo.
//
// Dos cosas que NO se copiaron del entregable, a propósito:
//   · El panel «Vista de estados» (`.opa-dev`) era andamio de diseño para ver
//     error/enviando/duplicada sin backend. Aquí esos estados llegan de verdad.
//   · Los campos del mockup no tenían `name`. Cada uno lleva el suyo, y el
//     nombre coincide con lo que lee `submitOperatorApplication`.

import { useState } from "react";
import { submitOperatorApplication } from "@/lib/operadores/actions";

type Radio = { v: string; t: string };

const TIPOS: Radio[] = [
  { v: "montana", t: "Montaña y senderismo" },
  { v: "mar", t: "Mar y buceo" },
  { v: "cuevas", t: "Cuevas y cañones" },
  { v: "naturaleza", t: "Naturaleza y observación" },
  { v: "cultura", t: "Cultura y comunidades" },
  { v: "mixta", t: "Mixta" },
];
const ANTIGUEDAD: Radio[] = [
  { v: "menos-1", t: "Menos de 1 año" },
  { v: "1-3", t: "1–3 años" },
  { v: "3-10", t: "3–10 años" },
  { v: "mas-10", t: "Más de 10" },
];
const SEGURO: Radio[] = [
  { v: "vigente", t: "Sí, vigente" },
  { v: "vence-pronto", t: "Sí, pero vence pronto" },
  { v: "tramite", t: "En trámite" },
  { v: "no", t: "No" },
];
const PRIMEROS: Radio[] = [
  { v: "todos", t: "Todos certificados" },
  { v: "algunos", t: "Algunos" },
  { v: "botiquin", t: "No, pero llevamos botiquín" },
  { v: "no", t: "No" },
];

function Cards({
  opciones,
  valor,
  set,
  cols,
}: {
  opciones: Radio[];
  valor: string;
  set: (v: string) => void;
  cols: "g2" | "g3" | "";
}) {
  return (
    <div className={`opa-cards${cols ? " " + cols : ""}`}>
      {opciones.map((o) => (
        <button
          key={o.v}
          type="button"
          className={"opa-rc" + (valor === o.v ? " on" : "")}
          onClick={() => set(o.v)}
          aria-pressed={valor === o.v}
        >
          <span className="bx" />
          <span><b>{o.t}</b></span>
        </button>
      ))}
    </div>
  );
}

export default function OpaAplicar({ duplicada }: { duplicada: boolean }) {
  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [malos, setMalos] = useState<Set<string>>(new Set());

  // Paso 1
  const [nombreOperadora, setNombreOperadora] = useState("");
  const [responsable, setResponsable] = useState("");
  const [correo, setCorreo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [ciudadEstado, setCiudadEstado] = useState("");
  // Paso 2
  const [tipo, setTipo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [antiguedad, setAntiguedad] = useState("");
  const [salidasAno, setSalidasAno] = useState("");
  const [personasTipico, setPersonasTipico] = useState("");
  const [personasMax, setPersonasMax] = useState("");
  const [rangoPrecio, setRangoPrecio] = useState("");
  // Paso 3
  const [seguro, setSeguro] = useState("");
  const [primerosAuxilios, setPrimerosAuxilios] = useState("");
  const [ratioGuias, setRatioGuias] = useState("");
  const [incidentes, setIncidentes] = useState("");
  // Paso 4
  const [porque, setPorque] = useState("");
  const [conociste, setConociste] = useState("");
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [c3, setC3] = useState(false);

  const err = (k: string) => (malos.has(k) ? " err" : "");

  /** Valida SOLO el paso visible. Devuelve las claves que fallan. */
  function faltantes(n: number): string[] {
    const f: string[] = [];
    if (n === 1) {
      if (!nombreOperadora.trim()) f.push("nombreOperadora");
      if (!responsable.trim()) f.push("responsable");
      if (!correo.includes("@")) f.push("correo");
      if (!whatsapp.trim()) f.push("whatsapp");
      if (!ciudadEstado.trim()) f.push("ciudadEstado");
    }
    if (n === 2) {
      if (!tipo) f.push("tipo");
      if (!descripcion.trim()) f.push("descripcion");
      if (!antiguedad) f.push("antiguedad");
      if (!salidasAno) f.push("salidasAno");
      if (!personasTipico.trim() || !personasMax.trim()) f.push("personas");
      if (!rangoPrecio) f.push("rangoPrecio");
    }
    if (n === 3) {
      if (!seguro) f.push("seguro");
      if (!primerosAuxilios) f.push("primerosAuxilios");
      if (!ratioGuias.trim()) f.push("ratioGuias");
      if (!incidentes.trim()) f.push("incidentes");
    }
    return f;
  }

  function avanzar() {
    const f = faltantes(paso);
    setMalos(new Set(f));
    if (f.length) {
      document.querySelector(".opa-fld.err")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (paso < 4) {
      setPaso(paso + 1);
      window.scrollTo({ top: 0 });
    }
  }

  const listo = c1 && c2 && c3;

  if (duplicada) {
    return (
      <div className="opa-pending">
        <div className="bx">
          <span className="opa-eyb"><i>{"//"}</i> Ya en revisión</span>
          <h1 className="opa-h2" style={{ fontSize: "clamp(24px,5.4vw,34px)", margin: "12px 0 12px" }}>
            Ya tienes una solicitud <em>en revisión.</em>
          </h1>
          <p className="opa-p">
            Recibimos una solicitud con este correo. Estamos leyéndola; no hace falta mandarla otra
            vez, y mandarla de nuevo no la adelanta.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            <a className="opa-btn ghost wide" href="/caminante/operadores">Volver al sitio</a>
            <a className="opa-btn quiet" href="mailto:uno@numanhub.com">
              Agregar algo por correo: uno@numanhub.com
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="opa-appbar">
        <div className="in">
          <button
            className="back"
            type="button"
            onClick={() => (paso > 1 ? setPaso(paso - 1) : (window.location.href = "/caminante/operadores"))}
          >
            ‹ <span>{paso > 1 ? "Atrás" : "Volver al sitio"}</span>
          </button>
          <img src="/landing/assets/logos/caminante-logo.svg" alt="Caminante" style={{ height: 18 }} />
          <span className="ct">Paso {paso} de 4</span>
        </div>
        <div className="opa-prog"><i style={{ width: `${paso * 25}%` }} /></div>
      </div>

      <form className="opa-form" action={submitOperatorApplication} onSubmit={() => setEnviando(true)}>
        {/* Honeypot: los bots lo llenan y el servidor les finge éxito. */}
        <label className="opa-hp">
          Sitio web
          <input type="text" name="web" tabIndex={-1} autoComplete="off" />
        </label>

        {/*
          Los pasos ocultos siguen en el DOM (`.opa-hidden`), no desmontados:
          así lo escrito viaja en el submit aunque el usuario no vuelva a verlo,
          que es lo que promete la propia barra («puedes regresar a cualquier
          paso sin perder lo escrito»).
        */}
        <section className={"opa-st1" + (paso === 1 ? "" : " opa-hidden")}>
          <div className="opa-stephd">
            <span className="opa-eyb"><i>{"//"}</i> Paso 1 · Quién eres</span>
            <h1>Empecemos por <em>quién opera.</em></h1>
            <p>Sin cuenta y sin documentos. Quince campos para saber si vale la llamada.</p>
          </div>
          <div className="opa-two f">
            <div className={"opa-fld" + err("nombreOperadora")}>
              <label>Nombre de la operadora o marca <span className="req">*</span></label>
              <input name="nombreOperadora" value={nombreOperadora} onChange={(e) => setNombreOperadora(e.target.value)} placeholder="Como te conoce tu gente" />
              <p className="errmsg">{"//"} Este campo es obligatorio</p>
            </div>
            <div className={"opa-fld" + err("responsable")}>
              <label>Nombre del responsable <span className="req">*</span></label>
              <input name="responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Quién firma y quién responde" />
              <p className="errmsg">{"//"} Este campo es obligatorio</p>
            </div>
            <div className={"opa-fld" + err("correo")}>
              <label>Correo <span className="req">*</span></label>
              <input type="email" name="correo" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tu@correo.com" />
              <p className="errmsg">{"//"} Escribe un correo válido</p>
            </div>
            <div className={"opa-fld" + err("whatsapp")}>
              <label>WhatsApp <span className="req">*</span></label>
              <input type="tel" name="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Con lada" />
              <p className="errmsg">{"//"} Este campo es obligatorio</p>
            </div>
            <div className="opa-fld">
              <label>Instagram o sitio web</label>
              <input name="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@tuoperadora" />
            </div>
            <div className={"opa-fld" + err("ciudadEstado")}>
              <label>Ciudad y estado base <span className="req">*</span></label>
              <input name="ciudadEstado" value={ciudadEstado} onChange={(e) => setCiudadEstado(e.target.value)} placeholder="Dónde operas desde" />
              <p className="errmsg">{"//"} Este campo es obligatorio</p>
            </div>
          </div>
        </section>

        <section className={"opa-st2" + (paso === 2 ? "" : " opa-hidden")}>
          <div className="opa-stephd">
            <span className="opa-eyb"><i>{"//"}</i> Paso 2 · Qué operas</span>
            <h1>A dónde llevas <em>a la gente.</em></h1>
          </div>
          <div className={"opa-fld" + err("tipo")}>
            <span className="opa-lbl">Tipo de operación <span className="req">*</span></span>
            <Cards opciones={TIPOS} valor={tipo} set={setTipo} cols="g3" />
            <input type="hidden" name="tipo" value={tipo} />
            <p className="errmsg">{"//"} Elige una opción</p>
          </div>
          <div className={"opa-fld" + err("descripcion")}>
            <label>Describe tus experiencias <span className="req">*</span></label>
            <textarea name="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="A dónde llevas gente y qué hacen ahí" />
            <p className="help">Si operas varias, descríbelas todas. No hace falta que suene a folleto.</p>
            <p className="errmsg">{"//"} Este campo es obligatorio</p>
          </div>
          <div className={"opa-fld" + err("antiguedad")}>
            <span className="opa-lbl">¿Desde cuándo operas? <span className="req">*</span></span>
            <Cards opciones={ANTIGUEDAD} valor={antiguedad} set={setAntiguedad} cols="g2" />
            <input type="hidden" name="antiguedad" value={antiguedad} />
            <p className="errmsg">{"//"} Elige una opción</p>
          </div>
          <div className="opa-two f">
            <div className={"opa-fld" + err("salidasAno")}>
              <label>Salidas al año <span className="req">*</span></label>
              <select name="salidasAno" value={salidasAno} onChange={(e) => setSalidasAno(e.target.value)}>
                <option value="">Elige un rango</option>
                <option>1 a 5</option>
                <option>6 a 12</option>
                <option>13 a 24</option>
                <option>25 a 52</option>
                <option>Más de 52</option>
              </select>
              <p className="errmsg">{"//"} Elige un rango</p>
            </div>
            <div className={"opa-fld" + err("personas")}>
              <label>Personas por salida <span className="req">*</span></label>
              <div style={{ display: "flex", gap: 10 }}>
                <input type="number" min="1" name="personasTipico" value={personasTipico} onChange={(e) => setPersonasTipico(e.target.value)} placeholder="Típico" />
                <input type="number" min="1" name="personasMax" value={personasMax} onChange={(e) => setPersonasMax(e.target.value)} placeholder="Máximo" />
              </div>
              <p className="help">Típico y máximo. El cupo con criterio es parte del estándar.</p>
              <p className="errmsg">{"//"} Faltan estos dos números</p>
            </div>
          </div>
          <div className={"opa-fld" + err("rangoPrecio")}>
            <label>Rango de precio por persona <span className="req">*</span></label>
            <select name="rangoPrecio" value={rangoPrecio} onChange={(e) => setRangoPrecio(e.target.value)}>
              <option value="">Elige un rango</option>
              <option>Hasta $5,000 MXN</option>
              <option>$5,001 a $15,000 MXN</option>
              <option>Más de $15,000 MXN</option>
            </select>
            <p className="help">Este dato define tu escalón de comisión: entre más cara la experiencia, más baja.</p>
            <p className="errmsg">{"//"} Elige un rango</p>
          </div>
        </section>

        <section className={"opa-st3" + (paso === 3 ? "" : " opa-hidden")}>
          <div className="opa-stephd">
            <span className="opa-eyb"><i>{"//"}</i> Paso 3 · Cómo cuidas a la gente</span>
            <h1>El paso que <em>de verdad decide.</em></h1>
          </div>
          <p className="opa-stepnote">
            «Aquí es donde de verdad decidimos. Contesta con la verdad: varias de estas se resuelven,
            esconderlas no.»
          </p>
          <div className={"opa-fld" + err("seguro")}>
            <span className="opa-lbl">¿Tienes seguro de responsabilidad civil vigente? <span className="req">*</span></span>
            <Cards opciones={SEGURO} valor={seguro} set={setSeguro} cols="g2" />
            <input type="hidden" name="seguro" value={seguro} />
            <p className="help">En el expediente pedimos que la póliza cubra la actividad concreta que operas.</p>
            <p className="errmsg">{"//"} Elige una opción</p>
          </div>
          <div className={"opa-fld" + err("primerosAuxilios")}>
            <span className="opa-lbl">¿Tus guías tienen primeros auxilios o atención en zonas remotas? <span className="req">*</span></span>
            <Cards opciones={PRIMEROS} valor={primerosAuxilios} set={setPrimerosAuxilios} cols="g2" />
            <input type="hidden" name="primerosAuxilios" value={primerosAuxilios} />
            <p className="errmsg">{"//"} Elige una opción</p>
          </div>
          <div className={"opa-fld" + err("ratioGuias")}>
            <label>¿Cuántos guías por cada cuántos participantes? <span className="req">*</span></label>
            <input name="ratioGuias" value={ratioGuias} onChange={(e) => setRatioGuias(e.target.value)} placeholder="Por ejemplo: 2 guías por cada 10" />
            <p className="errmsg">{"//"} Este campo es obligatorio</p>
          </div>
          <div className={"opa-fld" + err("incidentes")}>
            <label>¿Han tenido algún incidente en los últimos 3 años? <span className="req">*</span></label>
            <textarea
              name="incidentes"
              value={incidentes}
              onChange={(e) => setIncidentes(e.target.value)}
              placeholder="Qué pasó, cómo se manejó y qué cambió después. Si no ha habido, escríbelo también."
            />
            <p className="errmsg">{"//"} Contesta esta pregunta para continuar</p>
            <div className="opa-warn" style={{ marginTop: 12 }}>
              <s>{"//"}</s><span>Un incidente bien manejado suma. Uno escondido descalifica.</span>
            </div>
          </div>
        </section>

        <section className={"opa-st4" + (paso === 4 ? "" : " opa-hidden")}>
          <div className="opa-stephd">
            <span className="opa-eyb"><i>{"//"}</i> Paso 4 · Por qué Caminante</span>
            <h1>Y las tres reglas <em>que no se negocian.</em></h1>
          </div>
          <div className="opa-fld">
            <label>¿Qué te hace clic de Caminante?</label>
            <textarea name="porque" value={porque} onChange={(e) => setPorque(e.target.value)} placeholder="Lo que te interesa y lo que te choca. Las dos cosas sirven." />
          </div>
          <div className="opa-fld">
            <label>¿Cómo nos conociste?</label>
            <input name="conociste" value={conociste} onChange={(e) => setConociste(e.target.value)} placeholder="Quién o qué te trajo aquí" />
          </div>
          <div className="opa-fld">
            <span className="opa-lbl">Compromisos <span className="req">*</span></span>
            <p className="help" style={{ margin: "0 0 12px" }}>
              Las tres son reglas duras del sistema. Aceptarlas antes de la llamada nos ahorra la
              conversación entera si no estás dispuesto.
            </p>
            <div className="opa-cards">
              {([
                ["aceptaCobro", c1, setC1, "Todo cobro pasa por la plataforma"],
                ["aceptaDeslinde", c2, setC2, "Nadie sube a una salida sin deslinde firmado"],
                ["aceptaEncuesta", c3, setC3, "Toda salida se mide con la encuesta"],
              ] as const).map(([name, val, set, texto]) => (
                <button
                  key={name}
                  type="button"
                  className={"opa-rc opa-check" + (val ? " on" : "")}
                  onClick={() => set(!val)}
                  aria-pressed={val}
                >
                  <span className="bx" />
                  <span><b>{texto}</b></span>
                </button>
              ))}
            </div>
            {c1 ? <input type="hidden" name="aceptaCobro" value="on" /> : null}
            {c2 ? <input type="hidden" name="aceptaDeslinde" value="on" /> : null}
            {c3 ? <input type="hidden" name="aceptaEncuesta" value="on" /> : null}
          </div>
          <p className="opa-fine" style={{ marginTop: 18 }}>
            Al enviar, tu solicitud entra en revisión. Te escribimos al correo del paso 1 para
            agendar 30 minutos.
          </p>
        </section>

        <div className="opa-nav">
          <div className="in">
            <p className="hint">Puedes regresar a cualquier paso sin perder lo escrito.</p>
            {paso > 1 ? (
              <button className="opa-btn ghost" type="button" style={{ flex: "0 0 auto" }} onClick={() => setPaso(paso - 1)}>
                Atrás
              </button>
            ) : null}
            {paso < 4 ? (
              <button className="opa-btn accent" type="button" style={{ maxWidth: 280 }} onClick={avanzar}>
                Continuar
              </button>
            ) : (
              <button className="opa-btn accent" type="submit" style={{ maxWidth: 280 }} disabled={!listo || enviando}>
                {enviando ? <><span className="opa-spin" /> Enviando…</> : "Enviar solicitud"}
              </button>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
