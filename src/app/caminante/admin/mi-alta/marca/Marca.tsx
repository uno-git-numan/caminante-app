"use client";

// TU MARCA — el formulario. Lo que decide si la marca viste es `marcaLista`
// del lado del servidor; aquí sólo se dice en vivo qué falta para que nadie
// guarde creyendo que ya quedó.

import { useState, useTransition } from "react";
import { guardarMarca } from "@/lib/operadores/marca-actions";
import { color, logoUrl } from "@/lib/operators/marca";
import { subirImagen } from "../../experiencias/form-piezas";

export type MarcaInicial = {
  logoUrl: string;
  logoDarkUrl: string;
  primary: string;
  accent: string;
  poweredBy: "discreto" | "visible";
  footerLine: string;
};

// LA HOJA DE ESTE FORMULARIO (23 nov 2026).
//
// Los campos iban dentro de `.docs` con párrafos `.gnhint`: dos clases que SÍ
// existen, pero para otra cosa. `.docs` es la lista de documentos del
// expediente —borde, esquinas redondas, `overflow:hidden` y CERO relleno,
// porque sus renglones `.doc` traen el suyo— y aquí no había renglones: el
// texto quedaba pegado al borde y la esquina le comía la primera letra (Luis:
// «se corta el texto, se ve poco profesional»). Y ningún `input` de la hoja de
// Mi alta tiene caja: se veían como texto suelto. «Que la clase exista no es
// que sirva».
//
// El contenedor es `card pad`, de la casa; lo de adentro son estas reglas,
// propias y con su prefijo `.mk`, con los mismos tokens del panel.
const MARCA_CSS = `
.adm .mk{display:grid;gap:22px;max-width:640px}
.adm .mk .c{display:grid;gap:8px;min-width:0}
.adm .mk .c>b{font-size:13.5px;font-weight:600;letter-spacing:-.005em;color:var(--charcoal)}
.adm .mk .c>small{font-size:12px;line-height:1.55;color:var(--ink-soft)}
.adm .mk input[type=text],.adm .mk select{font:inherit;font-size:14px;width:100%;min-width:0;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:#fff;color:var(--charcoal)}
.adm .mk input[type=text]::placeholder{color:var(--sand)}
.adm .mk input[type=text]:focus,.adm .mk select:focus{outline:none;border-color:var(--olive);box-shadow:0 0 0 3px rgba(99,113,84,.15)}
.adm .mk input:disabled,.adm .mk select:disabled{opacity:.55}
.adm .mk .fila{display:flex;gap:10px;align-items:center}
.adm .mk .fila input[type=color]{width:48px;height:42px;padding:3px;border:1px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;flex:0 0 auto}
.adm .mk .fila input[type=text]{font-family:var(--mono);max-width:160px}
.adm .mk .logo{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.adm .mk .logo .muestra{display:grid;place-items:center;height:56px;min-width:56px;padding:6px 10px;border:1px solid var(--line);border-radius:12px;background:#fff}
.adm .mk .logo .muestra.oscura{background:var(--charcoal);border-color:var(--charcoal)}
.adm .mk .logo .muestra img{height:42px;max-width:160px;object-fit:contain;display:block}
.adm .mk .logo .quitar{font:inherit;font-size:12.5px;color:var(--ink-soft);text-decoration:underline;background:none;border:0;cursor:pointer;padding:0}
.adm .mk .logo.suelta{outline:2px dashed var(--olive);outline-offset:6px;border-radius:12px}
.adm .mk .enlace{font:inherit;font-size:12.5px;color:var(--ink-soft);text-decoration:underline;background:none;border:0;cursor:pointer;padding:0;justify-self:start}
.adm .mk .nota{font-size:12.5px;line-height:1.5;color:var(--orange)}
.adm .mk-guardar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:18px}
.adm .mk-guardar .aviso{font-size:13px;color:var(--ink-soft)}
`;

