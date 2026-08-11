"use client";

// Átomos del sitio público móvil — transcritos 1:1 de design/publico-movil/pub-core.jsx.
//
// Dos cambios respecto al entregable, ambos por el mismo motivo (la demo es una
// pila de React sin URLs y el sitio real sí las tiene):
//   · `nav.push(id)` / `nav.pop()` → <Link href> y el back del router.
//   · El sello sale de /landing/assets/logos/*.svg (en el repo son SVG, no PNG).
//
// El marcado y las clases NO se tocan: el CSS extraído los espera tal cual.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

export const Eyeb = ({ neg, children }: { neg?: boolean; children: ReactNode }) => (
  <span className={"pub-eyebrow" + (neg ? " neg" : "")}>
    <span className="sl">{"//"}</span> {children}
  </span>
);

export const Sec = ({
  id,
  sx,
  children,
  style,
}: {
  id?: string;
  sx?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}) => (
  <div className="pub-sec" id={id} data-sx={sx} style={style}>
    {children}
  </div>
);

export const Brand = ({ oncream }: { oncream?: boolean }) => (
  <Link className="brand" href="/caminante" aria-label="Inicio">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      className="lockup"
      src={oncream ? "/landing/assets/logos/caminante-logo.svg" : "/landing/assets/logos/caminante-logo-white.svg"}
      alt="NMN Caminante"
    />
  </Link>
);

const IcoBack = (
  <svg width="9" height="16" viewBox="0 0 9 16" fill="none">
    <path d="M8 1L1.5 8 8 15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IcoMenu = (
  <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
    <path d="M1 1h16M1 7h16M1 13h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

/**
 * Cabecera flotante: transparente sobre el hero y crema al scrollear.
 *
 * Escucha el scroll de `.pub-scroll` (el contenedor con overflow del shell),
 * NO el de la ventana — es lo que le da el comportamiento de app.
 */
export function HeadFloat({
  back,
  backLabel,
  backHref,
  oncream,
  right,
  onMenu,
}: {
  back?: boolean;
  backLabel?: string;
  /** A dónde regresa. Sin esto usa el back del navegador. */
  backHref?: string;
  oncream?: boolean;
  right?: ReactNode;
  onMenu?: () => void;
}) {
  const [sc, setSc] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cont = el.closest(".pub-scroll");
    if (!cont) return;
    const onScroll = () => {
      const scr = el.closest(".pub-screen");
      const hero = scr && (scr.querySelector(".pub-hero") as HTMLElement | null);
      const th = hero && hero.offsetTop < 120 ? Math.max(hero.offsetHeight - 72, 60) : 8;
      setSc(cont.scrollTop > th);
    };
    onScroll();
    cont.addEventListener("scroll", onScroll, { passive: true });
    return () => cont.removeEventListener("scroll", onScroll);
  }, []);

  const on = oncream || sc;
  const volver = () => (backHref ? router.push(backHref) : router.back());
  const menu = (
    <button className="hbtn" aria-label="Menú" onClick={onMenu}>
      {IcoMenu}
    </button>
  );

  if (backLabel) {
    return (
      <header ref={ref} className={"pub-head flexh" + (on ? " oncream" : "") + (sc ? " scrolled" : "")}>
        <button className="hbtn lblb" aria-label="Regresar" onClick={volver}>
          {IcoBack}
          <span>{backLabel}</span>
        </button>
        {right || menu}
      </header>
    );
  }

  return (
    <header
      ref={ref}
      className={"pub-head" + (on ? " oncream" : "") + (back ? " hasback" : "") + (sc ? " scrolled" : "")}
    >
      {back && (
        <button className="hbtn l" aria-label="Regresar" onClick={volver}>
          {IcoBack}
        </button>
      )}
      <Brand oncream={on} />
      {right || menu}
    </header>
  );
}

export function NavCream({ t, s, backHref }: { t: string; s?: string; backHref?: string }) {
  const router = useRouter();
  return (
    <div className="pub-nav">
      <button className="bk" onClick={() => (backHref ? router.push(backHref) : router.back())}>
        ‹
      </button>
      <div className="tt">
        <b>{t}</b>
        <small>{s}</small>
      </div>
    </div>
  );
}

/**
 * Testimonio. ⚠️ La firma va con INICIALES, nunca con el nombre completo — es
 * la regla de `initialsOf` en lib/operators/public.ts, y solo se publica con
 * `publish_status='approved'` y `testimonial_consent=true`.
 */
export const Testi = ({ texto, firma }: { texto: string; firma: string }) => (
  <div className="pub-testi">
    <p>{texto}</p>
    <small>{firma} · testimonio publicado con consentimiento</small>
  </div>
);

/**
 * Calificación de una experiencia.
 *
 * ⚠️ Va SIEMPRE sobre fondo claro, **nunca encima de la foto** (Luis, 11 ago:
 * «en la app el fondo naranja se pierde con la foto»). Es el mismo tratamiento
 * del sitio de escritorio, que sí se lee: la estrella y el número en naranja
 * sobre crema, el conteo en olivo al lado.
 *
 * Los estilos van en línea, igual que en `public/landing/assets/exp-grid.js`,
 * para no meter reglas nuevas en la hoja extraída de Claude Design.
 *
 * El promedio es POR EXPERIENCIA, no por salida (decisión de Luis).
 */
export const Estrellas = ({
  stars,
  count,
  style,
}: {
  stars: number;
  count: number;
  style?: React.CSSProperties;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 7, lineHeight: 1, ...style }}>
    <span style={{ color: "var(--orange)", fontWeight: 600, fontSize: 14 }}>
      ★ {stars.toFixed(1).replace(".", ",")}
    </span>
    <span style={{ color: "var(--olive)", fontSize: 12.5 }}>
      {count === 1 ? "1 opinión" : `${count} opiniones`}
    </span>
  </div>
);

export const TabIcons: Record<string, ReactNode> = {
  inicio: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3.5 9.5L11 3l7.5 6.5V18a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 18V9.5z" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  experiencias: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M4 17.5L9 5l4 8 2.5-4.5L19 17.5H4z" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  calendario: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="4.5" width="16" height="14" rx="3" strokeWidth="1.75" />
      <path d="M3 9h16M7.5 2.75v3.5M14.5 2.75v3.5" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  aprende: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 5.5C9.5 4 7.2 3.5 4.5 3.5c-.6 0-1 .45-1 1v11c0 .55.4 1 1 1 2.7 0 5 .5 6.5 2 1.5-1.5 3.8-2 6.5-2 .6 0 1-.45 1-1v-11c0-.55-.4-1-1-1-2.7 0-5 .5-6.5 2z" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M11 5.5v13" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
  espacio: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="8" r="3.5" strokeWidth="1.75" />
      <path d="M4.5 19c.9-3.4 3.4-5 6.5-5s5.6 1.6 6.5 5" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  ),
};
