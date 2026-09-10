"use client";

// LA PANTALLA DEL EXPEDIENTE — transcripción de
// `design/panel-operador/dc/Operador Expediente v1.html`.
//
// El entregable trae SEIS paneles (`#x1`…`#x6`) que son el mismo tablero en seis
// situaciones: en curso, en blanco, con un documento rechazado, con algo
// vencido, llegando desde una publicación bloqueada, y completo. Aquí no son
// seis pantallas: son una que se pinta distinta según lo que devuelve
// `fetchExpediente`. Copiarlas como seis habría creado seis verdades que se van
// separando.
//
// El panel #x5 —«te trajimos aquí porque quisiste publicar buceo»— se transcribe
// desde que existe el candado de publicación (F4). Sólo aparece cuando alguien
// llegó rebotado, con `?borrador=&actividad=`: es una lámina de llegada, no una
// sección de la pantalla.
//
// La subida va por `subirDocumento`, un server action con FormData: el archivo
// no pasa por el cliente más que para elegirlo, y el `operator_id` NUNCA viaja
// en el formulario — se resuelve de la sesión del lado del servidor.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { subirDocumento, mandarARevision, declararActividad } from "@/lib/operadores/expediente-actions";
import { ACTIVIDADES, requisitosDe } from "@/lib/operadores/actividades";
import type {
  ActividadEnPantalla,
  BorradorDelCandado,
  DocEnPantalla,
  Expediente as Datos,
} from "@/lib/operadores/expediente";

const fecha = (iso: string) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

/** El palomeo, el reloj o la cruz. Va como SVG inline, igual que el entregable. */
function Marca({ estado }: { estado: DocEnPantalla["estado"] }) {
  const color =
    estado === "aprobado" ? "var(--olive)" : estado === "rechazado" ? "var(--orange)" : "var(--sand)";
  return (
    <svg className="st" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      {estado === "aprobado" ? (
        <path d="M4 12.6l5.2 5.2L20 6.6" />
      ) : estado === "rechazado" ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <circle cx="12" cy="12" r="8" />
      )}
    </svg>
  );
}

function Fila({ d, actividad }: { d: DocEnPantalla; actividad: string | null }) {
  const clase =
    d.estado === "rechazado" ? " rech" : d.estado === "falta" || d.estado === "en_revision" ? " pend" : "";
  const dias = d.diasParaVencer;
  const vencido = dias !== null && dias < 0;
  const pronto = dias !== null && dias >= 0 && dias <= 30;
  return (
    <div className={"doc" + clase}>
      <Marca estado={d.estado} />
      <span className="nm">
        <b>{d.nombre}</b>
        <small>{d.porQue}</small>
      </span>
      <span className="fl">
        {d.estado === "falta" ? (
          <span className="mut">Todavía no lo has subido</span>
        ) : d.estado === "en_revision" ? (
          <span className="mut">Lo estamos revisando. No hay nada que hacer de tu lado.</span>
        ) : d.estado === "rechazado" ? (
          // Un rechazo SIEMPRE dice por qué. La base lo obliga con un check, y
          // aquí se pinta: un «no» mudo deja a alguien sin saber qué corregir.
          <span className="mut">{d.motivo}</span>
        ) : (
          <span className="mut">Aprobado</span>
        )}
        {d.venceAt ? (
          <span className={"venc" + (vencido ? " vencido" : pronto ? " pronto" : "")}>
            <s>{"//"}</s>
            {vencido
              ? `Venció el ${fecha(d.venceAt)}`
              : `Vence el ${fecha(d.venceAt)}${pronto ? ` · en ${dias} días` : ""}`}
          </span>
        ) : null}
      </span>
      <span className="ac">
        {d.cubiertoPorGeneral ? (
          // Se muestra, no se re-pide: vive en Lo general y ahí se reemplaza.
          <span className="mut">Ya está en Lo general</span>
        ) : (
          <SubirDoc actividad={actividad} doc={d} />
        )}
      </span>
    </div>
  );
}

