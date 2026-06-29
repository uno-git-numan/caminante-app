"use client";

// Encuesta de satisfacción — React del diseño "Caminante Encuesta" (Numan
// Caminante Design System / Claude Design, jun 2026). Re-skin del rebrand:
// progress con wordmark + "Paso X de 3" (Geist Mono), estrellas naranja/arena con
// media, NPS 0–10, paso 2 condicional, partes del paso 3 data-driven, consentimientos.
// La lógica real (submitFeedback con todos los campos) queda intacta.

import { useMemo, useState, useTransition } from "react";
import { submitFeedback } from "@/lib/feedback/actions";
import type { FeedbackContext, FeedbackInput, SectionRating } from "@/lib/feedback/types";

// Wordmark de Caminante (sello + palabra), recoloreado por CSS (.prog-logo .gN).
const G1 =
  '<g class="g1"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const G2 =
  '<g class="g2"><path d="M218.65,2.3c-8.09,0-14.64,6.56-14.64,14.64s6.56,14.64,14.64,14.64,14.64-6.56,14.64-14.64-6.56-14.64-14.64-14.64"/><path d="M276.91,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/><path d="M189.47,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/></g>';
const G3 =
  '<g class="g3"><path d="M335.23,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M422.67,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M412.31,114.57l-87.43-87.13c-5.72-5.72-5.72-14.99,0-20.71,5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const GW =
  '<g class="gw"><path d="M532.87,98.77c-4.27,4.6-9.41,6.89-15.42,6.89-5.69,0-10.45-1.75-14.27-5.25-3.83-3.5-6.73-8.56-8.7-15.18-1.97-6.62-2.95-14.68-2.95-24.2s.98-17.77,2.95-24.45c1.97-6.67,4.87-11.76,8.7-15.26,3.83-3.5,8.58-5.25,14.27-5.25s10.42,2.11,14.52,6.32c4.1,4.21,6.97,10.36,8.61,18.46l18.05-.98c-2.3-12.58-7.08-22.37-14.36-29.37-7.27-7-16.22-10.5-26.82-10.5-9.41,0-17.37,2.49-23.87,7.47-6.51,4.98-11.46,12-14.85,21.08-3.39,9.08-5.08,19.91-5.08,32.49s1.69,23.24,5.08,32.32c3.39,9.08,8.34,16.08,14.85,21,6.51,4.92,14.46,7.38,23.87,7.38,11.26,0,20.56-3.72,27.89-11.16,7.33-7.44,11.98-17.83,13.95-31.17l-17.88-.82c-1.42,8.86-4.27,15.59-8.53,20.18"/><path d="M636.87,72.84l14.54-52.34,14.54,52.34h-29.09ZM640.25,2.62l-34.13,116.49h17.88l8.43-30.35h37.93l8.43,30.35h17.88L662.57,2.62h-22.31Z"/><polygon points="784.88 77.66 766.51 2.62 743.54 2.62 743.54 119.11 760.11 119.11 760.11 29.17 778.32 105 791.45 105 809.66 29.17 809.66 119.11 826.23 119.11 826.23 2.62 803.26 2.62 784.88 77.66"/><polygon points="873.07 18.87 900.97 18.87 900.97 102.87 873.07 102.87 873.07 119.11 945.92 119.11 945.92 102.87 918.03 102.87 918.03 18.87 945.92 18.87 945.92 2.62 873.07 2.62 873.07 18.87"/><polygon points="1051.99 94.46 1013.77 2.62 992.77 2.62 992.77 119.11 1009.67 119.11 1009.67 27.28 1047.89 119.11 1068.89 119.11 1068.89 2.62 1051.99 2.62 1051.99 94.46"/><path d="M1146.48,72.84l14.54-52.34,14.54,52.34h-29.09ZM1149.87,2.62l-34.13,116.49h17.88l8.43-30.35h37.93l8.43,30.35h17.88l-34.13-116.49h-22.31Z"/><polygon points="1312.38 94.46 1274.15 2.62 1253.15 2.62 1253.15 119.11 1270.05 119.11 1270.05 27.28 1308.28 119.11 1329.28 119.11 1329.28 2.62 1312.38 2.62 1312.38 94.46"/><polygon points="1376.12 18.87 1410.25 18.87 1410.25 119.11 1427.31 119.11 1427.31 18.87 1461.44 18.87 1461.44 2.62 1376.12 2.62 1376.12 18.87"/><polygon points="1508.28 2.62 1508.28 119.11 1581.13 119.11 1581.13 102.87 1525.51 102.87 1525.51 68.58 1577.85 68.58 1577.85 52.83 1525.51 52.83 1525.51 18.87 1579.81 18.87 1579.81 2.62 1508.28 2.62"/></g>';
