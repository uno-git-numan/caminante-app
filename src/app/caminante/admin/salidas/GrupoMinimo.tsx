"use client";

// EL GRUPO MÍNIMO DE UNA SALIDA (D26 de legal: la cláusula de cupo mínimo).
//
// Si una salida necesita un mínimo de personas para salir, aquí se captura el
// mínimo y la FECHA DE CONFIRMACIÓN: el día a más tardar en que al cliente se
// le confirma que sale, o se le cancela por falta de grupo. Con los dos datos
// —y la fecha dentro del plazo que marca la duración de la salida— el cliente
// lo ve antes de pagar, y cancelar por falta de grupo en plazo devuelve el
// 100 % sin la bonificación del 20 %.
//
// Tres cosas que la pantalla no esconde:
//   · Si la fecha queda fuera del plazo, se guarda pero la cláusula NO se
//     enseña, y cancelar por falta de grupo sigue costando la bonificación.
//   · Con personas que ya pagaron viendo la cláusula, el mínimo no sube y la
//     fecha no se atrasa (lo frena el servidor y, debajo, la base).
//   · Confirmar es un compromiso: una salida confirmada ya no se cancela por
//     falta de grupo.
//
// La ven la casa y la operadora de la salida. Cancelar por cupo vive en
// «Reembolsar o cancelar», que es sólo de la casa.

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Salida } from "@/lib/admin/salidas";
import { confirmarSalidaAction, guardarClausulaDeSalida } from "@/lib/cancelacion/cupo-actions";
import { fechaConAnio } from "@/lib/cancelacion/politica";

export function GrupoMinimo({ s }: { s: Salida }) {
  const g = s.grupoMinimo;
  const router = useRouter();
  const [minimo, setMinimo] = useState(g.minimo != null ? String(g.minimo) : "");
  const [limite, setLimite] = useState(g.limite ?? "");
  const [ocupado, setOcupado] = useState<"" | "guardar" | "confirmar">("");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [seguro, setSeguro] = useState(false);

  const confirmada = !!g.confirmadaAt;
  const seJunto = g.minimo != null && g.pagados >= g.minimo;
  const fueraDelPiso = !!limite && !!g.ultimoDia && limite > g.ultimoDia;

  return (
    <div className="card pad" style={{ marginTop: 14 }}>
      <span className="subtitle">Grupo mínimo</span>
      <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 4 }}>
        Si esta salida necesita un mínimo de personas para salir, ponlo aquí con la fecha en que le confirmas al
        grupo. El cliente lo ve antes de pagar. Si para esa fecha no se juntó y cancelas <b>ese día o antes</b>, se
        devuelve el 100 % <b>sin</b> la bonificación del 20 %. Sin estos datos, o cancelando después, cancelar por falta
        de grupo cuenta como causa de quien opera.
      </p>

      <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 10 }}>
        {confirmada ? (
          <>
            <b>Salida confirmada.</b> Ya no se cancela por falta de grupo.
          </>
        ) : g.minimo == null ? (
          <>Esta salida no tiene grupo mínimo.</>
        ) : (
          <>
            <b>
              {g.pagados} de {g.minimo}
            </b>{" "}
            lugares pagados
            {g.limite ? <> · se confirma a más tardar el <b>{fechaConAnio(g.limite)}</b></> : null}
            {seJunto ? <> · <b>ya se juntó: confirma la salida.</b></> : null}
          </>
        )}
      </p>
      {!confirmada && g.minimo != null ? (
        <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 2, color: g.activa ? undefined : "#b33517" }}>
          {g.activa ? "El cliente ve esta condición antes de pagar." : `El cliente NO ve esta condición: ${g.porque}`}
        </p>
      ) : null}

      {!confirmada ? (
        <>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 }}>
            <label className="mut" style={{ fontSize: 12.5 }}>
              Mínimo de personas
              <br />
              <input
                inputMode="numeric"
                value={minimo}
                onChange={(e) => setMinimo(e.target.value.replace(/\D/g, ""))}
                placeholder="sin mínimo"
                style={{ width: 110 }}
              />
            </label>
            <label className="mut" style={{ fontSize: 12.5 }}>
              Te confirmamos a más tardar el
              <br />
              <input type="date" value={limite} max={g.ultimoDia ?? undefined} onChange={(e) => setLimite(e.target.value)} />
            </label>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!!ocupado}
              onClick={async () => {
                setOcupado("guardar");
                setAviso(null);
                const r = await guardarClausulaDeSalida(s.id, minimo, limite);
                setOcupado("");
                if (!r.ok) { setAviso({ ok: false, texto: r.error }); return; }
                setAviso(
                  r.estado.activa
                    ? { ok: true, texto: "Guardado. Desde ahora el cliente lo ve antes de pagar." }
                    : { ok: r.estado.razon === "sin-datos", texto: `Guardado, pero el cliente no verá la condición: ${r.estado.porque}` },
                );
                router.refresh();
              }}
            >
              {ocupado === "guardar" ? "Guardando…" : "Guardar"}
            </button>
          </div>
          {g.ultimoDia ? (
            <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 6, color: fueraDelPiso ? "#b33517" : undefined }}>
              Para esta salida la fecha tiene que ser a más tardar el <b>{fechaConAnio(g.ultimoDia)}</b>: {g.regla}. Puedes
              poner una más temprana, nunca más tardía.
            </p>
          ) : null}

          <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 12 }}>
            <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              <b>Confirmar la salida</b> le avisa por correo a todos los que ya pagaron que la salida se hace. Es un
              compromiso: después ya no se puede cancelar por falta de grupo. Si llega la fecha con el mínimo cubierto,
              se confirma sola. <b>Y si termina ese día sin que confirmes ni canceles, queda confirmada sola</b>, aunque
              no se haya juntado: al cliente se le prometió una respuesta ese día. Te avisamos por correo la víspera y
              esa mañana.
            </p>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
              {!seguro ? (
                <button type="button" className="btn btn-ghost btn-sm" disabled={!!ocupado} onClick={() => setSeguro(true)}>
                  Confirmar salida
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-orange btn-sm"
                    disabled={!!ocupado}
                    onClick={async () => {
                      setOcupado("confirmar");
                      setAviso(null);
                      const r = await confirmarSalidaAction(s.id);
                      setOcupado("");
                      setSeguro(false);
                      setAviso(r.ok ? { ok: true, texto: r.mensaje } : { ok: false, texto: r.error });
                      if (r.ok) router.refresh();
                    }}
                  >
                    {ocupado === "confirmar" ? "Confirmando…" : "Sí, confirmar y avisar al grupo"}
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={!!ocupado} onClick={() => setSeguro(false)}>
                    No
                  </button>
                  {g.minimo != null && !seJunto ? (
                    <span className="mut" style={{ fontSize: 12.5 }}>
                      Todavía no se junta el mínimo ({g.pagados} de {g.minimo}): confirmar ahora es decidir que sale de todos modos.
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </>
      ) : null}

      {aviso ? (
        <p style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 12, color: aviso.ok ? "var(--olive)" : "#b33517" }}>{aviso.texto}</p>
      ) : null}
    </div>
  );
}
