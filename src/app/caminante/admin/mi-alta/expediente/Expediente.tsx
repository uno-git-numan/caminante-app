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
// Lo único del entregable que NO está: el panel #x5 —«te trajimos aquí porque
// quisiste publicar buceo»— porque necesita el candado de publicación, que
// todavía no existe. Se transcribe con él, no antes: media pantalla que no
// puede llegar a su estado es peor que ninguna.
//
// La subida va por `subirDocumento`, un server action con FormData: el archivo
// no pasa por el cliente más que para elegirlo, y el `operator_id` NUNCA viaja
// en el formulario — se resuelve de la sesión del lado del servidor.

import { useState, useTransition } from "react";
import { subirDocumento, mandarARevision } from "@/lib/operadores/expediente-actions";
import { ACTIVIDADES } from "@/lib/operadores/actividades";
import type { ActividadEnPantalla, DocEnPantalla, Expediente as Datos } from "@/lib/operadores/expediente";

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

export default function Expediente({ datos }: { datos: Datos }) {
  const [abiertoGen, setAbiertoGen] = useState(true);
  const yaDeclaradas = new Set(datos.actividades.map((a) => a.slug));
  const genListos = datos.generales.length - datos.faltanGenerales;

  return (
    <>
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
        <div className={"actv " + (datos.faltanGenerales ? "inc" : "aprob") + (abiertoGen ? " open" : "")}>
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
        {ACTIVIDADES.map((c) => (
          <button key={c.slug} className={"cati" + (yaDeclaradas.has(c.slug) ? " ya" : "")} disabled={yaDeclaradas.has(c.slug)}>
            <span className="pl">{yaDeclaradas.has(c.slug) ? "✓" : "+"}</span>
            <span>
              <b>{c.nombre}</b>
              <small>
                {yaDeclaradas.has(c.slug)
                  ? "Ya la declaraste"
                  : `${c.documentos.length} ${c.documentos.length === 1 ? "documento" : "documentos"} propios`}
              </small>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
