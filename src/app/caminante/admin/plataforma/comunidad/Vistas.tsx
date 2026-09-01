"use client";

// EL SEGMENTADO de la Comunidad de la plataforma. Mismo patrón que el de NUMAN,
// y a propósito: la misma persona con otro sombrero no debería reaprender cómo
// se cambia de vista.
//
// Aquí la gente son las OPERADORAS, no los clientes. Tres momentos de la misma
// relación: quién está pidiendo entrar, quién está en camino, y quién ya está.

import { useState } from "react";

type Vista = "solicitudes" | "pipeline" | "operadoras";

export default function Vistas({
  solicitudes,
  pipeline,
  operadoras,
  vistaSolicitudes,
  vistaPipeline,
  vistaOperadoras,
}: {
  solicitudes: number;
  pipeline: number;
  operadoras: number;
  vistaSolicitudes: React.ReactNode;
  vistaPipeline: React.ReactNode;
  vistaOperadoras: React.ReactNode;
}) {
  // Abre en lo que tiene algo adentro: una bandeja vacía no merece ser lo
  // primero que ves cada mañana.
  const [vista, setVista] = useState<Vista>(
    solicitudes > 0 ? "solicitudes" : pipeline > 0 ? "pipeline" : "operadoras",
  );
  const tab = (k: Vista, label: string, n: number) => (
    <button type="button" className={vista === k ? "on" : undefined} onClick={() => setVista(k)}>
      {label}
      <span className="ct">{n}</span>
    </button>
  );
  return (
    <>
      <div className="cmseg">
        {tab("solicitudes", "Solicitudes", solicitudes)}
        {tab("pipeline", "Pipeline", pipeline)}
        {tab("operadoras", "Operadoras", operadoras)}
      </div>
      {vista === "solicitudes"
        ? vistaSolicitudes
        : vista === "pipeline"
          ? vistaPipeline
          : vistaOperadoras}
    </>
  );
}
