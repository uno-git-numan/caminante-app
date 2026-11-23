// La página «Más» del panel de la casa: las secciones que salieron del menú
// esencial (23 nov 2026), cada una con una línea que dice para qué sirve.
// Se viste con las piezas del panel (`sec`, `card pad`, `grid2`, `mut`): no es
// una pantalla nueva de diseño, es un índice.

import Link from "next/link";
import type { SeccionGuardada } from "./mas";

export default function PaginaMas({ secciones, bajada }: { secciones: SeccionGuardada[]; bajada: string }) {
  return (
    <section className="sec">
      <div className="sec-head">
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Más
          </span>
          <h1 className="display">
            Lo demás, <em className="ac">a la mano.</em>
          </h1>
          <div className="desc">{bajada}</div>
        </div>
      </div>
      <div className="grid2">
        {secciones.map((s) => (
          <Link key={s.href} href={s.href} className="card pad" style={{ display: "block" }}>
            <span className="subtitle">{s.nombre}</span>
            <p className="mut" style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 6 }}>
              {s.paraQue}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
