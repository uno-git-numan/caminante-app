"use client";

// EL NAV MIENTRAS LA OPERADORA SIGUE EN SU ALTA.
//
// Transcrito de la lámina v5: «Mi alta» encendida y las seis secciones
// punteadas (`.nav .fut` con su `.dt`). Al picar una cerrada no navega: sale el
// «susurro» con qué le falta, textual de la lámina. Al firmar el convenio,
// Experiencias se prende (`.fut.liv.nuevo`) y ya se puede entrar.
//
// ⚠️ ESCONDER NO ES CERRAR. Una sección punteada es un `<span>`, sin liga, pero
// el candado de verdad está en el servidor (`layout.tsx` y la cabecera, con la
// misma `rutaCerrada`): escribir la URL a mano también rebota a Mi alta.

import { useState } from "react";
import Link from "next/link";
import { NOTA_NAV, SECCIONES_ALTA, abierta, type EstadoNav, type Seccion } from "@/lib/operadores/nav-alta";

export default function NavAlta({
  estado,
  enMiAlta,
}: {
  estado: Exclude<EstadoNav, "abierto">;
  /** Si la página actual es Mi alta o una de sus pantallas. */
  enMiAlta: boolean;
}) {
  const [sus, setSus] = useState<Seccion | null>(null);
  return (
    <>
      <nav className="nav">
        <Link href="/caminante/admin/mi-alta" className={enMiAlta ? "on" : ""}>
          Mi alta
        </Link>
        {SECCIONES_ALTA.map((s) =>
          abierta(s, estado) ? (
            <Link key={s.nombre} href={s.href} className="fut liv nuevo">
              <span className="dt" />
              {s.nombre}
            </Link>
          ) : (
            <span
              key={s.nombre}
              className="fut"
              data-sec={s.nombre}
              role="button"
              tabIndex={0}
              onClick={() => setSus(s)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSus(s)}
            >
              <span className="dt" />
              {s.nombre}
            </span>
          ),
        )}
      </nav>
      <p className="navnote">
        <s>{"//"}</s>
        <span>{NOTA_NAV[estado]}</span>
      </p>
      <div className={`susurro${sus ? " on" : ""}`} role="status" aria-live="polite">
        <s>{"//"}</s>
        <span className="g">
          {sus ? (
            <>
              <b>{sus.dice[0]}</b>
              {sus.dice[1]}
            </>
          ) : null}
        </span>
        <button type="button" className="x" aria-label="Cerrar" onClick={() => setSus(null)}>
          ×
        </button>
      </div>
    </>
  );
}
