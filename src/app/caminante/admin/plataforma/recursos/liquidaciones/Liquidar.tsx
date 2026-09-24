"use client";

// EL FORMULARIO DE UNA LIQUIDACIÓN.
//
// ⚠️ NO TRANSFIERE. El dinero sale por el banco y lo mueve Luis; esto sólo
// apunta que salió. Por eso el botón dice «Registrar» y no «Pagar»: un botón
// que promete mover dinero y no lo mueve es peor que no tener botón.
//
// El monto se sugiere sumando los cobros que marcas, pero SE PUEDE CAMBIAR: la
// primera liquidación real no cuadró con lo calculado —Luis había acordado
// menos comisión con Nomádika por ser su primera experiencia— y bloquearla
// habría sido impedir registrar lo que de verdad pasó.
//
// ⚠️ LO QUE NO SE PUEDE ES DIFERIR EN SILENCIO. En cuanto el monto se separa de
// lo calculado aparece el campo del motivo y sin él no se registra, aquí y en
// la base (0067). Un descuadre con explicación es un dato; sin ella es un
// misterio que alguien va a intentar resolver en seis meses.

import { useMemo, useState, useTransition } from "react";
import { registrarLiquidacion } from "@/lib/operadores/liquidaciones-actions";

export type PagoUI = {
  paymentId: string;
  cobradoMxn: number;
  devueltoMxn: number;
  comisionMxn: number;
  netoMxn: number;
  pagadoEl: string | null;
};

const pesos = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fecha = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "America/Mexico_City",
      })
    : "—";

