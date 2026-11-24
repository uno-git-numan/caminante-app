"use client";

// EL ALTA RÁPIDA DE UNA EXPERIENCIA (19 nov 2026).
//
// La puerta por defecto para crear: una pantalla con lo que hace falta para
// VENDER, y nada más. De aquí sale una experiencia completa (lib/experiences/
// corta.ts) con su primera fecha. Lo editorial —itinerario día por día, guías,
// mochila, preguntas frecuentes, ficha científica— no se pide: se agrega
// después en el editor completo, si se quiere.
//
// Se viste con la misma hoja y las mismas piezas del editor completo
// (form-base.ts, form-piezas.tsx): no es un diseño nuevo, es el mismo
// formulario con menos preguntas.
//
// Lo que falta se dice JUNTO y arriba del botón, no de uno en uno.

import { useState } from "react";
import { CSS, MARK } from "./form-base";
import { Field, StrList, Uploader } from "./form-piezas";
import { ACTIVIDADES } from "@/lib/operadores/actividades";
import { ESTADOS } from "@/lib/experiences/estados";
import { resumenPolitica, VENTANAS, type Variante } from "@/lib/cancelacion/politica";
import { CORTA_VACIA, EXIGENCIA, esExigencia, faltantesDeCorta, type ExperienciaCorta, type Exigencia, type FaltanteDeCorta } from "@/lib/experiences/corta";
import { crearExperienciaRapida, publicarExperienciaRapida, type PrimeraSalida } from "@/lib/experiences/corta-actions";
import { aplicarPrellenadoCorta, type CortaDeIA } from "@/lib/experiences/prellenado-corta";
import LlenarConFlyer, { type ResumenFlyer } from "./LlenarConFlyer";

const MAX_FOTOS = 5;

