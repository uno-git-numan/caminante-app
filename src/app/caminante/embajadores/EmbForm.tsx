"use client";

// Formulario de aplicación al programa de embajadores. Patrón de
// SolicitarForm: server action directa, radio-cards con estado local,
// honeypot fuera de vista, botón con estado "enviando".
import { useState } from "react";
import { submitAmbassadorApplication } from "@/lib/embajadores/actions";

const PERFILES = [
  { v: "creador", tt: "Creador", dd: "Tienes audiencia que confía en ti y quieres monetizarla con algo real." },
  { v: "agencia", tt: "Agencia individual", dd: "Ya organizas viajes para tu cartera y quieres experiencias listas para vender." },
  { v: "comunidad", tt: "Líder de comunidad", dd: "Juntas gente que quiere vivir cosas juntas: corredores, buzos, equipos." },
] as const;

export default function EmbForm() {
  const [perfil, setPerfil] = useState<string>("");
  const [sending, setSending] = useState(false);

  return (
    <form action={submitAmbassadorApplication} onSubmit={() => setSending(true)}>
      {/* honeypot */}
      <div className="emb-hp" aria-hidden>
        <label htmlFor="web">Web</label>
        <input id="web" name="web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="emb-group">
        <div className="emb-glabel">
          <span className="emb-eyebrow"><span className="sl">{"//"}</span> Tú</span>
        </div>
        <div className="emb-fields">
          <div className="emb-fg">
            <label htmlFor="emb-nombre">Nombre completo</label>
            <input id="emb-nombre" name="nombre" type="text" required autoComplete="name" placeholder="Tu nombre" />
          </div>
          <div className="emb-fg">
            <label htmlFor="emb-correo">Correo</label>
            <input id="emb-correo" name="correo" type="email" required autoComplete="email" placeholder="tu@correo.com" />
          </div>
          <div className="emb-fg">
            <label htmlFor="emb-whatsapp">WhatsApp</label>
            <input id="emb-whatsapp" name="whatsapp" type="tel" required autoComplete="tel" placeholder="+52 …" />
          </div>
        </div>
      </div>

      <div className="emb-group">
        <div className="emb-glabel">
          <span className="emb-eyebrow"><span className="sl">{"//"}</span> Tu perfil</span>
        </div>
        <div className="emb-radios">
          {PERFILES.map((p) => (
            <label key={p.v} className={`emb-radio${perfil === p.v ? " sel" : ""}`}>
              <input
                type="radio"
                name="perfil"
                value={p.v}
                required
                checked={perfil === p.v}
                onChange={() => setPerfil(p.v)}
              />
              <span className="mk" aria-hidden />
              <span>
                <span className="tt">{p.tt}</span>
                <span className="dd">{p.dd}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="emb-group">
        <div className="emb-glabel">
          <span className="emb-eyebrow"><span className="sl">{"//"}</span> Tu comunidad</span>
        </div>
        <div className="emb-fields">
          <div className="emb-fg">
            <label htmlFor="emb-links">Links de tus redes o comunidad + tamaño de audiencia</label>
            <textarea
              id="emb-links"
              name="links"
              required
              placeholder={"Instagram: @tucuenta (12k)\nGrupo de corredores: 200 personas\n…"}
            />
            <span className="emb-hint">Los links que mejor cuenten quién te sigue y cuántos son.</span>
          </div>
          <div className="emb-fg">
            <label htmlFor="emb-exp">¿Has organizado viajes o grupos? Cuéntanos</label>
            <textarea id="emb-exp" name="experiencia" placeholder="Retiros, viajes con amigos, tu club, tu cartera de clientes…" />
          </div>
          <div className="emb-fg">
            <label htmlFor="emb-porque">¿Por qué caminante?</label>
            <textarea id="emb-porque" name="porque" placeholder="Qué te hizo clic del programa o de nuestras experiencias." />
          </div>
          <div className="emb-fg">
            <label htmlFor="emb-conociste">¿Cómo nos conociste?</label>
            <input id="emb-conociste" name="conociste" type="text" placeholder="Instagram, un amigo, un viaje…" />
          </div>
        </div>
      </div>

      <button type="submit" className="emb-submit" disabled={sending}>
        {sending ? "Enviando…" : "Enviar mi aplicación"}
      </button>
      <p className="emb-micro">
        Leemos cada aplicación con calma. Si tu perfil hace clic, agendamos una llamada de 30 minutos.
      </p>
    </form>
  );
}
