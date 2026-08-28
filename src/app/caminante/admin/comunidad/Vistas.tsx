"use client";

// EL SEGMENTADO de Comunidad: CRM, Gente y Solicitudes son tres VISTAS de la
// misma pantalla, no tres secciones apiladas. Se cambia sin recargar y sin
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

type Vista = "solicitudes" | "crm" | "gente";

export default function Vistas({
  crm,
  gente,
  solicitudes,
  tablero,
  biblioteca,
  bandeja,
}: {
  crm: number;
  gente: number;
  /** null = este usuario no tiene bandeja (operador externo): la pestaña no existe. */
  solicitudes: number | null;
  tablero: React.ReactNode;
  biblioteca: React.ReactNode;
  bandeja: React.ReactNode;
}) {
  const [vista, setVista] = useState<Vista>(
    solicitudes ? "solicitudes" : crm > 0 ? "crm" : "gente",
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
        {solicitudes === null ? null : tab("solicitudes", "Solicitudes", solicitudes)}
        {tab("crm", "CRM", crm)}
        {tab("gente", "Gente", gente)}
      </div>
      {vista === "crm" ? tablero : vista === "gente" ? biblioteca : bandeja}
    </>
  );
}
