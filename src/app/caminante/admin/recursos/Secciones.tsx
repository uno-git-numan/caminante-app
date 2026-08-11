// Las dos mitades que le faltaban al tablero: INGRESOS y EGRESOS.
//
// Antes vivían en dos páginas distintas — `/admin/dinero` respondía «cuánto
// entró» y `/admin/rentabilidad` respondía «cuánto es mío» — y para cerrar una
// cuenta había que saltar entre ellas. Se leía como redundancia porque las dos
// hablaban de dinero. Aquí es una sola página: la escalera por salida es la
// espina, y estas dos secciones son el desglose de sus dos extremos.
//
// El entregable de Claude Design solo cubría la escalera, así que estas dos
// secciones se arman con SUS MISMAS primitivas (`.card`, `.tbl`, `.chip`,
// `.money`, `.pos/.neg`, `.empty`) — no con un lenguaje visual nuevo.

import type { DineroAdmin, LedgerLinea } from "@/lib/admin/queries";
import { formatMXN } from "@/lib/admin/queries";
import type { SalidaRentabilidad } from "@/lib/admin/rentabilidad";

const mx = (n: number) => "$" + Math.round(Math.abs(n)).toLocaleString("es-MX");

// ── INGRESOS ─────────────────────────────────────────────────────────────

