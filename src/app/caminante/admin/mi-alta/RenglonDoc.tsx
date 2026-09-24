"use client";

// EL RENGLÓN DE DOCUMENTO — uno solo, para Mi alta y para el expediente.
//
// Transcrito de la lámina «Panel Operadora» (design/panel-operador/dc/Panel
// Operadora.html, recurso 9db813cc · `DocRow` y `useUpload`).
//
// ⚠️ UN CLIC, NO CUATRO (Luis, 24 sep 2026: «Son 4 pasos para subir un archivo.
// Super impráctico»). Antes el renglón traía a la vista un selector de archivo,
// un campo de fecha y un botón: había que ir al expediente, elegir el archivo,
// teclear la fecha y apretar «Subir» — y si se apretaba sin archivo, el navegador
// contestaba «Please select a file». Ahora el botón naranja ABRE el selector; al
// elegir el archivo se sube solo. Si el documento caduca, aparece en el mismo
// renglón el cuadrito de la fecha, porque sin ella el servidor no lo acepta.
//
// Era DOS renglones —uno en Mi alta que sólo llevaba al expediente y otro en el
// expediente con el formulario— y ahora es uno. El cuadrito de fecha ocupa
// todo el ancho del renglón (`grid-column:1/-1`), así que el componente ES el
// renglón: un botón suelto no podría poner su panel ahí.

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DocEnPantalla } from "@/lib/operadores/expediente";
import { subirDocumento } from "@/lib/operadores/expediente-actions";
import { diaEnPalabras } from "@/lib/fecha/zona";

