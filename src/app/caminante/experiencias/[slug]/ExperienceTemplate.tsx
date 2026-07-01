"use client";

import { Fragment, useEffect } from "react";
import { templateCss } from "@/lib/experiences/template-assets";
import { emptyExperience } from "@/lib/experiences/empty";
import type { Experience } from "@/lib/experiences/types";

// Minimal inline formatter: **bold** and *italic*, matching the static design's <strong>/<em>.
function fmt(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) out.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    else out.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// Render a string with "\n" as <br/> line breaks.
function lines(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i, arr) => (
    <Fragment key={i}>
      {line}
      {i < arr.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

export default function ExperienceTemplate({ experience: raw }: { experience: Experience }) {
  // Fallback legacy (las experiencias nuevas son páginas estáticas). El contenido
  // rico es opcional → rellenamos con defaults para que la plantilla data-driven
  // NUNCA truene si faltan campos; las secciones sin datos quedan vacías, no rompen.
  // emptyExperience() rellena TODOS los arrays/objetos de contenido, así que tras el
  // merge están presentes aunque en el tipo sean opcionales → los aseguramos para que
  // el template (que hace .map directo) tipe sin guards por línea.
  const e = { ...emptyExperience(), ...raw } as Experience &
    Required<
      Pick<
        Experience,
        | "heroMeta"
        | "context"
        | "lenses"
        | "vivir"
        | "aliados"
        | "itinerario"
        | "impactoBody"
        | "incluye"
        | "noIncluye"
        | "mochila"
        | "cancelacion"
        | "faq"
        | "metaNote"
        | "datesBadge"
      >
    >;
  const wa = `https://wa.me/${e.whatsapp}`;
  const mailto = `mailto:${e.email}`;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("no-js");
    root.classList.add("js");

    // scroll reveal
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    // FAQ accordion
    const accHandlers: Array<{ btn: Element; fn: () => void }> = [];
    document.querySelectorAll<HTMLButtonElement>(".acc-q").forEach((btn) => {
      const fn = () => {
        const item = btn.closest(".acc-item");
        if (!item) return;
        const ans = item.querySelector<HTMLElement>(".acc-a");
        if (!ans) return;
        if (item.classList.contains("open")) {
          item.classList.remove("open");
          ans.style.maxHeight = "";
        } else {
          item.classList.add("open");
          ans.style.maxHeight = ans.scrollHeight + "px";
        }
      };
      btn.addEventListener("click", fn);
      accHandlers.push({ btn, fn });
    });

    // four-lens chip bar
    const chips = Array.from(document.querySelectorAll<HTMLElement>(".chip"));
    const lensEls = Array.from(document.querySelectorAll<HTMLElement>(".lens"));
    const chipHandlers: Array<{ chip: Element; fn: () => void }> = [];
    chips.forEach((chip) => {
      const fn = () => {
        const el = document.getElementById("lens-" + chip.dataset.lens);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      chip.addEventListener("click", fn);
      chipHandlers.push({ chip, fn });
    });
    const setActiveChip = (lens?: string) =>
      chips.forEach((c) => c.classList.toggle("active", c.dataset.lens === lens));
    const lensIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveChip((entry.target as HTMLElement).dataset.lens);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    lensEls.forEach((l) => lensIO.observe(l));

    // nav hide on scroll + dark theme over dark sections
    const nav = document.getElementById("nav");
    const NAVH = 62;
    const darkSections = Array.from(
      document.querySelectorAll<HTMLElement>("#caras,#impacto,#reserva")
    );
    let lastY = 0;
    const updateNav = () => {
      if (!nav) return;
      const y = window.scrollY;
      nav.style.transform = y > 600 && y > lastY ? "translateY(-100%)" : "translateY(0)";
      lastY = y;
      let dark = false;
      for (const s of darkSections) {
        const r = s.getBoundingClientRect();
        if (r.top <= NAVH + 1 && r.bottom > NAVH + 1) {
          dark = true;
          break;
        }
      }
      nav.classList.toggle("on-dark", dark);
    };
    window.addEventListener("scroll", updateNav, { passive: true });
    updateNav();

    return () => {
      io.disconnect();
      lensIO.disconnect();
      window.removeEventListener("scroll", updateNav);
      accHandlers.forEach(({ btn, fn }) => btn.removeEventListener("click", fn));
      chipHandlers.forEach(({ chip, fn }) => chip.removeEventListener("click", fn));
    };
  }, [e.slug]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: templateCss }} />

      <div className="edge left">{e.edgeLabel}</div>
      <div className="edge right">{e.coords}</div>

      {/* NAV */}
      <nav className="nav" id="nav">
        <a href="#top" className="brand">
          Caminante<small>{e.brandSmall}</small>
        </a>
        <div className="nav-links">
          <a href="#contexto">Contexto</a>
          <a href="#caras">Cuatro Caras</a>
          <a href="#experiencia">Experiencia</a>
          <a href="#aliados">Aliados</a>
          <a href="#itinerario">Itinerario</a>
          <a href="#paquete">Paquete</a>
          <a href="#practico">Inversión</a>
        </div>
        <a href={wa} className="nav-cta" target="_blank" rel="noopener">
          Reservar
        </a>
      </nav>

      {/* HERO */}
      <header className="hero" id="top">
        <div className="bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.heroImageUrl} alt={e.heroImageAlt ?? ""} fetchPriority="high" />
        </div>
        <div className="wrap hero-top">
          <span className="label">Experiencia Caminante</span>
          <span className="label">{e.vol}</span>
        </div>
        <div className="wrap hero-inner">
          <h1>
            {e.title}
            <br />
            <span className="ital">{e.titleAccent}</span>
          </h1>
          <p className="sub">{e.subtitle}</p>
          <div className="hero-meta">
            {e.heroMeta.map((m, i) => (
              <div className="item" key={i}>
                <div className="k">{m.k}</div>
                <div className="v">{lines(m.v)}</div>
              </div>
            ))}
          </div>
          <div className="hero-actions">
            <a href={wa} className="btn btn-primary" target="_blank" rel="noopener">
              Reservar por WhatsApp →
            </a>
            <a href="#itinerario" className="btn btn-ghost">
              Ver itinerario
            </a>
          </div>
        </div>
        <div className="scroll-hint">
          <span>Scroll</span>
          <span className="line"></span>
        </div>
      </header>

      {/* CAP 01 — CONTEXTO */}
      <section className="chapter wrap" id="contexto">
        <div className="ctx-head reveal">
          <div>
            <div className="chapter-tag">{e.contextTag}</div>
            <h2 className="display" style={{ marginTop: 22 }}>
              {e.contextTitle} <span className="ital">{e.contextTitleAccent}</span>
            </h2>
          </div>
          <p className="lead">{e.contextLead}</p>
        </div>
        <div className="ctx-band reveal">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.contextBandImageUrl} alt={e.contextBandCaption} />
          <div className="cap">{e.contextBandCaption}</div>
        </div>
        <div className="numlist">
          {e.context.map((c) => (
            <div className="numitem reveal" key={c.no}>
              <div className="no">{c.no}</div>
              <div className="stem"></div>
              <div className="arrow">↓</div>
              <h4>{c.title}</h4>
              <div className="sub">{c.sub}</div>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CUATRO CARAS */}
      <section className="caras" id="caras">
        <div className="intro reveal">
          <div className="chapter-tag">Las cuatro caras de la moneda</div>
          <h2 style={{ marginTop: 22 }}>
            {e.carasTitle} <span className="ital">{e.carasTitleAccent}</span>
          </h2>
          <p>{e.carasIntro}</p>
        </div>
        <div className="chipbar" id="chipbar">
          <div className="chipbar-inner">
            {e.lenses.map((l) => (
              <button className="chip" data-lens={l.key} key={l.key}>
                <span className="dot"></span>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        {e.lenses.map((l) => (
          <article className="lens" data-lens={l.key} id={`lens-${l.key}`} key={l.key}>
            <div className="text">
              <div className="lens-no">{l.caraNo}</div>
              <div className="lens-label">
                <span className="dot"></span>
                {l.label}
              </div>
              <h3>{l.title}</h3>
              <p>{fmt(l.body)}</p>
              <div className="facts">
                {l.facts.map((f, i) => (
                  <div className="f" key={i}>
                    <div className="n">{f.n}</div>
                    <div className="l">{f.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.imageUrl} alt={l.imageAlt ?? ""} />
            </div>
          </article>
        ))}
      </section>

      {/* CAP 02 — EXPERIENCIA */}
      <section className="chapter" id="experiencia">
        <div className="wrap ctx-head reveal" style={{ marginBottom: 48 }}>
          <div>
            <div className="chapter-tag">{e.vivirTag}</div>
            <h2 className="display" style={{ marginTop: 22 }}>
              {e.vivirTitle} <span className="ital">{e.vivirTitleAccent}</span>
            </h2>
          </div>
          <p className="lead">{e.vivirLead}</p>
        </div>
        <div className="wrap" style={{ maxWidth: 1180 }}>
          {e.vivir.map((v) => (
            <div className="exp-item reveal" key={v.num}>
              <div className="media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.imageUrl} alt={v.imageAlt ?? ""} />
              </div>
              <div className="copy">
                <div className="num">{v.num}</div>
                <span className="pill">{v.pill}</span>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CAP 03 — ALIADOS */}
      <section className="chapter wrap" id="aliados">
        <div className="ctx-head reveal" style={{ marginBottom: 44 }}>
          <div>
            <div className="chapter-tag">{e.aliadosTag}</div>
            <h2 className="display" style={{ marginTop: 22 }}>
              {e.aliadosTitle} <span className="ital">{e.aliadosTitleAccent}</span>
            </h2>
          </div>
          <p className="lead">{e.aliadosLead}</p>
        </div>
        <div className="aliados-grid reveal">
          {e.aliados.map((a, i) => (
            <div className="ally" key={i}>
              <div className="role">{a.role}</div>
              <h3>{a.name}</h3>
              <p>{a.body}</p>
              <div className="people">
                <div className="pl">{a.peopleLabel}</div>
                <div className="pn">{a.people}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CAP 04 — ITINERARIO */}
      <section className="chapter wrap" id="itinerario">
        <div className="ctx-head reveal" style={{ marginBottom: 8 }}>
          <div>
            <div className="chapter-tag">{e.itinerarioTag}</div>
            <h2 className="display" style={{ marginTop: 22 }}>
              {e.itinerarioTitle}
            </h2>
          </div>
          <p className="lead">{e.itinerarioLead}</p>
        </div>
        <div className="timeline reveal">
          {e.itinerario.map((d, i) => (
            <div className="day" key={i}>
              <div className="dno">{d.dno}</div>
              <div className="dname">{d.dname}</div>
              {d.beats.map((b, j) => (
                <div className="beat" key={j}>
                  <div className="t">{b.t}</div>
                  <div className="d">{b.d}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* CAP 05 — IMPACTO */}
      <section className="band impact" id="impacto">
        <div className="bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.impactoImageUrl} alt={e.impactoImageAlt ?? ""} />
        </div>
        <div className="band-inner reveal">
          <div className="chapter-tag">{e.impactoTag}</div>
          <h2 style={{ marginTop: 22 }}>
            {e.impactoTitle} <span className="ital">{e.impactoTitleAccent}</span>
          </h2>
          {e.impactoBody.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div className="label" style={{ marginTop: 30 }}>
            {e.impactoLabel}
          </div>
        </div>
      </section>

      {/* CAP 06 — PAQUETE */}
      <section className="chapter wrap" id="paquete">
        <div className="ctx-head reveal" style={{ marginBottom: 8 }}>
          <div>
            <div className="chapter-tag">{e.paqueteTag}</div>
            <h2 className="display" style={{ marginTop: 22 }}>
              {e.paqueteTitle} <span className="ital">{e.paqueteTitleAccent}</span>
            </h2>
          </div>
          <p className="lead">{e.paqueteLead}</p>
        </div>
        <div className="pak reveal">
          <div className="pak-col inc">
            <div className="hd">Incluye</div>
            <h3>Qué incluye.</h3>
            <ul>
              {e.incluye.map((item, i) => (
                <li key={i}>
                  <span className="mk">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pak-col exc">
            <div className="hd">No incluye</div>
            <h3>Qué no incluye.</h3>
            <ul>
              {e.noIncluye.map((item, i) => (
                <li key={i}>
                  <span className="mk">−</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CAP 07 — MOCHILA */}
      <section className="chapter wrap" id="mochila" style={{ background: "var(--paper-2)" }}>
        <div className="ctx-head reveal" style={{ marginBottom: 8 }}>
          <div>
            <div className="chapter-tag">{e.mochilaTag}</div>
            <h2 className="display" style={{ marginTop: 22 }}>
              {e.mochilaTitle} <span className="ital">{e.mochilaTitleAccent}</span>
            </h2>
          </div>
          <p className="lead">{e.mochilaLead}</p>
        </div>
        <div className="moch-grid reveal">
          {e.mochila.map((cat, i) => (
            <div className="moch-cat" key={i}>
              <div className="ct">{cat.title}</div>
              <ul>
                {cat.items.map((it, j) => (
                  <li className={it.must ? "must" : undefined} key={j}>
                    {it.text}
                    {it.req ? <span className="req">{it.req}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="moch-note reveal">
          <div className="label">Nota importante</div>
          <p>{e.mochilaNote}</p>
        </div>
      </section>

      {/* CAP 08 — PRACTICO */}
      <section className="chapter wrap" id="practico">
        <div className="ctx-head reveal" style={{ marginBottom: 8 }}>
          <div>
            <div className="chapter-tag">{e.practicoTag}</div>
            <h2 className="display" style={{ marginTop: 22 }}>
              {e.practicoTitle} <span className="ital">{e.practicoTitleAccent}</span>
            </h2>
          </div>
          <p className="lead">{e.practicoLead}</p>
        </div>
        <div className="prac-grid">
          {e.price ? (
            <aside className="cost-panel reveal">
              <div className="label">Inversión por persona</div>
              <div className="big">{e.price.amount}</div>
              <div className="cur">{e.price.currency}</div>
              <p className="desc">{e.price.desc}</p>
              <div className="cancel">
                <div className="ct">Políticas de cancelación</div>
                {e.cancelacion.map((c, i) => (
                  <div className="row" key={i}>
                    <span>{c.label}</span>
                    <span>{c.val}</span>
                  </div>
                ))}
              </div>
            </aside>
          ) : null}
          <div className="faq reveal">
            <div className="label">Preguntas frecuentes</div>
            <h3>Antes de reservar.</h3>
            <div className="acc">
              {e.faq.map((f, i) => (
                <div className="acc-item" key={i}>
                  <button className="acc-q">
                    {f.q}
                    <span className="ic"></span>
                  </button>
                  <div className="acc-a">
                    <div className="inner">{f.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CAP 09 — RESERVA */}
      <section className="reserva" id="reserva">
        <div className="bg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.reservaImageUrl} alt={e.reservaImageAlt ?? ""} />
        </div>
        <div className="reserva-inner reveal">
          <div className="chapter-tag">{e.reservaTag}</div>
          <h2 style={{ marginTop: 22 }}>
            {e.reservaTitle} <span className="ital">{e.reservaTitleAccent}</span>
          </h2>
          <div className="dates-badge">
            <span className="label" style={{ letterSpacing: ".24em" }}>
              {e.datesBadge.label}
            </span>
            <span className="big">{e.datesBadge.big}</span>
            <span style={{ fontSize: "1.2rem" }}>{e.datesBadge.rest}</span>
          </div>
          <div className="contact-grid">
            <a className="ci" href={mailto}>
              <div className="k">Correo</div>
              <div className="v">{e.email}</div>
            </a>
            <a className="ci" href={wa} target="_blank" rel="noopener">
              <div className="k">WhatsApp</div>
              <div className="v">+{e.whatsapp.replace(/^(\d{2})(\d{2})(\d{4})(\d{4})$/, "$1 $2 $3 $4")}</div>
            </a>
            <a className="ci" href={`https://instagram.com/${e.instagram}`} target="_blank" rel="noopener">
              <div className="k">Redes · Instagram</div>
              <div className="v">@{e.instagram}</div>
            </a>
          </div>
          <div className="reserva-actions">
            <a href={wa} className="btn btn-primary" target="_blank" rel="noopener">
              Reservar por WhatsApp →
            </a>
            <a href={mailto} className="btn btn-ghost">
              Escribir un correo
            </a>
          </div>
          <p style={{ maxWidth: "54ch", marginTop: 30, color: "rgba(245,240,232,.8)", fontSize: 15 }}>
            {e.reservaNote}
          </p>
          <div className="meta-note">
            {e.metaNote.map((n, i) => (
              <span key={i}>{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="foot">
        <div className="foot-inner">
          <div>
            <div className="brand">{e.footerBrand}</div>
            <small>{e.footerSmall}</small>
          </div>
          <div className="right">{e.footerRight}</div>
        </div>
      </footer>

      <a href={wa} className="wa-mobile" target="_blank" rel="noopener">
        Reservar por WhatsApp →
      </a>
    </>
  );
}
