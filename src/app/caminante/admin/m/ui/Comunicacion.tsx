"use client";

// COMUNICACIÓN — transcrita de `ScrComunicacion` (adm-screens-c.jsx): la cola
// global de redes en Lista o Calendario, y abajo un desplegable por evento.
//
// Los datos son los MISMOS del escritorio: `listRecentPosts` para la cola y
// `fetchEventos` para los eventos (adaptador: lib/admin/movil/mas.ts). La hora
// que se muestra de una PROGRAMADA es la real del cron (~1:00 p.m.), no la
// normalizada a las 2 a.m. que solo marca el día.
//
// Lo que el entregable traía y aquí NO va:
//   · «Reintentar» en una pieza fallida: no existe esa acción en el sistema
//     (el publicador ya reintenta solo hasta 3 veces y luego marca `failed`).
//     Inventar una escritura nueva está prohibido, así que el botón se omite.
//   · Los meses y los puntos del calendario eran fijos en el mockup; aquí el
//     mes se navega y cada punto sale de la cola real y de las salidas abiertas.

import { useState } from "react";
import { cancelarPost } from "@/lib/social/publish-actions";
import type { ColaMovil, MasMovil } from "@/lib/admin/movil/mas";
import type { Nav, Ui } from "./AppShell";
import { Chip, Empty, Gap, Life, NavBar, Seg, Sub } from "./kit";

const GRUPOS: [string, ColaMovil["estado"]][] = [
  ["Programadas", "programada"],
  ["Falló", "falló"],
  ["Publicadas", "publicada"],
];

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// "2026-08-11" → "mar 11". Se arma a mediodía UTC y se lee en UTC: así el día
// no se corre por zona horaria.
function diaLabel(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return dia;
  const sem = d.toLocaleDateString("es-MX", { weekday: "short", timeZone: "UTC" }).replace(".", "");
  return `${sem} ${d.getUTCDate()}`;
}

