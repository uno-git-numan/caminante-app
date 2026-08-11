// INGRESOS y EGRESOS — el MISMO formato visual que «Fechas y equilibrio».
//
// ⚠️ Lección de la primera versión (Luis, 11 ago: «se ve traslapado, se ve
// sucio, quita las flechitas»): yo había usado `.dtl` como si fuera un
// desplegable. **No lo es.** En el entregable de Claude Design `.dtl` es el
// CONTENEDOR de la tabla de detalle que vive DENTRO de un desplegable. Usarlo
// como envoltura anidada apilaba paddings —de ahí el traslape— y dejaba a la
// vista el triángulo nativo de <details> encima de la `.chev2` del diseño.
//
// El patrón correcto es el de la escalera:
//   .scroller > .ladder
//     .row.row--head                                        ← rejilla COMPARTIDA
//     <details><summary class="row row--mes" --depth:0>      ← nivel 1
//       <details><summary class="row row--sal" --depth:1>    ← nivel 2
//         <div class="drawer">
//           .cascade > details > summary.crow → .dtl > table ← nivel 3
//
// La rejilla se comparte a propósito: una columna se lee de arriba a abajo
// aunque cambie la agrupación. Aquí las dos secciones agrupan por EXPERIENCIA
// (la escalera agrupa por mes), que es lo que pidió Luis.

import Link from "next/link";
import { formatMXN, type LedgerLinea, type PayoutOperador } from "@/lib/admin/queries";
import type { SalidaRentabilidad } from "@/lib/admin/rentabilidad";
import { mx } from "./ui";

/** Agrupa las salidas por experiencia. */
function porExperiencia(salidas: SalidaRentabilidad[]) {
  const m = new Map<string, SalidaRentabilidad[]>();
  for (const s of salidas) m.set(s.experienciaNombre, [...(m.get(s.experienciaNombre) || []), s]);
  return [...m.entries()].map(([nombre, ss]) => ({
    nombre,
    ss: [...ss].sort((a, b) => (b.startsAt || "").localeCompare(a.startsAt || "")),
    ingreso: ss.reduce((a, s) => a + s.ingreso, 0),
    pagos: ss.reduce((a, s) => a + s.pagos.length, 0),
    costos: ss.reduce((a, s) => a + s.proveedoresConIva, 0),
    lineas: ss.reduce((a, s) => a + s.costos.length, 0),
  }));
}

// Estas dos secciones NO llevan las columnas de la escalera (llenado, IVA,
// Stripe, proveedores, utilidad): aquí la pregunta es «quién pagó qué» y «a
// quién se le paga», no la rentabilidad — esa ya vive arriba, en «Fechas y
// equilibrio». Con `.ladder--simple` la fila es nombre · monto · chevron.

// ── INGRESOS ─────────────────────────────────────────────────────────────

