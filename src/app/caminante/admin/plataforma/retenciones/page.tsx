// RETENCIONES DEL MES — el reporte que pidió Marisol (11 nov 2026).
//
// «Espero que el sistema que utilizas pueda proporcionar el reporte de las
// retenciones del mes para presentar las informativas que se generan.»
//
// Una tabla por operadora (lo que va a la informativa de plataformas y al
// entero del día 17) y dos descargas CSV: el resumen y el detalle venta por
// venta. El cálculo vive en lib/fiscal/reporte-retenciones.ts.
//
// Sólo la casa. En pantalla la CURP y la CLABE van enmascaradas; completas
// sólo en el CSV, que es lo que se presenta.
//
// Se viste con las clases de Recursos (tbl-wrap, card, empty, dl): es una
// pantalla de trabajo de la casa, no una superficie nueva de diseño.

import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../ui/AdminShell";
import { getCurrentRole } from "@/lib/auth/authorization";
import { formatMXN } from "@/lib/admin/formato";
import { MES_VALIDO, reporteRetenciones } from "@/lib/fiscal/reporte-retenciones-server";
import { mesCdmx, txtInformativa } from "@/lib/fiscal/reporte-retenciones";
import { clabeEnmascarada } from "@/lib/fiscal/clabe";
import { puedeEmitir } from "@/lib/fiscal/emitir-retenciones";
import EmitirCfdi from "./EmitirCfdi";

export const dynamic = "force-dynamic";

