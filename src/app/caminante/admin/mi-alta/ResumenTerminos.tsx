// EL RESUMEN DE TÉRMINOS, PARA LEERLO EN PANTALLA.
//
// Es el mismo documento que viaja en PDF adjunto a la invitación a la llamada,
// y sale de la misma lista de bloques (`lib/operadores/terminos.ts`). Aquí no
// hay una sola frase: sólo la manera de dibujar cada bloque. Si el texto cambia,
// cambia en los dos formatos a la vez, porque es uno.
//
// Se lee dentro del paso «01 · Nos conocemos» para que la operadora pueda
// volver a él cuando quiera, sin buscar el correo (Luis, 24 sep 2026).
//
// ⚠️ SÓLO IMPORTA EL TIPO. `terminos.ts` trae la comisión y el catálogo de
// actividades; los bloques se calculan en el servidor y llegan ya hechos.

import type { BloqueTerminos } from "@/lib/operadores/terminos";

type Fila = Extract<BloqueTerminos, { t: "fila" }>;

/** Junta las filas seguidas en una sola tabla: en el PDF son renglones sueltos
    alineados a ojo; en HTML una tabla es lo que los mantiene en columna. */
function agrupar(bloques: BloqueTerminos[]): (BloqueTerminos | { t: "tabla"; filas: Fila[] })[] {
  const out: (BloqueTerminos | { t: "tabla"; filas: Fila[] })[] = [];
  for (const b of bloques) {
    const ult = out[out.length - 1];
    if (b.t === "fila") {
      if (ult && ult.t === "tabla") ult.filas.push(b);
      else out.push({ t: "tabla", filas: [b] });
    } else out.push(b);
  }
  return out;
}

export default function ResumenTerminos({ bloques }: { bloques: BloqueTerminos[] }) {
  return (
    <div style={{ maxWidth: "74ch" }}>
      {agrupar(bloques).map((b, i) => {
        if (b.t === "espacio") return null;
        if (b.t === "titulo") {
          return (
            <p key={i} className="xh4" style={{ marginTop: 22 }}>
              {b.texto}
            </p>
          );
        }
        if (b.t === "aviso") {
          return (
            <div key={i} className="verdict casa" style={{ margin: "14px 0" }}>
              <span className="n">{"//"}</span>
              <span className="g">
                <b>{b.titulo}</b>
                <span>{b.cuerpo}</span>
              </span>
            </div>
          );
        }
        if (b.t === "tabla") {
          const [cab, ...resto] = b.filas;
          const conCab = cab.encabezado;
          const cuerpo = conCab ? resto : b.filas;
          return (
            <div key={i} className="tbl-wrap" style={{ margin: "8px 0" }}>
              <table>
                {conCab ? (
                  <thead>
                    <tr>
                      <th>{cab.celdas[0]}</th>
                      <th className="right">{cab.celdas[1]}</th>
                      <th className="right">{cab.celdas[2]}</th>
                    </tr>
                  </thead>
                ) : null}
                <tbody>
                  {cuerpo.map((f, k) => (
                    <tr key={k}>
                      <td>{f.celdas[0]}</td>
                      <td className="num right">{f.celdas[1]}</td>
                      <td className="num right">{f.celdas[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        // Una fila suelta no llega aquí —`agrupar` las mete todas en tablas—;
        // la guarda es para que el tipo lo sepa también.
        if (b.t !== "parrafo") return null;
        // Párrafo. El PDF lo distingue por tamaño y color; aquí se traduce a
        // peso: el título del documento, su rótulo, los subtítulos y el cuerpo.
        const size = b.size ?? 10.5;
        const suave = b.color === "olivo";
        if (size >= 20) {
          return (
            <p key={i} className="display" style={{ fontSize: 26, margin: "2px 0" }}>
              {b.texto}
            </p>
          );
        }
        if (b.color === "naranja") {
          return (
            <p key={i} style={{ color: "var(--orange)", fontSize: 15, margin: "2px 0" }}>
              {b.texto}
            </p>
          );
        }
        if (size <= 8.5) {
          return (
            <p key={i} className="mut mono" style={{ fontSize: 11, letterSpacing: ".08em", margin: "6px 0" }}>
              {b.texto}
            </p>
          );
        }
        return (
          <p
            key={i}
            className={suave ? "mut" : undefined}
            style={{
              fontSize: size >= 11 ? 14 : size >= 10.5 ? 14 : 13,
              fontWeight: size === 11 && !suave ? 600 : undefined,
              lineHeight: 1.55,
              margin: size === 11 && !suave ? "10px 0 2px" : "4px 0",
              paddingLeft: b.sangria ? 14 : undefined,
            }}
          >
            {b.texto}
          </p>
        );
      })}
    </div>
  );
}
