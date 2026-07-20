"use client";

// Compositor del BOLETÍN dentro del Kit. Edita el contenido pre-llenado desde
// la ficha científica + serie E + salidas reales, muestra la vista previa del
// correo tal cual llegará (iframe con el HTML ya armado en el servidor) y
// dispara los envíos.
//
// ⚠️ Envío real = DOS PASOS. El primer botón NO manda: pide confirmación y
// vuelve con el resumen (plantilla, asunto, N destinatarios); solo entonces
// aparece el botón rojo que manda de verdad. La prueba a uno@numanhub.com no
// pide confirmación: es inofensiva y debe estar siempre a mano.
import { useState } from "react";
import type { NewsletterBody, NewsletterTemplate } from "@/lib/newsletter/templates";
import type { NewsletterRow } from "@/lib/newsletter/queries";
import {
  prellenarBoletin,
  guardarBoletin,
  probarBoletin,
  pedirConfirmacion,
  enviarBoletinReal,
} from "@/lib/newsletter/actions";

const PLANTILLAS: { id: NewsletterTemplate; nombre: string; para: string }[] = [
  { id: "carta", nombre: "La carta", para: "la mensual — historia + dato + salidas" },
  { id: "dato", nombre: "Un dato", para: "corto y potente — una cifra con su fuente" },
  { id: "guia", nombre: "Guía de campo", para: "editorial — especies para guardar y reenviar" },
  { id: "vivio", nombre: "Así se vivió", para: "post-viaje — fotos, voz del grupo y próxima fecha" },
];

type Props = {
  slug: string;
  borrador: NewsletterRow | null;
  previewHtml: string | null;
  destinatarios: number;
  faltantes: string[];
  enviados: NewsletterRow[];
  confirmar?: string;
  nConfirmado?: number;
};

