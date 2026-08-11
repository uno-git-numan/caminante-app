"use client";

// Las piezas CLIENTE de la vista móvil de la experiencia (PubExp).
//
// Dos cosas del entregable necesitan navegador y por eso viven aquí:
//   · el riel flotante de secciones (`.pub-rail-f`), que se enciende al
//     scrollear y marca en qué sección vas;
//   · la barra de compra fija (`.pub-buybar`).
//
// Las dos se PORTAN a `.pub-app` — igual que el `ReactDOM.createPortal` del
// mockup (pub-a.jsx:240) — porque su CSS es `position:absolute` contra ese
// contenedor. Si vivieran dentro de `.pub-scroll` se irían con el scroll.

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { HeadFloat } from "@/app/caminante/ui/pub/atoms";
import { usePubUI } from "@/app/caminante/ui/pub/PubShell";

/** Cabecera flotante con el menú del shell cableado. */
export function ExpHead() {
  const ui = usePubUI();
  // Regreso SIEMPRE visible y SIEMPRE dentro del sitio (regla app-first): esta
  // página recibe tráfico directo de redes, donde `router.back()` saldría de
  // Caminante. El padre es el índice de experiencias.
  return <HeadFloat back backHref="/caminante/experiencias" onMenu={() => ui.abrirHoja("menu")} />;
}

export type BuyBar = {
  precio: string;
  sub: string;
  href: string;
  cta: string;
};

export function ExpChrome({ secs, buy }: { secs: string[]; buy: BuyBar }) {
  const ancla = useRef<HTMLSpanElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [idx, setIdx] = useState(0);
  const [vis, setVis] = useState(false);
  const tm = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHost((ancla.current?.closest(".pub-app") as HTMLElement | null) ?? null);
  }, []);

  useEffect(() => {
    if (!host) return;
    const cont = host.querySelector(".pub-scroll");
    if (!cont) return;
    const onScroll = () => {
      const els = Array.from(cont.querySelectorAll<HTMLElement>("[data-sx]"));
      const st = cont.scrollTop + 220;
      let k = 0;
      for (const el of els) {
        if (el.offsetTop <= st) k = Math.max(k, parseInt(el.dataset.sx || "0", 10));
      }
      setIdx(k);
      setVis(true);
      if (tm.current) clearTimeout(tm.current);
      tm.current = setTimeout(() => setVis(false), 1300);
    };
    cont.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (tm.current) clearTimeout(tm.current);
      cont.removeEventListener("scroll", onScroll);
    };
  }, [host]);

  const irA = (i: number) => {
    const cont = host?.querySelector(".pub-scroll");
    const el = cont?.querySelector<HTMLElement>(`[data-sx="${i}"]`);
    if (!cont || !el) return;
    if (el.tagName === "DETAILS") (el as HTMLDetailsElement).open = true;
    cont.scrollTo({ top: Math.max(el.offsetTop - 64, 0), behavior: "smooth" });
  };

  return (
    <>
      <span ref={ancla} hidden />
      {host
        ? createPortal(
            <>
              <div className={"pub-rail-f" + (vis ? " vis" : "")}>
                <span className="cnt">{secs.length} secciones</span>
                {secs.map((s, i) => (
                  <button key={i} className={i === idx ? "on" : ""} onClick={() => irA(i)}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="pub-buybar">
                <div className="p">
                  <b>{buy.precio}</b>
                  <small>{buy.sub}</small>
                </div>
                <Link className="pub-cta pub-cta-orange" href={buy.href}>
                  {buy.cta}
                </Link>
              </div>
            </>,
            host,
          )
        : null}
    </>
  );
}
