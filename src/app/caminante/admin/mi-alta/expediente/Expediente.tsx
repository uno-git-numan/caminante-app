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
// La subida va por `subirDocumento` (desde `../RenglonDoc.tsx`, el renglón que
// comparte con Mi alta), un server action con FormData: el archivo
// no pasa por el cliente más que para elegirlo. El `operator_id` sí puede viajar
// (`operadora`, un input oculto) pero NO decide nada: `operadoraObjetivo` lo
// compara contra la sesión del lado del servidor — la casa actúa sobre quien
// diga, la operadora sólo sobre sí misma. Aquí `operadora` es null cuando la
// operadora edita lo suyo y el id de ella cuando la casa sube POR ella.

import RenglonDoc from "../RenglonDoc";
import { diaEnPalabras } from "@/lib/fecha/zona";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mandarARevision, declararActividad, quitarActividad } from "@/lib/operadores/expediente-actions";
import { ACTIVIDADES, requisitosDe } from "@/lib/operadores/actividades";
import type {
  ActividadEnPantalla,
  BorradorDelCandado,
  DocEnPantalla,
  Expediente as Datos,
} from "@/lib/operadores/expediente";

// `vence_at` es `date`: ver `diaEnPalabras` para por qué no va directo a `new Date()`.
const fecha = diaEnPalabras;

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

// El renglón de documento vive en `../RenglonDoc.tsx`: es el mismo que usa el
// paso 02 de Mi alta. Aquí había otro —con el selector de archivo, la fecha y
// el botón a la vista— y subir costaba cuatro pasos.

function Carpeta({ a, operadora }: { a: ActividadEnPantalla; operadora: string | null }) {
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
          {a.propios.map((d) => <RenglonDoc operadora={operadora} key={d.slug} d={d} actividad={a.slug} />)}
        </div>
        {a.generales.length ? (
          <>
            <p className="xh4">Lo que ya cubriste en Lo general</p>
            <div className="docs">
              {a.generales.map((d) => <RenglonDoc operadora={operadora} key={d.slug} d={d} actividad={a.slug} />)}
            </div>
          </>
        ) : null}
        {a.estado === "incompleta" ? <Mandar operadora={operadora} a={a} /> : null}
        {a.estado !== "aprobada" ? <Quitar operadora={operadora} a={a} /> : null}
      </div>
    </div>
  );
}

/**
 * Sacar de la lista una actividad declarada por error (Luis, 24 sep 2026:
 * «si me equivoqué y puse cañonismo, la quiero eliminar»).
 *
 * ⚠️ NO ESTÁ EN LA LÁMINA: ninguna de las versiones dibuja cómo se quita una
 * actividad. Va con piezas que ya existen —el botón fantasma y el recuadro
 * `.motivo` de la lámina para la confirmación— y sin inventar clases.
 *
 * La confirmación va EN LA PANTALLA y no con `confirm()` del navegador: dice
 * cuántos documentos se van a borrar, que es lo único que duele de quitarla.
 * Lo que no se puede quitar (aprobada, con anexo, con experiencias, con
 * dispensa) lo decide el servidor y lo explica.
 */
export function Quitar({ a, operadora }: { a: ActividadEnPantalla; operadora: string | null }) {
  const [confirmar, setConfirmar] = useState(false);
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const subidos = a.propios.filter((d) => d.estado !== "falta").length;

  if (!confirmar) {
    return (
      <p className="gnhint">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setError(null);
            setConfirmar(true);
          }}
        >
          Quitar esta actividad
        </button>{" "}
        Si la declaraste por error, sácala de tu lista.
      </p>
    );
  }
  return (
    <p className="motivo" style={{ marginTop: 12 }}>
      <s>{"//"}</s>
      <span>
        <b>¿Quitar {a.nombre} de tu lista?</b>
        {subidos
          ? `Se borran también ${subidos === 1 ? "el documento que subiste" : `los ${subidos} documentos que subiste`} para ella. `
          : "No has subido nada para ella, así que no se pierde nada. "}
        Lo de Lo general no se toca.
        <span style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button
            className="btn btn-orange btn-sm"
            disabled={pendiente}
            onClick={() =>
              arranca(async () => {
                const r = await quitarActividad(a.slug, operadora);
                if (r.ok) setConfirmar(false);
                else setError(r.error);
              })
            }
          >
            {pendiente ? "Quitando…" : "Sí, quitarla"}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={pendiente}
            onClick={() => {
              setConfirmar(false);
              setError(null);
            }}
          >
            Cancelar
          </button>
        </span>
        {error ? <span style={{ display: "block", marginTop: 8 }}>{error}</span> : null}
      </span>
    </p>
  );
}

/** «Ya está, revísenlo». Solo aparece mientras la actividad está incompleta. */
export function Mandar({ a, operadora }: { a: ActividadEnPantalla; operadora: string | null }) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <p className="gnhint">
      <button
        className="btn btn-ghost btn-sm"
        disabled={pendiente || a.faltan > 0}
        onClick={() =>
          arranca(async () => {
            const r = await mandarARevision(a.slug, operadora);
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
export function Declarar({ slug, texto, clase, operadora }: { slug: string; texto: string; clase: string; operadora: string | null }) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        className={clase}
        disabled={pendiente}
        onClick={() =>
          arranca(async () => {
            const r = await declararActividad(slug, operadora);
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
export function Mosaico({ slug, nombre, documentos, operadora }: { slug: string; nombre: string; documentos: number; operadora: string | null }) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <button
      className="cati"
      disabled={pendiente}
      onClick={() =>
        arranca(async () => {
          const r = await declararActividad(slug, operadora);
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
function Traido({ t, generales, operadora }: { t: BorradorDelCandado; generales: DocEnPantalla[]; operadora: string | null }) {
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
                  <Declarar operadora={operadora}
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

export default function Expediente({
  datos,
  traido,
  porOtra,
}: {
  datos: Datos;
  traido?: BorradorDelCandado | null;
  /** La casa subiendo POR una operadora. Null cuando la operadora edita lo suyo. */
  porOtra?: { id: string; nombre: string } | null;
}) {
  const operadora = porOtra?.id ?? null;
  const [abiertoGen, setAbiertoGen] = useState(true);
  const yaDeclaradas = new Set(datos.actividades.map((a) => a.slug));
  const genListos = datos.generales.length - datos.faltanGenerales;

  return (
    <>
      {porOtra ? (
        // La casa está aquí POR alguien. Se dice arriba de todo y en cada acción
        // queda registrado (`subido_por`): un papel que subió la casa no lo
        // revisó la operadora, y eso se tiene que poder ver.
        <p className="trajo" style={{ marginBottom: 14 }}>
          <s>{"//"}</s>
          <span>
            <b>Estás en el expediente de {porOtra.nombre}, como la casa.</b>
            Lo que subas o declares aquí queda a su nombre, y con el tuyo como quien lo subió.
          </span>
        </p>
      ) : null}
      {traido ? <Traido operadora={operadora} t={traido} generales={datos.generales} /> : null}

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
              {datos.generales.map((d) => <RenglonDoc operadora={operadora} key={d.slug} d={d} actividad={null} />)}
            </div>
          </div>
        </div>

        {datos.actividades.map((a) => <Carpeta operadora={operadora} key={a.slug} a={a} />)}
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
            <Mosaico operadora={operadora} key={c.slug} slug={c.slug} nombre={c.nombre} documentos={c.documentos.length} />
          ),
        )}
      </div>
    </>
  );
}
