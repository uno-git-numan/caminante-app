"use client";

// Form de "Solicita una fecha" (diseño Claude Design jul 2026, clases .sol-*).
// Client component: stepper de personas + radio cards; el submit va a la
// server action submitSlotRequest (valida TODO de nuevo server-side).

import { useState } from "react";
import { submitSlotRequest } from "@/lib/experiences/solicitudes";
import { trackPixel } from "@/lib/meta/pixel";

export default function SolicitarForm({
  slug,
  minPeople,
  prefill,
}: {
  slug: string;
  minPeople: number;
  prefill: { nombre: string; correo: string; whatsapp: string };
}) {
  const min = Math.max(1, minPeople);
  const [pax, setPax] = useState(min);
  const [tipo, setTipo] = useState<"privado" | "abierta">("privado");
  const [sending, setSending] = useState(false);

  return (
    <form
      action={submitSlotRequest}
      onSubmit={() => {
        setSending(true);
        trackPixel("Lead", { content_ids: [slug], content_type: "product" });
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="personas" value={pax} />
      {/* honeypot anti-bots: un humano nunca lo ve ni lo llena */}
      <div className="sol-hp" aria-hidden="true">
        <label htmlFor="sol-web">Web</label>
        <input id="sol-web" type="text" name="web" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Tú */}
      <section className="sol-group">
        <div className="sol-glabel"><span className="sol-eyebrow"><span className="sl">{"//"}</span> Tú</span></div>
        <div className="sol-fields">
          <div className="sol-fg">
            <label htmlFor="sol-nom">Nombre completo</label>
            <input id="sol-nom" name="nombre" type="text" placeholder="Mariana López Herrera" defaultValue={prefill.nombre} required />
          </div>
          <div className="sol-fg">
            <label htmlFor="sol-cor">Correo</label>
            <input id="sol-cor" name="correo" type="email" placeholder="mariana@correo.com" defaultValue={prefill.correo} required />
          </div>
          <div className="sol-fg">
            <label htmlFor="sol-wa">WhatsApp</label>
            <input id="sol-wa" name="whatsapp" type="tel" placeholder="+52 55 1234 5678" defaultValue={prefill.whatsapp} required />
          </div>
        </div>
      </section>

      {/* Tu fecha */}
      <section className="sol-group">
        <div className="sol-glabel"><span className="sol-eyebrow"><span className="sl">{"//"}</span> Tu fecha</span></div>
        <div className="sol-fields">
          <div className="sol-fg">
            <label htmlFor="sol-fec">Fecha deseada</label>
            <input id="sol-fec" name="fecha" type="date" />
            <span className="sol-hint">Puedes dejar la fecha vacía si son flexibles.</span>
          </div>
          <div className="sol-fg">
            <label htmlFor="sol-not">Notas</label>
            <textarea id="sol-not" name="nota" placeholder="Fechas flexibles, ocasión, algo que debamos saber…" />
          </div>
        </div>
      </section>

      {/* Tu grupo */}
      <section className="sol-group">
        <div className="sol-glabel"><span className="sol-eyebrow"><span className="sl">{"//"}</span> Tu grupo</span></div>
        <div className="sol-fields">
          <div className="sol-fg">
            <label>Personas</label>
            <div className="sol-stepwrap">
              <div className="sol-stepper">
                <button type="button" aria-label="Quitar" disabled={pax <= min} onClick={() => setPax((p) => Math.max(min, p - 1))}>−</button>
                <span className="val">{pax}</span>
                <button type="button" aria-label="Agregar" disabled={pax >= 80} onClick={() => setPax((p) => Math.min(80, p + 1))}>+</button>
              </div>
              {min > 1 ? (
                <span className="sol-chip"><span className="dot" /> Esta experiencia sale desde {min}&nbsp;personas</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="sol-radios">
          <label className={`sol-radio${tipo === "privado" ? " sel" : ""}`}>
            <input type="radio" name="tipo" value="privado" checked={tipo === "privado"} onChange={() => setTipo("privado")} />
            <span className="mk" />
            <span>
              <span className="tt">Grupo privado</span>
              <span className="dd">Solo tu gente. Te mandamos un link exclusivo para que reserven.</span>
            </span>
          </label>
          <label className={`sol-radio${tipo === "abierta" ? " sel" : ""}`}>
            <input type="radio" name="tipo" value="abierta" checked={tipo === "abierta"} onChange={() => setTipo("abierta")} />
            <span className="mk" />
            <span>
              <span className="tt">Salida abierta</span>
              <span className="dd">Otros caminantes pueden sumarse hasta llenar el cupo.</span>
            </span>
          </label>
        </div>
      </section>

      <button type="submit" className="sol-submit" disabled={sending}>
        {sending ? "Enviando…" : "Enviar solicitud →"}
      </button>
      <p className="sol-micro">Sin costo ni compromiso — te contactamos por WhatsApp para confirmar.</p>
    </form>
  );
}
