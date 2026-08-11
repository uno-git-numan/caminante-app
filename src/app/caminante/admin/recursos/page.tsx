// RECURSOS — una sola página para el dinero.
//
// Antes eran dos: `/admin/dinero` respondía «cuánto entró» y
// `/admin/rentabilidad` respondía «de lo que entró, cuánto es mío». Se leían
// como redundancia (las dos hablaban de dinero) y para cerrar una cuenta había
// que saltar entre ellas. Luis las fundió aquí el 11 ago. Las dos rutas viejas
// redirigen a esta.
//
// La espina es la escalera POR SALIDA, con markup transcrito VERBATIM del
// entregable de Claude Design (design/tablero-financiero/): tres niveles de
// <details> nativos, sin JavaScript — mes → salida → cascada → detalle. La
// unidad es la salida y no la experiencia porque los costos fijos se pagan una
// vez por salida; agregados por experiencia, el punto de equilibrio desaparece.
//
// Alrededor de esa espina van los dos extremos desglosados (`Secciones.tsx`):
// INGRESOS (por experiencia, payout por operador, ledger con su respaldo) y
// EGRESOS (por proveedor, con la etiqueta fijo/variable a la vista). El
// entregable no cubría esas dos, así que se arman con SUS MISMAS primitivas.

import Link from "next/link";
import { fetchRentabilidad, type SalidaRentabilidad } from "@/lib/admin/rentabilidad";
import { Fila, cls, firmado, mesLabel, mx } from "./ui";
import { fetchDinero } from "@/lib/admin/queries";
import { fetchExperienciasConSalidas } from "@/lib/admin/transferencias";
import { ADMIN_NAV } from "../ui/nav";
import PagoManualForm from "./PagoManualForm";
import { Egresos, Ingresos } from "./Secciones";

export const dynamic = "force-dynamic";

const G1 =
  '<g class="g1"><path d="M14.64,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64S0,96.44,0,104.52s6.56,14.64,14.64,14.64"/><path d="M102.08,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M91.72,114.57L4.29,27.44C-1.43,21.73-1.43,12.46,4.29,6.74c5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const G2 =
  '<g class="g2"><path d="M218.65,2.3c-8.09,0-14.64,6.56-14.64,14.64s6.56,14.64,14.64,14.64,14.64-6.56,14.64-14.64-6.56-14.64-14.64-14.64"/><path d="M276.91,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/><path d="M189.47,16.97l.22,87.33c0,8.09-6.56,14.64-14.64,14.64s-14.64-6.56-14.64-14.64l-.22-87.33c0-8.09,6.56-14.64,14.64-14.64s14.64,6.56,14.64,14.64"/></g>';
const G3 =
  '<g class="g3"><path d="M335.23,119.17c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M422.67,31.73c8.09,0,14.64-6.56,14.64-14.64s-6.56-14.64-14.64-14.64-14.64,6.56-14.64,14.64,6.56,14.64,14.64,14.64"/><path d="M412.31,114.57l-87.43-87.13c-5.72-5.72-5.72-14.99,0-20.71,5.72-5.72,14.99-5.72,20.71,0l87.43,87.13c5.72,5.72,5.72,14.99,0,20.71-5.72,5.72-14.99,5.72-20.71,0"/></g>';
const MARK = `<svg viewBox="0 0 437.31 121.74" role="img" aria-label="Caminante">${G1}${G2}${G3}</svg>`;

