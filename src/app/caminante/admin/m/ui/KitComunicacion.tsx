"use client";

// KIT de una experiencia en el teléfono — transcrita de `ScrKit`
// (adm-screens-c.jsx): KPIs, barra de acciones, progreso de los captions y las
// piezas agrupadas por momento en acordeón.
//
// ⚠️ REGLA DEL SISTEMA: en móvil el Kit MUESTRA el estado, no lo cambia.
// Exportar PNG y «Programar campaña» rasterizan las láminas leyendo
// `[data-piece="X"] .slide` del DOM off-screen del Kit de escritorio — ese
// bloque no existe en el teléfono, así que esos botones no se portan (serían
// botones que no pueden funcionar). Lo que SÍ corre aquí es «Captions con IA»:
// es una server action pura, sin DOM de por medio, y es justo lo que se quiere
// disparar desde el celular. El ciclo de vida por pieza es el mismo del tablero
// de escritorio (la cola manda → insumos → caption), calculado en el adaptador
// para no tener dos versiones de la misma verdad.
//
// POR QUÉ CARGA AL ABRIRSE (y no llega por props del servidor): armar el kit de
// TODAS las experiencias en cada carga del panel serían decenas de consultas
// para algo que casi nunca se mira. La promesa se guarda en un caché de módulo
// porque `use()` exige la MISMA promesa entre renders.

import { Suspense, use, useState, startTransition } from "react";
import { generarLoteCaptions, listarPiezasListas } from "@/lib/kit/kit-actions";
import { LOTE_CAPTIONS } from "@/lib/kit/captions-lote";
import { cargarKitMovil, type KitMovil } from "@/lib/admin/movil/mas";
import type { Nav, Ui } from "./AppShell";
import { Chip, Empty, Gap, Life, NavBar, Sub } from "./kit";

const cache = new Map<string, Promise<KitMovil | null>>();
// `v` cambia al abrir la pantalla y al recargar (tras generar captions): llave
// nueva = promesa nueva = datos frescos, y las viejas del mismo slug se tiran.
// Nunca rechaza: un error de red se resuelve como `null` y la pantalla lo dice.
function pedirKit(slug: string, v: number): Promise<KitMovil | null> {
  const k = `${slug}:${v}`;
  let p = cache.get(k);
  if (!p) {
    for (const vieja of [...cache.keys()]) if (vieja.startsWith(`${slug}:`)) cache.delete(vieja);
    p = cargarKitMovil(slug).catch(() => null);
    cache.set(k, p);
  }
  return p;
}

type Ia = { hechas: number; total: number } | null;

export default function KitComunicacion({
  nav,
  ui,
  params,
}: {
  nav: Nav;
  ui: Ui;
  params: Record<string, string>;
}) {
  const slug = params.slug || "";
  // Sello de apertura: cada vez que se entra a la pantalla los datos se piden de
  // nuevo (una cola que cambió mientras tanto no debe verse vieja).
  const [v, setV] = useState(() => Date.now());
  return (
    <Suspense fallback={<Cargando nav={nav} />}>
      <Cargado slug={slug} v={v} recargar={() => startTransition(() => setV(Date.now()))} nav={nav} ui={ui} />
    </Suspense>
  );
}

function Cargando({ nav }: { nav: Nav }) {
  return (
    <div className="adm-screen">
      <NavBar onBack={nav.pop} t="Kit" s="cargando…" />
      <div className="adm-pad">
        <div className="adm-card adm-skel">
          <div className="sk" style={{ width: "70%" }}></div>
          <div className="sk"></div>
          <div className="sk" style={{ width: "45%" }}></div>
        </div>
      </div>
    </div>
  );
}

