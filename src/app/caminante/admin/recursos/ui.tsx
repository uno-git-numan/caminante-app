// Piezas compartidas del tablero — las usan la escalera («Fechas y equilibrio»)
// y las secciones de Ingresos y Egresos, para que las tres lean con la MISMA
// rejilla de columnas. Esa rejilla compartida es del entregable de Claude
// Design y es lo que permite seguir una columna de arriba a abajo aunque
// cambie la agrupación (por mes en la escalera, por experiencia en las otras).

import type { SalidaRentabilidad } from "@/lib/admin/rentabilidad";

export const mx = (n: number) =>
  "$" + Math.round(Math.abs(n)).toLocaleString("es-MX");
/** Signo y color separados: el IVA a veces es a favor y a veces a cargo. */
export const firmado = (n: number) => (n < 0 ? "−" : "+") + mx(n);
export const cls = (n: number) => (n < 0 ? "neg" : n > 0 ? "pos" : "");

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
export function mesLabel(ym: string) {
  const [y, m] = ym.split("-");
  const nm = MESES[Number(m) - 1] || "";
  return nm ? `${nm[0].toUpperCase()}${nm.slice(1)} ${y}` : ym;
}

/** Barra de llenado con la marca vertical del punto de equilibrio. */
export function Llenado({ s }: { s: SalidaRentabilidad }) {
  const cupo = s.cupo || 0;
  const pct = cupo ? Math.min(100, Math.round((s.vendidos / cupo) * 100)) : 0;
  const eq = cupo && s.equilibrio ? Math.min(100, Math.round((s.equilibrio / cupo) * 100)) : 0;
  const cruzado = s.equilibrio != null && s.vendidos >= s.equilibrio;
  return (
    <div className="prog2">
      <div
        className={"tk" + (cruzado ? "" : " bajo")}
        style={{ ["--pct" as string]: pct + "%", ["--eq" as string]: eq + "%" }}
      >
        <i></i>
        {eq > 0 ? <span className="eq"></span> : null}
      </div>
      <div className="fr">
        <span>
          <b>{s.vendidos}</b>/{cupo || "∞"}
        </span>
        <span>{s.equilibrio != null ? `eq. ${s.equilibrio}` : "eq. —"}</span>
      </div>
    </div>
  );
}

export function Fila({ s }: { s: SalidaRentabilidad }) {
  return (
    <>
      <div className="c-name">
        <div className="sal-lbl">{s.experienciaNombre}</div>
        <div className="sub">{s.salidaLabel}</div>
      </div>
      <div>
        <Llenado s={s} />
      </div>
      <div className="money">{mx(s.ingreso)}</div>
      <div className={"money " + cls(s.ivaNeto)}>{firmado(s.ivaNeto)}</div>
      <div className="money neg">−{mx(s.stripe)}</div>
      <div className="money neg">−{mx(s.proveedoresConIva)}</div>
      <div className={"money money--util " + (s.sinCostos ? "" : cls(s.utilidad))}>
        {s.sinCostos ? <span className="mut">sin costear</span> : firmado(s.utilidad)}
      </div>
      <span className="chev2">▼</span>
    </>
  );
}