export default function BoletinPanel({
  slug,
  borrador,
  previewHtml,
  destinatarios,
  faltantes,
  enviados,
  confirmar,
  nConfirmado,
}: Props) {
  const [body, setBody] = useState<NewsletterBody>(borrador?.body ?? {});
  const [subject, setSubject] = useState(borrador?.subject ?? "");
  const [preheader, setPreheader] = useState(borrador?.preheader ?? "");
  const [verPreview, setVerPreview] = useState(false);
  const [correoPrueba, setCorreoPrueba] = useState("uno@numanhub.com");

  const set = (patch: Partial<NewsletterBody>) => setBody((b) => ({ ...b, ...patch }));
  const oculto = (
    <>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="id" value={borrador?.id ?? ""} />
      <input type="hidden" name="template" value={borrador?.template ?? "carta"} />
      <input type="hidden" name="body" value={JSON.stringify(body)} />
      <input type="hidden" name="subject" value={subject} />
      <input type="hidden" name="preheader" value={preheader} />
    </>
  );

  return (
    <section className="bol" id="boletin">
      <div className="eyebrow" style={{ marginTop: 44 }}>// Boletín</div>
      <h2>Correo a los suscriptores</h2>
      <p className="lead">
        Se arma con <b>la misma fuente</b> que el resto del kit: un dato con su fuente de la ficha científica,
        una pieza del catálogo informativo como cuerpo, y las salidas reales de esta experiencia. Todo es
        editable antes de enviar.
      </p>

      {faltantes.length ? (
        <div className="bol-warn">
          {faltantes.map((f, i) => (
            <div key={i}>{f}</div>
          ))}
        </div>
      ) : null}

      {!borrador ? (
        <div className="bol-tpl">
          {PLANTILLAS.map((p) => (
            <form key={p.id} action={prellenarBoletin} className="bol-card">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="template" value={p.id} />
              <div className="bol-nom">{p.nombre}</div>
              <div className="bol-para">{p.para}</div>
              <button type="submit" className="btn btn-glass btn-sm" style={{ marginTop: 12 }}>
                Armar borrador →
              </button>
            </form>
          ))}
        </div>
      ) : (
        <div className="bol-edit">
          <div className="bol-head">
            <span className="chip c-lista">{PLANTILLAS.find((p) => p.id === borrador.template)?.nombre}</span>
            <span className="bol-dest">{destinatarios} suscriptores activos</span>
          </div>

          <label className="bol-f">
            <span>Asunto</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} />
          </label>
          <label className="bol-f">
            <span>Preheader <i>(lo que se ve en la bandeja junto al asunto)</i></span>
            <input value={preheader} onChange={(e) => setPreheader(e.target.value)} maxLength={160} />
          </label>
          <label className="bol-f">
            <span>Titular <i>(**texto** sale en itálica naranja)</i></span>
            <input value={body.titulo ?? ""} onChange={(e) => set({ titulo: e.target.value })} />
          </label>
          {borrador.template !== "dato" ? (
            <label className="bol-f">
              <span>Entrada</span>
              <textarea rows={3} value={body.intro ?? ""} onChange={(e) => set({ intro: e.target.value })} />
            </label>
          ) : null}

          {/* Apartados (La carta) */}
          {(body.apartados ?? []).map((a, i) => (
            <div className="bol-sub" key={i}>
              <input
                value={a.t}
                placeholder="Subtítulo"
                onChange={(e) =>
                  set({ apartados: (body.apartados ?? []).map((x, j) => (j === i ? { ...x, t: e.target.value } : x)) })
                }
              />
              <textarea
                rows={3}
                value={a.b}
                placeholder="Párrafo"
                onChange={(e) =>
                  set({ apartados: (body.apartados ?? []).map((x, j) => (j === i ? { ...x, b: e.target.value } : x)) })
                }
              />
            </div>
          ))}

          {/* El dato SIEMPRE con su fuente */}
          {body.dato ? (
            <div className="bol-sub">
              <textarea
                rows={2}
                value={body.dato.texto}
                placeholder="El dato"
                onChange={(e) => set({ dato: { ...body.dato!, texto: e.target.value } })}
              />
              <input
                value={body.dato.fuente}
                placeholder="Fuente (obligatoria)"
                onChange={(e) => set({ dato: { ...body.dato!, fuente: e.target.value } })}
              />
            </div>
          ) : null}

          <label className="bol-f">
            <span>Pregunta al lector <i>(del tercer porqué — ahí viven las respuestas)</i></span>
            <input value={body.pregunta ?? ""} onChange={(e) => set({ pregunta: e.target.value })} />
          </label>
          <label className="bol-f">
            <span>Cierre</span>
            <input value={body.cierre ?? ""} onChange={(e) => set({ cierre: e.target.value })} />
          </label>

          <div className="bol-acts">
            <form action={guardarBoletin}>
              {oculto}
              <button type="submit" className="btn btn-glass btn-sm">Guardar</button>
            </form>
            <form action={probarBoletin} className="bol-prueba">
              {oculto}
              <input
                type="email"
                name="to"
                value={correoPrueba}
                onChange={(e) => setCorreoPrueba(e.target.value)}
                placeholder="correo de prueba"
                className="bol-prueba-in"
              />
              <button type="submit" className="btn btn-glass btn-sm">Enviar prueba</button>
            </form>
            <button type="button" className="btn btn-glass btn-sm" onClick={() => setVerPreview((v) => !v)}>
              {verPreview ? "Ocultar" : "Vista previa"}
            </button>
            {!confirmar ? (
              <form action={pedirConfirmacion}>
                {oculto}
                <button type="submit" className="btn btn-orange btn-sm">
                  Enviar a los suscriptores…
                </button>
              </form>
            ) : null}
          </div>

          {/* PASO 2 — la confirmación explícita, con el resumen a la vista */}
          {confirmar ? (
            <div className="bol-conf">
              <div className="bol-conf-t">Confirma el envío</div>
              <div className="bol-conf-b">
                Plantilla <b>{PLANTILLAS.find((p) => p.id === borrador.template)?.nombre}</b> · asunto «
                <b>{subject}</b>» · se enviará a <b>{nConfirmado ?? destinatarios} suscriptores</b>. Esto no se
                puede deshacer.
              </div>
              <div className="bol-acts" style={{ marginTop: 12 }}>
                <form action={enviarBoletinReal}>
                  {oculto}
                  <input type="hidden" name="confirmar" value={confirmar} />
                  <input type="hidden" name="n" value={String(nConfirmado ?? destinatarios)} />
                  <button type="submit" className="btn btn-danger btn-sm">
                    Sí, enviar ahora a {nConfirmado ?? destinatarios}
                  </button>
                </form>
                <a href={`/caminante/admin/kit/${slug}#boletin`} className="btn btn-glass btn-sm">Cancelar</a>
              </div>
            </div>
          ) : null}

          {verPreview && previewHtml ? (
            <iframe className="bol-prev" title="Vista previa del boletín" srcDoc={previewHtml} />
          ) : null}
        </div>
      )}

      {enviados.length ? (
        <div className="bol-hist">
          <div className="bol-hist-t">Enviados</div>
          {enviados.map((e) => (
            <div className="bol-hist-r" key={e.id}>
              <span>{e.subject}</span>
              <span className="bol-hist-m">
                {e.sent_at ? new Date(e.sent_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) : ""} ·{" "}
                {e.recipients_count ?? 0} destinatarios
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
