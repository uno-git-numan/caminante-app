"use client";

// EVENTOS · contenido — transcrita de `ScrContenido`
// (design/admin-movil/adm-screens-a.jsx).
//
// ⚠️ Dos cosas del mockup NO se pudieron transcribir tal cual y aquí se dice
// por qué:
//
// 1) Los renglones y el «13 de 16» eran datos de ejemplo escritos a mano. El
//    estado REAL de los insumos ya existe y es el semáforo «Comunicación lista»
//    del formulario (lib/kit/checklist.ts): seis renglones con lo que hay y lo
//    que falta. Es lo que se pinta aquí, con su misma vocación: cada uno lleva
//    a la sección que lo arregla.
//
// 2) El mockup edita «Precio y niveles» desde el teléfono. No hay —ni debe
//    haber— una mutación para eso: el contenido de la experiencia se escribe en
//    el FORMULARIO (regla: el formulario CREA, el dashboard OPERA) y este
//    entregable prohíbe lógica de escritura nueva. El bloque queda de LECTURA
//    (el precio de verdad, y sus niveles si los tiene) con el link a la sección
//    del formulario. El precio de una SALIDA sí se opera desde aquí: vive en la
//    hoja «Editar salida».
//
// «Nivel» no existe como campo en la base — el bloque se omite.

import type { EventosMovil } from "@/lib/admin/movil/eventos";
import type { Nav } from "./AppShell";
import { Fld, Gap, Life, NavBar, Sub } from "./kit";

export default function Contenido({
  d,
  nav,
  params,
}: {
  d: EventosMovil;
  nav: Nav;
  params: Record<string, string>;
}) {
  const e = d.eventos.find((x) => x.slug === params.slug);
  if (!e) {
    return (
      <div className="adm-screen">
        <NavBar onBack={nav.pop} t="Contenido" s="" />
      </div>
    );
  }
  const form = `/caminante/admin/experiencias/${e.slug}`;

  return (
    <div className="adm-screen">
      <NavBar onBack={nav.pop} t={"Contenido · " + e.nombre.split(" ")[0]} s="lo que el Kit necesita" />
      <div className="adm-pad">
        <div className="adm-note adm-note-info">
          <span className="st" style={{ background: "var(--sand)" }}></span>
          <span>
            Aquí ves qué le falta a la experiencia para comunicarse. La autoría (banco de fotos,
            ficha científica, pre-llenar con IA) vive en el panel de computadora.
          </span>
        </div>
        <Gap />
        <Sub pad>
          Comunicación lista · {e.seccionesOk} de {e.secciones.length}
        </Sub>
        <div className="adm-card">
          <details className="adm-li" open>
            <summary>
              <div className="r1">
                <span className="t">Precio</span>
                <Life e={e.precioBase ? "listo" : "falta insumo"} />
              </div>
            </summary>
            <div className="adm-x">
              {/* Sin `set` el campo es de lectura: el precio se escribe en el
                  formulario, y el de cada salida en «Editar salida». */}
              <Fld
                l="Precio por persona"
                val={e.precioBase ? "$" + e.precioBase : "sin precio capturado"}
                mono
                hint="el precio base de la experiencia; cada salida puede tener el suyo"
              />
              {e.tiers.map((t, i) => (
                <Fld key={i} l={t.label} val={"$" + t.amount} mono />
              ))}
              <div className="adm-acts">
                <a className="adm-btn adm-btn-ghost" href={`${form}#s13`}>
                  Editar en el panel
                </a>
              </div>
            </div>
          </details>
          {e.secciones.map((s) => (
            <a className="adm-li" key={s.id} href={`${form}${s.ancla}`}>
              <div className="rowbody">
                <div className="r1">
                  <span className="t">
                    {s.titulo}
                    <small>{s.detalle}</small>
                  </span>
                  <Life e={s.estado} />
                </div>
              </div>
            </a>
          ))}
          <div style={{ padding: "10px 16px 16px" }}>
            <a className="adm-btn adm-btn-glass adm-btn-block" href={form}>
              Abrir el formulario completo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
