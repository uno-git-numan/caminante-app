"use client";

// TU MARCA — el formulario. Reusa el marcado de Mi alta (`.verdict`, `.gnhint`,
// `.btn`) y las clases del expediente; no se diseñó nada nuevo. Lo que decide
// si la marca viste es `marcaLista` del lado del servidor; aquí sólo se dice
// en vivo qué falta para que nadie guarde creyendo que ya quedó.

import { useState, useTransition } from "react";
import { guardarMarca } from "@/lib/operadores/marca-actions";
import { color } from "@/lib/operators/marca";
import { subirImagen } from "../../experiencias/form-piezas";

export type MarcaInicial = {
  logoUrl: string;
  logoDarkUrl: string;
  primary: string;
  accent: string;
  poweredBy: "discreto" | "visible";
  footerLine: string;
};

// EL LOGO SE SUBE, NO SE PEGA (23 nov 2026). Este campo era sólo «liga https a
// .png»: se copió del formulario público de solicitud, que no acepta archivos
// A PROPÓSITO (un endpoint de carga sin sesión es una puerta al bucket). Aquí
// SÍ hay sesión, y una operadora tiene su logo en un archivo, no en una liga.
// Sube por el mismo camino que las fotos de una experiencia (`subirImagen`,
// que además le recorta el aire transparente). La liga sigue sirviendo.
function SubirLogo({ onUrl, disabled }: { onUrl: (url: string) => void; disabled: boolean }) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <label className="btn btn-ghost btn-sm" style={{ cursor: disabled || subiendo ? "default" : "pointer" }}>
        {subiendo ? "Subiendo…" : "Subir archivo"}
        <input
          type="file"
          accept="image/png,image/svg+xml,image/jpeg,image/webp"
          hidden
          disabled={disabled || subiendo}
          onChange={async (e) => {
            const archivo = e.target.files?.[0];
            e.target.value = "";
            if (!archivo) return;
            setSubiendo(true);
            setError(null);
            const r = await subirImagen(archivo, { logo: true });
            if (r.ok) onUrl(r.url);
            else setError(r.error);
            setSubiendo(false);
          }}
        />
      </label>
      {error ? <small style={{ color: "var(--orange)" }}>{error}</small> : null}
    </span>
  );
}

/** El color se elige con el selector del sistema o se teclea: los dos mueven el mismo valor. */
function CampoColor({
  nombre, etiqueta, valor, porOmision, onChange, disabled,
}: {
  nombre: string; etiqueta: string; valor: string; porOmision: string; onChange: (v: string) => void; disabled: boolean;
}) {
  return (
    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        type="color"
        aria-label={`${etiqueta}: elegir`}
        value={color(valor) ?? porOmision}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ width: 44, height: 38, padding: 2, flex: "0 0 auto", cursor: "pointer" }}
      />
      <input name={nombre} aria-label={etiqueta} value={valor} onChange={(e) => onChange(e.target.value)} placeholder={porOmision} disabled={disabled} style={{ flex: 1 }} />
    </span>
  );
}

export default function Marca({ inicial, operadora }: { inicial: MarcaInicial; operadora: string | null }) {
  const [pendiente, arranca] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [primary, setPrimary] = useState(inicial.primary);
  const [accent, setAccent] = useState(inicial.accent);
  const [logo, setLogo] = useState(inicial.logoUrl);
  const [logoOscuro, setLogoOscuro] = useState(inicial.logoDarkUrl);

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
          <CampoColor nombre="marcaPrimary" etiqueta="Color principal" valor={primary} porOmision="#637154" onChange={setPrimary} disabled={pendiente} />
          <small>Botones, ligas y títulos. Elígelo en el cuadro o escribe su código.</small>
        </p>
        <p className="gnhint" style={{ display: "grid", gap: 4 }}>
          <b>Color de acento</b>
          <CampoColor nombre="marcaAccent" etiqueta="Color de acento" valor={accent} porOmision="#ff5d36" onChange={setAccent} disabled={pendiente} />
          <small>Llamadas a la acción y énfasis.</small>
        </p>
        <p className="gnhint" style={{ display: "grid", gap: 4 }}>
          <b>Logo</b>
          <SubirLogo onUrl={setLogo} disabled={pendiente} />
          <input name="marcaLogo" aria-label="Logo" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="…o pega su liga: https://…/logo.png" disabled={pendiente} />
          <small>Opcional. PNG, SVG, JPG o WEBP, para fondo claro. Sin logo va tu nombre en texto.</small>
        </p>
        <p className="gnhint" style={{ display: "grid", gap: 4 }}>
          <b>Logo para fondo oscuro o sobre foto</b>
          <SubirLogo onUrl={setLogoOscuro} disabled={pendiente} />
          <input name="marcaLogoOscuro" aria-label="Logo para fondo oscuro" value={logoOscuro} onChange={(e) => setLogoOscuro(e.target.value)} placeholder="…o pega su liga: https://…/logo-blanco.png" disabled={pendiente} />
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
