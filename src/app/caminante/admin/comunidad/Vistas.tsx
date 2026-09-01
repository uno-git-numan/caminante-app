"use client";

// EL SEGMENTADO de Comunidad: CRM y Gente son dos VISTAS de la misma pantalla.
//
// Fueron tres un rato. «Solicitudes» desapareció: la mitad de lo que traía no
// era de NUMAN sino de la plataforma —aprobar operadoras— y se fue al Pipeline
// del sombrero Caminante; la otra mitad —el cliente que pide fecha, el
// embajador que quiere traer gente— se subió ARRIBA del tablero, que es donde
// va a acabar convertida en tarjeta. Una bandeja aparte es una pestaña que hay
// que acordarse de visitar. Se cambia sin recargar y sin
// perder el scroll.
//
// Las tres llegan ya renderizadas desde el servidor: el cliente sólo decide
// cuál se ve. Así el tablero, la biblioteca y la bandeja siguen siendo Server
// Components con sus consultas, y esto no toca la base.
//
// El orden es el del trabajo del día: primero quién está esperando respuesta,
// luego quién está en conversación, al final quién ya viajó. Pero la vista que
// ABRE es la primera que tiene algo adentro —una bandeja vacía no merece ser
// lo primero que ves cada mañana.

import { useState } from "react";

type Vista = "crm" | "gente";

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
  const [vista, setVista] = useState<Vista>(crm > 0 ? "crm" : "gente");
  const tab = (k: Vista, label: string, n: number) => (
    <button type="button" className={vista === k ? "on" : undefined} onClick={() => setVista(k)}>
      {label}
      <span className="ct">{n}</span>
    </button>
  );
  return (
    <>
      <div className="cmseg">
        {tab("crm", "CRM", crm)}
        {tab("gente", "Clientes", gente)}
      </div>
      {vista === "crm" ? tablero : biblioteca}
    </>
  );
}