const WORD = `<svg viewBox="0 0 1581.13 121.74" role="img" aria-label="Caminante">${G1}${G2}${G3}${GW}</svg>`;

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
  const px = size === "big" ? 40 : 26;
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
              <svg width={px} height={px} viewBox="0 0 24 24" fill="currentColor"><path d={STAR_PATH} /></svg>
            </span>
            <span className="star-fg" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}>
              <svg width={px} height={px} viewBox="0 0 24 24" fill="currentColor"><path d={STAR_PATH} /></svg>
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
    <input
      type="checkbox"
      className="cb-input"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className={`box${checked ? " on" : ""}`} aria-hidden="true">
      {checked && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
    <span className="label">{children}</span>
  </label>
);

export default function FeedbackForm({
  ctx,
  initialStars = 0,
}: {
  ctx: FeedbackContext;
  initialStars?: number;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | "success">(1);
  // Pre-relleno desde el correo (cada estrella del email enlaza con ?s=N).
  const [overall, setOverall] = useState(initialStars);
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
    setSections((s) => {
      const prev: SectionRating = s[key] ?? { stars: 0 };
      return { ...s, [key]: { ...prev, ...patch } };
    });

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
          <div className="progress-meta">
            <span className="prog-logo" aria-label="Caminante" dangerouslySetInnerHTML={{ __html: WORD }} />
            <span className="eyebrow">Paso {step} de 3</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className="steps">
        {/* ── PASO 1 · El pulso ── */}
        {step === 1 && (
          <section className="step active">
            <h1 className="title display">
              Tu paso por{" "}
              <span className="lugar">{ctx.locationLabel.split(",")[0] || "Caminante"}</span>
            </h1>

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
                  <span>Nada probable</span>
                  <span>Muy probable</span>
                </div>
              </div>
            )}

            <div className="actions">
              <button className="btn btn-green btn-arrow" type="button" onClick={() => goTo(2)}>
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
                <h1 className="title display">
                  Nos llena <em className="ac">leerte.</em>
                </h1>
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
                <h1 className="title display">
                  Gracias por tu honestidad <em className="ac">— así crecemos.</em>
                </h1>
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
              <button className="btn btn-ghost" type="button" onClick={() => goTo(1)}>
                Volver
              </button>
              <button className="btn btn-green btn-arrow" type="button" onClick={() => goTo(3)}>
                Continuar
              </button>
            </div>
          </section>
        )}

        {/* ── PASO 3 · El detalle (opcional) ── */}
        {step === 3 && (
          <section className="step active">
            <h1 className="title display">
              ¿Nos ayudas con <em className="ac">el detalle?</em>
            </h1>
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
                        <div className="section-stars">
                          <Stars
                            size="compact"
                            value={sections[sec.key]?.stars ?? 0}
                            onChange={(v) => setSection(sec.key, { stars: v })}
                            ariaLabel={`Calificar: ${sec.label}`}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="comment-toggle"
                        onClick={() =>
                          setOpenComment((o) => ({ ...o, [sec.key]: !o[sec.key] }))
                        }
                      >
                        <span className="plus">{openComment[sec.key] ? "–" : "+"}</span>{" "}
                        {openComment[sec.key] ? "Quitar comentario" : "Agregar comentario"}
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
              <button className="btn btn-ghost" type="button" onClick={() => goTo(2)}>
                Volver
              </button>
              <button className="btn btn-orange" type="button" onClick={onSubmit} disabled={pending}>
                {pending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </section>
        )}

        {/* ── Cierre ── */}
        {step === "success" && (
          <section id="success" className="active">
            <div className="success-mark">✓</div>
            <h1 className="display">
              Gracias por caminar <em className="ac">con nosotros.</em>
            </h1>
            <p>
              {ctx.firstName ? `${ctx.firstName}, leemos ` : "Leemos "}cada respuesta. Lo que nos
              compartiste nos ayuda a cuidar mejor el lugar y a quienes vienen después.
            </p>
            <div className="success-sign">
              <strong>CAMINANTE</strong>
              Naturaleza en movimiento
            </div>
          </section>
        )}
      </div>

      <style jsx global>{`
        @font-face {
          font-family: "Geist Mono";
          src: url("/landing/assets/fonts/GeistMono-VariableFont_wght.ttf") format("truetype-variations");
          font-weight: 100 900; font-style: normal; font-display: swap;
        }
        .shell {
          --cream: #fbfbf7; --charcoal: #20211c; --olive: #637154; --olive-d: #4f5d44;
          --orange: #ff5d36; --sand: #b6ada5; --salvia: #d6d8c7; --dune: #c9b79c;
          --ink-soft: rgba(32, 33, 28, 0.6); --line: rgba(32, 33, 28, 0.13);
          --mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
          max-width: 520px; width: 100%; margin: 0 auto; min-height: 100vh; display: flex;
          flex-direction: column; padding: 30px 20px calc(48px + env(safe-area-inset-bottom));
          color: var(--charcoal); background: var(--cream); overflow-x: clip;
        }
        .progress { margin: 8px 0 26px; }
        .progress-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 14px; }
        .prog-logo { height: 19px; display: inline-flex; }
        .prog-logo svg { height: 100%; width: auto; display: block; }
        .prog-logo .g1 { fill: var(--olive); } .prog-logo .g2 { fill: var(--sand); }
        .prog-logo .g3 { fill: var(--orange); } .prog-logo .gw { fill: var(--charcoal); }
        .eyebrow { font-family: var(--mono); font-size: 12px; font-weight: 500; letter-spacing: 0.08em; color: var(--ink-soft); white-space: nowrap; }
        .progress-track { height: 4px; background: var(--salvia); border-radius: 999px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--olive); border-radius: 999px; transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1); }
        .steps { flex: 1; display: flex; flex-direction: column; }
        .step { display: flex; flex-direction: column; animation: rise 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both; padding-bottom: 40px; }
        @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .display { font-weight: 200; letter-spacing: -0.02em; line-height: 1.06; }
        em.ac { font-style: italic; color: var(--orange); font-weight: 300; }
        .title { font-size: clamp(27px, 7.5vw, 37px); margin: 8px 0 0; }
        .lugar { color: var(--orange); font-style: italic; font-weight: 300; }
        .subline { font-size: 14.5px; color: var(--ink-soft); line-height: 1.5; margin-top: 10px; }
        .card { background: #fff; border: 1px solid var(--line); border-radius: 18px; padding: 22px 20px; box-shadow: 0 8px 26px -22px rgba(32, 33, 28, 0.4); }
        .card + .card { margin-top: 16px; }
        .q { font-size: 18px; font-weight: 500; line-height: 1.35; margin: 0 0 5px; }
        .q-sub { font-size: 14px; color: var(--ink-soft); line-height: 1.5; margin: 0 0 16px; }
        .stars { display: flex; gap: 4px; }
        .stars.big { gap: 4px; }
        .star { position: relative; background: none; border: none; padding: 6px 3px; cursor: pointer; line-height: 0; transition: transform 0.12s ease; -webkit-tap-highlight-color: transparent; }
        .star svg { display: block; }
        .star-base { color: var(--sand); }
        .star-fg { position: absolute; top: 6px; left: 3px; color: var(--orange); transition: clip-path 0.12s ease; }
        .star:active { transform: scale(0.9); }
        @media (hover: hover) { .star:hover { transform: scale(1.1); } }
        .nps { display: grid; grid-template-columns: repeat(11, minmax(0, 1fr)); gap: 5px; width: 100%; }
        .nps-btn { min-width: 0; min-height: 48px; border: 1px solid var(--line); background: #fff; border-radius: 10px; font-size: 15px; font-weight: 500; color: var(--charcoal); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s, border-color 0.15s, transform 0.1s; padding: 0; }
        .nps-btn.on { background: var(--orange); border-color: var(--orange); color: #fff; }
        .nps-ends { display: flex; justify-content: space-between; margin-top: 10px; font-size: 11.5px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-soft); font-weight: 600; }
        @media (max-width: 380px) { .nps { gap: 3px; } .nps-btn { font-size: 13px; min-height: 40px; border-radius: 8px; } }
        textarea { width: 100%; border: 1px solid var(--line); border-radius: 14px; background: var(--cream); padding: 14px; font-family: inherit; font-size: 16px; color: var(--charcoal); resize: vertical; min-height: 120px; line-height: 1.5; }
        textarea:focus { outline: none; border-color: var(--olive); box-shadow: 0 0 0 3px rgba(99, 113, 84, 0.18); }
        textarea::placeholder { color: rgba(32, 33, 28, 0.38); }
        textarea.sm { min-height: 84px; }
        .check { display: flex; align-items: flex-start; gap: 11px; cursor: pointer; margin-top: 16px; font-size: 14.5px; line-height: 1.45; }
        .cb-input { position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0; }
        .box { margin-top: 1px; flex-shrink: 0; width: 20px; height: 20px; border: 1.5px solid var(--sand); border-radius: 6px; background: #fff; color: #fff; display: flex; align-items: center; justify-content: center; transition: background 0.15s, border-color 0.15s; }
        .box.on { background: var(--olive); border-color: var(--olive); }
        .label { font-size: 14.5px; line-height: 1.45; }
        .muted { color: var(--ink-soft); }
        .actions { display: flex; gap: 12px; margin-top: 30px; }
        .btn { flex: 1; border: 1px solid transparent; border-radius: 999px; min-height: 54px; padding: 0 22px; font-size: 16px; font-weight: 500; cursor: pointer; transition: transform 0.1s, background 0.2s, color 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5em; font-family: inherit; }
        .btn:active { transform: translateY(1px); }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-green { background: var(--olive); color: #fff; }
        .btn-orange { background: var(--orange); color: #fff; }
        .btn-ghost { flex: 0 0 auto; background: transparent; color: var(--olive); border-color: var(--line); }
        .btn-arrow::after { content: "→"; }
        .err { color: #c43d2a; font-size: 14px; text-align: center; margin: 16px 0 0; }
        .section-list { display: flex; flex-direction: column; }
        .section-item { padding: 14px 0; border-top: 1px solid var(--line); }
        .section-item:first-child { border-top: none; padding-top: 2px; }
        .section-head { display: flex; align-items: center; gap: 12px; }
        .section-emoji { width: 30px; height: 30px; border-radius: 9px; background: var(--salvia); color: var(--olive); display: flex; align-items: center; justify-content: center; font-size: 14px; line-height: 1; flex: 0 0 auto; }
        .section-name { font-size: 15.5px; font-weight: 500; flex: 1; min-width: 0; line-height: 1.25; }
        .section-stars { flex: 0 0 auto; }
        .comment-toggle { margin: 8px 0 0 42px; background: none; border: none; padding: 0; font-size: 13.5px; font-weight: 500; color: var(--olive); cursor: pointer; display: inline-flex; align-items: center; gap: 0.4em; }
        .comment-toggle:hover { color: var(--olive-d); }
        .plus { font-size: 15px; }
        .section-comment { margin: 10px 0 0 42px; }
        .section-comment textarea { min-height: 62px; }
        .field { margin-top: 18px; }
        .field:first-child { margin-top: 0; }
        .field-label { font-size: 16px; font-weight: 500; margin: 0 0 10px; }
        @media (max-width: 380px) { .section-stars { padding-left: 42px; } .section-head { flex-wrap: wrap; } }
        #success { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 8px; min-height: 74vh; animation: rise 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
        .success-mark { width: 70px; height: 70px; border-radius: 999px; background: var(--salvia); display: flex; align-items: center; justify-content: center; color: var(--olive); font-size: 30px; margin-bottom: 26px; }
        #success h1 { font-size: clamp(30px, 8vw, 42px); line-height: 1.06; margin: 0 0 16px; max-width: 14ch; }
        #success p { font-size: 17px; color: var(--ink-soft); line-height: 1.6; margin: 0; max-width: 34ch; }
        .success-sign { margin-top: 36px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--ink-soft); }
        .success-sign strong { display: block; color: var(--charcoal); font-size: 13px; letter-spacing: 0.45em; margin-bottom: 6px; }
      `}</style>
    </div>
  );
}