// Los cuatro íconos de la lámina: entregado, en revisión, rechazado y falta.
const IcoOK = () => (
  <svg className="st" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12.6l5.2 5.2L20 6.6" />
  </svg>
);
const IcoMas = () => (
  <svg className="st" viewBox="0 0 24 24" fill="none" stroke="var(--sand)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IcoX = () => (
  <svg className="st" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
const IcoReloj = () => (
  <svg className="st" viewBox="0 0 24 24" fill="none" stroke="var(--olive)" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

// Los formatos que el servidor acepta (`TIPOS` en expediente-actions.ts). El
// selector sólo ofrece ésos, para no dejar elegir uno que después rebota.
const ACEPTA = "application/pdf,image/jpeg,image/png,image/heic,.pdf,.jpg,.jpeg,.png,.heic";

export default function RenglonDoc({
  d,
  actividad,
  operadora,
}: {
  d: DocEnPantalla;
  /** `null` = Lo general. */
  actividad: string | null;
  /** La operadora sobre la que actúa la casa; `null` si es ella misma. */
  operadora: string | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pend, setPend] = useState<{ f: File; vence: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subiendo, arranca] = useTransition();

  const vencido = d.estado !== "falta" && d.diasParaVencer !== null && d.diasParaVencer < 0;
  const k = d.estado === "falta" ? "falta" : vencido ? "vencido" : d.estado === "en_revision" ? "revision" : d.estado;
  const ico = k === "aprobado" ? <IcoOK /> : k === "revision" ? <IcoReloj /> : k === "rechazado" || k === "vencido" ? <IcoX /> : <IcoMas />;
  const cls = "doc" + (k === "falta" ? " pend" : "") + (k === "rechazado" || k === "vencido" ? " rech" : "");
  const estadoTxt: Record<string, string> = {
    aprobado: "Aprobado",
    revision: "En revisión · nos toca a nosotros",
    rechazado: "Rechazado",
    vencido: "Vencido",
  };

  const pick = () => {
    setError(null);
    ref.current?.click();
  };

  const guardar = (f: File, vence: string | null) => {
    setError(null);
    arranca(async () => {
      const fd = new FormData();
      fd.set("archivo", f);
      fd.set("actividad", actividad ?? "");
      fd.set("documento", d.slug);
      fd.set("operadora", operadora ?? "");
      if (vence) fd.set("venceAt", vence);
      const r = await subirDocumento(fd);
      if (r.ok) {
        setPend(null);
        // La acción revalida el expediente; Mi alta es otra ruta y hay que
        // pedirle al servidor que la vuelva a dibujar.
        router.refresh();
      } else setError(r.error);
    });
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // para que elegir el mismo archivo otra vez vuelva a disparar
    if (!f) return;
    if (d.caduca) setPend({ f, vence: "" });
    else guardar(f, null);
  };

  // Vive en Lo general: se enseña, no se vuelve a pedir.
  if (d.cubiertoPorGeneral) {
    return (
      <div className="doc">
        {ico}
        <span className="nm">
          <b>{d.nombre}</b>
          <small>{d.porQue}</small>
        </span>
        <span className="fl">
          <span className="mut">{d.estado === "falta" ? "Todavía no lo has subido" : estadoTxt[k]}</span>
        </span>
        <span className="ac">
          <span className="mut">Ya está en Lo general</span>
        </span>
      </div>
    );
  }

  const dias = d.diasParaVencer;
  return (
    <div className={cls}>
      {ico}
      <span className="nm">
        <b>{d.nombre}</b>
        <small>
          {d.porQue}
          {d.caduca && d.estado === "falta" ? " · pide fecha de vencimiento" : ""}
        </small>
      </span>
      <span className="fl">
        {d.estado === "falta" ? (
          <span className="mut">sin archivo</span>
        ) : (
          <>
            <span className="mut" style={{ fontFamily: "'Geist',system-ui,sans-serif" }}>
              {estadoTxt[k]}
            </span>
            {d.venceAt ? (
              <span className={"venc" + (vencido ? " vencido" : dias !== null && dias <= 30 ? " pronto" : "")}>
                <s>{"//"}</s>
                {vencido
                  ? `Venció el ${diaEnPalabras(d.venceAt)}`
                  : `Vence el ${diaEnPalabras(d.venceAt)}${dias !== null && dias <= 30 ? ` · en ${dias} ${dias === 1 ? "día" : "días"}` : ""}`}
              </span>
            ) : null}
          </>
        )}
      </span>
      <span className="ac">
        {k === "falta" ? (
          <button type="button" className="btn btn-orange btn-sm" onClick={pick} disabled={subiendo}>
            {subiendo ? "Subiendo…" : "Subir"}
          </button>
        ) : k === "rechazado" || k === "vencido" ? (
          <button type="button" className="btn btn-orange btn-sm" onClick={pick} disabled={subiendo}>
            {subiendo ? "Subiendo…" : k === "vencido" ? "Subir el vigente" : "Subir de nuevo"}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-sm" onClick={pick} disabled={subiendo}>
            {subiendo ? "Subiendo…" : "Reemplazar"}
          </button>
        )}
      </span>
      <input ref={ref} type="file" hidden accept={ACEPTA} onChange={onFile} />

      {pend ? (
        <div className="upfecha">
          <span className="g">
            <b>{pend.f.name}</b>
            <small>
              Este documento vence. Escribe la fecha que dice el papel: con ella te avisamos 30 días
              antes.
            </small>
          </span>
          <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
            <span className="mut">Fecha de vencimiento</span>
            <input
              type="date"
              required
              value={pend.vence}
              onChange={(e) => setPend({ ...pend, vence: e.target.value })}
            />
          </label>
          <span className="ac">
            <button
              type="button"
              className="btn btn-orange btn-sm"
              disabled={!pend.vence || subiendo}
              onClick={() => guardar(pend.f, pend.vence)}
            >
              {subiendo ? "Subiendo…" : "Guardar"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={subiendo} onClick={() => setPend(null)}>
              Cancelar
            </button>
          </span>
        </div>
      ) : null}

      {error ? (
        <p className="motivo">
          <s>{"//"}</s>
          <span>
            <b>No se subió</b>
            {error}
          </span>
        </p>
      ) : null}

      {d.estado === "rechazado" && d.motivo ? (
        <p className="motivo">
          <s>{"//"}</s>
          <span>
            <b>Lo rechazamos, y esto es lo que hay que corregir</b>
            {d.motivo}
          </span>
        </p>
      ) : null}
      {vencido ? (
        <p className="motivo">
          <s>{"//"}</s>
          <span>
            <b>Este documento ya no está vigente</b>
            Mientras no subas el vigente, las actividades que lo necesitan no pueden vender fechas
            nuevas. Tus salidas ya vendidas se operan igual.
          </span>
        </p>
      ) : null}
    </div>
  );
}