function Cargado({
  slug,
  v,
  recargar,
  nav,
  ui,
}: {
  slug: string;
  v: number;
  recargar: () => void;
  nav: Nav;
  ui: Ui;
}) {
  const k = use(pedirKit(slug, v));
  const [ia, setIa] = useState<Ia>(null);

  // Mismo bucle que el runner de escritorio: lotes de 4 (medido ~28-34s; la
  // función muere a los 60s) y guardado incremental — si un lote falla, lo
  // anterior YA está en la base.
  async function captions() {
    if (ia) return;
    setIa({ hechas: 0, total: 0 });
    let hechas = 0;
    try {
      const ids = await listarPiezasListas(slug);
      if (!ids.length) {
        setIa(null);
        ui.toastify("Nada que redactar", "ninguna pieza tiene sus insumos listos todavía");
        return;
      }
      setIa({ hechas: 0, total: ids.length });
      for (let i = 0; i < ids.length; i += LOTE_CAPTIONS) {
        const r = await generarLoteCaptions(slug, ids.slice(i, i + LOTE_CAPTIONS));
        if (!r.ok) {
          setIa(null);
          ui.toastify("Se cortó", `${r.error}${hechas > 0 ? ` · ${hechas} alcanzaron a guardarse` : ""}`);
          recargar();
          return;
        }
        hechas += r.ids.length;
        setIa({ hechas, total: ids.length });
      }
      setIa(null);
      ui.toastify("Captions listos", `${hechas} generados`);
      recargar();
    } catch (e) {
      setIa(null);
      ui.toastify("Se cortó", `${(e as Error).message}${hechas > 0 ? ` · ${hechas} guardadas` : ""}`);
      recargar();
    }
  }

  if (!k) {
    return (
      <div className="adm-screen">
        <NavBar onBack={nav.pop} t="Kit" s={slug} />
        <div className="adm-pad">
          <div className="adm-card">
            <Empty
              ic="◌"
              t="No pude abrir este kit"
              p="La experiencia no existe o la sesión caducó."
              btn={
                <button className="adm-btn adm-btn-ghost adm-btn-sm" onClick={recargar}>
                  Reintentar
                </button>
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-screen">
      <NavBar
        onBack={nav.pop}
        t={`Kit · ${k.nombre}`}
        s={`${k.total} piezas · ${k.grupos.length} momentos`}
        right={
          k.cuenta ? (
            <Chip c="ok" dot>
              @{k.cuenta}
            </Chip>
          ) : (
            <Chip c="mut">sin Instagram</Chip>
          )
        }
      />
      <div className="adm-pad">
        <div className="adm-card adm-kpi4">
          {(
            [
              ["listas", k.kpis.listas],
              ["con caption", k.kpis.conCaption],
              ["programadas", k.kpis.programadas],
              ["publicadas", k.kpis.publicadas],
            ] as [string, number][]
          ).map(([l, n]) => (
            <div key={l}>
              <span className="adm-mono">{n}</span>
              <br />
              <small>{l}</small>
            </div>
          ))}
        </div>
        <Gap s />
        <div className="adm-filters">
          <button className="adm-btn adm-btn-orange adm-btn-sm" disabled={!!ia} onClick={captions}>
            {ia ? `Generando… ${ia.hechas} de ${ia.total || "?"}` : "Captions con IA"}
          </button>
          <a
            className="adm-btn adm-btn-ghost adm-btn-sm"
            href={`/caminante/admin/kit/${k.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Abrir en computadora
          </a>
          <a
            className="adm-btn adm-btn-ghost adm-btn-sm"
            href={`/caminante/admin/print/${k.slug}?o=v`}
            target="_blank"
            rel="noreferrer"
          >
            PDF
          </a>
          <a
            className="adm-btn adm-btn-ghost adm-btn-sm"
            href={`/caminante/admin/social/${k.slug}`}
            target="_blank"
            rel="noreferrer"
          >
            Flyer redes
          </a>
        </div>
        {ia && (
          <div className="adm-card" style={{ padding: "13px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 }}>
              <b>Generando captions con IA</b>
              <span className="adm-mono">
                {ia.hechas} de {ia.total || "?"}
              </span>
            </div>
            <div className="adm-prog">
              <i style={{ width: (ia.total ? (ia.hechas / ia.total) * 100 : 4) + "%" }}></i>
            </div>
            <p className="adm-mut" style={{ fontSize: 11.5, marginTop: 8 }}>
              Corre por lotes y va guardando: si se corta, lo generado ya quedó. No cierres esta pantalla.
            </p>
          </div>
        )}
        <Gap />
        {k.grupos.map((g) => (
          <div key={g.momento}>
            <Sub pad>
              {g.momento} · {g.piezas.length} pieza{g.piezas.length === 1 ? "" : "s"}
            </Sub>
            <div className="adm-card">
              {g.piezas.map((p) => (
                <details className="adm-li" key={p.id}>
                  <summary>
                    <div className="r1">
                      <span className="t">
                        {p.id} · {p.nombre}
                        <small>{p.detalle}</small>
                      </span>
                      <Life e={p.estado} />
                    </div>
                    {p.trigger ? (
                      <div className="r2">
                        <Chip c="warn">vigilar: {p.trigger}</Chip>
                      </div>
                    ) : null}
                  </summary>
                  <div className="adm-x">
                    <p className="adm-mut" style={{ fontSize: 12, lineHeight: 1.5, padding: "10px 0 2px" }}>
                      {p.trabajo} · <b>{p.formato}</b>
                      {p.cara !== "—" ? ` · cara ${p.cara}` : ""}
                    </p>
                    {p.razon ? (
                      <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "#8a6d3b", padding: "6px 0" }}>
                        {p.razon} Se completa en el formulario, en la computadora.
                      </p>
                    ) : p.caption ? (
                      <>
                        <p
                          style={{
                            fontSize: 12.5,
                            lineHeight: 1.55,
                            color: "var(--charcoal)",
                            whiteSpace: "pre-wrap",
                            padding: "6px 0 2px",
                          }}
                        >
                          {p.caption}
                        </p>
                        {p.hashtags.length ? (
                          <p style={{ fontSize: 12, color: "var(--olive)", paddingBottom: 4 }}>
                            {p.hashtags.join(" ")}
                          </p>
                        ) : null}
                        {p.porques ? (
                          <>
                            <Sub>Los 3 porqués · de dónde salió la pregunta</Sub>
                            <p className="adm-mut" style={{ fontSize: 12, lineHeight: 1.5 }}>
                              <b>safe</b> {p.porques.safe}
                              <br />
                              <b>real</b> {p.porques.real}
                              <br />
                              <b>raw</b> {p.porques.raw}
                            </p>
                          </>
                        ) : null}
                      </>
                    ) : (
                      <p className="adm-mut" style={{ fontSize: 12.5, padding: "6px 0" }}>
                        Sin caption — usa «Captions con IA».
                      </p>
                    )}
                    <div className="adm-acts">
                      {p.caption && (
                        <button
                          className="adm-btn adm-btn-ghost adm-btn-sm"
                          onClick={() =>
                            ui.copy(p.caption + (p.hashtags.length ? "\n\n" + p.hashtags.join(" ") : ""))
                          }
                        >
                          Copiar caption
                        </button>
                      )}
                      {p.permalink && (
                        <a
                          className="adm-btn adm-btn-ghost adm-btn-sm"
                          href={p.permalink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver en Instagram
                        </a>
                      )}
                      <a
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        href={`/caminante/admin/kit/${k.slug}#${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Publicar en computadora
                      </a>
                    </div>
                  </div>
                </details>
              ))}
            </div>
            <Gap />
          </div>
        ))}
        <p className="adm-mut" style={{ fontSize: 11.5, lineHeight: 1.6, paddingBottom: 8 }}>
          Publicar, descargar las láminas y programar la campaña se hacen en la computadora: esas acciones
          dibujan las imágenes en pantalla antes de subirlas, y el teléfono no las dibuja.
        </p>
      </div>
    </div>
  );
}