// EL LOGO SE SUBE, NO SE PEGA (23 nov 2026). Este campo era sólo «liga https a
// .png»: se copió del formulario público de solicitud, que no acepta archivos
// A PROPÓSITO (un endpoint de carga sin sesión es una puerta al bucket). Aquí
// SÍ hay sesión, y una operadora tiene su logo en un archivo, no en una liga.
// Sube por el mismo camino que las fotos de una experiencia (`subirImagen`,
// que además le recorta el aire transparente).
//
// ⚠️ SUBIR ES EL ÚNICO CAMINO A LA VISTA. La primera versión dejaba, justo
// debajo del botón, una caja de texto «…o pega su liga». Luis, probándolo como
// operadora, escribió ahí el NOMBRE del archivo: la pantalla lo aceptó, enseñó
// un recuadro vacío con «Cambiar archivo» como si hubiera subido algo, y al
// guardar contestó «tiene que ser una liga https». Una caja de texto debajo de
// la palabra «Logo» se llena con texto. Ahora:
//   · la liga es una opción que hay que pedir («Tengo mi logo en una liga»);
//   · la muestra sólo aparece si lo que hay ES una imagen enlazable;
//   · lo que se manda al servidor es la liga válida o nada, nunca lo tecleado;
//   · y si se escribe algo que no es liga, se dice ahí mismo qué hacer.
function CampoLogo({
  nombre,
  etiqueta,
  valor,
  onChange,
  disabled,
  oscura,
}: {
  nombre: string;
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  disabled: boolean;
  /** La muestra va sobre fondo oscuro: es el logo para fotos y fondos oscuros. */
  oscura?: boolean;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conLiga, setConLiga] = useState(false);
  const [sobre, setSobre] = useState(false);
  const valido = logoUrl(valor);
  const ocupado = disabled || subiendo;

  const subir = async (archivo: File | undefined) => {
    if (!archivo) return;
    if (!/^image\/(png|svg\+xml|jpeg|webp)$/.test(archivo.type)) {
      setError("Ese archivo no es una imagen. Tu logo tiene que ser PNG, SVG, JPG o WEBP.");
      return;
    }
    setSubiendo(true);
    setError(null);
    const r = await subirImagen(archivo, { logo: true });
    if (r.ok) {
      onChange(r.url);
      setConLiga(false);
    } else setError(r.error);
    setSubiendo(false);
  };

  return (
    <>
      {/* Lo que viaja al servidor: la liga válida, o nada. */}
      <input type="hidden" name={nombre} value={valido ?? ""} />
      <span
        className={"logo" + (sobre ? " suelta" : "")}
        onDragOver={(e) => {
          e.preventDefault();
          if (!ocupado) setSobre(true);
        }}
        onDragLeave={() => setSobre(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSobre(false);
          if (!ocupado) void subir(e.dataTransfer.files?.[0]);
        }}
      >
        {valido ? (
          <span className={"muestra" + (oscura ? " oscura" : "")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={valido} alt="" />
          </span>
        ) : null}
        <label className={"btn btn-sm " + (valido ? "btn-ghost" : "btn-orange")} style={{ cursor: ocupado ? "default" : "pointer" }}>
          {subiendo ? "Subiendo…" : valido ? "Cambiar archivo" : "Subir archivo"}
          <input
            type="file"
            aria-label={`${etiqueta}: subir archivo`}
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            hidden
            disabled={ocupado}
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              e.target.value = "";
              void subir(archivo);
            }}
          />
        </label>
        {valido ? (
          <button
            type="button"
            className="quitar"
            disabled={ocupado}
            onClick={() => {
              onChange("");
              setConLiga(false);
              setError(null);
            }}
          >
            Quitar
          </button>
        ) : null}
      </span>
      {error ? <span className="nota">{error}</span> : null}

      {!valido && !conLiga ? (
        <button type="button" className="enlace" onClick={() => setConLiga(true)} disabled={ocupado}>
          Tengo mi logo en una liga
        </button>
      ) : null}
      {!valido && conLiga ? (
        <>
          <input
            type="text"
            aria-label={`${etiqueta}: liga`}
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://tusitio.com/logo.png"
            disabled={ocupado}
            autoFocus
          />
          {valor.trim() ? (
            <span className="nota">
              Eso no es una liga a una imagen. Tiene que empezar con https:// y terminar en .png, .svg, .jpg o .webp. Si
              tu logo está en tu computadora, usa «Subir archivo».
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );
}

/** El color se elige con el selector del sistema o se teclea: los dos mueven el mismo valor. */
function CampoColor({
  nombre,
  etiqueta,
  valor,
  porOmision,
  onChange,
  disabled,
}: {
  nombre: string;
  etiqueta: string;
  valor: string;
  porOmision: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <span className="fila">
      <input
        type="color"
        aria-label={`${etiqueta}: elegir`}
        value={color(valor) ?? porOmision}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <input
        type="text"
        name={nombre}
        aria-label={etiqueta}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={porOmision}
        disabled={disabled}
      />
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
      <style dangerouslySetInnerHTML={{ __html: MARCA_CSS }} />

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

      <div className="card pad mk" style={{ boxShadow: "none" }}>
        <div className="c">
          <b>Color principal</b>
          <CampoColor nombre="marcaPrimary" etiqueta="Color principal" valor={primary} porOmision="#637154" onChange={setPrimary} disabled={pendiente} />
          <small>Botones, ligas y títulos. Elígelo en el cuadro o escribe su código.</small>
        </div>

        <div className="c">
          <b>Color de acento</b>
          <CampoColor nombre="marcaAccent" etiqueta="Color de acento" valor={accent} porOmision="#ff5d36" onChange={setAccent} disabled={pendiente} />
          <small>Llamadas a la acción y énfasis.</small>
        </div>

        <div className="c">
          <b>Logo</b>
          <CampoLogo nombre="marcaLogo" etiqueta="Logo" valor={logo} onChange={setLogo} disabled={pendiente} />
          <small>Opcional. PNG, SVG, JPG o WEBP, para fondo claro: súbelo o arrástralo aquí. Sin logo va tu nombre en texto.</small>
        </div>

        <div className="c">
          <b>Logo para fondo oscuro o sobre foto</b>
          <CampoLogo nombre="marcaLogoOscuro" etiqueta="Logo para fondo oscuro" valor={logoOscuro} onChange={setLogoOscuro} disabled={pendiente} oscura />
          <small>Opcional. Si falta, se usa el de arriba.</small>
        </div>

        <div className="c">
          <b>Línea del pie</b>
          <input type="text" name="marcaPie" aria-label="Línea del pie" defaultValue={inicial.footerLine} placeholder="Nomádika · Expediciones en el Ajusco" disabled={pendiente} />
          <small>Opcional. Va al pie de tu portal.</small>
        </div>

        <div className="c">
          <b>«Operado con Caminante»</b>
          <select name="poweredBy" aria-label="Operado con Caminante" defaultValue={inicial.poweredBy} disabled={pendiente}>
            <option value="discreto">Discreto (letra pequeña al pie)</option>
            <option value="visible">Visible</option>
          </select>
        </div>
      </div>

      <div className="mk-guardar">
        <button className="btn btn-orange btn-sm" disabled={pendiente}>
          {pendiente ? "Guardando…" : "Guardar mi marca"}
        </button>
        {msg ? <span className="aviso" style={msg.ok ? undefined : { color: "var(--orange)" }}>{msg.texto}</span> : null}
      </div>
    </form>
  );
}
