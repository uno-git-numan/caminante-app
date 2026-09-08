"use client";

// EL COTIZADOR — la cuenta de una salida ANTES de venderla.
//
// Es la misma cascada de Recursos, pero al revés: allá se lee lo que YA pasó,
// aquí se mueve el número de clientes y se ve qué pasaría. Corre el MISMO motor
// (`lib/admin/costeo`) que el panel, en el navegador, para que la tabla se mueva
// mientras escribes sin ir al servidor por cada tecla.
//
// El markup usa las primitivas del entregable de Claude Design (`.pgf`, `.mini`,
// `.cascade`, `.tbl`, `.chip`) igual que Ingresos y Egresos: el entregable no
// cubría esta pantalla, y armarla con clases nuevas la haría derivar del resto.

import { useMemo, useState } from "react";
import {
  cabezasDe,
  cascada,
  type Cortesia,
  type LineaCosto,
  type Modo,
} from "@/lib/admin/costeo";
import type { Regla } from "@/lib/operadores/comision";
import type { OperadorConRegla, SalidaCotizable } from "@/lib/admin/cotizacion";

const mx = (n: number) => "$" + Math.round(Math.abs(n)).toLocaleString("es-MX");
const pct = (n: number) => (n * 100).toFixed(2) + "%";

const MODOS: { v: Modo; l: string; ayuda: string }[] = [
  { v: "unico", l: "Monto único", ayuda: "se paga completo, vaya quien vaya" },
  { v: "por_persona", l: "Por persona", ayuda: "una tarifa fija por cabeza" },
  { v: "tarifa_por_tramo", l: "Tarifa por tramo", ayuda: "la tarifa POR CABEZA baja al llegar a N cabezas" },
  { v: "desde_personas", l: "Escalón", ayuda: "un monto total distinto según cuántos van" },
  { v: "porcentaje", l: "Porcentaje", ayuda: "un % sobre los demás costos (buffer)" },
];

const LINEA_NUEVA: LineaCosto = { concepto: "", tipo: "variable", modo: "por_persona", tarifaMxn: 0 };