export default function AltaRapida({
  operadoras,
  enAlta = false,
}: {
  /**
   * Sólo cuando crea la CASA: de entre cuáles elige a la dueña. Sin elegida
   * por omisión —ni siquiera el sombrero—: la atribución es dinero y se
   * congela al vender (invariante #22). Una operadora no lo recibe.
   */
  operadoras?: { id: string; nombre: string }[];
  /**
   * La crea una operadora que SIGUE EN SU ALTA (23 nov 2026). Cambia a dónde
   * se regresa y qué se ofrece al guardar: el Panorama y Salidas le están
   * cerrados todavía (mandarla ahí es rebotarla), y lo que sigue para ella no
   * es publicar sino ver su página y continuar con sus documentos.
   */
  enAlta?: boolean;
}) {
  const [c, setC] = useState<ExperienciaCorta>(CORTA_VACIA);
  const [duena, setDuena] = useState("");
  const [faltaDuena, setFaltaDuena] = useState(false);
  const [salida, setSalida] = useState<PrimeraSalida>({ inicio: "", fin: "", puntoEncuentro: "" });
  const [faltan, setFaltan] = useState<FaltanteDeCorta[]>([]);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState<"" | "guardar" | "publicar">("");
  const [guardada, setGuardada] = useState<{ slug: string; conFecha: boolean; avisos: string[] } | null>(null);
  const [publicada, setPublicada] = useState<{ ok: boolean; texto: string } | null>(null);

  const set = <K extends keyof ExperienciaCorta>(k: K, v: ExperienciaCorta[K]) => setC((p) => ({ ...p, [k]: v }));
  const falta = (k: keyof ExperienciaCorta) => faltan.find((f) => f.campo === k)?.mensaje;
  const marca = (k: keyof ExperienciaCorta) => (falta(k) ? { borderColor: "#c43d2a" } : undefined);

  // LO QUE LEYÓ LA IA DEL FLYER entra aquí. Sólo llena lo vacío y nunca
  // inventa (`prellenado-corta.ts`); devuelve qué llenó y qué falta para que
  // la tarjeta del flyer lo cuente. «Hoy» es el día de México: una fecha que
  // ya pasó no se propone como primera salida.
  function llenarDesdeFlyer(campos: CortaDeIA): ResumenFlyer {
    const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
    const r = aplicarPrellenadoCorta(c, salida, campos, hoy);
    setC(r.corta);
    setSalida(r.salida);
    setFaltan([]);
    setError("");
    return { llenados: r.llenados, faltan: r.faltan, notas: r.notas };
  }

  async function guardar() {
    setError("");
    const f = faltantesDeCorta(c);
    setFaltan(f);
    const sinDuena = !!operadoras && !duena;
    setFaltaDuena(sinDuena);
    if (f.length || sinDuena) return;
    setOcupado("guardar");
    const r = await crearExperienciaRapida(c, salida, duena || undefined);
    setOcupado("");
    if (!r.ok) {
      setError(r.error);
      if (r.faltantes) setFaltan(r.faltantes);
      return;
    }
    setGuardada({ slug: r.slug, conFecha: r.conFecha, avisos: r.avisos });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function publicar() {
    if (!guardada) return;
    setOcupado("publicar");
    setPublicada(null);
    const r = await publicarExperienciaRapida(guardada.slug);
    setOcupado("");
    setPublicada(r.ok ? { ok: true, texto: "Publicada. Ya está en el sitio." } : { ok: false, texto: r.error });
  }

  const cabecera = (
    <header className="ahead">
      <div className="brand">
        {/* El logo REGRESA al panel (regla app-first: siempre hay camino de vuelta). */}
        <a className="logo" href={enAlta ? "/caminante/admin/mi-alta" : "/caminante/admin"} aria-label={enAlta ? "Volver a Mi alta" : "Volver al panel"} title={enAlta ? "Volver a Mi alta" : "Volver al panel"} dangerouslySetInnerHTML={{ __html: MARK }} />
        <span className="ctx">
          Admin · <b>Crear experiencia</b>
        </span>
      </div>
      <div className="head-actions">
        <a className="btn btn-ghost btn-sm" href={enAlta ? "/caminante/admin/mi-alta" : "/caminante/admin"}>
          {enAlta ? "Volver a Mi alta" : "Volver al panel"}
        </a>
      </div>
    </header>
  );

  // ── Ya se guardó: qué sigue ───────────────────────────────────────────────
  if (guardada) {
    return (
      <div className="adminexp">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        {cabecera}
        <div className="wrap" style={{ gridTemplateColumns: "1fr", maxWidth: 760 }}>
          <div className="main">
            <section className="card">
              <div className="sec-head">
                <span className="eyebrow">
                  <span className="sl">{"//"}</span> Guardada
                </span>
                <h2>{c.titulo.trim()}</h2>
                <p className="desc">
                  Quedó como <b>borrador</b>{guardada.conFecha ? ", con su primera fecha" : ", todavía sin fecha"}. Nadie la ve en el sitio
                  hasta que la publiques.
                  {enAlta
                    ? " Mírala como la verá tu cliente y sigue con tu alta: para publicarla faltan tus dos documentos, tu firma y tu cuenta de cobro."
                    : ""}
                </p>
              </div>
              {guardada.avisos.map((a, i) => (
                <p key={i} className="err" style={{ marginTop: 0, marginBottom: 12 }}>
                  {a}
                </p>
              ))}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a className={"btn " + (enAlta ? "btn-orange" : "btn-ghost")} href={`/caminante/admin/preview/${guardada.slug}`} target="_blank" rel="noopener noreferrer">
                  {enAlta ? "Ver mi página" : "Ver cómo se ve"}
                </a>
                {enAlta ? (
                  <a className="btn btn-orange" href="/caminante/admin/mi-alta">
                    Continuar con mi alta
                  </a>
                ) : (
                  <button className="btn btn-orange" type="button" disabled={!!ocupado || publicada?.ok === true} onClick={publicar}>
                    {ocupado === "publicar" ? "Publicando…" : publicada?.ok ? "Publicada" : "Publicar"}
                  </button>
                )}
                <a className="btn btn-ghost" href={`/caminante/admin/experiencias/${guardada.slug}`}>
                  Agregar más detalle
                </a>
                {enAlta ? null : (
                  <a className="btn btn-ghost" href="/caminante/admin/salidas">
                    Ir a Salidas
                  </a>
                )}
              </div>
              {publicada ? (
                <p className={publicada.ok ? "desc" : "err"} style={{ marginTop: 14 }}>
                  {publicada.texto}
                </p>
              ) : null}
            </section>
            <p className="form-intro">
              <span className="sl">Más detalle, cuando quieras</span>
              Itinerario día por día, guías, qué llevar, preguntas frecuentes y más fotos se agregan en «Agregar más detalle». Nada de eso
              hace falta para vender.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── El formulario corto ───────────────────────────────────────────────────
  const politica = (c.politica === "expedicion" ? "expedicion" : "estandar") as Variante;
  const exigencia: Exigencia | null = esExigencia(c.exigencia) ? c.exigencia : null;

  return (
    <div className="adminexp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {cabecera}

      <div className="wrap" style={{ gridTemplateColumns: "1fr", maxWidth: 760 }}>
        <div className="main">
          <p className="form-intro">
            <span className="sl">Lo esencial</span>
            Con esto tu experiencia ya se puede publicar y vender. El contacto, la encuesta y el deslinde se ponen solos. ¿Quieres escribirlo
            todo a detalle desde el principio?{" "}
            <a href="/caminante/admin/experiencias/nueva?completo=1" style={{ textDecoration: "underline" }}>
              Abre el editor completo
            </a>
            .
          </p>

          {/* 0 · EL ATAJO: el flyer llena el formulario */}
          <LlenarConFlyer onCampos={llenarDesdeFlyer} />

          {/* 1 · QUÉ ES */}
          <section className="card">
            <div className="sec-head">
              <span className="eyebrow">
                <span className="sl">{"//"}</span> 1 de 5
              </span>
              <h2>Qué es y dónde</h2>
            </div>
            {operadoras ? (
              <Field label="De qué operadora es" hint="a su nombre se vende; se decide aquí, antes de la primera venta">
                <select
                  value={duena}
                  style={faltaDuena ? { borderColor: "#c43d2a" } : undefined}
                  onChange={(e) => {
                    setDuena(e.target.value);
                    setFaltaDuena(false);
                  }}
                >
                  <option value="">— elige la operadora —</option>
                  {operadoras.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field label="Nombre de la experiencia">
              <input type="text" value={c.titulo} style={marca("titulo")} placeholder="Amanecer en el Nevado" onChange={(e) => set("titulo", e.target.value)} />
            </Field>
            <div className="row c2">
              <Field label="Dónde es" hint="como lo dirías al invitar">
                <input type="text" value={c.lugar} style={marca("lugar")} placeholder="Nevado de Toluca, Zinacantepec" onChange={(e) => set("lugar", e.target.value)} />
              </Field>
              <Field label="Estado">
                <select value={c.estado} style={marca("estado")} onChange={(e) => set("estado", e.target.value)}>
                  <option value="">— elige —</option>
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Qué actividad es" hint="decide qué documentos te pedimos">
              <select value={c.actividad} style={marca("actividad")} onChange={(e) => set("actividad", e.target.value)}>
                <option value="">— elige la actividad —</option>
                {ACTIVIDADES.map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="De qué se trata" hint="un par de párrafos; cada párrafo sale como un punto en la página">
              <textarea rows={5} value={c.descripcion} style={marca("descripcion")} onChange={(e) => set("descripcion", e.target.value)} />
            </Field>
          </section>

          {/* 2 · FOTOS */}
          <section className="card">
            <div className="sec-head">
              <span className="eyebrow">
                <span className="sl">{"//"}</span> 2 de 5
              </span>
              <h2>Fotos</h2>
            </div>
            <Field label="Foto de portada" hint="también sale en la tarjeta del inicio">
              <div style={falta("portada") ? { outline: "1px solid #c43d2a", borderRadius: 10, padding: 6 } : undefined}>
                <Uploader value={c.portada} onChange={(url) => set("portada", url)} />
              </div>
            </Field>
            <Field label="Más fotos" hint={`hasta ${MAX_FOTOS}; con 3 o más se arma el mosaico`}>
              {c.fotos.map((f, i) => (
                <div key={i} className="rep-row" style={{ marginBottom: 8 }}>
                  <div className="grow">
                    <Uploader value={f} onChange={(url) => set("fotos", c.fotos.map((x, j) => (j === i ? url : x)))} />
                  </div>
                  <button type="button" className="rm" onClick={() => set("fotos", c.fotos.filter((_, j) => j !== i))}>
                    Quitar
                  </button>
                </div>
              ))}
              {c.fotos.length < MAX_FOTOS ? (
                <button type="button" className="add" onClick={() => set("fotos", [...c.fotos, ""])}>
                  + Agregar foto
                </button>
              ) : null}
            </Field>
          </section>

          {/* 3 · QUÉ INCLUYE */}
          <section className="card">
            <div className="sec-head">
              <span className="eyebrow">
                <span className="sl">{"//"}</span> 3 de 5
              </span>
              <h2>Qué incluye y qué no</h2>
            </div>
            <div className="row c2">
              <Field label="Incluye">
                <div style={falta("incluye") ? { outline: "1px solid #c43d2a", borderRadius: 10, padding: 6 } : undefined}>
                  <StrList items={c.incluye} onChange={(v) => set("incluye", v)} placeholder="Guía certificado" />
                </div>
              </Field>
              <Field label="No incluye">
                <StrList items={c.noIncluye} onChange={(v) => set("noIncluye", v)} placeholder="Transporte desde tu ciudad" />
              </Field>
            </div>
          </section>

          {/* 4 · LA SALIDA */}
          <section className="card">
            <div className="sec-head">
              <span className="eyebrow">
                <span className="sl">{"//"}</span> 4 de 5
              </span>
              <h2>Cómo es la salida</h2>
            </div>
            <div className="row c2">
              <Field label="Empieza a las">
                <input type="time" value={c.horaInicio} style={marca("horaInicio")} onChange={(e) => set("horaInicio", e.target.value)} />
              </Field>
              <Field label="Termina a las" hint="si dura varios días, la hora del último">
                <input type="time" value={c.horaTermino} style={marca("horaTermino")} onChange={(e) => set("horaTermino", e.target.value)} />
              </Field>
            </div>
            <div className="row c2">
              <Field label="Qué tanto exige">
                <select value={c.exigencia} style={marca("exigencia")} onChange={(e) => set("exigencia", e.target.value)}>
                  <option value="">— elige —</option>
                  {(Object.keys(EXIGENCIA) as Exigencia[]).map((k) => (
                    <option key={k} value={k}>
                      {EXIGENCIA[k].nombre}
                    </option>
                  ))}
                </select>
                {exigencia ? <p className="desc" style={{ marginTop: 6 }}>{EXIGENCIA[exigencia].detalle}</p> : null}
              </Field>
              <Field label="Edad mínima" hint="en años; 0 si no hay">
                <input type="text" inputMode="numeric" value={c.edadMinima} style={marca("edadMinima")} onChange={(e) => set("edadMinima", e.target.value.replace(/\D/g, ""))} />
              </Field>
            </div>
          </section>

          {/* 5 · PRECIO, CUPO Y FECHA */}
          <section className="card">
            <div className="sec-head">
              <span className="eyebrow">
                <span className="sl">{"//"}</span> 5 de 5
              </span>
              <h2>Precio, cupo y primera fecha</h2>
            </div>
            <div className="row c2">
              <Field label="Precio por persona" hint="en pesos, con IVA incluido">
                <input type="text" inputMode="decimal" value={c.precio} style={marca("precio")} placeholder="1850" onChange={(e) => set("precio", e.target.value.replace(/[^0-9.,]/g, ""))} />
              </Field>
              <Field label="Cuántas personas caben" hint="vacío si no hay tope">
                <input type="text" inputMode="numeric" value={c.cupo} style={marca("cupo")} onChange={(e) => set("cupo", e.target.value.replace(/\D/g, ""))} />
              </Field>
            </div>
            <Field label="Si el cliente cancela">
              <select value={politica} onChange={(e) => set("politica", e.target.value)}>
                {(Object.keys(VENTANAS) as Variante[]).map((v) => (
                  <option key={v} value={v}>
                    {VENTANAS[v].nombre}
                  </option>
                ))}
              </select>
              <p className="desc" style={{ marginTop: 6 }}>{resumenPolitica(politica)[0]}</p>
            </Field>
            <div className="row c2">
              <Field label="Primera fecha" hint="opcional; puedes agregarla después en Salidas">
                <input type="date" value={salida.inicio} onChange={(e) => setSalida({ ...salida, inicio: e.target.value })} />
              </Field>
              <Field label="Regreso" hint="vacío si es el mismo día">
                <input type="date" value={salida.fin} min={salida.inicio || undefined} onChange={(e) => setSalida({ ...salida, fin: e.target.value })} />
              </Field>
            </div>
            {salida.inicio ? (
              <Field label="Punto de encuentro" hint="dónde y cómo se juntan">
                <input type="text" value={salida.puntoEncuentro} placeholder="Estacionamiento del Parque de los Venados" onChange={(e) => setSalida({ ...salida, puntoEncuentro: e.target.value })} />
              </Field>
            ) : null}
          </section>

          {/* LO QUE FALTA, JUNTO */}
          {faltan.length || faltaDuena ? (
            <section className="card" style={{ borderColor: "#c43d2a" }}>
              <div className="sec-head">
                <h2 style={{ fontSize: 18 }}>Te falta esto para guardar</h2>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, fontSize: 14 }}>
                {faltaDuena ? <li>Elige de qué operadora es.</li> : null}
                {faltan.map((f) => (
                  <li key={f.campo}>{f.mensaje}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {error ? <p className="err">{error}</p> : null}
        </div>
      </div>

      <div className="actionbar">
        <div className="inner">
          <span className="status">Se guarda como borrador. Publicas después de verla.</span>
          <div className="grp">
            <button className="btn btn-orange btn-sm" type="button" disabled={!!ocupado} onClick={guardar}>
              {ocupado === "guardar" ? "Guardando…" : "Guardar y ver"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
