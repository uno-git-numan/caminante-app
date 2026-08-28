"use client";

// EL SEGMENTADO de Comunidad: CRM y Gente son dos VISTAS de la misma pantalla,
// no dos secciones apiladas. Se cambia sin recargar y sin perder el scroll.
//
// Las dos mitades llegan ya renderizadas desde el servidor: el cliente sólo
// decide cuál se ve. Así el tablero y la biblioteca siguen siendo Server
// Components con sus consultas, y esto no toca la base.

import { useState } from "react";

export default function Vistas({
  crm,
  gente,
  tablero,
  biblioteca,
}: {
  crm: number;
  gente: number;
  tablero: React.ReactNode;
  biblioteca: React.ReactNode;
}) {
  const [vista, setVista] = useState<"crm" | "gente">(crm > 0 ? "crm" : "gente");
  return (
    <>
      <div className="cmseg">
        <button type="button" className={vista === "crm" ? "on" : undefined} onClick={() => setVista("crm")}>
          CRM<span className="ct">{crm}</span>
        </button>
        <button type="button" className={vista === "gente" ? "on" : undefined} onClick={() => setVista("gente")}>
          Gente<span className="ct">{gente}</span>
        </button>
      </div>
      {vista === "crm" ? tablero : biblioteca}
    </>
  );
}