export default function Cotizador({
  salidas,
  operadores,
}: {
  salidas: SalidaCotizable[];
  operadores: OperadorConRegla[];
}) {
  const [operatorId, setOperatorId] = useState<string>("");
  const [traeCliente, setTraeCliente] = useState(false);
  const [publico, setPublico] = useState(13500);
  const [clientes, setClientes] = useState(12);
  const [cortesias, setCortesias] = useState<Cortesia[]>([{ rol: "guía", cuantas: 2, descuentoPct: 50 }]);
  const [costos, setCostos] = useState<LineaCosto[]>([{ ...LINEA_NUEVA }]);
  const [copiado, setCopiado] = useState(false);

  const op = operadores.find((o) => o.id === operatorId);

  // La regla sale del operador; el interruptor solo elige ESCALA, y solo cuando
  // no hay número pactado. Con convenio firmado el % está congelado y ninguna
  // casilla de esta pantalla puede moverlo — decirlo en voz alta abajo.
  const regla: Regla = useMemo(() => {
    if (op?.regla.tipo === "plano") return op.regla;
    return { tipo: "escala", escala: traeCliente && op ? "plataforma" : "venta" };
  }, [op, traeCliente]);

  const c = useMemo(
    () => cascada({ clientes, cortesias, costos, publicoPorPersona: publico, regla }),
    [clientes, cortesias, costos, publico, regla],
  );

  // La tabla que se manda por WhatsApp: de la mitad del grupo al doble.
  const escenarios = useMemo(() => {
    const desde = Math.max(1, Math.floor(clientes / 2));
    const hasta = clientes + 6;
    const out = [];
    for (let n = desde; n <= hasta; n++) {
      out.push({ n, ...cascada({ clientes: n, cortesias, costos, publicoPorPersona: publico, regla }) });
    }
    return out;
  }, [clientes, cortesias, costos, publico, regla]);

  const equilibrio = escenarios.find((e) => e.queda >= 0)?.n ?? null;

  function cargar(slotId: string) {
    const s = salidas.find((x) => x.slotId === slotId);
    if (!s) return;
    setOperatorId(s.operatorId ?? "");
    setPublico(s.precioMxn || 0);
    setClientes(s.cupo || 10);
    setCortesias(s.cortesias.length ? s.cortesias : []);
    setCostos(s.costos.length ? s.costos : [{ ...LINEA_NUEVA }]);
  }

  function editar(i: number, patch: Partial<LineaCosto>) {
    setCostos((xs) => xs.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  }

  const texto = () =>
    [
      `${mx(publico)} por persona.`,
      "",
      ...escenarios.map(
        (e) => `${e.n} clientes → queda ${mx(e.queda)} (${mx(e.queda / e.n)} por cliente)`,
      ),
      "",
      equilibrio ? `Con ${equilibrio} clientes ya no se pierde.` : "Todavía no llega a cero.",
    ].join("\n");

  return (
    <>
      <section className="sec card">
        <div className="card-head">
          <span className="card-lbl">La cotización</span>
          <p className="card-desc">
            Escribe los costos como te los da el proveedor. La tabla de abajo se mueve sola.
          </p>
        </div>

        <div className="pgf" style={{ padding: "0 22px 4px" }}>
          <label>
            <span className="k">Partir de una salida</span>
            <select defaultValue="" onChange={(e) => e.target.value && cargar(e.target.value)}>
              <option value="">— en blanco —</option>
              {salidas.map((s) => (
                <option key={s.slotId} value={s.slotId}>
                  {s.experiencia} · {s.salida}
                </option>
              ))}
            </select>
            <span className="h">trae su precio, su cupo y sus costos ya cargados</span>
          </label>

          <label>
            <span className="k">Operador</span>
            <select value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
              <option value="">De la casa (Caminante)</option>
              {operadores.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
            <span className="h">
              {op
                ? op.origen === "convenio"
                  ? `convenio firmado · ${op.regla.tipo === "plano" ? op.regla.pct + "%" : "escala"} congelado`
                  : op.origen === "pactada"
                    ? `pactado sin firmar · ${op.regla.tipo === "plano" ? op.regla.pct + "%" : "escala"}`
                    : "sin convenio · aplica la escala de la casa"
                : "la venta es de Caminante"}
            </span>
          </label>

          <label>
            <span className="k">¿El operador trae al cliente?</span>
            <select
              value={traeCliente ? "si" : "no"}
              onChange={(e) => setTraeCliente(e.target.value === "si")}
              disabled={!op || op.regla.tipo === "plano"}
            >
              <option value="no">No · lo vende Caminante</option>
              <option value="si">Sí · Caminante solo es plataforma</option>
            </select>
            <span className="h">
              {op?.regla.tipo === "plano"
                ? "no aplica: su % ya está pactado"
                : "si lo trae él, la comisión baja"}
            </span>
          </label>

          <label>
            <span className="k">Precio público por persona</span>
            <input
              type="number"
              value={publico}
              min={0}
              onChange={(e) => setPublico(Number(e.target.value) || 0)}
            />
            <span className="h">con IVA, lo que paga el cliente</span>
          </label>

          <label>
            <span className="k">Clientes que pagan</span>
            <input
              type="number"
              value={clientes}
              min={1}
              onChange={(e) => setClientes(Math.max(1, Number(e.target.value) || 1))}
            />
            <span className="h">{c.cabezas} cabezas contando cortesías</span>
          </label>
        </div>

        {/* CORTESÍAS. Los guías no pagan boleto pero SÍ cuestan cama y comida,
            y —esto es lo que se olvida— cuentan para el tramo del proveedor. */}
        <div style={{ padding: "10px 22px 0" }}>
          <span className="card-lbl">
            Quién va sin pagar <span className="m">· cuenta para el tramo del proveedor</span>
          </span>
          {cortesias.map((k, i) => (
            <div className="pgf" key={i}>
              <label>
                <span className="k">Rol</span>
                <input
                  value={k.rol}
                  onChange={(e) =>
                    setCortesias((xs) => xs.map((x, j) => (j === i ? { ...x, rol: e.target.value } : x)))
                  }
                />
              </label>
              <label>
                <span className="k">Cuántos</span>
                <input
                  type="number"
                  value={k.cuantas}
                  min={0}
                  onChange={(e) =>
                    setCortesias((xs) =>
                      xs.map((x, j) => (j === i ? { ...x, cuantas: Number(e.target.value) || 0 } : x)),
                    )
                  }
                />
              </label>
              <label>
                <span className="k">Descuento %</span>
                <input
                  type="number"
                  value={k.descuentoPct}
                  min={0}
                  max={100}
                  onChange={(e) =>
                    setCortesias((xs) =>
                      xs.map((x, j) => (j === i ? { ...x, descuentoPct: Number(e.target.value) || 0 } : x)),
                    )
                  }
                />
                <span className="h">100 = no cuesta nada</span>
              </label>
              <label>
                <span className="k">&nbsp;</span>
                <button
                  type="button"
                  className="btn btn-glass btn-sm"
                  onClick={() => setCortesias((xs) => xs.filter((_, j) => j !== i))}
                >
                  Quitar
                </button>
              </label>
            </div>
          ))}
          <div className="actrow">
            <button
              type="button"
              className="btn btn-glass btn-sm"
              onClick={() => setCortesias((xs) => [...xs, { rol: "", cuantas: 1, descuentoPct: 100 }])}
            >
              + Alguien sin pagar
            </button>
          </div>
        </div>

        {/* COSTOS */}
        <div style={{ padding: "18px 22px 22px" }}>
          <span className="card-lbl">Lo que cuesta</span>
          {costos.map((l, i) => (
            <div
              key={i}
              style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 4 }}
            >
              <div className="pgf">
                <label className="ancho" style={{ gridColumn: "span 2" }}>
                  <span className="k">Concepto</span>
                  <input
                    value={l.concepto}
                    placeholder="Hacienda San Andrés"
                    onChange={(e) => editar(i, { concepto: e.target.value })}
                  />
                </label>
                <label>
                  <span className="k">Tipo</span>
                  <select
                    value={l.tipo}
                    onChange={(e) => editar(i, { tipo: e.target.value as LineaCosto["tipo"] })}
                  >
                    <option value="variable">variable</option>
                    <option value="fijo">fijo</option>
                    <option value="buffer">buffer</option>
                  </select>
                </label>
                <label>
                  <span className="k">Cómo se cobra</span>
                  <select value={l.modo} onChange={(e) => editar(i, { modo: e.target.value as Modo })}>
                    {MODOS.map((m) => (
                      <option key={m.v} value={m.v}>
                        {m.l}
                      </option>
                    ))}
                  </select>
                  <span className="h">{MODOS.find((m) => m.v === l.modo)?.ayuda}</span>
                </label>
                <label>
                  <span className="k">&nbsp;</span>
                  <button
                    type="button"
                    className="btn btn-glass btn-sm"
                    onClick={() => setCostos((xs) => xs.filter((_, j) => j !== i))}
                  >
                    Quitar
                  </button>
                </label>
              </div>

              <div className="pgf">
                {l.modo === "unico" ? (
                  <label>
                    <span className="k">Monto total</span>
                    <input
                      type="number"
                      value={l.montoMxn ?? 0}
                      onChange={(e) => editar(i, { montoMxn: Number(e.target.value) || 0 })}
                    />
                  </label>
                ) : null}

                {l.modo === "por_persona" ? (
                  <label>
                    <span className="k">Tarifa por persona</span>
                    <input
                      type="number"
                      value={l.tarifaMxn ?? 0}
                      onChange={(e) => editar(i, { tarifaMxn: Number(e.target.value) || 0 })}
                    />
                  </label>
                ) : null}

                {l.modo === "porcentaje" ? (
                  <label>
                    <span className="k">Porcentaje</span>
                    <input
                      type="number"
                      value={l.porcentaje ?? 0}
                      onChange={(e) => editar(i, { porcentaje: Number(e.target.value) || 0 })}
                    />
                    <span className="h">sobre los demás costos</span>
                  </label>
                ) : null}

                {l.modo === "tarifa_por_tramo" || l.modo === "desde_personas" ? (
                  <div className="ancho">
                    <span className="k">
                      {l.modo === "tarifa_por_tramo"
                        ? "Tramos · desde cuántas CABEZAS y qué tarifa por cabeza"
                        : "Escalones · desde cuántas cabezas y qué monto TOTAL"}
                    </span>
                    {((l.modo === "tarifa_por_tramo" ? l.tramos : l.escalones) ?? []).map((t, k) => (
                      <div className="pgf" key={k} style={{ marginTop: 6 }}>
                        <label>
                          <span className="k">Desde</span>
                          <input
                            type="number"
                            value={t.desde}
                            onChange={(e) => {
                              const v = Number(e.target.value) || 0;
                              if (l.modo === "tarifa_por_tramo")
                                editar(i, {
                                  tramos: (l.tramos ?? []).map((x, j) => (j === k ? { ...x, desde: v } : x)),
                                });
                              else
                                editar(i, {
                                  escalones: (l.escalones ?? []).map((x, j) => (j === k ? { ...x, desde: v } : x)),
                                });
                            }}
                          />
                        </label>
                        <label>
                          <span className="k">{l.modo === "tarifa_por_tramo" ? "Tarifa" : "Monto"}</span>
                          <input
                            type="number"
                            value={"tarifa" in t ? t.tarifa : t.monto}
                            onChange={(e) => {
                              const v = Number(e.target.value) || 0;
                              if (l.modo === "tarifa_por_tramo")
                                editar(i, {
                                  tramos: (l.tramos ?? []).map((x, j) => (j === k ? { ...x, tarifa: v } : x)),
                                });
                              else
                                editar(i, {
                                  escalones: (l.escalones ?? []).map((x, j) => (j === k ? { ...x, monto: v } : x)),
                                });
                            }}
                          />
                        </label>
                        <label>
                          <span className="k">&nbsp;</span>
                          <button
                            type="button"
                            className="btn btn-glass btn-sm"
                            onClick={() =>
                              l.modo === "tarifa_por_tramo"
                                ? editar(i, { tramos: (l.tramos ?? []).filter((_, j) => j !== k) })
                                : editar(i, { escalones: (l.escalones ?? []).filter((_, j) => j !== k) })
                            }
                          >
                            Quitar
                          </button>
                        </label>
                      </div>
                    ))}
                    <div className="actrow">
                      <button
                        type="button"
                        className="btn btn-glass btn-sm"
                        onClick={() =>
                          l.modo === "tarifa_por_tramo"
                            ? editar(i, { tramos: [...(l.tramos ?? []), { desde: 1, tarifa: 0 }] })
                            : editar(i, { escalones: [...(l.escalones ?? []), { desde: 1, monto: 0 }] })
                        }
                      >
                        + Tramo
                      </button>
                    </div>
                  </div>
                ) : null}

                {l.modo !== "unico" && l.modo !== "porcentaje" && l.modo !== "desde_personas" ? (
                  <label>
                    <span className="k">¿Lo toman todos?</span>
                    <select
                      value={l.proporcion == null ? "" : String(l.proporcion)}
                      onChange={(e) =>
                        editar(i, { proporcion: e.target.value === "" ? null : Number(e.target.value) })
                      }
                    >
                      <option value="">Todos (y las cortesías)</option>
                      <option value="0.75">Tres cuartas partes</option>
                      <option value="0.5">La mitad</option>
                      <option value="0.25">Una cuarta parte</option>
                    </select>
                    <span className="h">
                      {l.proporcion == null
                        ? "cama y comida: los guías también"
                        : `${Math.ceil(clientes * l.proporcion)} de ${clientes} clientes · sin cortesías`}
                    </span>
                  </label>
                ) : null}
              </div>
            </div>
          ))}
          <div className="actrow">
            <button
              type="button"
              className="btn btn-glass btn-sm"
              onClick={() => setCostos((xs) => [...xs, { ...LINEA_NUEVA }])}
            >
              + Costo
            </button>
          </div>
        </div>
      </section>

      {/* LA CUENTA */}
      <section className="sec card">
        <div className="card-head">
          <span className="card-lbl">
            La cuenta con {clientes} {clientes === 1 ? "cliente" : "clientes"}
            <span className="m"> · {c.cabezas} cabezas</span>
          </span>
        </div>
        <div className="mini">
          <div>
            <div className="l">Cobras</div>
            <div className="v">{mx(c.cobrado)}</div>
            <div className="g">{mx(c.iva)} es IVA que le trasladas al SAT</div>
          </div>
          <div>
            <div className="l">Costos</div>
            <div className="v">{mx(c.costosDuros)}</div>
            <div className="g">{mx(c.costosDuros / Math.max(1, clientes))} por cliente</div>
          </div>
          <div>
            <div className="l">Comisión Caminante</div>
            <div className="v">{mx(c.comision)}</div>
            <div className="g">
              {pct(c.pctComision)} efectivo ·{" "}
              {regla.tipo === "plano" ? `${regla.pct}% pactado` : `escala ${regla.escala}`}
            </div>
          </div>
          <div>
            <div className="l">Queda</div>
            <div className={"v " + (c.queda < 0 ? "neg" : "pos")}>
              {c.queda < 0 ? "−" : ""}
              {mx(c.queda)}
            </div>
            <div className="g">
              {(c.margen * 100).toFixed(1)}% de la base · {mx(c.queda / Math.max(1, clientes))} por cliente
            </div>
          </div>
        </div>

        <div style={{ padding: "0 22px 20px" }}>
          <div className="cascade">
            <div className="crow" style={{ cursor: "default" }}>
              <div>
                <div className="t">Base gravable</div>
                <div className="d">lo cobrado menos el IVA</div>
              </div>
              <div className="n">{mx(c.base)}</div>
              <span />
            </div>
            {c.lineas.map((l, i) => (
              <div className="crow" key={i} style={{ cursor: "default" }}>
                <div>
                  <div className="t">{l.concepto || "(sin nombre)"}</div>
                  <div className="d">{l.tipo}</div>
                </div>
                <div className="n neg">−{mx(l.monto)}</div>
                <span />
              </div>
            ))}
            <div className="crow crow--util">
              <div>
                <div className="t">Queda para el operador</div>
              </div>
              <div className={"n " + (c.queda < 0 ? "neg" : "")}>
                {c.queda < 0 ? "−" : ""}
                {mx(c.queda)}
              </div>
              <span />
            </div>
          </div>
        </div>
      </section>

      {/* CLIENTES vs UTILIDAD */}
      <section className="sec card">
        <div className="card-head">
          <span className="card-lbl">
            Clientes y utilidad <span className="m">· a {mx(publico)} por persona</span>
          </span>
          <div className="legend">
            <button type="button" className="btn btn-glass btn-sm" onClick={() => { void navigator.clipboard.writeText(texto()); setCopiado(true); }}>
              {copiado ? "Copiado" : "Copiar para WhatsApp"}
            </button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Clientes</th>
                <th className="right">Cabezas</th>
                <th className="right">Cobras</th>
                <th className="right">Costos</th>
                <th className="right">Comisión</th>
                <th className="right">Queda</th>
                <th className="right">Por cliente</th>
              </tr>
            </thead>
            <tbody>
              {escenarios.map((e) => (
                <tr
                  key={e.n}
                  className={e.n === clientes ? "is-best" : e.queda < 0 ? "is-crit" : ""}
                >
                  <td className="c">{e.n}</td>
                  <td className="num right">{e.cabezas}</td>
                  <td className="num right">{mx(e.cobrado)}</td>
                  <td className="num right">−{mx(e.costosDuros)}</td>
                  <td className="num right">−{mx(e.comision)}</td>
                  <td className={"num right " + (e.queda < 0 ? "neg" : "pos")}>
                    {e.queda < 0 ? "−" : ""}
                    {mx(e.queda)}
                  </td>
                  <td className="num right">{mx(e.queda / e.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="notes" style={{ padding: "12px 22px 18px" }}>
          {equilibrio ? (
            <span className="chip c-paid chip-sm">Con {equilibrio} clientes deja de perder</span>
          ) : (
            <span className="chip c-full chip-sm">Con este precio no llega a cero en todo el rango</span>
          )}
          <span className="chip c-info chip-sm">
            {cabezasDe(clientes, cortesias) - clientes} cabezas van sin pagar
          </span>
          {costos.some((l) => l.modo === "tarifa_por_tramo") ? (
            <span className="chip c-var chip-sm">
              El tramo se mide en CABEZAS — confirma con el proveedor si cuenta a los guías
            </span>
          ) : null}
        </div>
      </section>
    </>
  );
}