/**
 * El control de subida de UNA fila.
 *
 * `vence` sale del catálogo a través de `venceAt`… no: sale de si el documento
 * ya trae fecha o de si el catálogo dice que caduca. Aquí se usa lo segundo de
 * forma indirecta —el servidor lo exige de todos modos— y se pide la fecha
 * siempre que el documento tenga una o pueda tenerla, para no adivinar.
 */
function SubirDoc({ actividad, doc }: { actividad: string | null; doc: DocEnPantalla }) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      action={(fd) =>
        arranca(async () => {
          fd.set("actividad", actividad ?? "");
          fd.set("documento", doc.slug);
          const r = await subirDocumento(fd);
          setError(r.ok ? null : r.error);
        })
      }
    >
      <input type="file" name="archivo" accept="application/pdf,image/*" required disabled={pendiente} />
      {/* La fecha se ofrece siempre que el documento pueda caducar. El servidor
          la exige cuando el catálogo dice que sí; aquí no se adivina. */}
      <input type="date" name="venceAt" defaultValue={doc.venceAt ?? ""} disabled={pendiente} />
      <button className="btn btn-ghost btn-sm" disabled={pendiente}>
        {pendiente ? "Subiendo…" : doc.estado === "falta" ? "Subir" : "Reemplazar"}
      </button>
      {error ? <span className="mut">{error}</span> : null}
    </form>
  );
}

function Carpeta({ a }: { a: ActividadEnPantalla }) {
  const [abierta, setAbierta] = useState(a.estado !== "aprobada");
  const clase = a.estado === "aprobada" ? " aprob" : " inc";
  const total = a.propios.length;
  const listos = total - a.faltan;
  return (
    <div className={"actv" + clase + (abierta ? " open" : "")}>
      <button className="ah" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta}>
        <span className="g">
          <b>{a.nombre}</b>
          <small>
            {a.estado === "aprobada"
              ? "Aprobada · puedes publicar experiencias de esta actividad"
              : a.estado === "en_revision"
                ? "La estamos revisando. Nadie puede apurarlo."
                : a.estado === "suspendida"
                  ? a.motivo ?? "Suspendida"
                  : `Te faltan ${a.faltan} ${a.faltan === 1 ? "documento" : "documentos"} y no puedes publicar todavía`}
          </small>
        </span>
        <span className="rt">
          <span className={"chip " + (a.estado === "aprobada" ? "c-paid" : "c-full")}>
            <span className="cd" />
            {a.estado === "aprobada"
              ? "Aprobada"
              : a.estado === "en_revision"
                ? "En revisión"
                : a.estado === "suspendida"
                  ? "Suspendida"
                  : "Incompleta"}
          </span>
          <span className="fr">{listos} de {total}</span>
          <span className="chev2">▾</span>
        </span>
      </button>
      <div className="ab">
        <div className="docs">
          {a.propios.map((d) => <Fila key={d.slug} d={d} actividad={a.slug} />)}
        </div>
        {a.generales.length ? (
          <>
            <p className="xh4">Lo que ya cubriste en Lo general</p>
            <div className="docs">
              {a.generales.map((d) => <Fila key={d.slug} d={d} actividad={a.slug} />)}
            </div>
          </>
        ) : null}
        {a.estado === "incompleta" ? <Mandar a={a} /> : null}
      </div>
    </div>
  );
}

/** «Ya está, revísenlo». Solo aparece mientras la actividad está incompleta. */
function Mandar({ a }: { a: ActividadEnPantalla }) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <p className="gnhint">
      <button
        className="btn btn-ghost btn-sm"
        disabled={pendiente || a.faltan > 0}
        onClick={() =>
          arranca(async () => {
            const r = await mandarARevision(a.slug);
            setError(r.ok ? null : r.error);
          })
        }
      >
        {pendiente ? "Mandando…" : "Mandar a revisión"}
      </button>{" "}
      {a.faltan > 0
        ? `Cuando estén los ${a.faltan} que faltan, aquí la mandas a revisar.`
        : "Ya está completa. Nosotros la revisamos y te avisamos."}
      {error ? <> · {error}</> : null}
    </p>
  );
}

