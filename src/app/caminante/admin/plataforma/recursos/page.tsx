import { redirect } from "next/navigation";
import AdminShell from "../../ui/AdminShell";
import { getCurrentRole } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatMXN } from "@/lib/admin/formato";
import { fetchPanoramaPlataforma } from "@/lib/plataforma/panorama";
import { fetchOperadorasPlataforma } from "@/lib/plataforma/operadoras";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recursos · Caminante plataforma" };

// RECURSOS — UNA SOLA CUENTA, de arriba abajo.
//
// Estaba partido en dos («Dinero» y «Recursos») y era el mismo dinero: lo que
// entra en una pestaña y lo que sale en la otra. Contestar «¿cómo cerró el mes?»
// obligaba a abrir las dos y restar de cabeza. Ahora es una sola lectura:
// entró · salió · se declara · queda.
//
// ⚠️ TRES DE LOS CINCO BLOQUES NO TIENEN FUENTE TODAVÍA, y se dibujan como
// huecos marcados en vez de rellenarse:
//
//   · Proveedores — no hay tabla de proveedores DE LA PLATAFORMA. La tabla
//     `providers` que existe es del andamio viejo del marketplace (una fila,
//     «Caminante Internal»), no Stripe/Vercel/Meta. Usarla sería mostrar algo
//     que se ve bien y no significa nada.
//   · Impuestos — no hay migración. El día 15 y el 17 son reglas reales, pero
//     el estatus de cada mes no vive en ningún lado.
//   · El archivo — el acta y las marcas están en Drive, no en la base.
//
// Los otros dos SÍ son reales: la comisión sale de las ventas congeladas y los
// datos de emisión salen de la fila de la casa en `operators`.

