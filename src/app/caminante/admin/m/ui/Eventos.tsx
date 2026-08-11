"use client";

// EVENTOS · lista — transcrita de `ScrEventos` (design/admin-movil/adm-screens-a.jsx).
// Markup y clases 1:1; los datos salen de fetchEventosMovil (que reusa
// fetchEventos del escritorio).
//
// Lo que el mockup traía escrito a mano y aquí es real: la ocupación por salida,
// el operador, la chapa «Privada» y el candado de publicar (deslinde/encuesta),
// que sale de listaParaPublicar — la misma regla que bloquea el botón.

import Link from "next/link";
import type { EventoMovil, EventosMovil } from "@/lib/admin/movil/eventos";
import type { Nav } from "./AppShell";
import { Chip, Empty, Head } from "./kit";

// Las que están EN VENTA hoy: abiertas y que aún no se van. Es lo que se opera.
export const enVenta = (e: EventoMovil) => e.salidas.filter((s) => s.enVenta && !s.pasada);

// «Necesita ventas»: la salida arrancó pero va por debajo del 40% de su cupo.
// Misma lectura que la barra naranja de Panorama.
const floja = (s: { taken: number; capacity: number | null }) =>
  s.taken > 0 && s.capacity != null && s.capacity > 0 && s.taken / s.capacity < 0.4;

export default function Eventos({ d, nav }: { d: EventosMovil; nav: Nav }) {
  return (
    <div className="adm-screen">
      <Head eyebrow="Eventos" title="Las <em>experiencias.</em>" />
      <div className="adm-pad">
        <div className="adm-card">
          {d.eventos.map((e) => {
            const sal = enVenta(e);
            const ocup = sal
              .slice(0, 3)
              .map((s) => `${s.taken}/${s.capacity ?? "∞"}`)
              .join(" · ");
            return (
              <div className="adm-li" key={e.slug}>
                <div className="rowbody" onClick={() => nav.push("evento", { slug: e.slug })}>
                  <div className="r1">
                    <span className="t">
                      {e.nombre}
                      <small>
                        {e.operadorNombre || "propia"} ·{" "}
                        {sal.length
                          ? sal.length + " salida" + (sal.length > 1 ? "s" : "")
                          : "sin salidas abiertas"}
                      </small>
                    </span>
                    <span className={"m adm-mono" + (sal.length ? "" : " adm-mut")}>
                      {sal.length ? ocup + (sal.length > 3 ? " …" : "") : "—"}
                    </span>
                  </div>
                  <div className="r2">
                    {e.publicada ? (
                      <Chip c="ok" dot>
                        Publicada
                      </Chip>
                    ) : (
                      <Chip c="mut">Borrador</Chip>
                    )}
                    {sal.some((s) => s.privada) && <Chip c="sol">Privada</Chip>}
                    {sal.some(floja) && <Chip c="warn">Necesita ventas</Chip>}
                    {!e.candado.ok && (
                      <span className="dt">
                        candado: falta{" "}
                        {e.candado.faltaDeslinde && e.candado.faltaEncuesta
                          ? "deslinde y encuesta"
                          : e.candado.faltaDeslinde
                            ? "deslinde"
                            : "encuesta"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!d.eventos.length ? (
            <Empty
              ic="◌"
              t="Todavía no hay experiencias"
              p="Se dan de alta en el formulario del panel de computadora — aquí se operan."
              btn={
                <Link
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  href="/caminante/admin/experiencias/nueva"
                >
                  Abrir el formulario
                </Link>
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