/** La tabla de pagos de UNA salida. Antes era el ledger global de la página. */
function Pagos({ pagos }: { pagos: LedgerLinea[] }) {
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Persona</th>
          <th>Método</th>
          <th className="num right">Monto</th>
          <th>Estado</th>
          <th>Respaldo</th>
        </tr>
      </thead>
      <tbody>
        {pagos.map((l, i) => (
          <tr key={i}>
            <td className="c">{l.fecha}</td>
            <td>{l.persona}</td>
            <td className="c">{l.metodo}</td>
            <td
              className="num right mono"
              style={l.estado === "refunded" ? { textDecoration: "line-through" } : undefined}
            >
              {formatMXN(l.monto)}
            </td>
            <td>
              {l.estado === "paid" ? (
                <span className="chip c-paid chip-sm">Pagado</span>
              ) : l.estado === "refunded" ? (
                <span className="chip c-draft chip-sm">Reembolsado</span>
              ) : (
                <span className="chip c-sol chip-sm">{l.estado}</span>
              )}
            </td>
            <td className="c">
              {l.referencia ? <span>ref. {l.referencia}</span> : null}
              {l.comprobantePath ? (
                <>
                  {l.referencia ? " · " : null}
                  {/* URL firmada de 5 min: el bucket es privado. */}
                  <a
                    href={`/caminante/api/admin/comprobante?path=${encodeURIComponent(l.comprobantePath)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    comprobante
                  </a>
                </>
              ) : null}
              {!l.referencia && !l.comprobantePath ? "—" : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Ingresos({ d }: { d: DineroAdmin }) {
  return (
    <>
      <section className="sec card" style={{ marginTop: 22 }}>
        <div className="card-head">
          {/* El entregable escribe el subtítulo DENTRO del span, con su punto
              medio y un espacio antes: «Título <span class="m">· detalle</span>». */}
          <span className="card-lbl">
            Ingresos <span className="m">· por experiencia y por operador</span>
          </span>
        </div>

        <div className="pad grid2">
          <div>
            <div className="mes-lbl" style={{ marginBottom: 8 }}>Por experiencia</div>
            {d.porExperiencia.length ? (
              d.porExperiencia.map((e) => (
                <details key={e.nombre} className="dtl">
                  <summary>
                    <span className="c-name">{e.nombre}</span>
                    <span className="money mono">{formatMXN(e.monto)}</span>
                    <span className="chev2">▾</span>
                  </summary>
                  <div className="drawer">
                    {/* Los pagos viven DENTRO de su salida (Luis, 11 ago): una
                        lista global de cobros no dice de quién es cada peso.
                        Tercer nivel de <details>, como el resto de la página. */}
                    {e.detalle.map((sal, j) => (
                      <details key={j} className="dtl">
                        <summary>
                          <span className="c-name">
                            {sal.salida} <span className="c">· {sal.personas} pers.</span>
                          </span>
                          <span className="money mono">{formatMXN(sal.monto)}</span>
                          <span className="chev2">▾</span>
                        </summary>
                        <div className="drawer">
                          {sal.pagos.length ? (
                            <Pagos pagos={sal.pagos} />
                          ) : (
                            <div className="empty">Sin pagos capturados en esta salida.</div>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </details>
              ))
            ) : (
              <div className="empty">Sin ingresos aún.</div>
            )}
          </div>

          <div>
            <div className="mes-lbl" style={{ marginBottom: 8 }}>Payout por operador</div>
            {d.payouts.length ? (
              d.payouts.map((p) => (
                <details key={p.operador} className="dtl">
                  <summary>
                    <span className="c-name">{p.operador}</span>
                    <span className="money mono">
                      {p.neto != null ? (
                        formatMXN(p.neto)
                      ) : (
                        <span className="neg">
                          {p.sinAtribuir ? "falta atribuir" : "por definir"}
                        </span>
                      )}
                    </span>
                    <span className="chev2">▾</span>
                  </summary>
                  <div className="drawer">
                    <table className="tbl">
                      <tbody>
                        {p.lineas.map((l, j) => (
                          <tr key={j}>
                            <td>{l.concepto}</td>
                            <td className="c">{l.nota}</td>
                            <td className="num right mono">{formatMXN(l.monto)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Nunca se inventa un neto: si alguna venta no trae el %
                        congelado, la página lo dice en vez de proponer un
                        depósito por el 100% del bruto. */}
                    {p.sinAtribuir ? (
                      <p className="notes">
                        Estas ventas no tienen operador asignado, así que no entran en ningún payout.
                        Asígnales operador en Eventos.
                      </p>
                    ) : p.brutoSinPct ? (
                      <p className="notes">
                        No hay neto porque {formatMXN(p.brutoSinPct)} se vendió sin comisión
                        congelada. Define la comisión del operador para las ventas futuras; las
                        pasadas se acuerdan a mano.
                      </p>
                    ) : null}
                  </div>
                </details>
              ))
            ) : (
              <div className="empty">Sin ventas atribuidas a operadores.</div>
            )}
          </div>
        </div>
      </section>

      {/* Un pago siempre cuelga de una reserva, y una reserva siempre tiene
          experiencia. Si algo cae aquí es un dato roto y hay que verlo, así que
          se muestra en vez de esconderse. */}
      {d.huerfanos.length ? (
        <section className="sec card" style={{ marginTop: 18 }}>
          <div className="card-head">
            <span className="card-lbl">
              Pagos sin experiencia <span className="m">· revisar: no deberían existir</span>
            </span>
          </div>
          <div className="tbl-wrap">
            <Pagos pagos={d.huerfanos} />
          </div>
        </section>
      ) : null}

    </>
  );
}

// ── EGRESOS ──────────────────────────────────────────────────────────────

type Linea = { concepto: string; tipo: string; sinIva: number; notas: string | null; salida: string };

/**
 * Lo que sale, agrupado por proveedor (el concepto es el proveedor: NANAE, la
 * Hacienda, Octavio, la van…) y con la etiqueta fijo/variable a la vista.
 *
 * ⚠️ Esa etiqueta NO es decorativa: es lo que permite calcular el equilibrio
 * como `costos_fijos / contribución_por_cliente`. La van de Volcanes y el lote
 * de gorras se pagan completos vayan 5 o 16 personas — ese es justo el riesgo
 * que el tablero tiene que hacer visible.
 */
export function Egresos({ salidas }: { salidas: SalidaRentabilidad[] }) {
  const lineas: Linea[] = salidas.flatMap((s) =>
    s.costos.map((c) => ({
      concepto: c.concepto,
      tipo: c.tipo,
      sinIva: c.montoSinIva,
      notas: c.notas,
      salida: `${s.experienciaNombre} · ${s.salidaLabel}`,
    })),
  );

  // Agrupado por proveedor. El nombre del proveedor es la primera parte del
  // concepto antes del «·» (así se sembraron: "NANAE · recorrido 18 clientes").
  const porProveedor = new Map<string, Linea[]>();
  for (const l of lineas) {
    const prov = l.concepto.split("·")[0].trim() || l.concepto;
    porProveedor.set(prov, [...(porProveedor.get(prov) || []), l]);
  }
  const grupos = [...porProveedor.entries()]
    .map(([prov, ls]) => ({ prov, ls, total: ls.reduce((a, l) => a + l.sinIva, 0) }))
    .sort((a, b) => b.total - a.total);

  const totalSinIva = lineas.reduce((a, l) => a + l.sinIva, 0);
  const fijos = lineas.filter((l) => l.tipo !== "variable").reduce((a, l) => a + l.sinIva, 0);
  const variables = totalSinIva - fijos;
  const sinCotizar = lineas.filter((l) => l.sinIva === 0).length;

  return (
    <section className="sec card" style={{ marginTop: 18 }}>
      <div className="card-head">
        <span className="card-lbl">
          Egresos{" "}
          <span className="m">
            · por proveedor · sin IVA · fijo {mx(fijos)} · variable {mx(variables)}
          </span>
        </span>
      </div>

      {grupos.length ? (
        <div className="pad">
          {grupos.map((g) => (
            <details key={g.prov} className="dtl">
              <summary>
                <span className="c-name">{g.prov}</span>
                <span className="money mono">{mx(g.total)}</span>
                <span className="chev2">▾</span>
              </summary>
              <div className="drawer">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Salida</th>
                      <th>Tipo</th>
                      <th className="num right">Sin IVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.ls.map((l, i) => (
                      <tr key={i}>
                        <td>
                          {l.concepto}
                          {l.notas ? <span className="c"> · {l.notas}</span> : null}
                        </td>
                        <td className="c">{l.salida}</td>
                        <td>
                          <span
                            className={
                              "chip chip-sm " + (l.tipo === "variable" ? "c-var" : "c-info")
                            }
                          >
                            {l.tipo}
                          </span>
                        </td>
                        <td className="num right mono">
                          {l.sinIva === 0 ? <span className="neg">sin cotizar</span> : mx(l.sinIva)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
          {/* Un costo en $0 no es un costo conocido: es uno sin cotizar, y
              mientras esté ahí la utilidad de esa salida está inflada. */}
          {sinCotizar ? (
            <p className="notes">
              {sinCotizar} {sinCotizar === 1 ? "línea sigue" : "líneas siguen"} en $0 — sin cotizar.
              La utilidad de esas salidas está inflada hasta que se capturen.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="empty">
          Todavía no hay costos capturados. Sin costos no hay utilidad que calcular.
        </div>
      )}
    </section>
  );
}