/** El mes anterior al de hoy: es el que se presenta (días 5, 10 y 17). */
function mesAnterior(): string {
  const [y, m] = mesCdmx(new Date()).split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

const nombreDelMes = (mes: string) =>
  new Date(`${mes}-15T18:00:00Z`).toLocaleDateString("es-MX", { month: "long", year: "numeric", timeZone: "America/Mexico_City" });

export default async function RetencionesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  if ((await getCurrentRole()) !== "admin") redirect("/caminante/admin");
  const q = await searchParams;
  const mes = MES_VALIDO.test(q.mes ?? "") ? (q.mes as string) : mesAnterior();
  const rep = await reporteRetenciones(mes);
  const [y, m] = mes.split("-").map(Number);
  const antes = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const despues = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const incompletas = rep.renglones.filter((r) => r.faltan.length);
  const { fuera } = txtInformativa(rep);
  const emision = puedeEmitir();

  return (
    <AdminShell active="pl-recursos">
      <div className="sec">
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Recursos · Lo que se declara
            </span>
            <h2 className="display" style={{ marginTop: 10 }}>
              Retenciones de <em className="ac">{nombreDelMes(mes)}</em>
            </h2>
            <p className="desc">
              Lo que Caminante retuvo a cada operadora por las ventas cobradas por su cuenta de cobro
              (modelo Airbnb). Es la base de tres cosas: el <b>CFDI de retenciones</b> a cada operadora
              (día 5), la <b>informativa de plataformas</b> (día 10) y el <b>entero</b> de ISR e IVA
              retenidos (día 17). Una devolución confirmada antes de emitir el CFDI del mes se resta de
              su venta; si fue total, la venta no se reporta. Sólo aparecen operadoras con ventas: el
              SAT no acepta montos en cero.
            </p>
            <p className="desc" style={{ marginTop: 10 }}>
              <Link href={`/caminante/admin/plataforma/retenciones?mes=${antes}`}>← {nombreDelMes(antes)}</Link>
              {" · "}
              <Link href={`/caminante/admin/plataforma/retenciones?mes=${despues}`}>{nombreDelMes(despues)} →</Link>
              {" · "}
              <Link href="/caminante/admin/plataforma/recursos">Volver a Recursos</Link>
            </p>
          </div>
        </div>

        <div className="card pad">
          <div className="dl">
            <div>
              <span>ISR a enterar (día 17)</span>
              <b className="mono">{formatMXN(rep.totales.isrEnterar)}</b>
            </div>
            <div>
              <span>IVA a enterar (día 17)</span>
              <b className="mono">{formatMXN(rep.totales.ivaEnterar)}</b>
            </div>
            <div>
              <span>Operaciones sin IVA ({rep.totales.ventas} ventas)</span>
              <b className="mono">{formatMXN(rep.totales.base)}</b>
            </div>
            <div>
              <span>Devoluciones restadas</span>
              <b className="mono">{formatMXN(rep.totales.devueltoNetado)}</b>
            </div>
          </div>
        </div>

        {/* Un <a> y no un <Link>: es un route handler, y Link lo ejecutaría al precargar. */}
        <p className="desc" style={{ marginTop: 14 }}>
          <a className="btn btn-sm" href={`/caminante/api/admin/retenciones?mes=${mes}&formato=txt`}>
            Descargar txt para el SAT (informativa)
          </a>{" "}
          <a className="btn btn-sm" href={`/caminante/api/admin/retenciones?mes=${mes}`}>
            Resumen CSV para la contadora
          </a>{" "}
          <a className="btn btn-sm" href={`/caminante/api/admin/retenciones?mes=${mes}&detalle=1`}>
            Detalle venta por venta
          </a>
        </p>

        <p className="desc" style={{ marginTop: 6, fontSize: 13 }}>
          Lo que se entera es lo que dicen los CFDI de retenciones (base del mes × tasa, truncado, regla
          del SAT). Retenido venta por venta: ISR {formatMXN(rep.totales.isrRetenido)} · IVA{" "}
          {formatMXN(rep.totales.ivaRetenido)}. Si el CFDI pide unos centavos más, los pone NUMAN.
        </p>

        {rep.renglones.length ? (
          emision.ok ? (
            <p className="desc" style={{ marginTop: 6 }}>
              <EmitirCfdi mes={mes} etiqueta="Emitir los CFDI de retenciones que falten" />
            </p>
          ) : (
            <div className="empty" style={{ marginTop: 14 }}>
              Los CFDI de retenciones todavía no se pueden emitir.
              <br />
              <span style={{ fontSize: 13 }}>{emision.porque}</span>
            </div>
          )
        ) : null}

        {fuera.length ? (
          <div className="empty" style={{ marginTop: 14 }}>
            No entran al txt del SAT: {fuera.map((f) => `${f.nombre} (${f.porque})`).join(" · ")}.
          </div>
        ) : null}

        {incompletas.length ? (
          <div className="empty" style={{ marginTop: 14 }}>
            A {incompletas.length === 1 ? "una operadora le faltan" : `${incompletas.length} operadoras les faltan`} datos
            para la informativa: {incompletas.map((r) => `${r.nombre} (${r.faltan.join(", ")})`).join(" · ")}.
            <br />
            <span style={{ fontSize: 13 }}>
              CURP y domicilio salen de su constancia; la CLABE se captura una vez en su pantalla de Cobrar. No se
              rellenan aquí.
            </span>
          </div>
        ) : null}

        {rep.renglones.length ? (
          <div className="tbl-wrap card" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Operadora</th>
                  <th>RFC · CURP</th>
                  <th>Banco · CLABE</th>
                  <th className="num right">Ventas</th>
                  <th className="num right">Sin IVA</th>
                  <th className="num right">ISR retenido</th>
                  <th className="num right">IVA retenido</th>
                  <th>CFDI de retenciones</th>
                </tr>
              </thead>
              <tbody>
                {rep.renglones.map((r) => (
                  <tr key={r.operatorId}>
                    <td>
                      <b>{r.nombre}</b>
                      {r.domicilio ? <small style={{ display: "block" }}>{r.domicilio}</small> : null}
                    </td>
                    <td className="mono">
                      {r.rfc ?? "—"}
                      <small style={{ display: "block" }}>{r.curp ? `${r.curp.slice(0, 4)}••••••••••••••` : "—"}</small>
                    </td>
                    <td className="mono">
                      {r.banco ?? "—"}
                      <small style={{ display: "block" }}>{r.clabe ? clabeEnmascarada(r.clabe) : "—"}</small>
                    </td>
                    <td className="num right">{r.ventas}</td>
                    <td className="num right">{formatMXN(r.base)}</td>
                    <td className="num right">{formatMXN(r.isrRetenido)}</td>
                    <td className="num right">{formatMXN(r.ivaRetenido)}</td>
                    <td>
                      {(() => {
                        const c = rep.cfdis.get(r.operatorId);
                        if (c?.estado === "timbrado") {
                          return (
                            <>
                              <span className="mono" style={{ fontSize: 12 }}>{c.uuid}</span>
                              <small style={{ display: "block" }}>
                                <a href={`/caminante/api/admin/retenciones/cfdi?id=${c.id}&formato=pdf`}>PDF</a> ·{" "}
                                <a href={`/caminante/api/admin/retenciones/cfdi?id=${c.id}&formato=xml`}>XML</a>
                                {c.enviado_a ? ` · enviado a ${c.enviado_a}` : " · sin enviar"}
                              </small>
                            </>
                          );
                        }
                        if (c?.estado === "pendiente") return <small>Timbrando…</small>;
                        return (
                          <>
                            {c?.estado === "fallido" ? <small style={{ display: "block" }}>Falló: {c.error}</small> : null}
                            {emision.ok ? <EmitirCfdi mes={mes} operatorId={r.operatorId} etiqueta="Emitir" /> : <small>—</small>}
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 14 }}>
            Ninguna venta por cuenta de cobro de una operadora en este mes.
            <br />
            <span style={{ fontSize: 13 }}>
              Sin ventas no hay retenciones que enterar. Si se presenta la informativa en ceros lo decide
              la contadora (M10).
            </span>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
