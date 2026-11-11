"use client";

// El botón de emitir (uno o todos) del CFDI de retenciones. La pantalla es de
// servidor; esto sólo dispara la acción y enseña lo que contestó.

import { useState } from "react";
import { emitirRetencionAction, emitirTodosAction } from "@/lib/fiscal/retenciones-actions";

export default function EmitirCfdi({ mes, operatorId, etiqueta }: { mes: string; operatorId?: string; etiqueta: string }) {
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState("");
  async function emitir() {
    setOcupado(true);
    setMsg("");
    const r = operatorId ? await emitirRetencionAction(mes, operatorId) : await emitirTodosAction(mes);
    setOcupado(false);
    setMsg(r.ok ? `✓ ${r.mensaje}` : `Error: ${r.mensaje}`);
  }
  return (
    <span>
      <button type="button" className="btn btn-sm" onClick={emitir} disabled={ocupado}>
        {ocupado ? "Timbrando…" : etiqueta}
      </button>
      {msg ? <small style={{ display: "block", marginTop: 4 }}>{msg}</small> : null}
    </span>
  );
}
