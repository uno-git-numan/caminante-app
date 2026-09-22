"use client";

// TU MARCA — el formulario. Reusa el marcado de Mi alta (`.verdict`, `.gnhint`,
// `.btn`) y las clases del expediente; no se diseñó nada nuevo. Lo que decide
// si la marca viste es `marcaLista` del lado del servidor; aquí sólo se dice
// en vivo qué falta para que nadie guarde creyendo que ya quedó.

import { useState, useTransition } from "react";
import { guardarMarca } from "@/lib/operadores/marca-actions";
import { color } from "@/lib/operators/marca";

export type MarcaInicial = {
  logoUrl: string;
  logoDarkUrl: string;
  primary: string;
  accent: string;
  poweredBy: "discreto" | "visible";
  footerLine: string;
};

export default function Marca({ inicial, operadora }: { inicial: MarcaInicial; operadora: string | null }) {
  const [pendiente, arranca] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [primary, setPrimary] = useState(inicial.primary);
  const [accent, setAccent] = useState(inicial.accent);
  const [logo, setLogo] = useState(inicial.logoUrl);

  const p = color(primary);
  const a = color(accent);
  const completa = !!(p && a);

  return (
    <form
      action={(fd) =>
        arranca(async () => {
          fd.set("operadora", operadora ?? "");
          const r = await guardarMarca(fd);
          setMsg(
            r.ok
              ? { ok: true, texto: r.completa ? "Guardada. Tu portal y tu funnel ya se ven tuyos." : "Guardada. Faltan los dos colores para que se vea tuya." }
              : { ok: false, texto: r.error },
          );
        })
      }
    >
      <div className={completa ? "verdict si" : "verdict no"} style={{ marginBottom: 18 }}>
        <span className="n">{"//"}</span>
        <span className="g">
          <b>{completa ? "Tu marca está completa" : "Tu marca está a medias"}</b>
          <span>
            {completa
              ? "Con estos dos colores tu portal, tu ficha, la reserva y el deslinde se visten de ti."
              : "Sin los dos colores todo lo tuyo se ve de Caminante, con tu nombre. El logo es opcional; los colores no."}
          </span>
          {/* La vista previa es honesta: es exactamente lo que `themeCssFor`
              derivaría. Dos colores; el resto se calcula. */}
          <span style={{ display: "inline-flex", gap: 8, marginTop: 10, alignItems: "center" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: p ?? "#637154", border: "1px solid rgba(0,0,0,.12)" }} title="principal" />
            <span style={{ width: 28, height: 28, borderRadius: 8, background: a ?? "#ff5d36", border: "1px solid rgba(0,0,0,.12)" }} title="acento" />
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" style={{ height: 28, maxWidth: 140, objectFit: "contain" }} />
            ) : null}
          </span>
        </span>
      </div>

      <div className="docs" style={{ display: "grid", gap: 12, maxWidth: 560 }}>
        <p className="gnhint" style={{ display: "grid", gap: 4 }}>
          <b>Color principal</b>
          <input name="marcaPrimary" aria-label="Color principal" value={primary} onChange={(e) => setPrimary(e.target.value)} placeholder="#637154" disabled={pendiente} />
          <small>Botones, ligas y títulos. Hex de 6 dígitos.</small>
        </p>
        <p className="gnhint" style={{ display: "grid", gap: 4 }}>
          <b>Color de acento</b>
          <input name="marcaAccent" aria-label="Color de acento" value={accent} onChange={(e) => setAccent(e.target.value)} placeholder="#ff5d36" disabled={pendiente} />
          <small>Llamadas a la acción y énfasis.</small>
        </p>
        <p className="gnhint" style={{ display: "grid", gap: 4 }}>
          <b>Logo (liga https a .png, .svg, .jpg o .webp)</b>
          <input name="marcaLogo" aria-label="Logo" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…/logo.png" disabled={pendiente} />
          <small>Opcional. Sobre fondo claro. Sin logo va tu nombre en texto.</small>
        </p>
        <p className="gnhint" style={{ display: "grid", gap: 4 }}>
          <b>Logo para fondo oscuro o sobre foto</b>
          <input name="marcaLogoOscuro" aria-label="Logo para fondo oscuro" defaultValue={inicial.logoDarkUrl} placeholder="https://…/logo-blanco.png" disabled={pendiente} />
          <small>Opcional. Si falta, se usa el de arriba.</small>
        </p>
        <p className="gnhint" style={{ display: "grid", gap: 4 }}>
          <b>Línea del pie</b>
          <input name="marcaPie" aria-label="Línea del pie" defaultValue={inicial.footerLine} placeholder="Nomádika · Expediciones en el Ajusco" disabled={pendiente} />
          <small>Opcional. Va al pie de tu portal.</small>
        </p>
        <p className="gnhint" style={{ display: "grid", gap: 4 }}>
          <b>«Operado con Caminante»</b>
          <select name="poweredBy" aria-label="Operado con Caminante" defaultValue={inicial.poweredBy} disabled={pendiente}>
            <option value="discreto">Discreto (letra pequeña al pie)</option>
            <option value="visible">Visible</option>
          </select>
        </p>
      </div>

      <p className="gnhint" style={{ marginTop: 14 }}>
        <button className="btn btn-orange btn-sm" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Guardar mi marca"}
        </button>
        {msg ? <span className="mut" style={msg.ok ? undefined : { color: "var(--orange)" }}> · {msg.texto}</span> : null}
      </p>
    </form>
  );
}
