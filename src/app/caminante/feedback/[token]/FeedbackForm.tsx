"use client";

// Encuesta de satisfacción — conversión a React del diseño de Claude Design
// (encuesta-satisfaccion.html). Divulgación progresiva en 3 pasos + cierre.
// Estrellas con medias (0.5), NPS 0–10, Paso 2 condicional según rating,
// secciones del Paso 3 data-driven desde la config de la experiencia.

import { useMemo, useState, useTransition } from "react";
import { submitFeedback } from "@/lib/feedback/actions";
import type { FeedbackContext, FeedbackInput, SectionRating } from "@/lib/feedback/types";

const STAR_PATH =
  "M12 2.5l2.95 5.98 6.6.96-4.77 4.65 1.13 6.57L12 17.55l-5.9 3.1 1.13-6.57L2.46 9.44l6.6-.96L12 2.5z";

function Stars({
  value,
  onChange,
  size = "big",
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "big" | "compact";
  ariaLabel: string;
}) {
  return (
    <div className={`stars ${size}`} role="radiogroup" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((pos) => {
        const pct = value >= pos ? 100 : value >= pos - 0.5 ? 50 : 0;
        return (
          <button
            key={pos}
            type="button"
            className="star"
            role="radio"
            aria-checked={Math.ceil(value) === pos}
            aria-label={`${pos} ${pos === 1 ? "estrella" : "estrellas"}`}
            // 2do toque sobre la misma estrella = media
            onClick={() => onChange(value === pos ? pos - 0.5 : pos)}
          >
            <span className="star-base">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d={STAR_PATH} /></svg>
            </span>
            <span className="star-fg" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d={STAR_PATH} /></svg>
            </span>
          </button>
        );
      })}
    </div>
  );
}

