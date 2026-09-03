"use client";

// LA CALCULADORA DE PRECIO — lo que explica de dónde sale cada peso.
//
// Va pegada al campo de precio, en las DOS direcciones:
//   · escribes lo que quieres recibir  → te sugiere el precio al público
//   · escribes el precio al público    → te dice qué te queda
//
// ⚠️ NO ELEVA NADA SOLA. El botón «Usar este precio» es de una persona, y solo
// entonces el número entra al formulario. Si el sistema elevara el precio en
// cada guardado, un costo escrito ya con la comisión adentro se volvería a
// elevar y el cliente pagaría la comisión dos veces. Aquí ese caso se ve: el
// renglón «Recibes tú» sale más alto de lo que la persona dijo necesitar.

import { useState } from "react";
import type { Regla } from "@/lib/operadores/comision";
import { desglosarPrecio, precioSugerido, type Desglose } from "@/lib/operadores/precio-sugerido";

const mxn = (n: number) =>
  "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const num = (s: string) => {
  const n = Number(String(s ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function Renglon({ k, v, nota, fuerte }: { k: string; v: string; nota?: string; fuerte?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        padding: "5px 0",
        fontSize: 13,
        fontWeight: fuerte ? 600 : 400,
      }}
    >
      <span>
        {k}
        {nota ? (
          <span className="mut" style={{ fontSize: 11.5, display: "block", fontWeight: 400 }}>
            {nota}
          </span>
        ) : null}
      </span>
      <span className="mono" style={{ whiteSpace: "nowrap" }}>{v}</span>
    </div>
  );
}

export default function CalculadoraPrecio({
  regla,
  publico,
  onUsarPrecio,
  compacta = false,
}: {
  /** La regla que le toca a ESTE operador. La resuelve el servidor. */
  regla: Regla;
  /** El precio que hoy tiene el campo, con IVA. */
  publico: string;
  /** Escribe el precio sugerido en el campo del formulario. */
  onUsarPrecio: (v: string) => void;
  /** Dentro de un complemento: sin encabezado, más apretada. */
  compacta?: boolean;
}) {
  const [quiero, setQuiero] = useState("");
  const [abierta, setAbierta] = useState(false);

  const pub = num(publico);
  const neto = num(quiero);
  const sugerido: Desglose | null = neto > 0 ? precioSugerido(neto, regla) : null;
  const actual: Desglose | null = pub > 0 ? desglosarPrecio(pub, regla) : null;

  const comoSeCobra =
    regla.tipo === "plano"
      ? `tu comisión pactada de ${regla.pct}%`
      : regla.escala === "venta"
        ? "la escala de venta (Caminante trae al cliente)"
        : "la escala de plataforma (tú traes al cliente)";

  return (
    <div className="card pad" style={{ marginTop: 12, background: "rgba(99,113,84,.05)" }}>
      {compacta ? null : <span className="subtitle">Precio sugerido</span>}
      <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.65, marginTop: compacta ? 0 : 6 }}>
        Escribe <b>lo que quieres recibir tú</b> —el número de tu cotización, sin IVA— y te decimos a
        qué precio hay que publicarlo para que eso te llegue completo. Se calcula con {comoSeCobra}.
      </p>

      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginTop: 10 }}>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Quiero recibir (sin IVA){" "}
          <input
            type="number"
            value={quiero}
            onChange={(e) => setQuiero(e.target.value)}
            placeholder="23350"
            style={{ width: 130 }}
          />
        </label>
        {sugerido ? (
          <>
            <span style={{ fontSize: 15 }}>
              → publicar en <b>{mxn(sugerido.publico)}</b>
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onUsarPrecio(String(Math.round(sugerido.publico)))}
            >
              Usar este precio
            </button>
          </>
        ) : null}
      </div>

      {/* El desglose del precio QUE ESTÁ EN EL CAMPO — no el sugerido. Es el que
          va a cobrarse, y por eso es el que tiene que poder auditarse. */}
      {actual ? (
        <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 10 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setAbierta((v) => !v)}
            style={{ marginBottom: abierta ? 8 : 0 }}
          >
            {abierta ? "Ocultar" : `Ver a dónde van los ${mxn(actual.publico)} del campo`}
          </button>
          {abierta ? (
            <div>
              <Renglon
                k="Recibes tú"
                v={mxn(actual.neto)}
                nota={`facturas ${mxn(actual.neto + actual.ivaNeto)} con IVA`}
              />
              <Renglon
                k="Comisión Caminante"
                v={mxn(actual.comision)}
                nota={`${(actual.pct * 100).toFixed(2)}% sobre la base de ${mxn(actual.base)}`}
              />
              <Renglon
                k="IVA de la comisión"
                v={mxn(actual.ivaComision)}
                nota="lo retiene Caminante y lo traslada al SAT"
              />
              <div style={{ borderTop: "1px solid var(--line)", marginTop: 6, paddingTop: 6 }}>
                <Renglon k="Paga el cliente" v={mxn(actual.publico)} fuerte />
              </div>
              <p className="mut" style={{ fontSize: 11.5, lineHeight: 1.6, marginTop: 8 }}>
                La comisión se calcula sobre la base <b>sin IVA</b>: se cobra por el servicio, no por
                un impuesto que se traslada. Entre más caro el ticket, más baja la tasa — por eso un
                complemento barato paga un porcentaje más alto que el viaje al que se le pega.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