/**
 * El botón que declara una actividad. Es el mismo acto desde los dos lugares
 * donde se ofrece —el mosaico de abajo y la lámina de llegada—, así que es un
 * solo componente: dos copias se habrían separado.
 */
function Declarar({ slug, texto, clase }: { slug: string; texto: string; clase: string }) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        className={clase}
        disabled={pendiente}
        onClick={() =>
          arranca(async () => {
            const r = await declararActividad(slug);
            setError(r.ok ? null : r.error);
          })
        }
      >
        {pendiente ? "Declarando…" : texto}
      </button>
      {error ? <span className="mut"> · {error}</span> : null}
    </>
  );
}

/** Un mosaico del catálogo, en su estado «todavía no la declaras». */
function Mosaico({ slug, nombre, documentos }: { slug: string; nombre: string; documentos: number }) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <button
      className="cati"
      disabled={pendiente}
      onClick={() =>
        arranca(async () => {
          const r = await declararActividad(slug);
          setError(r.ok ? null : r.error);
        })
      }
    >
      <span className="pl">+</span>
      <span>
        <b>{nombre}</b>
        <small>
          {error ?? (pendiente
            ? "Declarando…"
            : `${documentos} ${documentos === 1 ? "documento" : "documentos"} propios`)}
        </small>
      </span>
    </button>
  );
}

/**
 * LÁMINA #x5 — «te trajimos aquí porque quisiste publicar».
 *
 * Dos situaciones distintas y se dicen distinto: si la actividad ni siquiera
 * está declarada, se le enseña EN QUÉ SE METE antes de pedirle nada (sus
 * documentos propios y los generales que le harían falta) y se le ofrece
 * declararla. Si ya está declarada, su carpeta ya está más abajo con su estado
 * real: repetirla aquí sería una segunda verdad que se despega de la primera.
 */
