"use client";

// El selector de operador de la experiencia, con su comisión al lado.
//
// ⚠️ Por qué esto es un componente de cliente y no dos inputs sueltos: el campo
// «%» arrancaba con la comisión del operador que YA estaba asignado, y ese valor
// se quedaba ahí al cambiar de operador en la lista. O sea: pasar la experiencia
// de Kéntro (15%) a otra operadora y darle Guardar le escribía 15% a la nueva —
// un número que nadie acordó con ella, y encima escrito en `operators`, así que
// le aplicaba a TODAS sus experiencias. Ahora el % sigue al operador elegido.
//
// ⚠️ La comisión NO es por experiencia aunque se edite aquí: vive en
// `operators.commission_pct` y es la misma en todo lo que esa persona opere. Lo
// que sí es por venta es el snapshot que se congela al cobrar (0016).

import { useState } from "react";

export type OperadorOpcion = { id: string; name: string; commissionPct: number | null };

export default function OperadorSelect({
  operadores,
  operadorId,
}: {
  operadores: OperadorOpcion[];
  operadorId: string | null;
}) {
  const [sel, setSel] = useState(operadorId ?? "");
  const [pct, setPct] = useState(
    operadores.find((o) => o.id === operadorId)?.commissionPct ?? null,
  );

  function cambiarOperador(id: string) {
    setSel(id);
    // El % que se muestra es SIEMPRE el del operador elegido; nunca se hereda.
    setPct(operadores.find((o) => o.id === id)?.commissionPct ?? null);
  }

  return (
    <>
      <select
        name="operatorId"
        value={sel}
        onChange={(e) => cambiarOperador(e.target.value)}
        style={{ flex: 1, minWidth: 140 }}
      >
        <option value="">Sin asignar</option>
        {operadores.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
            {o.commissionPct == null ? " · % por definir" : ` · ${o.commissionPct}%`}
          </option>
        ))}
      </select>
      <input
        name="commissionPct"
        type="number"
        min={0}
        max={100}
        step="0.5"
        value={pct == null ? "" : String(pct)}
        onChange={(e) => setPct(e.target.value === "" ? null : Number(e.target.value))}
        placeholder="% comisión"
        style={{ maxWidth: 110 }}
      />
    </>
  );
}