export default async function RecursosPlataformaPage() {
  if ((await getCurrentRole()) !== "admin") redirect("/caminante/admin");

  const sb = createSupabaseAdminClient();
  const [d, ops, { data: casa }, { data: cobros }] = await Promise.all([
    fetchPanoramaPlataforma(),
    fetchOperadorasPlataforma(),
    sb
      .from("operators")
      .select("name, rfc, razon_social, regimen_fiscal, cp_fiscal, tipo_persona")
      .eq("es_la_casa", true)
      .maybeSingle(),
    sb.from("operator_payables").select("id, operator_id, monto_mxn, origen, created_at"),
  ]);

  const externas = ops.filter((o) => !o.esLaCasa);
  const mes = d.mesEnCurso.split(" ")[0];
  const mesCap = mes[0].toUpperCase() + mes.slice(1);
  const hayCobros = (cobros ?? []).length > 0;

  const Hueco = ({ que, donde }: { que: string; donde: string }) => (
    <div className="empty">
      {que}
      <br />
      <span style={{ fontSize: 13 }}>{donde}</span>
    </div>
  );

  return (
    <AdminShell active="pl-recursos">
      <div className="sec">
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Recursos
            </span>
            <h2 className="display" style={{ marginTop: 10 }}>
              Una sola cuenta, <em className="ac">de arriba abajo.</em>
            </h2>
            <p className="desc">
              Lo que entra, lo que sale y lo que se declara son partes de la misma cuenta. Estaban en
              dos pestañas y contestar «¿cómo cerró el mes?» obligaba a abrir las dos.
            </p>
          </div>
        </div>

        {/* La resta, para que no haya que hacerla de cabeza. */}
        <div className="cuenta">
          <div className="cu">
            <span className="lb">Entró</span>
            <span className="n">{formatMXN(d.comision.cobrada)}</span>
            <p className="sub">Comisión cobrada en {mes}.</p>
          </div>
          <span className="op">−</span>
          <div className="cu">
            <span className="lb">Salió</span>
            <span className="n hole">sin registrar</span>
            <p className="sub">Los proveedores de la plataforma. Todavía no viven en la base.</p>
          </div>
          <span className="op">−</span>
          <div className="cu">
            <span className="lb">Se declara</span>
            <span className="n hole">sin registrar</span>
            <p className="sub">IVA e ISR de {mes}. Alarma el 15, vence el 17.</p>
          </div>
          <span className="op">=</span>
          <div className="cu res">
            <span className="lb">Queda</span>
            <span className="n">{formatMXN(d.comision.cobrada)}</span>
            <p className="sub">
              {d.comision.cobrada === 0
                ? "Todavía no ha entrado una sola comisión."
                : "Sin restarle lo que sale ni lo que se declara."}
            </p>
          </div>
        </div>
        <p className="mnybridge">
          <s>{"//"}</s>
          <span>
            Los dos huecos son huecos de verdad: no hay tabla de proveedores de la plataforma ni de
            impuestos, así que <b>la maqueta no los inventa</b>. La resta va a mentir hasta que esos
            dos existan, y por eso lo dice aquí en vez de mostrar un número redondo.
          </span>
        </p>

        {/* ── 01 · LO QUE ENTRA ────────────────────────────────────────── */}
        <p className="xh4" style={{ marginTop: 30 }}>
          <span className="mono" style={{ color: "var(--orange)" }}>
            01
          </span>{" "}
          Lo que entra
        </p>
        <p className="subtitle">Comisión devengada, cobrada y por cobrar, y el CFDI de cada operadora.</p>

        <div className="kpis">
          <div className="card kpi">
            <span className="k-lbl">Devengada · {mesCap}</span>
            <span className="k-val">{formatMXN(d.comision.devengada)}</span>
            <p className="k-sub">
              Comisión generada por reservas posteriores a la fecha de arranque de cada operadora.
            </p>
          </div>
          <div className="card kpi">
            <span className="k-lbl">Cobrada · {mesCap}</span>
            <span className="k-val">{formatMXN(d.comision.cobrada)}</span>
            <p className="k-sub">Lo que ya entró a la cuenta de Caminante.</p>
          </div>
          <div className="card kpi">
            <span className="k-lbl">Por cobrar</span>
            <span className="k-val">{formatMXN(d.comision.porCobrar)}</span>
            <p className="k-sub">
              {d.comision.porCobrar === 0
                ? "Ninguna operadora me debe nada."
                : "Devengada y todavía sin cobrar."}
            </p>
          </div>
          <div className="card kpi">
            <span className="k-lbl">CFDI por emitir</span>
            <span className="k-val">0</span>
            <p className="k-sub">
              {d.comision.devengada === 0
                ? "No hay comisión que facturar."
                : "Comisión devengada sin CFDI."}
            </p>
          </div>
        </div>

        <p className="xh4" style={{ marginTop: 22 }}>
          Cobros a operadoras
        </p>
        {hayCobros ? null : (
          <Hueco
            que="Todavía no hay un solo cobro."
            donde={
              d.primerArranque
                ? `La primera comisión se devenga con la primera reserva posterior al ${new Date(
                    d.primerArranque,
                  ).toLocaleDateString("es-MX", { day: "numeric", month: "long", timeZone: "America/Mexico_City" })}. Ese día aparece aquí el primer renglón, con su CFDI por emitir.`
                : "Ninguna operadora tiene fecha de arranque, así que ninguna devenga comisión todavía."
            }
          />
        )}

        {externas.length ? (
          <div className="tbl-wrap card" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Operadora</th>
                  <th>Arranque</th>
                  <th className="num right">Vendido en {mes}</th>
                  <th className="num right">Comisión de {mes}</th>
                  <th>CFDI</th>
                </tr>
              </thead>
              <tbody>
                {externas.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <span className="opnm">
                        <span className="av">{o.iniciales}</span>
                        <span>
                          <b>{o.nombre}</b>
                          <small>{o.comisionPct != null ? `${o.comisionPct}% vigente` : "sin comisión"}</small>
                        </span>
                      </span>
                    </td>
                    <td className="mono">
                      {o.comisionDesde
                        ? new Date(o.comisionDesde).toLocaleDateString("es-MX", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            timeZone: "America/Mexico_City",
                          })
                        : "—"}
                    </td>
                    <td className="num right">{formatMXN(o.vendidoMes)}</td>
                    {/* Cero porque no hay venta suya posterior a su arranque, no
                        porque no se sepa. Multiplicar su % por lo que vendió
                        antes inventaría ingreso que nadie cobró. */}
                    <td className="num right">{formatMXN(0)}</td>
                    <td className="mut">nada que emitir</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* ── 02 · LO QUE SALE ─────────────────────────────────────────── */}
        <p className="xh4" style={{ marginTop: 30 }}>
          <span className="mono" style={{ color: "var(--orange)" }}>
            02
          </span>{" "}
          Lo que sale
        </p>
        <Hueco
          que="Los proveedores de la plataforma todavía no viven en la base."
          donde="Stripe cobra por cobro; Vercel, Meta y los demás son fijos mensuales. Hoy están en la contabilidad, no aquí. Necesitan su propia tabla antes de que esta resta signifique algo."
        />

        {/* ── 03 · LO QUE SE DECLARA ───────────────────────────────────── */}
        <p className="xh4" style={{ marginTop: 30 }}>
          <span className="mono" style={{ color: "var(--orange)" }}>
            03
          </span>{" "}
          Lo que se declara
        </p>
        <p className="subtitle">
          Los impuestos son de la ENTIDAD, y la entidad es una sola. Este bloque existe aquí y en
          ningún otro sombrero: si apareciera dos veces, un día se presentan dos veces o ninguna.
        </p>
        <p className="arr">
          <s>El día 15</s>
          <span>es la alarma; el vencimiento es el</span>
          <b>día 17.</b>
          <span>
            Son dos días de margen para conseguir la línea de captura y pagarla. No depende de que
            haya habido comisión: si el mes fue cero, se declara en cero.
          </span>
        </p>
        <Hueco
          que="El estatus de cada mes no está en la base."
          donde="Hoy vive en el Drive de contabilidad y en los acuses del SAT. Aquí se marcaría al presentar, pero necesita su tabla — la maqueta no lo inventa."
        />

        {/* ── 04 · CON QUÉ SE FACTURA ──────────────────────────────────── */}
        <p className="xh4" style={{ marginTop: 30 }}>
          <span className="mono" style={{ color: "var(--orange)" }}>
            04
          </span>{" "}
          Con qué se factura
        </p>
        <p className="subtitle">
          La plataforma se llama <b>Caminante</b>; la empresa se llama <b>NUMAN Hub</b>. Los CFDI de
          comisión los emite la plataforma, pero salen a nombre de la persona moral que existe ante
          el SAT. Los datos de emisión y el expediente fiscal son lo mismo, y viven aquí una sola vez.
        </p>
        <div className="card pad">
          <div className="dl">
            <div>
              <span>Razón social</span>
              <b>{casa?.razon_social ?? <span className="hole">sin capturar</span>}</b>
            </div>
            <div>
              <span>RFC</span>
              <b className="mono">{casa?.rfc ?? <span className="hole">sin capturar</span>}</b>
            </div>
            <div>
              <span>Régimen</span>
              <b>{casa?.regimen_fiscal ?? <span className="hole">sin capturar</span>}</b>
            </div>
            <div>
              <span>Código postal</span>
              <b className="mono">{casa?.cp_fiscal ?? <span className="hole">sin capturar</span>}</b>
            </div>
            <div>
              <span>Tipo de persona</span>
              <b>{casa?.tipo_persona ?? <span className="hole">sin capturar</span>}</b>
            </div>
          </div>
        </div>

        {/* ── 05 · EL ARCHIVO ──────────────────────────────────────────── */}
        <p className="xh4" style={{ marginTop: 30 }}>
          <span className="mono" style={{ color: "var(--orange)" }}>
            05
          </span>{" "}
          El archivo
        </p>
        <Hueco
          que="Acta constitutiva, constancia de situación fiscal y marcas."
          donde="Están en el Drive (EXPEDIENTE-NUMAN), no en la base. Son documentos que se consultan tres veces al año: van al final y cerrados para no competir con las cifras."
        />
      </div>
    </AdminShell>
  );
}
