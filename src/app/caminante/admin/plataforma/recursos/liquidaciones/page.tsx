import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../../ui/AdminShell";
import { getCurrentRole } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatMXN } from "@/lib/admin/formato";
import { saldosDeOperadoras } from "@/lib/operadores/liquidaciones";
import Liquidar from "./Liquidar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Liquidaciones · Caminante plataforma" };

// LIQUIDACIONES — lo que Caminante le debe a cada operadora, y lo que ya le pagó.
//
// Es el paso 8 de los diez del MVP. Vive BAJO Recursos y no como sección nueva
// de la nav a propósito: Recursos es «una sola cuenta —entró, salió, se declara,
// queda—» y esto es parte de lo que sale. Una pestaña más arriba sería una
// pestaña que hay que acordarse de visitar, y ya pasó con Solicitudes.
//
// ⚠️ SÓLO EL CANAL `casa`. Con Connect el cobro entra a nombre de la operadora y
// su parte nunca toca la cuenta de Caminante: no hay nada que liquidarle, Stripe
// ya se lo dio. Esta pantalla no muestra esos cobros porque prometería
// transferencias que no van a ocurrir — y la base tampoco los deja registrar
// (trigger de la 0066).
//
// ⚠️ ESTA PANTALLA NO SALIÓ DE CLAUDE DESIGN. No hay entregable para ella, así
// que está armada REUSANDO las clases que ya existen en `admin-css.ts`
// —verificadas una por una contra el archivo, ninguna inventada— y no con CSS
// nuevo. Si va a quedarse, el camino es pedirle su lámina a Claude Design y
// transcribirla; lo que no se hizo fue inventar un diseño propio.

