"use client";

// UNA SALIDA PRÓXIMA QUE NADIE HA COMPRADO — con mandos.
//
// Antes era un renglón con un link «Abrir» a la ficha de la experiencia, y la
// ficha decía «las salidas se crean, se editan y se cierran en Salidas» con un
// link de vuelta. El circuito se cerraba sin una sola forma de cerrar o editar
// la fecha en escritorio (21 oct 2026: la de Volcanes del 13 de noviembre
// estaba en duda y no había cómo pararla). Una fecha vacía no necesita cápsula
// —no hay firmas ni encuesta— pero sí los tres mandos de cualquier salida:
// cerrar/reabrir ventas, editar cupo y fechas, y cancelar.
import { useState } from "react";
import Link from "next/link";
import type { Salida } from "@/lib/admin/salidas";
import { setSlotStatusAction, updateSlot } from "@/lib/admin/eventos-actions";
import { EditarSalida } from "./Capsula";

export default function SalidaVacia({ s }: { s: Salida }) {
  const [editando, setEditando] = useState(false);
  // Cancelar borra la fecha del sitio y no se deshace. Sin reservas no hay
  // dinero de por medio, así que basta un segundo clic en vez de escribir el
  // nombre; pero sí dos clics, nunca uno.
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const abierta = s.estado === "open";

  return (
    <div className="salvl" style={{ alignItems: "center" }}>
      <span className="nm">
        {s.experiencia}
        {s.lugar ? ` · ${s.lugar}` : ""}
        {!abierta ? (
          <span className="mut" style={{ fontSize: 12.5 }}>
            {" "}
            · cerrada, ya no se vende
          </span>
        ) : null}
      </span>
      <span className="dt">
        {s.label} · 0 de {s.cupo ?? "∞"}
      </span>
      <form action={setSlotStatusAction} style={{ display: "inline" }}>
        <input type="hidden" name="slotId" value={s.id} />
        <input type="hidden" name="slug" value={s.slug} />
        <input type="hidden" name="status" value={abierta ? "closed" : "open"} />
        <button type="submit" className="btn btn-ghost btn-sm">
          {abierta ? "Cerrar ventas" : "Reabrir ventas"}
        </button>
      </form>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditando((v) => !v)}>
        {editando ? "Cerrar edición" : "Editar cupo y fechas"}
      </button>
      {confirmando ? (
        <>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={ocupado}
            style={{ color: "#b33517" }}
            onClick={async () => {
              setOcupado(true);
              setError("");
              const r = await updateSlot({ slotId: s.id, slug: s.slug, status: "cancelled" });
              if (!r.ok) {
                setError(r.error);
                setOcupado(false);
                return;
              }
              window.location.href = "/caminante/admin/salidas?ok=Salida%20cancelada.";
            }}
          >
            {ocupado ? "Cancelando…" : "Sí, cancelar la salida"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmando(false)}>
            No
          </button>
        </>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmando(true)}>
          Cancelar salida
        </button>
      )}
      <Link href={`/caminante/admin/eventos/${s.slug}`}>Ficha</Link>
      {error ? (
        <span style={{ color: "#b33517", fontSize: 12.5, flexBasis: "100%" }}>{error}</span>
      ) : null}
      {editando ? (
        <div style={{ flexBasis: "100%" }}>
          <EditarSalida s={s} onListo={() => setEditando(false)} />
        </div>
      ) : null}
    </div>
  );
}