const Check = ({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) => (
  <label className="check">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="box">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </span>
    <span className="label">{children}</span>
  </label>
);

export default function FeedbackForm({ ctx }: { ctx: FeedbackContext }) {
  const [step, setStep] = useState<1 | 2 | 3 | "success">(1);
  const [overall, setOverall] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [testimonial, setTestimonial] = useState("");
  const [consentShare, setConsentShare] = useState(false);
  const [consentPhotos, setConsentPhotos] = useState(false);
  const [improve, setImprove] = useState("");
  const [sections, setSections] = useState<Record<string, SectionRating>>({});
  const [openComment, setOpenComment] = useState<Record<string, boolean>>({});
  const [mostMarked, setMostMarked] = useState("");
  const [expectedMissing, setExpectedMissing] = useState("");
  const [notifyNext, setNotifyNext] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const positive = overall === 0 || overall >= 4; // sin rating → camino positivo
  const setSection = (key: string, patch: Partial<SectionRating>) =>
    setSections((s) => ({ ...s, [key]: { stars: s[key]?.stars ?? 0, ...s[key], ...patch } }));

  const goTo = (s: typeof step) => {
    setStep(s);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  const onSubmit = () => {
    setError("");
    const cleanSections: Record<string, SectionRating> = {};
    for (const [k, v] of Object.entries(sections)) {
      if (v.stars >= 1) cleanSections[k] = { stars: v.stars, comment: v.comment };
    }
    const input: FeedbackInput = {
      token: ctx.token,
      overallStars: overall,
      nps,
      sectionRatings: cleanSections,
      lovedText: mostMarked,
      improveText: improve,
      expectedGapText: expectedMissing,
      rebookInterest: notifyNext,
      testimonialText: testimonial,
      testimonialStars: null,
      testimonialConsent: consentShare,
      photoConsent: consentPhotos,
    };
    startTransition(async () => {
      const res = await submitFeedback(input);
      if (res.ok) goTo("success");
      else setError(res.error);
    });
  };

  const progressPct = useMemo(
    () => (step === "success" ? 100 : (Number(step) / 3) * 100),
    [step],
  );

  return (
    <div className="shell">
      {step !== "success" && (
        <div className="progress">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="progress-meta">
            <span className="eyebrow">Tu experiencia</span>
            <span className="eyebrow">Paso {step} de 3</span>
          </div>
        </div>
      )}

      <div className="steps">
        {/* ── PASO 1 · El pulso ── */}
        {step === 1 && (
          <section className="step active">
            <h1 className="title">Tu paso por {ctx.locationLabel.split(",")[0] || "Caminante"}</h1>
            {ctx.locationLabel && <p className="subline">{ctx.locationLabel}</p>}

            <div className="card" style={{ marginTop: 24 }}>
              <p className="q">¿Cómo te fuiste?</p>
              <p className="q-sub">
                Toca las estrellas que sentiste. Si quieres afinar, toca de nuevo la última para
                dejarla a la mitad.
              </p>
              <Stars value={overall} onChange={setOverall} ariaLabel="Calificación general" />
            </div>

            {ctx.npsEnabled && (
              <div className="card">
                <p className="q">¿Qué tan probable es que nos recomiendes a alguien que quieres?</p>
                <div className="nps" role="radiogroup" aria-label="Probabilidad de recomendar">
                  {Array.from({ length: 11 }, (_, n) => (
                    <button
                      key={n}
                      type="button"
                      className={`nps-btn${nps === n ? " on" : ""}`}
                      role="radio"
                      aria-checked={nps === n}
                      aria-label={`${n} de 10`}
                      onClick={() => setNps(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="nps-ends">
                  <span>0 · nada probable</span>
                  <span>10 · sin dudarlo</span>
                </div>
              </div>
            )}

            <div className="actions">
              <button className="btn btn-lagoon" type="button" onClick={() => goTo(2)}>
                Continuar
              </button>
            </div>
          </section>
        )}

        {/* ── PASO 2 · condicional según rating ── */}
        {step === 2 && (
          <section className="step active">
            {positive ? (
              <>
                <h1 className="title">Nos llena leerte.</h1>
                <div className="card" style={{ marginTop: 24 }}>
                  <p className="q">¿Nos regalas unas palabras?</p>
                  <p className="q-sub">Lo que te llevas del mar, dicho con tu voz.</p>
                  <textarea
                    value={testimonial}
                    onChange={(e) => setTestimonial(e.target.value)}
                    placeholder={ctx.testimonialPrompt}
                    aria-label="Tu testimonio"
                  />
                  <div style={{ marginTop: 16 }}>
                    <Check checked={consentShare} onChange={setConsentShare}>
                      Sí, Caminante puede compartir mis palabras{" "}
                      <span className="muted">(siempre solo con mis iniciales)</span> en redes, web y
                      materiales.
                    </Check>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Check checked={consentPhotos} onChange={setConsentPhotos}>
                      Si tomé fotos, puedo compartir alguna.
                    </Check>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="title">Gracias por tu honestidad — así crecemos.</h1>
                <div className="card" style={{ marginTop: 24 }}>
                  <p className="q">¿Qué nos faltó?</p>
                  <p className="q-sub">Tu respuesta es anónima, puedes expresarte libremente.</p>
                  <textarea
                    value={improve}
                    onChange={(e) => setImprove(e.target.value)}
                    placeholder="Cuéntanos qué pudo ser distinto. Lo leemos con atención, sin excusas."
                    aria-label="Qué podemos mejorar"
                  />
                </div>
              </>
            )}

            <div className="actions">
              <button className="btn btn-lagoon" type="button" onClick={() => goTo(3)}>
                Continuar
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => goTo(1)}>
                Volver
              </button>
            </div>
          </section>
        )}

        {/* ── PASO 3 · El detalle (opcional) ── */}
        {step === 3 && (
          <section className="step active">
            <h1 className="title">¿Nos ayudas con el detalle?</h1>
            <p className="subline">Opcional · puedes enviar sin llenarlo</p>

            {ctx.sections.length > 0 && (
              <div className="card" style={{ marginTop: 24 }}>
                <p className="q">Califica cada parte de la expedición.</p>
                <p className="q-sub">Toca para puntuar; abre un comentario solo si quieres.</p>
                <div className="section-list">
                  {ctx.sections.map((sec) => (
                    <div className="section-item" key={sec.key}>
                      <div className="section-head">
                        <span className="section-emoji" aria-hidden="true">{sec.icon}</span>
                        <span className="section-name">{sec.label}</span>
                      </div>
                      <div className="section-stars">
                        <Stars
                          size="compact"
                          value={sections[sec.key]?.stars ?? 0}
                          onChange={(v) => setSection(sec.key, { stars: v })}
                          ariaLabel={`Calificar: ${sec.label}`}
                        />
                      </div>
                      <button
                        type="button"
                        className="comment-toggle"
                        onClick={() =>
                          setOpenComment((o) => ({ ...o, [sec.key]: !o[sec.key] }))
                        }
                      >
                        <span className="plus">{openComment[sec.key] ? "–" : "+"}</span>{" "}
                        {openComment[sec.key] ? "Ocultar comentario" : "Agregar comentario"}
                      </button>
                      {openComment[sec.key] && (
                        <div className="section-comment open">
                          <textarea
                            className="sm"
                            value={sections[sec.key]?.comment ?? ""}
                            onChange={(e) => setSection(sec.key, { comment: e.target.value })}
                            placeholder={`Tu nota sobre ${sec.label.toLowerCase()}`}
                            aria-label={`Comentario sobre ${sec.label}`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <div className="field">
                <p className="field-label">¿Qué fue lo que más te marcó?</p>
                <textarea
                  className="sm"
                  value={mostMarked}
                  onChange={(e) => setMostMarked(e.target.value)}
                  placeholder="Un momento, una imagen, una conversación…"
                  aria-label="Lo que más te marcó"
                />
              </div>
              <div className="field">
                <p className="field-label">¿Hubo algo que esperabas y no pasó?</p>
                <textarea
                  className="sm"
                  value={expectedMissing}
                  onChange={(e) => setExpectedMissing(e.target.value)}
                  placeholder="Sé honesto, nos sirve."
                  aria-label="Algo que esperabas y no pasó"
                />
              </div>
            </div>

            <div className="card">
              <Check checked={notifyNext} onChange={setNotifyNext}>
                ¿Te avisamos de la próxima expedición?
              </Check>
            </div>

            {error && <p className="err">{error}</p>}
            <div className="actions">
              <button
                className="btn btn-duna"
                type="button"
                onClick={onSubmit}
                disabled={pending}
              >
                {pending ? "Enviando…" : "Enviar"}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => goTo(2)}>
                Volver
              </button>
            </div>
          </section>
        )}

        {/* ── Cierre ── */}
        {step === "success" && (
          <section id="success" className="active">
            <div className="success-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1>
              Gracias{ctx.firstName ? `, ${ctx.firstName}` : ""}. Cada palabra tuya cuida el mar y a
              quienes vienen después.
            </h1>
            <p>Nos vemos en la próxima orilla.</p>
            <div className="success-sign">
              <strong>CAMINANTE</strong>
              Naturaleza en movimiento
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .shell {
          --crema: #f5f0e8; --lagoon: #1e3147; --duna: #d18730; --arena: #d4c5b0;
          --oliva: #5f5f40; --forest: #2c4a3e;
          --mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
          max-width: 600px; margin: 0 auto; min-height: 100vh; display: flex;
          flex-direction: column; padding: 0 16px; color: var(--lagoon);
        }
        @media (min-width: 480px) { .shell { padding: 0 24px; } }
        .progress { position: sticky; top: 0; z-index: 10; background: var(--crema); padding: 18px 0 14px; }
        .progress-track { height: 3px; background: var(--arena); border-radius: 999px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--duna); border-radius: 999px; transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1); }
        .progress-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
        .eyebrow { font-family: var(--mono); font-size: 10px; font-weight: 500; letter-spacing: 0.25em; text-transform: uppercase; color: var(--oliva); }
        .steps { flex: 1; display: flex; flex-direction: column; }
        .step { display: flex; flex-direction: column; animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; padding-bottom: 40px; }
        @keyframes rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .title { font-size: 28px; line-height: 1.12; font-weight: 700; letter-spacing: -0.4px; margin: 14px 0 0; }
        @media (min-width: 480px) { .title { font-size: 32px; } }
        .subline { font-family: var(--mono); font-size: 12px; letter-spacing: 0.08em; color: var(--oliva); margin-top: 10px; text-transform: uppercase; }
        .card { background: #fff; border: 1px solid var(--arena); border-radius: 18px; padding: 22px; }
        .card + .card { margin-top: 16px; }
        .q { font-size: 17px; font-weight: 600; margin: 0 0 4px; }
        .q-sub { font-size: 13px; color: var(--oliva); margin: 0 0 16px; }
        .stars { display: flex; gap: 6px; }
        .stars.big { gap: 10px; }
        .star { position: relative; background: none; border: none; padding: 6px; cursor: pointer; line-height: 0; transition: transform 0.12s ease; -webkit-tap-highlight-color: transparent; }
        .stars.big .star { padding: 8px; }
        .star :global(svg) { display: block; width: 26px; height: 26px; }
        .stars.big .star :global(svg) { width: 42px; height: 42px; }
        .star-base { color: var(--arena); }
        .star-fg { position: absolute; top: 6px; left: 6px; color: var(--duna); transition: clip-path 0.12s ease; }
        .stars.big .star-fg { top: 8px; left: 8px; }
        .star:active { transform: scale(0.88); }
        @media (hover: hover) { .star:hover { transform: scale(1.12); } }
        .nps { display: grid; grid-template-columns: repeat(11, 1fr); gap: 5px; }
        .nps-btn { aspect-ratio: 1; min-height: 42px; border: 1px solid var(--arena); background: #fff; border-radius: 10px; font-family: var(--mono); font-size: 14px; font-weight: 500; color: var(--lagoon); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s, border-color 0.15s, transform 0.12s; padding: 0; }
        .nps-btn.on { background: var(--lagoon); border-color: var(--lagoon); color: var(--crema); }
        .nps-ends { display: flex; justify-content: space-between; margin-top: 12px; font-size: 12px; color: var(--oliva); }
        @media (max-width: 400px) { .nps { gap: 4px; } .nps-btn { font-size: 12px; min-height: 34px; border-radius: 8px; } }
        textarea { width: 100%; border: 1px solid var(--arena); border-radius: 12px; background: #fff; padding: 14px; font-family: inherit; font-size: 15px; color: var(--lagoon); resize: vertical; min-height: 120px; line-height: 1.55; }
        textarea:focus { outline: none; border-color: var(--duna); box-shadow: 0 0 0 3px rgba(209, 135, 48, 0.18); }
        textarea.sm { min-height: 80px; }
        .check { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; padding: 4px 0; }
        .check :global(input) { position: absolute; opacity: 0; width: 0; height: 0; }
        .box { margin-top: 1px; flex-shrink: 0; width: 22px; height: 22px; border: 1.5px solid var(--arena); border-radius: 6px; background: #fff; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .box :global(svg) { width: 14px; height: 14px; opacity: 0; transform: scale(0.5); transition: all 0.15s; color: #fff; }
        .check :global(input:checked) + .box { background: var(--forest); border-color: var(--forest); }
        .check :global(input:checked) + .box :global(svg) { opacity: 1; transform: none; }
        .label { font-size: 14px; line-height: 1.5; }
        .muted { color: var(--oliva); }
        .actions { margin-top: 24px; }
        .btn { width: 100%; border: none; border-radius: 999px; padding: 16px 24px; font-size: 16px; font-weight: 600; cursor: pointer; transition: transform 0.12s, background 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-lagoon { background: var(--lagoon); color: var(--crema); }
        .btn-duna { background: var(--duna); color: #fff; }
        .btn-ghost { background: none; color: var(--oliva); font-size: 14px; padding: 14px; margin-top: 4px; }
        .err { color: var(--arcilla, #c4724e); font-size: 14px; text-align: center; margin: 16px 0 0; }
        .section-list { display: flex; flex-direction: column; }
        .section-item { padding: 18px 0; border-bottom: 1px solid var(--arena); }
        .section-item:first-child { padding-top: 4px; }
        .section-item:last-child { border-bottom: none; padding-bottom: 4px; }
        .section-head { display: flex; align-items: center; gap: 12px; }
        .section-emoji { font-size: 22px; line-height: 1; flex-shrink: 0; width: 30px; text-align: center; }
        .section-name { font-size: 15px; font-weight: 600; flex: 1; line-height: 1.25; }
        .section-stars { margin-top: 12px; margin-left: 42px; }
        .comment-toggle { margin: 10px 0 0 42px; background: none; border: none; padding: 0; font-family: var(--mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--duna); cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
        .plus { font-size: 14px; }
        .section-comment { margin: 12px 0 0 42px; }
        .field { margin-top: 20px; }
        .field:first-child { margin-top: 0; }
        .field-label { font-size: 15px; font-weight: 600; margin: 0 0 10px; }
        #success { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 8px; animation: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        .success-mark { width: 72px; height: 72px; border-radius: 999px; background: var(--forest); display: flex; align-items: center; justify-content: center; color: var(--crema); margin-bottom: 28px; }
        .success-mark :global(svg) { width: 36px; height: 36px; }
        #success h1 { font-size: 28px; line-height: 1.15; font-weight: 700; letter-spacing: -0.4px; margin: 0 0 16px; max-width: 420px; }
        #success p { font-size: 16px; color: var(--oliva); line-height: 1.6; margin: 0; max-width: 380px; }
        .success-sign { margin-top: 36px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--oliva); }
        .success-sign strong { display: block; color: var(--lagoon); font-size: 13px; letter-spacing: 0.45em; margin-bottom: 6px; }
      `}</style>
    </div>
  );
}
