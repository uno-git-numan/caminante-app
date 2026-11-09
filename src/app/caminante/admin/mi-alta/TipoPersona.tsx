"use client";

// ¿PERSONA FÍSICA O MORAL? — se pregunta ANTES del expediente.
//
// Luis, 9 nov 2026, haciendo el alta de una operadora en vivo: «Pedir antes del
// expediente si es persona moral o física, y con base a eso pedir los
// documentos que apliquen». Hasta hoy la pregunta vivía en el paso 03 (el
// convenio), DESPUÉS de haber pedido el acta constitutiva a todo el mundo.
//
// Las piezas (`.opts`/`.opt`) son las de «¿Quién firma?» del paso 03: es la
// misma pregunta, ahora en el lugar donde decide algo.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { guardarTipoPersona } from "@/lib/payments/connect-actions";

export default function TipoPersona({
  operadoraId,
  tipo,
  compacto = false,
}: {
  operadoraId: string;
  tipo: "fisica" | "moral" | null;
  /** Ya contestada: sólo el control, sin la explicación. */
  compacto?: boolean;
}) {
  const [pendiente, arranca] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const elegir = (t: "fisica" | "moral") =>
    arranca(async () => {
      setError(null);
      const r = await guardarTipoPersona(operadoraId, t);
      if (r.ok) router.refresh();
      else setError(r.error ?? "No se pudo guardar.");
    });

  return (
    <div style={{ marginBottom: compacto ? 14 : 22 }}>
      {compacto ? null : (
        <div className="verdict casa" style={{ marginBottom: 14 }}>
          <span className="n">{"//"}</span>
          <span className="g">
            <b>Antes de empezar: ¿operas como persona física o como empresa?</b>
            <span>
              De eso depende qué te pedimos. A una persona física no le pedimos acta constitutiva; a una
              empresa le pedimos la identificación de su representante legal. Lo puedes cambiar después.
            </span>
          </span>
        </div>
      )}
      <div className="opts">
        {([["fisica", "Persona física"], ["moral", "Persona moral (empresa)"]] as const).map(([v, t]) => (
          <button
            key={v}
            type="button"
            className={"opt" + (tipo === v ? " on" : "")}
            disabled={pendiente}
            onClick={() => elegir(v)}
          >
            <i />
            {t}
          </button>
        ))}
      </div>
      {error ? <p className="gnhint">{error}</p> : null}
    </div>
  );
}