export default async function LiquidacionesPage() {
  if ((await getCurrentRole()) !== "admin") redirect("/caminante/admin");

  const sb = createSupabaseAdminClient();
  const [saldos, { data: ops }, { data: hechas }] = await Promise.all([
    saldosDeOperadoras(),
    sb.from("operators").select("id, name, slug"),
    sb
      .from("operator_liquidaciones")
      .select("id, operator_id, monto_mxn, metodo, referencia, pagado_el, notas, registrado_por, diferencia_mxn, diferencia_motivo, cancelada_at, cancelada_motivo")
      .order("pagado_el", { ascending: false }),
  ]);

  const nombreDe = new Map(
    ((ops ?? []) as { id: string; name: string }[]).map((o) => [o.id, o.name]),
  );
  const conDeuda = saldos.filter((s) => s.porLiquidarMxn > 0 || s.pagadoDeMasMxn > 0);
  const totalPorLiquidar = saldos.reduce((a, s) => a + s.porLiquidarMxn, 0);
  const totalLiquidado = saldos.reduce((a, s) => a + s.liquidadoMxn, 0);
  const totalConcedido = saldos.reduce((a, s) => a + s.concedidoMxn, 0);
  const historial = (hechas ?? []) as Record<string, unknown>[];

  return (
    <AdminShell active="pl-recursos">
      <div className="sec">
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Recursos · Liquidaciones
            </span>
            <h2 className="display" style={{ marginTop: 10 }}>
              Lo que le debemos <em className="ac">a cada operadora.</em>
            </h2>
            <p className="desc">
              De cada venta que Caminante cobró en su cuenta, a la operadora le toca lo cobrado
              menos lo devuelto menos la comisión. Aquí se ve cuánto es y se apunta la
              transferencia cuando se hace.
            </p>
            <p className="desc" style={{ marginTop: 10 }}>
              <Link href="/caminante/admin/plataforma/recursos">Volver a Recursos</Link>
            </p>
          </div>
        </div>

        <div className="kpis">
          <div className="card kpi">
            <span className="k-lbl">Por liquidar</span>
            <span className="k-val">{formatMXN(totalPorLiquidar)}</span>
            <p className="k-sub">Ventas cobradas por la casa que todavía no se transfieren.</p>
          </div>
          <div className="card kpi">
            <span className="k-lbl">Ya liquidado</span>
            <span className="k-val">{formatMXN(totalLiquidado)}</span>
            <p className="k-sub">Transferencias registradas, sin contar las canceladas.</p>
          </div>
          {totalConcedido > 0 ? (
            <div className="card kpi">
              <span className="k-lbl">Concesiones</span>
              <span className="k-val">{formatMXN(totalConcedido)}</span>
              <p className="k-sub">
                Transferido por encima de lo calculado, con su motivo escrito. No es un sobrepago:
                es un acuerdo, y por eso no reescribe la comisión congelada de esas ventas.
              </p>
            </div>
          ) : null}
          <div className="card kpi">
            <span className="k-lbl">Por Connect</span>
            <span className="k-val hole">no aplica</span>
            <p className="k-sub">
              Ahí el cobro entra a nombre de la operadora: su parte nunca pasa por Caminante y no
              hay nada que transferirle.
            </p>
          </div>
        </div>

        {/* ── LO QUE SE DEBE, POR OPERADORA ──────────────────────────────── */}
        <p className="xh4" style={{ marginTop: 30 }}>
          <span className="mono" style={{ color: "var(--orange)" }}>
            01
          </span>{" "}
          Lo que se debe
        </p>

        {!conDeuda.length ? (
          <div className="empty">
            No hay nada por liquidar.
            <br />
            <span style={{ fontSize: 13 }}>
              Ninguna operadora tiene ventas cobradas por la casa sin transferir.
            </span>
          </div>
        ) : (
          conDeuda.map((s) => (
            <div key={s.operatorId} style={{ marginTop: 18 }}>
              <p className="subtitle" style={{ marginBottom: 0 }}>
                <b>{nombreDe.get(s.operatorId) ?? "operadora"}</b> · le toca{" "}
                {formatMXN(s.devengadoMxn)} · se le ha pagado {formatMXN(s.liquidadoMxn)} ·{" "}
                <b>falta {formatMXN(s.porLiquidarMxn)}</b>
                {s.concedidoMxn > 0 ? (
                  <> · más {formatMXN(s.concedidoMxn)} de concesiones acordadas</>
                ) : null}
              </p>

              {/* ⚠️ Un sobrepago se DICE. Taparlo con un max(0) lo haría
                  desaparecer de la pantalla y nadie lo perseguiría. */}
              {s.pagadoDeMasMxn > 0 ? (
                <div className="verdict no" style={{ marginTop: 10 }}>
                  <span className="n">{"//"}</span>
                  <span className="g">
                    <b>Se le transfirió {formatMXN(s.pagadoDeMasMxn)} más de lo que le tocaba</b>
                    <span>
                      Puede ser una liquidación capturada de más, o una devolución posterior a la
                      transferencia. No se descuenta solo: hay que mirarlo.
                    </span>
                  </span>
                </div>
              ) : null}

              <Liquidar
                operatorId={s.operatorId}
                nombre={nombreDe.get(s.operatorId) ?? "la operadora"}
                pendientes={s.pendientes}
              />
            </div>
          ))
        )}

        {/* ── LO QUE YA SE PAGÓ ──────────────────────────────────────────── */}
        <p className="xh4" style={{ marginTop: 34 }}>
          <span className="mono" style={{ color: "var(--orange)" }}>
            02
          </span>{" "}
          Lo que ya se pagó
        </p>
        <p className="subtitle">
          Cada transferencia con su fecha y su referencia. Una capturada mal no se borra: se
          cancela con motivo, y sus cobros vuelven a quedar por liquidar.
        </p>

        {!historial.length ? (
          <div className="empty">
            Todavía no hay ninguna transferencia registrada.
            <br />
            <span style={{ fontSize: 13 }}>
              La tabla nació el 23 sep 2026. Lo que se haya transferido antes hay que capturarlo
              con su fecha y su referencia reales.
            </span>
          </div>
        ) : (
          <div className="tbl-wrap card" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Operadora</th>
                  <th>Se transfirió</th>
                  <th>Cómo</th>
                  <th>Referencia</th>
                  <th className="num right">Monto</th>
                  <th className="num right">Difiere</th>
                  <th>Quién lo apuntó</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((l) => (
                  <tr key={l.id as string}>
                    <td>
                      <b>{nombreDe.get(l.operator_id as string) ?? "—"}</b>
                      {l.cancelada_at ? (
                        <>
                          <br />
                          <small>Cancelada: {(l.cancelada_motivo as string) ?? "sin motivo"}</small>
                        </>
                      ) : null}
                    </td>
                    <td className="mono">
                      {new Date(`${l.pagado_el as string}T12:00:00Z`).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "America/Mexico_City",
                      })}
                    </td>
                    <td>{l.metodo as string}</td>
                    <td className="mono">{(l.referencia as string) || "—"}</td>
                    <td className="num right">
                      {l.cancelada_at ? (
                        <s>{formatMXN(Number(l.monto_mxn))}</s>
                      ) : (
                        <b>{formatMXN(Number(l.monto_mxn))}</b>
                      )}
                    </td>
                    <td className="num right">
                      {Number(l.diferencia_mxn || 0) !== 0 ? (
                        <>
                          <b>{formatMXN(Number(l.diferencia_mxn))}</b>
                          <br />
                          <small>{(l.diferencia_motivo as string) ?? "sin motivo"}</small>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{(l.registrado_por as string) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mnybridge" style={{ marginTop: 22 }}>
          <s>{"//"}</s>
          <span>
            <b>Esta pantalla no mueve dinero.</b> La transferencia se hace por el banco; aquí se
            apunta que se hizo, con qué referencia y qué cobros salda. Lo que se debe no se guarda
            en ninguna columna: se deriva de los pagos, para que no haya un segundo número que
            mantener al día.
          </span>
        </p>
      </div>
    </AdminShell>
  );
}