function Traido({ t, generales }: { t: BorradorDelCandado; generales: DocEnPantalla[] }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(true);
  const req = requisitosDe(t.actividad);
  const porSlug = new Map(generales.map((g) => [g.slug, g]));
  const nuevos = req.generales.filter((g) => porSlug.get(g.slug)?.estado !== "aprobado");

  return (
    <div className="oppane">
      <p className="trajo">
        <s>{"//"}</s>
        <span>
          <b>Te trajimos aquí porque quisiste publicar una experiencia de {t.nombreActividad.toLowerCase()}</b>
          Tu borrador «{t.titulo}» se guardó completo y te está esperando. Para publicarlo hace falta el
          expediente de {t.nombreActividad.toLowerCase()}, que son {req.propios.length}{" "}
          {req.propios.length === 1 ? "documento" : "documentos"} propios
          {nuevos.length
            ? ` y ${nuevos.length === 1 ? "uno" : nuevos.length} de Lo general que hoy no ${nuevos.length === 1 ? "tienes" : "tienes"}`
            : ""}
          . Cuando esté aprobado, volvemos solos a tu borrador.
        </span>
        <span className="ac">
          {/* El entregable lo dibuja como <button> y aquí también: `.btn-glass`
              fija `color` y `.adm a:hover` lo pisaría con naranja. Ya pasó con
              la pastilla CAMINANTE/NUMAN, que salió a producción invisible por
              cambiar el elemento sin revisar a qué apuntaban las reglas. */}
          <button
            className="btn btn-glass btn-sm"
            type="button"
            onClick={() => router.push(`/caminante/admin/experiencias/${t.slug}`)}
          >
            Ver mi borrador
          </button>
        </span>
      </p>

      {t.estado === null ? (
        <>
          <p className="xh4" style={{ marginTop: 0 }}>La actividad que te falta</p>
          <div className="acts">
            <div className={"actv nod trae" + (abierta ? " open" : "")}>
              {/* `.ah` es <button> en el entregable y lo sigue siendo aquí: un
                  <div> con `cursor:pointer` sería un control que no lo es. */}
              <button className="ah" type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta}>
                <span className="g">
                  <b>{t.nombreActividad}</b>
                  <small>No declarada · es la que necesita tu borrador</small>
                </span>
                <span className="rt">
                  <span className="chip c-full"><span className="cd" />Te falta esta</span>
                  <span className="fr">0 de {req.propios.length}</span>
                  <span className="chev2">▾</span>
                </span>
              </button>
              <div className="ab">
                <p className="calm">
                  <s>{"//"}</s>
                  <span className="g">
                    <b>Está en el catálogo y no la has declarado</b>
                    <span>
                      Nadie te la va a pedir mientras no la quieras ofrecer. Si la declaras, te pedimos los{" "}
                      {req.propios.length} documentos de abajo
                      {nuevos.length ? `, y ${nuevos.length} de Lo general que hoy no necesitas` : ""}.
                    </span>
                  </span>
                </p>
                <div className="subh">
                  <b>Lo que te pediríamos</b>
                  <small>Para que sepas en qué te metes antes de declararla.</small>
                </div>
                <div className="docs">
                  {req.propios.map((d) => (
                    <div key={d.slug} className="doc pend">
                      <Marca estado="falta" />
                      <span className="nm"><b>{d.nombre}</b><small>{d.porQue}</small></span>
                      <span className="fl"><span className="mut">sin archivo</span></span>
                      <span className="ac" />
                    </div>
                  ))}
                </div>
                {req.generales.length ? (
                  <>
                    <div className="subh">
                      <b>De Lo general, que esta actividad necesita</b>
                      <small>
                        {nuevos.length === 0
                          ? "Todos los tienes ya."
                          : nuevos.length === req.generales.length
                            ? "Ninguno lo tienes todavía."
                            : "Unos los tienes; los otros se te pedirían por primera vez."}
                      </small>
                    </div>
                    <div className="hers">
                      {req.generales.map((g) => {
                        const ya = porSlug.get(g.slug)?.estado === "aprobado";
                        return (
                          <div key={g.slug} className="her">
                            <svg className="k" viewBox="0 0 24 24" fill="none" stroke={ya ? "currentColor" : "var(--orange)"} strokeWidth={ya ? "2.6" : "2.4"} strokeLinecap="round" strokeLinejoin="round">
                              <path d={ya ? "M4 12.6l5.2 5.2L20 6.6" : "M12 5v14M5 12h14"} />
                            </svg>
                            <span><b>{g.nombre}</b><small>{g.porQue}</small></span>
                            <span className="rt">
                              <span className="lbl" style={ya ? undefined : { color: "var(--orange)" }}>
                                {ya ? "Ya está en Lo general" : "Se subiría una sola vez"}
                              </span>
                              <a href="#lo-general">Verlo</a>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : null}
                <div className="salfoot">
                  <Declarar
                    slug={t.actividad}
                    clase="btn btn-orange btn-sm"
                    texto={`Declarar ${t.nombreActividad.toLowerCase()} y subir los documentos`}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function Expediente({ datos, traido }: { datos: Datos; traido?: BorradorDelCandado | null }) {
  const [abiertoGen, setAbiertoGen] = useState(true);
  const yaDeclaradas = new Set(datos.actividades.map((a) => a.slug));
  const genListos = datos.generales.length - datos.faltanGenerales;

  return (
    <>
      {traido ? <Traido t={traido} generales={datos.generales} /> : null}

      <div className="expbar">
        <div className={"verdict " + (datos.completo ? "casa" : datos.vacio ? "casa" : "no")}>
          <span className="n">{datos.vacio ? "//" : datos.completo ? "//" : datos.faltanTotal}</span>
          <span className="g">
            <b>
              {datos.vacio
                ? "Tu expediente está en blanco, y así empieza el de todos"
                : datos.completo
                  ? "Tu expediente está completo y tus actividades aprobadas"
                  : datos.faltanTotal === 1
                    ? "Te falta un documento"
                    : `Te faltan ${datos.faltanTotal} documentos en total`}
            </b>
            <span>
              {datos.vacio
                ? "No hay nada mal. Son diez documentos generales que se piden una vez, y después una carpeta por cada actividad que ofrezcas. Puedes subirlos en el orden que quieras, en varias sesiones, y lo que dejes a medias se guarda."
                : datos.completo
                  ? "Puedes publicar experiencias de todas las actividades que declaraste."
                  : "Lo general se sube una sola vez y sirve para todas tus actividades; lo propio de cada una vive en su carpeta."}
            </span>
          </span>
        </div>
        {datos.proximo ? (
          <div className="nowcard">
            <span className="lb">{"// "}{(datos.proximo.diasParaVencer ?? 0) < 0 ? "Ya venció" : "Lo que vence primero"}</span>
            <b className="t">{datos.proximo.nombre}</b>
            <span className="mn">
              {(datos.proximo.diasParaVencer ?? 0) < 0
                ? "vencido"
                : `${datos.proximo.diasParaVencer} días`}
            </span>
            <p>
              {(datos.proximo.diasParaVencer ?? 0) < 0
                ? `Venció el ${fecha(datos.proximo.venceAt!)}. Mientras no esté al corriente, este documento no cuenta como entregado.`
                : `Vence el ${fecha(datos.proximo.venceAt!)}. Te avisamos otra vez a 30 y a 7 días.`}
            </p>
          </div>
        ) : null}
      </div>

      <div className="acts">
        <div id="lo-general" className={"actv " + (datos.faltanGenerales ? "inc" : "aprob") + (abiertoGen ? " open" : "")}>
          <button className="ah" onClick={() => setAbiertoGen((v) => !v)} aria-expanded={abiertoGen}>
            <span className="g">
              <b>Lo general</b>
              <small>Se piden una sola vez y sirven para todas tus actividades</small>
            </span>
            <span className="rt">
              <span className={"chip " + (datos.faltanGenerales ? "c-full" : "c-paid")}>
                <span className="cd" />
                {datos.faltanGenerales ? `Faltan ${datos.faltanGenerales}` : "Al corriente"}
              </span>
              <span className="fr">{genListos} de {datos.generales.length}</span>
              <span className="chev2">▾</span>
            </span>
          </button>
          <div className="ab">
            <p className="gnhint">
              Diez documentos que se piden <b>una sola vez</b> y sirven para todas tus
              actividades. Si mañana declaras una actividad nueva, estos ya están: nada se
              sube dos veces.
            </p>
            <div className="docs">
              {datos.generales.map((d) => <Fila key={d.slug} d={d} actividad={null} />)}
            </div>
          </div>
        </div>

        {datos.actividades.map((a) => <Carpeta key={a.slug} a={a} />)}
      </div>

      <p className="xh4">Agregar una actividad</p>
      <p className="gnhint">
        Cada actividad tiene su propio expediente y se aprueba por separado. Que una esté
        incompleta no detiene a las demás: lo aprobado sigue vendiendo.
      </p>
      <div className="cat">
        {ACTIVIDADES.map((c) =>
          yaDeclaradas.has(c.slug) ? (
            <button key={c.slug} className="cati ya" disabled>
              <span className="pl">✓</span>
              <span><b>{c.nombre}</b><small>Ya la declaraste</small></span>
            </button>
          ) : (
            <Mosaico key={c.slug} slug={c.slug} nombre={c.nombre} documentos={c.documentos.length} />
          ),
        )}
      </div>
    </>
  );
}
