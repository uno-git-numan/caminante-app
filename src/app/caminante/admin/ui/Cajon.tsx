"use client";

// EL CAJÓN — la ficha entra por la derecha y la lista se atenúa.
//
// Sus reglas llevaban aquí desde la transcripción y NO LAS USABA NADIE. Picar
// una operadora no abría nada, y en la Biblioteca abría un velo huérfano: la
// pantalla gris que reportó Luis. `.gnficha` no es un cajón —es `background:#fff`
// y nada más—, así que el velo se pintaba contra un ancestro lejano y tapaba
// todo, con la ficha detrás.
//
// El contrato lo pone el CSS y aquí sólo se cumple:
//   .cmstage         position:relative — SIN esto el velo no tiene contra qué medir
//   .cmveil          inset:0, z-4, atenúa y al picarlo cierra
//   .cmpanel.layer   absolute a la derecha, z-8, alto completo
//   .cmstage.shut    esconde velo y panel cuando no hay nada abierto
//
// Es cliente porque «cuál está abierta» es estado de pantalla: abrir una ficha
// no debería recargar el servidor ni ensuciar la URL.

import { useState, type ReactNode } from "react";

export type FichaCajon = {
  iniciales: string;
  titulo: string;
  /** Va bajo el título: RFC, ciudad, la línea de identidad. */
  subtitulo: ReactNode;
  /** La banda verde: qué es esto. */
  banda: ReactNode;
  /** A la derecha de la banda, si hay algo que decir del estado. */
  bandaDer?: ReactNode;
  cuerpo: ReactNode;
};

export default function Cajon({
  abierta,
  cerrar,
  ficha,
  children,
  alto = 660,
}: {
  abierta: boolean;
  cerrar: () => void;
  ficha: FichaCajon | null;
  /** La lista. Va dentro de .gnstack, que el CSS ancla al escenario. */
  children: ReactNode;
  alto?: number;
}) {
  const puesto = abierta && ficha;

  return (
    <div className={puesto ? "cmstage" : "cmstage shut"} style={{ height: alto }}>
      {/* El escenario es alto fijo y `overflow:hidden` por diseño: es lo que
          deja al panel anclado sin que la página entera se mueva bajo él. Pero
          esconder clientes no es una decisión de diseño, así que la lista
          scrollea por dentro en vez de recortarse. */}
      <div className="gnstack" style={{ overflowY: "auto" }}>
        {children}
      </div>

      {puesto ? (
        <div className="cmveil" onClick={cerrar}>
          <span>Picar la lista cierra</span>
        </div>
      ) : null}

      {puesto ? (
        <aside className="cmpanel layer">
          <div className="cmpanel-hd">
            <span className="av">{ficha.iniciales}</span>
            <span className="g">
              <b>{ficha.titulo}</b>
              <small>{ficha.subtitulo}</small>
            </span>
            <button type="button" className="x" onClick={cerrar} aria-label="Cerrar">
              ×
            </button>
          </div>
          <div className="cmpanel-st">
            <span className="n">{"//"}</span>
            {ficha.banda}
            {ficha.bandaDer ? <span className="mv">{ficha.bandaDer}</span> : null}
          </div>
          <div className="cmpanel-bd">{ficha.cuerpo}</div>
        </aside>
      ) : null}
    </div>
  );
}
