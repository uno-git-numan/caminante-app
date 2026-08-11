"use client";

// Vista MÓVIL del calendario — transcripción de `PubCalendario`
// (design/publico-movil/pub-a.jsx:337) contra los datos reales.
//
// La ruta YA tiene escritorio: `page.tsx` renderiza los DOS marcados y el CSS
// decide cuál se ve (corte en 700px, modo `swap`). El escritorio no se tocó.
//
// El marcado y las clases van VERBATIM del entregable; los datos los arma
// `page.tsx` (servidor) y bajan ya formateados por props — así el mes, el día y
// la disponibilidad se calculan una sola vez, en America/Mexico_City, y no hay
// diferencia entre el render del servidor y el del navegador.
//
// ⚠️ El «Hoy hay 4 salidas en 3 experiencias» del mockup estaba HARDCODEADO.
// Aquí `resumen` viene contado de verdad (ver page.tsx). Y la frase «con 6
// personas se abre una privada» se cayó: el mínimo es por experiencia
// (`Experience.minPeople`), no una constante del calendario.

import Link from "next/link";
import { usePubUI } from "../ui/pub/PubShell";
import { Eyeb, NavCream, Sec } from "../ui/pub/atoms";

export type SalidaCal = {
  id: string;
  slug: string;
  /** Día y mes corto del badge; vacíos si la salida no tiene fecha capturada. */
  dia: string;
  mesCorto: string;
  nombre: string;
  sub: string; // "Estado · Operador"
  dispo: string; // "quedan 4" · "agotada" · "lugares disponibles"
  low: boolean;
};

export type MesCal = { key: string; label: string; salidas: SalidaCal[] };

export default function CalendarioMovil({
  meses,
  resumen,
}: {
  meses: MesCal[];
  resumen: string;
}) {
  const ui = usePubUI();

  return (
    <div className="pub-screen" style={{ background: "var(--panel)", minHeight: "100%" }}>
      <NavCream t="Calendario" s="las salidas abiertas, por mes" backHref="/caminante/experiencias" />

      <Sec style={{ paddingTop: 10 }}>
        <Eyeb>Calendario</Eyeb>
        <h2>
          Las salidas <em>abiertas.</em>
        </h2>
        <p>{resumen}</p>
      </Sec>

      {meses.map((m) => (
        <div className="pub-mes" key={m.key}>
          <h3>{m.label}</h3>
          {m.salidas.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {m.salidas.map((s) => (
                <Link className="pub-fecha" key={s.id} href={`/caminante/experiencias/${s.slug}`}>
                  {s.dia ? (
                    <div className="d">
                      <b>{s.dia}</b>
                      <small>{s.mesCorto}</small>
                    </div>
                  ) : null}
                  <div className="g">
                    <b>{s.nombre}</b>
                    <small>{s.sub}</small>
                  </div>
                  <span className={"disp" + (s.low ? " low" : "")}>{s.dispo}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">
              <p>Sin salidas este mes.</p>
              <button
                className="pub-cta pub-cta-ghost pub-cta-sm"
                onClick={() => ui.abrirHoja("avisame", { exp: "salidas de " + m.label })}
              >
                Avísame
              </button>
            </div>
          )}
        </div>
      ))}

      <div style={{ height: 28 }}></div>
    </div>
  );
}
