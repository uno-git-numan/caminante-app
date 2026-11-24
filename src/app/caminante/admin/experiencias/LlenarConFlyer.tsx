"use client";

// «LLENAR CON MI FLYER» — el atajo del alta rápida (23 nov 2026).
//
// Luis, armando una experiencia como operadora: «hay que incluir la sección de
// IA, en donde suban su flyer y les pre-llene la experiencia». Quien llega a
// este formulario casi siempre ya tiene la experiencia escrita en algún lado
// —un flyer, un PDF, un mensaje de WhatsApp—: teclearla otra vez es el trabajo
// que menos falta hace.
//
// Sube el archivo (o pega el texto), la IA lee los 16 datos del formulario y
// se llenan SÓLO los campos vacíos. Lo que el material no dice se queda vacío:
// no se inventa (`lib/experiences/prellenado-corta.ts`). Al terminar se dice
// qué se llenó y qué falta, con los nombres que los campos tienen en pantalla.
//
// Usa las clases del propio formulario (`card`, `sec-head`, `btn`, `err`); lo
// que no existe en esa hoja va en línea, no con clases inventadas.

import { useRef, useState } from "react";
import { comprimirImagen } from "./form-piezas";
import type { CortaDeIA } from "@/lib/experiences/prellenado-corta";

// El servidor corta el cuerpo en ~4.5 MB (ver api/admin/prellenar). Las fotos
// se comprimen antes de salir; un PDF que no cabe se avisa aquí, no con un 413.
const MAX_MB = 4.4;
const ACEPTA = ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp";

export type ResumenFlyer = { llenados: string[]; faltan: string[]; notas: string };

const enLista = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;