export default function Liquidar({
  operatorId,
  nombre,
  pendientes,
}: {
  operatorId: string;
  nombre: string;
  pendientes: PagoUI[];
}) {
  // Todos marcados al abrir: el caso normal es liquidar lo que se debe completo,
  // y desmarcar es más fácil que marcar doce casillas.
  const [elegidos, setElegidos] = useState<Set<string>>(
    () => new Set(pendientes.map((p) => p.paymentId)),
  );
  const [pagadoEl, setPagadoEl] = useState(() => new Date().toISOString().slice(0, 10));
  const [metodo, setMetodo] = useState<"transferencia" | "efectivo" | "otro">("transferencia");
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");
  // null = «el monto es la suma de lo marcado». Un número = lo capturaste tú.
  const [montoManual, setMontoManual] = useState<string | null>(null);
  const [difMotivo, setDifMotivo] = useState("");
  const [aviso, setAviso] = useState<{ tipo: "ok" | "mal"; texto: string } | null>(null);
  const [enviando, empezar] = useTransition();

  const calculado = useMemo(
    () =>
      Math.round(
        pendientes.filter((p) => elegidos.has(p.paymentId)).reduce((a, p) => a + p.netoMxn, 0) * 100,
      ) / 100,
    [pendientes, elegidos],
  );
  const total =
    montoManual === null || montoManual.trim() === ""
      ? calculado
      : Math.round((Number(montoManual) || 0) * 100) / 100;
  const diferencia = Math.round((total - calculado) * 100) / 100;
  const hayDiferencia = Math.abs(diferencia) > 0.01;

  const alternar = (id: string) =>
    setElegidos((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  const enviar = () => {
    setAviso(null);
    empezar(async () => {
      const r = await registrarLiquidacion({
        operatorId,
        montoMxn: total,
        pagadoEl,
        metodo,
        referencia: referencia || null,
        notas: notas || null,
        pagos: [...elegidos],
        diferenciaMotivo: hayDiferencia ? difMotivo : null,
      });
      if (r.ok) {
        setAviso({
          tipo: "ok",
          texto: `Quedó registrada: ${pesos(r.monto)} sobre ${r.pagos} ${r.pagos === 1 ? "cobro" : "cobros"}.`,
        });
        setReferencia("");
        setNotas("");
        setMontoManual(null);
        setDifMotivo("");
      } else {
        setAviso({ tipo: "mal", texto: r.error });
      }
    });
  };

  if (!pendientes.length) {
    return (
      <div className="empty">
        A {nombre} no se le debe nada por ventas cobradas en la cuenta de Caminante.
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 14, padding: 18 }}>
      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 34 }} />
              <th>Cobro</th>
              <th className="num right">Cobrado</th>
              <th className="num right">Devuelto</th>
              <th className="num right">Comisión</th>
              <th className="num right">Le toca</th>
            </tr>
          </thead>
          <tbody>
            {pendientes.map((p) => (
              <tr key={p.paymentId}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Incluir el cobro del ${fecha(p.pagadoEl)}`}
                    checked={elegidos.has(p.paymentId)}
                    onChange={() => alternar(p.paymentId)}
                  />
                </td>
                <td className="mono">{fecha(p.pagadoEl)}</td>
                <td className="num right">{pesos(p.cobradoMxn)}</td>
                <td className="num right">{p.devueltoMxn > 0 ? pesos(p.devueltoMxn) : "—"}</td>
                <td className="num right">{pesos(p.comisionMxn)}</td>
                <td className="num right">
                  <b>{pesos(p.netoMxn)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mini-form" style={{ marginTop: 16 }}>
        <label>
          <span className="k-lbl">Se transfirió el</span>
          <input type="date" value={pagadoEl} onChange={(e) => setPagadoEl(e.target.value)} />
        </label>
        <label>
          <span className="k-lbl">Cómo</span>
          <select value={metodo} onChange={(e) => setMetodo(e.target.value as typeof metodo)}>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="otro">Otro</option>
          </select>
        </label>
        <label>
          <span className="k-lbl">Referencia del banco</span>
          <input
            type="text"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="la que aparece en el estado de cuenta"
          />
        </label>
        <label>
          <span className="k-lbl">Nota</span>
          <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)} />
        </label>
      </div>

      <div className="mini-form" style={{ marginTop: 12 }}>
        <label>
          <span className="k-lbl">Monto real de la transferencia</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={montoManual ?? calculado.toFixed(2)}
            onChange={(e) => setMontoManual(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
        {hayDiferencia ? (
          <label style={{ flex: "2 1 320px" }}>
            <span className="k-lbl">
              Por qué difiere {pesos(Math.abs(diferencia))} ({diferencia > 0 ? "de más" : "de menos"})
            </span>
            <input
              type="text"
              value={difMotivo}
              onChange={(e) => setDifMotivo(e.target.value)}
              placeholder="p. ej. menos comisión acordada por ser su primera experiencia"
            />
          </label>
        ) : null}
      </div>

      <p className="note" style={{ marginTop: 14 }}>
        <s>{"//"}</s>
        <span>
          La referencia es lo que permite cuadrar contra el estado de cuenta, y lo que impide
          apuntar dos veces la misma transferencia. No es obligatoria, pero sin ella la
          conciliación es a ojo.
          {hayDiferencia ? (
            <>
              {" "}
              <b>
                La diferencia se guarda como tal, con su motivo: no reescribe la comisión de esas
                ventas —que está congelada a propósito— ni aparece como sobrepago.
              </b>
            </>
          ) : null}
        </span>
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span className="k-lbl">Lo que se transfirió</span>
          <div className="k-val">{pesos(total)}</div>
          <p className="k-sub" style={{ margin: 0 }}>
            {elegidos.size} de {pendientes.length} {pendientes.length === 1 ? "cobro" : "cobros"}{" "}
            saldan {pesos(calculado)}.
            {hayDiferencia ? null : " Si transferiste otra cantidad, cámbialo abajo."}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-orange"
          disabled={enviando || total <= 0 || (hayDiferencia && difMotivo.trim().length < 10)}
          onClick={enviar}
        >
          {enviando ? "Registrando…" : "Registrar la transferencia"}
        </button>
      </div>

      {aviso ? (
        <p className={`note ${aviso.tipo === "ok" ? "ok" : "falta"}`} style={{ marginTop: 14 }}>
          <s>{"//"}</s>
          <span>{aviso.texto}</span>
        </p>
      ) : null}
    </div>
  );
}