export function Ingresos({
  salidas,
  payouts,
  huerfanos,
}: {
  salidas: SalidaRentabilidad[];
  payouts: PayoutOperador[];
  huerfanos: LedgerLinea[];
}) {
  const grupos = porExperiencia(salidas).sort((a, b) => b.ingreso - a.ingreso);

  return (
    <>
      <section className="sec card">
        <div className="card-head">
          <span className="card-lbl">
            Ingresos <span className="m">· quién pagó, en qué salida</span>
          </span>
        </div>
        <div className="scroller">
          <div className="ladder ladder--simple">
            {grupos.map((g) => (
              <details key={g.nombre}>
                <summary className="row row--mes" style={{ ["--depth" as string]: 0 }}>
                  <div className="c-name">
                    <div className="mes-lbl">{g.nombre}</div>
                    <div className="sub">
                      {g.ss.length} {g.ss.length === 1 ? "salida" : "salidas"} · {g.pagos}{" "}
                      {g.pagos === 1 ? "pago" : "pagos"}
                    </div>
                  </div>
                  <div className="money">{mx(g.ingreso)}</div>
                  <span className="chev2">▼</span>
                </summary>

                {g.ss.map((s) => (
                  <details key={s.slotId}>
                    <summary className="row row--sal" style={{ ["--depth" as string]: 1 }}>
                      <div className="c-name">
                        <div className="sal-lbl">{s.salidaLabel}</div>
                        <div className="sub">
                          {s.pagos.length} {s.pagos.length === 1 ? "pago" : "pagos"} · {s.vendidos}{" "}
                          {s.vendidos === 1 ? "persona" : "personas"}
                        </div>
                      </div>
                      <div className="money">{mx(s.ingreso)}</div>
                      <span className="chev2">▼</span>
                    </summary>
                    <div className="drawer">
                      <Link className="btn btn-glass btn-sm" href={`/caminante/admin/roster/${s.slotId}`}>
                        Ver el roster de esta salida <span className="arw">↗</span>
                      </Link>
                      <div className="cascade">
                        <details>
                          <summary className="crow">
                            <div>
                              <div className="t">Pagos de esta salida</div>
                              <div className="d">
                                {s.pagos.length} {s.pagos.length === 1 ? "cobro" : "cobros"}
                                {s.reembolsado > 0 ? ` · ${mx(s.reembolsado)} reembolsados` : ""}
                              </div>
                            </div>
                            <div className="n">{mx(s.ingreso)}</div>
                            <span className="chev2">▼</span>
                          </summary>
                          <div className="dtl">
                            <table>
                              <tbody>
                                <tr>
                                  <th>Fecha</th>
                                  <th>Persona</th>
                                  <th>Método</th>
                                  <th className="right">Monto</th>
                                  <th>Respaldo</th>
                                </tr>
                                {s.pagos.map((p, i) => (
                                  <tr key={i}>
                                    <td className="c">{p.fecha}</td>
                                    <td>
                                      {p.persona}
                                      {p.estado !== "paid" ? (
                                        <span className="c">
                                          {" "}
                                          · {p.estado === "refunded" ? "reembolsado" : p.estado}
                                        </span>
                                      ) : null}
                                    </td>
                                    <td className="c">{p.metodo}</td>
                                    <td
                                      className="num right"
                                      style={
                                        p.estado === "refunded"
                                          ? { textDecoration: "line-through" }
                                          : undefined
                                      }
                                    >
                                      {mx(p.monto)}
                                    </td>
                                    <td className="c">
                                      {p.referencia ? <span>ref. {p.referencia}</span> : null}
                                      {p.comprobantePath ? (
                                        <>
                                          {p.referencia ? " · " : null}
                                          {/* URL firmada de 5 min: el bucket es privado. */}
                                          <a
                                            href={`/caminante/api/admin/comprobante?path=${encodeURIComponent(p.comprobantePath)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                          >
                                            comprobante
                                          </a>
                                        </>
                                      ) : null}
                                      {!p.referencia && !p.comprobantePath ? "—" : null}
                                    </td>
                                  </tr>
                                ))}
                                {!s.pagos.length ? (
                                  <tr>
                                    <td className="c" colSpan={5}>
                                      Sin pagos capturados en esta salida.
                                    </td>
                                  </tr>
                                ) : null}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      </div>
                    </div>
                  </details>
                ))}
              </details>
            ))}
            {!grupos.length ? (
              <div className="row">
                <div className="c-name">Todavía no hay ingresos.</div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="sec card">
        <div className="card-head">
          <span className="card-lbl">
            Payout por operador <span className="m">· lo que se le deposita a cada quien</span>
          </span>
        </div>
        <div className="scroller">
          <div className="ladder ladder--simple">
            {payouts.map((p) => (
              <details key={p.operador}>
                <summary className="row row--mes" style={{ ["--depth" as string]: 0 }}>
                  <div className="c-name">
                    <div className="mes-lbl">{p.operador}</div>
                    <div className="sub">{p.email}</div>
                  </div>
                  <div className="money">{formatMXN(p.bruto)}</div>
                  {/* Nunca se inventa un neto: sin el % congelado se dice, en
                      vez de proponer que se deposite el 100% del bruto. */}
                  <div className="money money--util">
                    {p.neto != null ? (
                      formatMXN(p.neto)
                    ) : (
                      <span className="neg">{p.sinAtribuir ? "sin atribuir" : "por definir"}</span>
                    )}
                  </div>
                  <span className="chev2">▼</span>
                </summary>
                <div className="drawer">
                  <div className="cascade">
                    <details>
                      <summary className="crow">
                        <div>
                          <div className="t">Cálculo</div>
                          <div className="d">bruto, comisión y neto</div>
                        </div>
                        <div className="n">{formatMXN(p.bruto)}</div>
                        <span className="chev2">▼</span>
                      </summary>
                      <div className="dtl">
                        <table>
                          <tbody>
                            <tr>
                              <th>Concepto</th>
                              <th>Nota</th>
                              <th className="right">Monto</th>
                            </tr>
                            {p.lineas.map((l, j) => (
                              <tr key={j}>
                                <td className="c">{l.concepto}</td>
                                <td className="c">{l.nota}</td>
                                <td className="num right">{formatMXN(l.monto)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </div>
                  {p.sinAtribuir ? (
                    <p className="notes">
                      Estas ventas no tienen operador asignado, así que no entran en ningún payout.
                      Asígnales operador en Eventos.
                    </p>
                  ) : p.brutoSinPct ? (
                    <p className="notes">
                      No hay neto porque {formatMXN(p.brutoSinPct)} se vendió sin comisión congelada.
                      Define la comisión del operador para las ventas futuras; las pasadas se
                      acuerdan a mano.
                    </p>
                  ) : null}
                </div>
              </details>
            ))}
            {!payouts.length ? (
              <div className="row">
                <div className="c-name">Sin ventas atribuidas a operadores.</div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Un pago siempre cuelga de una reserva. Si algo cae aquí es un dato
          roto y hay que verlo, así que se muestra en vez de esconderse. */}
      {huerfanos.length ? (
        <section className="sec card">
          <div className="card-head">
            <span className="card-lbl">
              Pagos sin reserva <span className="m">· revisar: no deberían existir</span>
            </span>
          </div>
          <div className="dtl">
            <table>
              <tbody>
                <tr>
                  <th>Fecha</th>
                  <th>Persona</th>
                  <th>Método</th>
                  <th className="right">Monto</th>
                </tr>
                {huerfanos.map((p, i) => (
                  <tr key={i}>
                    <td className="c">{p.fecha}</td>
                    <td>{p.persona}</td>
                    <td className="c">{p.metodo}</td>
                    <td className="num right">{mx(p.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}

// ── EGRESOS ──────────────────────────────────────────────────────────────

/**
 * Lo que sale, agrupado POR EXPERIENCIA y luego por salida (Luis, 11 ago).
 *
 * ⚠️ La etiqueta fijo/variable de cada línea NO es decorativa: es lo que hace
 * calculable el equilibrio (`costos_fijos / contribución_por_cliente`). La van
 * de Volcanes y el lote de gorras se pagan completos vayan 5 o 16 personas —
 * ese es justo el riesgo que el tablero tiene que hacer visible.
 */
export function Egresos({ salidas }: { salidas: SalidaRentabilidad[] }) {
  const grupos = porExperiencia(salidas).sort((a, b) => b.costos - a.costos);
  const chip = (t: string) => (
    <span
      className={"chip chip-sm " + (t === "variable" ? "c-var" : t === "buffer" ? "c-info" : "c-draft")}
    >
      {t}
    </span>
  );

  return (
    <section className="sec card">
      <div className="card-head">
        <span className="card-lbl">
          Egresos <span className="m">· a quién se le paga, en qué salida</span>
        </span>
      </div>
      <div className="scroller">
        <div className="ladder ladder--simple">
          {grupos.map((g) => (
            <details key={g.nombre}>
              <summary className="row row--mes" style={{ ["--depth" as string]: 0 }}>
                <div className="c-name">
                  <div className="mes-lbl">{g.nombre}</div>
                  <div className="sub">
                    {g.ss.length} {g.ss.length === 1 ? "salida" : "salidas"} · {g.lineas}{" "}
                    {g.lineas === 1 ? "línea de costo" : "líneas de costo"}
                  </div>
                </div>
                <div className="money neg">−{mx(g.costos)}</div>
                <span className="chev2">▼</span>
              </summary>

              {g.ss.map((s) => (
                <details key={s.slotId}>
                  <summary className="row row--sal" style={{ ["--depth" as string]: 1 }}>
                    <div className="c-name">
                      <div className="sal-lbl">{s.salidaLabel}</div>
                      <div className="sub">
                        {s.costos.length} {s.costos.length === 1 ? "línea" : "líneas"} · fijos{" "}
                        {mx(s.costosFijos)} · variables {mx(s.costosVariables)}
                        {s.bufferLiberado > 0 ? ` · buffer liberado ${mx(s.bufferLiberado)}` : ""}
                      </div>
                    </div>
                    <div className="money neg">−{mx(s.proveedoresConIva)}</div>
                    <span className="chev2">▼</span>
                  </summary>
                  <div className="drawer">
                    <div className="cascade">
                      <details>
                        <summary className="crow">
                          <div>
                            <div className="t">Proveedores de esta salida</div>
                            <div className="d">
                              {s.costos.length} {s.costos.length === 1 ? "línea" : "líneas"} · fijos{" "}
                              {mx(s.costosFijos)} · variables {mx(s.costosVariables)}
                            </div>
                          </div>
                          <div className="n">{mx(s.proveedoresConIva)}</div>
                          <span className="chev2">▼</span>
                        </summary>
                        <div className="dtl">
                          <table>
                            <tbody>
                              <tr>
                                <th>Proveedor</th>
                                <th>Tipo</th>
                                <th className="right">Sin IVA</th>
                                <th className="right">Con IVA</th>
                              </tr>
                              {s.costos.map((c, i) => (
                                <tr key={i}>
                                  <td className="c">
                                    {c.concepto}
                                    {c.notas ? <span className="c"> · {c.notas}</span> : null}
                                  </td>
                                  <td>{chip(c.tipo)}</td>
                                  {/* Un costo en $0 no es un costo conocido: es
                                      uno sin cotizar, y mientras siga ahí la
                                      utilidad de esta salida está inflada. */}
                                  <td className="num right">
                                    {c.sinCotizar ? <span className="neg">sin cotizar</span> : mx(c.montoSinIva)}
                                  </td>
                                  <td className="num right">
                                    {c.sinCotizar ? "—" : mx(c.montoSinIva * 1.16)}
                                  </td>
                                </tr>
                              ))}
                              {!s.costos.length ? (
                                <tr>
                                  <td className="c" colSpan={4}>
                                    Sin costos capturados. Sin ellos no hay utilidad que calcular.
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    </div>
                  </div>
                </details>
              ))}
            </details>
          ))}
          {!grupos.length ? (
            <div className="row">
              <div className="c-name">Todavía no hay costos capturados.</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