export default function LlenarConFlyer({
  onCampos,
}: {
  /** Recibe lo que leyó la IA y devuelve qué se llenó y qué falta, para contarlo aquí. */
  onCampos: (campos: CortaDeIA) => ResumenFlyer;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [archivos, setArchivos] = useState<File[]>([]);
  const [conTexto, setConTexto] = useState(false);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [resumen, setResumen] = useState<ResumenFlyer | null>(null);
  const [sobre, setSobre] = useState(false);

  const agregar = (lista: FileList | File[] | null | undefined) => {
    const nuevos = Array.from(lista ?? []);
    if (!nuevos.length) return;
    const malos = nuevos.filter((f) => !/^(application\/pdf|image\/(png|jpeg|webp))$/.test(f.type));
    if (malos.length) {
      setError(`«${malos[0].name}» no se puede leer. Sube un PDF o una imagen (PNG, JPG o WEBP); si es Word, expórtalo a PDF.`);
      return;
    }
    setError("");
    setResumen(null);
    setArchivos((p) => [...p, ...nuevos].slice(0, 4));
  };

  const hayAlgo = archivos.length > 0 || texto.trim().length > 20;

  async function llenar() {
    if (!hayAlgo || ocupado) return;
    setOcupado(true);
    setError("");
    setResumen(null);
    try {
      const fd = new FormData();
      fd.append("forma", "corta");
      fd.append("notas", texto);
      let total = 0;
      for (const f of archivos) {
        // Una foto de teléfono pesa más de lo que el servidor deja pasar: se
        // reduce antes de salir. El texto de un flyer se lee igual a 2000 px.
        const chico = f.type.startsWith("image/") && f.size > 1_200_000 ? await comprimirImagen(f, 2000, 0.8) : null;
        const cuerpo: Blob = chico && chico.size < f.size ? chico : f;
        total += cuerpo.size;
        fd.append("files", cuerpo, chico && chico.size < f.size ? f.name.replace(/\.[^.]+$/, "") + ".jpg" : f.name);
      }
      if (total > MAX_MB * 1024 * 1024) {
        setError(`Tu archivo pesa ${(total / 1024 / 1024).toFixed(1)} MB y el máximo es ${MAX_MB} MB. Sube una foto o captura del flyer, o pega el texto.`);
        return;
      }
      const res = await fetch("/caminante/api/admin/prellenar", { method: "POST", body: fd });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.error || "No pudimos leer tu material. Inténtalo de nuevo.");
        return;
      }
      setResumen(onCampos((json.campos ?? {}) as CortaDeIA));
    } catch {
      setError("Se cortó la conexión. Inténtalo de nuevo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section
      className="card"
      style={sobre ? { outline: "2px dashed var(--olive)", outlineOffset: 4 } : undefined}
      onDragOver={(e) => {
        e.preventDefault();
        if (!ocupado) setSobre(true);
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSobre(false);
        if (!ocupado) agregar(e.dataTransfer.files);
      }}
    >
      <div className="sec-head">
        <span className="eyebrow">
          <span className="sl">{"//"}</span> Atajo · opcional
        </span>
        <h2>¿Ya tienes tu flyer o tu itinerario?</h2>
        <p className="desc">
          Súbelo y llenamos el formulario por ti. Tú revisas y corriges antes de guardar. Lo que no venga en tu material se queda
          vacío: no inventamos precios, horarios ni fechas.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="btn btn-ghost" disabled={ocupado} onClick={() => entrada.current?.click()}>
          {archivos.length ? "Agregar otro archivo" : "Subir mi flyer"}
        </button>
        <input
          ref={entrada}
          type="file"
          aria-label="Subir mi flyer"
          multiple
          accept={ACEPTA}
          hidden
          onChange={(e) => {
            agregar(e.target.files);
            e.target.value = "";
          }}
        />
        {archivos.map((f, i) => (
          <span
            key={`${f.name}-${i}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, padding: "6px 6px 6px 12px",
              borderRadius: 999, border: "1px solid var(--line)", background: "var(--panel)", maxWidth: "100%",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{f.name}</span>
            <button
              type="button"
              aria-label={`Quitar ${f.name}`}
              disabled={ocupado}
              onClick={() => setArchivos((p) => p.filter((_, j) => j !== i))}
              style={{ border: 0, background: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 6px", color: "var(--ink-soft)" }}
            >
              ×
            </button>
          </span>
        ))}
        {!conTexto ? (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => setConTexto(true)}
            style={{ border: 0, background: "none", cursor: "pointer", font: "inherit", fontSize: 13, color: "var(--ink-soft)", textDecoration: "underline", padding: 0 }}
          >
            o pega el texto
          </button>
        ) : null}
      </div>
      <p className="desc" style={{ marginTop: 10, fontSize: 12.5 }}>PDF o imagen (PNG, JPG, WEBP). También puedes arrastrarlo aquí.</p>

      {conTexto ? (
        <textarea
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setResumen(null);
          }}
          aria-label="Texto de tu experiencia"
          placeholder="Pega aquí el texto de tu flyer, tu itinerario o el mensaje con el que la anuncias."
          rows={6}
          disabled={ocupado}
          style={{ width: "100%", marginTop: 12 }}
        />
      ) : null}

      {hayAlgo || ocupado ? (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 14 }}>
          <button type="button" className="btn btn-orange" disabled={!hayAlgo || ocupado} onClick={llenar}>
            {ocupado ? "Leyendo tu material…" : "Llenar el formulario"}
          </button>
          {ocupado ? <span className="desc" style={{ margin: 0 }}>Tarda menos de un minuto. No cierres la página.</span> : null}
        </div>
      ) : null}

      {error ? <p className="err" role="alert">{error}</p> : null}

      {resumen ? (
        <div
          role="status"
          style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--panel)", fontSize: 13.5, lineHeight: 1.6 }}
        >
          {resumen.llenados.length ? (
            <p style={{ margin: 0 }}>
              <b>Llenamos {enLista(resumen.llenados)}.</b> Revísalo abajo: lo puedes cambiar todo.
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              <b>No encontramos datos que llenar.</b> Prueba con otro archivo o pega el texto; si ya habías escrito los campos, se
              quedaron como los tenías.
            </p>
          )}
          {resumen.faltan.length ? (
            <p style={{ margin: "8px 0 0" }}>
              No venía en tu material y te toca escribirlo: {enLista(resumen.faltan)}. Las fotos también se suben abajo.
            </p>
          ) : (
            <p style={{ margin: "8px 0 0" }}>Sólo te faltan las fotos.</p>
          )}
          {resumen.notas ? <p style={{ margin: "8px 0 0", color: "var(--ink-soft)" }}>{resumen.notas}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