function Cascada({ s }: { s: SalidaRentabilidad }) {
  const chip = (t: string) => (
    <span className={"chip chip-sm " + (t === "variable" ? "c-var" : t === "buffer" ? "c-info" : "c-draft")}>{t}</span>
  );
  return (
    <div className="cascade">
      <details>
        <summary className="crow">
          <div>
            <div className="t">Ingreso cobrado</div>
            <div className="d">
              {s.vendidos} {s.vendidos === 1 ? "lugar vendido" : "lugares vendidos"}
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
                <th>Concepto</th>
                <th className="right">Monto</th>
              </tr>
              <tr>
                <td className="c">Cobrado por Stripe y transferencia</td>
                <td className="num right">{mx(s.ingreso + s.reembolsado)}</td>
              </tr>
              {s.reembolsado > 0 ? (
                <tr>
                  <td className="c">Reembolsado (su comisión de Stripe NO se devolvió)</td>
                  <td className="num right neg">−{mx(s.reembolsado)}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </details>

      <details>
        <summary className="crow">
          <div>
            <div className="t">IVA neto al SAT</div>
            <div className="d">trasladado − acreditable · {s.ivaNeto < 0 ? "a cargo" : "a favor"}</div>
          </div>
          <div className={"n " + cls(s.ivaNeto)}>{firmado(s.ivaNeto)}</div>
          <span className="chev2">▼</span>
        </summary>
        <div className="dtl">
          <table>
            <tbody>
              <tr>
                <th>Concepto</th>
                <th>Cálculo</th>
                <th className="right">Monto</th>
              </tr>
              <tr>
                <td className="c">IVA trasladado</td>
                <td className="num">{mx(s.ingreso)} ÷ 1.16 × .16</td>
                <td className="num right neg">−{mx(s.ivaTrasladado)}</td>
              </tr>
              <tr>
                <td className="c">IVA acreditable de proveedores y Stripe</td>
                <td className="num">{mx(s.proveedoresSinIva + s.stripeSinIva)} × .16</td>
                <td className="num right pos">+{mx(s.ivaAcreditable)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <details>
        <summary className="crow">
          <div>
            <div className="t">Comisión Stripe</div>
            <div className="d">tarifa real por cargo, con IVA</div>
          </div>
          <div className="n neg">−{mx(s.stripe)}</div>
          <span className="chev2">▼</span>
        </summary>
        <div className="dtl">
          <table>
            <tbody>
              <tr>
                <th>Concepto</th>
                <th className="right">Monto</th>
              </tr>
              <tr>
                <td className="c">Comisión</td>
                <td className="num right">{mx(s.stripeSinIva)}</td>
              </tr>
              <tr>
                <td className="c">IVA de la comisión (acreditable con el CFDI de Stripe)</td>
                <td className="num right">{mx(s.stripe - s.stripeSinIva)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <details>
        <summary className="crow">
          <div>
            <div className="t">Proveedores</div>
            <div className="d">
              {s.costos.length} {s.costos.length === 1 ? "línea" : "líneas"} · fijos {mx(s.costosFijos)} · variables{" "}
              {mx(s.costosVariables)}
              {/* Un número que sube solo tiene que explicarse, o parece error. */}
              {s.bufferLiberado > 0
                ? ` · buffer liberado ${mx(s.bufferLiberado)}: la salida ya se fue sin imprevistos`
                : ""}
            </div>
          </div>
          <div className="n neg">−{mx(s.proveedoresConIva)}</div>
          <span className="chev2">▼</span>
        </summary>
        <div className="dtl">
          <table>
            <tbody>
              <tr>
                <th>Concepto</th>
                <th>Tipo</th>
                <th className="right">Sin IVA</th>
                <th className="right">Con IVA</th>
              </tr>
              {s.costos.map((c, i) => (
                <tr key={i}>
                  <td className="c">
                    {c.concepto}
                    {c.sinCotizar ? <span className="chip c-full chip-sm"> sin cotizar</span> : null}
                  </td>
                  <td>{chip(c.tipo)}</td>
                  <td className="num right">{mx(c.montoSinIva)}</td>
                  <td className="num right">{mx(c.montoSinIva * 1.16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {s.costosIncompletos ? (
            <div className="notes">
              <span className="chip c-full chip-sm">
                Hay costos en $0 sin cotizar — la utilidad de esta salida está inflada
              </span>
            </div>
          ) : null}
        </div>
      </details>
    </div>
  );
}

export default async function RentabilidadPage() {
  const [salidas, dinero, experiencias] = await Promise.all([
    fetchRentabilidad(),
    fetchDinero(),
    fetchExperienciasConSalidas(),
  ]);

  // Agrupado por mes de la salida.
  const porMes = new Map<string, SalidaRentabilidad[]>();
  for (const s of salidas) porMes.set(s.mes, [...(porMes.get(s.mes) || []), s]);
  const meses = [...porMes.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const suma = (xs: SalidaRentabilidad[], k: keyof SalidaRentabilidad) =>
    xs.reduce((a, s) => a + (Number(s[k]) || 0), 0);

  const hoy = new Date().toISOString().slice(0, 10);
  const abiertas = salidas.filter((s) => (s.startsAt || "") >= hoy);
  const cerradas = salidas.filter((s) => (s.startsAt || "") < hoy);

  // La alerta: la salida futura más lejos de su equilibrio. Es la única
  // sobre la que todavía se puede hacer algo.
  const enRiesgo = abiertas
    .filter((s) => s.equilibrio != null && s.vendidos < s.equilibrio)
    .sort((a, b) => a.utilidad - b.utilidad)[0];

  // ⚠️ Una salida SIN costos cargados no tiene utilidad de $0: tiene utilidad
  // DESCONOCIDA. Sumarla a los totales los infla por todo su ingreso — Ensenada
  // sola metía +$206,897 de "utilidad" que es puro ingreso sin restarle nada.
  // Los KPI solo suman salidas con costos; las demás se cuentan aparte.
  const conDatos = salidas.filter((s) => !s.sinCostos);
  const sinDatos = salidas.filter((s) => s.sinCostos);
  const yaGanado = suma(cerradas.filter((s) => !s.sinCostos), "utilidad");
  const posicion = suma(conDatos, "utilidad");
  const conIncompletos = salidas.filter((s) => s.costosIncompletos).length;
  const sinCostos = sinDatos.length;
  const ingresoSinCostear = suma(sinDatos, "ingreso");

  return (
    <>
      <header className="ahead">
        <div className="top">
          <div className="brand">
            <span className="logo" dangerouslySetInnerHTML={{ __html: MARK }} aria-label="Caminante" />
            <span className="mode">Modo admin</span>
          </div>
          <div className="qa">
            <Link className="btn btn-glass btn-sm" href="/caminante/admin/facturacion">
              Facturación CFDI
            </Link>
          </div>
        </div>
        {/* El nav sale de la MISMA lista que AdminShell (ui/nav.ts). Cuando
            estaba duplicado a mano, esta copia se quedó sin Comunicación ni
            Solicitudes y la página no se podía alcanzar desde el resto. */}
        <nav className="nav">
          {ADMIN_NAV.map((it) =>
            it.key === "recursos" ? (
              <a key={it.key} href="#" className="on">
                {it.label}
              </a>
            ) : (
              <Link key={it.key} href={it.href!}>
                {it.label}
              </Link>
            ),
          )}
        </nav>
      </header>

      <div className="page">
        <header className="phead">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Recursos · lo que entra y lo que sale
            </span>
            <h1 className="display">
              Fechas, proveedores, <em className="ac">y equilibrio.</em>
            </h1>
          </div>
          <p className="note">
            los montos de la escalera incluyen IVA · <b>toca cualquier fila para desarrollarla</b>
          </p>
        </header>

        {/* Capturar un pago de fuera de Stripe es la única acción de esta
            página; va colapsada porque es puntual. */}
        <div style={{ marginBottom: 18 }}>
          <PagoManualForm experiencias={experiencias} />
        </div>

        {enRiesgo ? (
          <section className="sec card alert">
            <div className="a-top">
              <span className="chip c-full chip-sm">ABAJO DEL EQUILIBRIO</span>
              <span className="a-t">
                {enRiesgo.experienciaNombre} · {enRiesgo.salidaLabel}: necesita {enRiesgo.equilibrio} personas y van{" "}
                {enRiesgo.vendidos}
              </span>
            </div>
            <div>
              <div className="a-n">{firmado(enRiesgo.utilidad)}</div>
              <div className="a-g">si la salida se va con lo vendido hoy</div>
            </div>
            <p className="a-body">
              Los costos fijos de esta salida son <b>{mx(enRiesgo.costosFijos)}</b> y se pagan completos vaya quien
              vaya. Faltan <b>{(enRiesgo.equilibrio || 0) - enRiesgo.vendidos} clientes</b> para dejar de perder
              {enRiesgo.cupo ? ` y ${enRiesgo.cupo - enRiesgo.vendidos} para llenar` : ""}.
              {enRiesgo.costosIncompletos ? " Y todavía hay costos sin cotizar: el número real es peor." : ""}
            </p>
          </section>
        ) : null}

        <section className="kpis">
          <div className="card kpi">
            <div className="k-lbl">Ya cerrado</div>
            <div className={"k-val " + (yaGanado < 0 ? "k-neg" : "k-pos")}>{firmado(yaGanado)}</div>
            <div className="k-sub">
              {cerradas.filter((s) => !s.sinCostos).length} de {cerradas.length} salidas pasadas ·{" "}
              <b>solo las que tienen costos</b>
            </div>
          </div>
          <div className="card kpi">
            <div className="k-lbl">Posición de {conDatos.length} fechas</div>
            <div className={"k-val " + (posicion < 0 ? "k-neg" : "k-pos")}>{firmado(posicion)}</div>
            <div className="k-sub">
              {sinCostos
                ? `${sinCostos} fechas fuera: ${mx(ingresoSinCostear)} de ingreso sin costear`
                : "todas las fechas tienen costos"}
            </div>
          </div>
          <div className="card kpi">
            <div className="k-lbl">Abiertas por vender</div>
            <div className="k-val k-tot">{abiertas.length}</div>
            <div className="k-sub">
              {abiertas.filter((s) => s.equilibrio != null && s.vendidos < s.equilibrio).length} abajo del equilibrio
            </div>
          </div>
          <div className="card kpi">
            <div className="k-lbl">Calidad del dato</div>
            <div className={"k-val " + (conIncompletos || sinCostos ? "k-neg" : "k-pos")}>
              {conIncompletos + sinCostos}
            </div>
            <div className="k-sub">
              {conIncompletos ? `${conIncompletos} con costos sin cotizar` : "sin huecos"}
              {sinCostos ? ` · ${sinCostos} sin ningún costo` : ""}
            </div>
          </div>
        </section>

        <section className="sec card">
          <div className="card-head">
            <span className="card-lbl">
              Fechas y equilibrio <span className="m">· toca una fila para el detalle</span>
            </span>
            <div className="legend">
              <i>
                <span className="ldot" style={{ background: "var(--olive)" }}></span>arriba del equilibrio
              </i>
              <i>
                <span className="ldot" style={{ background: "var(--orange)" }}></span>abajo
              </i>
              <i>
                <span
                  style={{ display: "inline-block", width: 2, height: 11, background: "var(--charcoal)", opacity: 0.65 }}
                ></span>
                equilibrio
              </i>
              <i>
                <span className="pos">+</span> a favor · <span className="neg">−</span> a cargo
              </i>
            </div>
          </div>
          <div className="scroller">
            <div className="ladder">
              <div className="row row--head">
                <div className="c-name">Experiencia</div>
                <div>Llenado</div>
                <div className="r">Ingreso</div>
                <div className="r">IVA</div>
                <div className="r">Stripe</div>
                <div className="r">Proveedores</div>
                <div className="r">Utilidad</div>
                <div></div>
              </div>

              {meses.map(([ym, ss]) => {
                const pax = ss.reduce((a, s) => a + s.vendidos, 0);
                const util = suma(ss, "utilidad");
                return (
                  <details key={ym}>
                    <summary className="row row--mes" style={{ ["--depth" as string]: 0 }}>
                      <div className="c-name">
                        <div className="mes-lbl">{mesLabel(ym)}</div>
                        <div className="sub">
                          {ss.length} {ss.length === 1 ? "salida" : "salidas"} · {pax} personas
                        </div>
                      </div>
                      <div></div>
                      <div className="money">{mx(suma(ss, "ingreso"))}</div>
                      <div className={"money " + cls(suma(ss, "ivaNeto"))}>{firmado(suma(ss, "ivaNeto"))}</div>
                      <div className="money neg">−{mx(suma(ss, "stripe"))}</div>
                      <div className="money neg">−{mx(suma(ss, "proveedoresConIva"))}</div>
                      <div className={"money money--util " + (ss.some((x) => x.sinCostos) ? "" : cls(util))}>
                        {ss.some((x) => x.sinCostos) ? <span className="mut">incompleto</span> : firmado(util)}
                      </div>
                      <span className="chev2">▼</span>
                    </summary>

                    {ss.map((s) => (
                      <details key={s.slotId}>
                        <summary className="row row--sal" style={{ ["--depth" as string]: 1 }}>
                          <Fila s={s} />
                        </summary>
                        <div className="drawer">
                          <Link className="btn btn-glass btn-sm" href={`/caminante/admin/roster/${s.slotId}`}>
                            Ver el roster de esta salida <span className="arw">↗</span>
                          </Link>
                          <Cascada s={s} />
                        </div>
                      </details>
                    ))}
                  </details>
                );
              })}

              {!salidas.length ? (
                <div className="row">
                  <div className="c-name">Todavía no hay salidas con dinero o costos cargados.</div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <Ingresos salidas={salidas} payouts={dinero.payouts} huerfanos={dinero.huerfanos} />
        <Egresos salidas={salidas} />
      </div>
    </>
  );
}