const hoyCdmx = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export default function Comunicacion({ d, nav, ui }: { d: MasMovil; nav: Nav; ui: Ui }) {
  const [vista, setVista] = useState("Lista");
  const hoy = hoyCdmx();
  const [cursor, setCursor] = useState(() => ({ y: Number(hoy.slice(0, 4)), m: Number(hoy.slice(5, 7)) - 1 }));

  const mover = (n: number) =>
    setCursor((c) => {
      const t = c.m + n;
      return { y: c.y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
    });

  const primero = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const huecos = (primero.getUTCDay() + 6) % 7; // el entregable empieza en lunes
  const dias = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();
  const diasPrev = new Date(Date.UTC(cursor.y, cursor.m, 0)).getUTCDate();
  const prefijo = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}`;

  const delMes = d.cola.filter((c) => c.diaCdmx && c.diaCdmx.startsWith(prefijo));
  const salidasMes = d.salidas.filter((s) => s.diaCdmx.startsWith(prefijo));

  // Un punto por día: la salida manda (es el evento, no una pieza), luego lo
  // programado —que todavía se puede mover— y al final lo ya publicado.
  const punto = (dia: string): string | null => {
    if (salidasMes.some((s) => s.diaCdmx === dia)) return "var(--orange)";
    const items = delMes.filter((c) => c.diaCdmx === dia);
    if (items.some((c) => c.estado === "programada")) return "#1c6f6a";
    if (items.length) return "var(--forest)";
    return null;
  };

  const agenda = [
    ...delMes.map((c) => ({ dia: c.diaCdmx as string, pieza: c, salida: null as null | (typeof salidasMes)[number] })),
    ...salidasMes.map((s) => ({ dia: s.diaCdmx, pieza: null as ColaMovil | null, salida: s })),
  ].sort((a, b) => a.dia.localeCompare(b.dia));

  return (
    <div className="adm-screen">
      <NavBar onBack={nav.pop} t="Comunicación" s="cola global de redes" />
      <div className="adm-pad">
        <Seg opts={["Lista", "Calendario"]} val={vista} set={setVista} />
        <Gap />
        {vista === "Lista" ? (
          <>
            {d.cola.length === 0 ? (
              <div className="adm-card">
                <Empty
                  ic="◌"
                  t="La cola está vacía"
                  p="Nada programado ni publicado todavía. Las campañas se programan desde el Kit, en la computadora."
                />
              </div>
            ) : null}
            {GRUPOS.map(([lbl, est]) => {
              const items = d.cola
                .filter((c) => c.estado === est)
                .sort((a, b) =>
                  est === "programada"
                    ? (a.diaCdmx || "").localeCompare(b.diaCdmx || "")
                    : (b.diaCdmx || "").localeCompare(a.diaCdmx || ""),
                );
              if (!items.length) return null;
              return (
                <div key={est}>
                  <Sub pad>
                    {lbl} · {items.length}
                  </Sub>
                  <div className="adm-card">
                    {items.slice(0, 40).map((c) => (
                      <div className="adm-li" key={c.id}>
                        <div className="rowbody">
                          <div className="r1">
                            <span className="t">
                              {c.evento}
                              <small>
                                {c.pieza}
                                {est === "falló" ? ` · ${c.cuando}` : ""}
                              </small>
                            </span>
                            {est !== "falló" && (
                              <span className="m adm-mono" style={{ fontSize: 12 }}>
                                {c.cuando}
                              </span>
                            )}
                          </div>
                          <div className="r2">
                            <Life e={est} />
                            {est === "programada" && (
                              <button
                                className="adm-btn adm-btn-ghost adm-btn-sm"
                                style={{ marginLeft: "auto" }}
                                disabled={ui.pendiente}
                                onClick={() =>
                                  ui.run("Publicación cancelada", async () => {
                                    const r = await cancelarPost(c.id);
                                    return { ok: r.ok, error: r.error };
                                  })
                                }
                              >
                                Cancelar publicación
                              </button>
                            )}
                            {est === "publicada" && c.permalink && (
                              <a
                                className="adm-btn adm-btn-ghost adm-btn-sm"
                                style={{ marginLeft: "auto" }}
                                href={c.permalink}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Ver en Instagram
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Gap />
                </div>
              );
            })}
            <Sub pad>Por evento</Sub>
            <div className="adm-card">
              {d.eventos.length === 0 ? (
                <div className="adm-x">
                  <Sub>Todavía no hay eventos.</Sub>
                </div>
              ) : null}
              {d.eventos.map((e) => (
                <details className="adm-li" key={e.slug}>
                  <summary>
                    <div className="r1">
                      <span className="t">
                        {e.nombre}
                        {!e.publicado && <small>borrador</small>}
                      </span>
                      <Chip c={e.programadas > 0 ? "ok" : "sol"}>
                        {e.piezas} pieza{e.piezas === 1 ? "" : "s"}
                      </Chip>
                    </div>
                    <div className="r2">
                      <span className="dt">
                        {e.programadas} programada{e.programadas === 1 ? "" : "s"} · {e.publicadas} publicada
                        {e.publicadas === 1 ? "" : "s"}
                      </span>
                    </div>
                  </summary>
                  <div className="adm-x">
                    <div className="adm-acts">
                      <button
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        onClick={() => nav.push("kit", { slug: e.slug })}
                      >
                        Abrir Kit
                      </button>
                      <a
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        href={`/caminante/admin/print/${e.slug}?o=v`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        PDF vertical
                      </a>
                      <a
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        href={`/caminante/admin/print/${e.slug}?o=h`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        PDF horizontal
                      </a>
                      <a
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        href={`/caminante/admin/social/${e.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Flyer redes
                      </a>
                      <a className="adm-btn adm-btn-ghost adm-btn-sm" href={`/caminante/admin/eventos/${e.slug}`}>
                        Ver evento
                      </a>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="adm-card adm-cal">
              <div className="mh">
                <span>
                  {MESES[cursor.m]} {cursor.y}
                </span>
                <span className="adm-mono" style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                  <button onClick={() => mover(-1)} aria-label="Mes anterior" style={{ padding: "0 6px" }}>
                    ‹
                  </button>
                  <button onClick={() => mover(1)} aria-label="Mes siguiente" style={{ padding: "0 6px" }}>
                    ›
                  </button>
                </span>
              </div>
              <div className="gridc">
                {DIAS.map((x, i) => (
                  <span className="dh" key={i}>
                    {x}
                  </span>
                ))}
                {Array.from({ length: huecos }, (_, i) => (
                  <span className="d mut" key={"p" + i}>
                    {diasPrev - huecos + i + 1}
                  </span>
                ))}
                {Array.from({ length: dias }, (_, i) => i + 1).map((n) => {
                  const dia = iso(cursor.y, cursor.m, n);
                  const color = punto(dia);
                  return (
                    <span key={n} className={"d" + (color ? " has" : "") + (dia === hoy ? " today" : "")}>
                      {n}
                      {color && <i style={{ background: color }}></i>}
                    </span>
                  );
                })}
              </div>
            </div>
            <Gap s />
            <div className="adm-card">
              {agenda.length === 0 ? (
                <Empty ic="◌" t="Este mes está vacío" p="Ni piezas en la cola ni salidas abiertas en el mes." />
              ) : (
                agenda.map((x, i) => (
                  <div className="adm-li" key={i}>
                    <div className="rowbody">
                      <div className="r1">
                        <span className="t">
                          {diaLabel(x.dia)}
                          <small>
                            {x.salida
                              ? `${x.salida.evento} · ${x.salida.label} — la salida, no una pieza`
                              : `${x.pieza!.evento} · ${x.pieza!.pieza}`}
                          </small>
                        </span>
                        {x.salida ? <Chip c="warn">salida</Chip> : <Life e={x.pieza!.estado} />}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
