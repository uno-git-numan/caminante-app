"use client";

// CÓDIGOS DE DESCUENTO DE UNA SALIDA — dentro de su cápsula (Luis, 4 nov 2026:
// «tiene que estar en Salidas, no en Recursos; cada salida puntual tiene su
// código individual»). Mismo lenguaje visual que «Link de pago especial»:
// card pad · subtitle · mini-form · act-row, y los renglones `salper` de la
// cápsula para los códigos que ya existen.
//
// La diferencia con el link especial: el link es para UNA persona con nombre;
// el código es para quien lo teclee en /reservar (una promo, un grupo, un
// aliado). El descuento va sobre el viaje (personas × precio), no sobre los
// complementos; los usos se gastan cuando el pago cae; un código que ya no
// quieres se apaga, no se borra (las reservas que lo usaron lo apuntan).

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CodigoDescuento, TipoDescuento } from "@/lib/descuentos/codigos";
import { apagarCodigo, crearCodigo } from "@/lib/descuentos/acciones";

const pesos = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const fecha = (ymd: string) => new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(`${ymd}T12:00:00Z`)).replace(".", "");

function resumen(c: CodigoDescuento, precioLista: number | null): string {
  const que = c.tipo === "porcentaje" ? `${c.valor}%` : `${pesos(c.valor)} menos`;
  const cobra = precioLista != null ? ` · cobra ${pesos(c.tipo === "porcentaje" ? precioLista * (1 - c.valor / 100) : Math.max(0, precioLista - c.valor))} por lugar` : "";
  const usos = c.usosMax != null ? `${c.usos} de ${c.usosMax} usos` : `${c.usos} ${c.usos === 1 ? "uso" : "usos"}, sin tope`;
  const vig = c.vigenteHasta ? ` · vence ${fecha(c.vigenteHasta)}` : "";
  return `${que}${cobra} · ${usos}${vig}${c.nota ? ` · ${c.nota}` : ""}`;
}

/**
 * El mensaje que la casa copia y pega (Luis, 4 nov 2026): el link del grupo de
 * ESTA salida con el código ya puesto (`?codigo=`), lo que cobra y cuánto era.
 */
function mensajeDelCodigo(c: CodigoDescuento, ctx: { titulo: string; fechaLarga: string; precioLista: number | null; liga: string }): string {
  const sep = ctx.liga.includes("?") ? "&" : "?";
  const liga = `${ctx.liga}${sep}codigo=${c.codigo}`;
  const cobra = ctx.precioLista != null ? (c.tipo === "porcentaje" ? ctx.precioLista * (1 - c.valor / 100) : Math.max(0, ctx.precioLista - c.valor)) : null;
  const cuanto = cobra != null && ctx.precioLista != null ? `pagas ${pesos(cobra)} en vez de ${pesos(ctx.precioLista)} por lugar` : c.tipo === "porcentaje" ? `tienes ${c.valor}% de descuento` : `tienes ${pesos(c.valor)} de descuento`;
  const vence = c.vigenteHasta ? ` Vale hasta el ${fecha(c.vigenteHasta)}.` : "";
  return `Hola, te comparto *${ctx.titulo}* (${ctx.fechaLarga}) con Caminante. Con el código *${c.codigo}* ${cuanto}.${vence}\n\nAparta tu lugar aquí, el código ya va puesto: ${liga}`;
}

export function CodigosDeSalida({ slotId, codigos, abierta, precioLista, titulo, fechaLarga, liga, onListo }: { slotId: string; codigos: CodigoDescuento[]; abierta: boolean; precioLista: number | null; titulo: string; fechaLarga: string; liga: string; onListo: () => void }) {
  const [f, setF] = useState({ codigo: "", tipo: "porcentaje" as TipoDescuento, valor: "", usosMax: "", hasta: "", nota: "" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [hecho, setHecho] = useState<string | null>(null);
  const [tocando, setTocando] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const router = useRouter();
  const copiar = (c: CodigoDescuento) =>
    navigator.clipboard?.writeText(mensajeDelCodigo(c, { titulo, fechaLarga, precioLista, liga })).then(() => {
      setCopiado(c.id);
      setTimeout(() => setCopiado(null), 1500);
    });

  const valorN = Number(f.valor.replace(/[^0-9.]/g, ""));
  const vistaPrevia =
    precioLista != null && valorN > 0
      ? f.tipo === "porcentaje"
        ? valorN < 100
          ? `Cobra ${pesos(precioLista * (1 - valorN / 100))} de ${pesos(precioLista)} por lugar`
          : "El descuento tiene que ser menor a 100%"
        : valorN < precioLista
          ? `Cobra ${pesos(precioLista - valorN)} de ${pesos(precioLista)} por lugar (${Math.round((valorN / precioLista) * 100)}% menos)`
          : `Es más que el precio de lista (${pesos(precioLista)})`
      : null;

  const activos = codigos.filter((c) => c.activo);
  const apagados = codigos.filter((c) => !c.activo);

  const prenderApagar = async (c: CodigoDescuento) => {
    setTocando(c.id);
    setError("");
    const r = await apagarCodigo(c.id, !c.activo);
    setTocando(null);
    if (!r.ok) setError(r.error);
    else router.refresh();
  };

  return (
    <div className="card pad" style={{ marginTop: 14 }}>
      <span className="subtitle">Códigos de descuento de esta salida</span>
      <p className="mut" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.55 }}>
        Quien lo teclee en la página de reservar paga menos por el viaje (no por los complementos). «Copiar mensaje» te da el texto con el link de esta salida y el código ya puesto. Los usos se gastan cuando el pago cae; la comisión se calcula sobre lo cobrado.
      </p>

      {activos.length || apagados.length ? (
        <div style={{ marginTop: 10 }}>
          {[...activos, ...apagados].map((c) => (
            <div className="salper" key={c.id} style={c.activo ? undefined : { opacity: 0.6 }}>
              <span className="nm">
                <b className="mono">{c.codigo}</b>
                <small>{resumen(c, precioLista)}</small>
              </span>
              <span className="rt">
                <span className="st">{c.activo ? "Activo" : "Apagado"}</span>
                {c.activo ? (
                  <button type="button" className="btn btn-glass btn-sm" style={{ padding: "3px 9px", fontSize: 11.5 }} onClick={() => void copiar(c)}>
                    {copiado === c.id ? "Copiado" : "Copiar mensaje"}
                  </button>
                ) : null}
                <button type="button" className="btn btn-ghost btn-sm" style={{ padding: "3px 9px", fontSize: 11.5 }} disabled={tocando === c.id} onClick={() => void prenderApagar(c)}>
                  {c.activo ? "Apagar" : "Volver a prender"}
                </button>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mut" style={{ fontSize: 12.5, marginTop: 10 }}>Esta salida todavía no tiene códigos.</p>
      )}

      {abierta ? (
        <>
          <div className="mini-form" style={{ marginTop: 12 }}>
            <label className="mut" style={{ fontSize: 12.5 }}>
              Código <input value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value.toUpperCase().replace(/\s+/g, "") })} placeholder="AMIGOS20" style={{ width: 130 }} />
            </label>
            <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value as TipoDescuento, valor: "" })} aria-label="Tipo">
              <option value="porcentaje">% de descuento</option>
              <option value="monto">Pesos de descuento</option>
            </select>
            <input inputMode="decimal" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} placeholder={f.tipo === "porcentaje" ? "20" : "2000"} aria-label={f.tipo === "porcentaje" ? "Porcentaje" : "Pesos"} style={{ width: 90 }} />
            <label className="mut" style={{ fontSize: 12.5 }}>
              Usos máx. <input inputMode="numeric" value={f.usosMax} onChange={(e) => setF({ ...f, usosMax: e.target.value })} placeholder="sin tope" style={{ width: 80 }} />
            </label>
            <label className="mut" style={{ fontSize: 12.5 }}>
              Vence <input type="date" value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} aria-label="Vence" />
            </label>
          </div>
          <div className="mini-form">
            <input value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} placeholder="Para qué: promo del boletín, grupo de Miranda…" aria-label="Para qué" style={{ flex: "1 1 220px" }} />
            {vistaPrevia ? <span className="mut" style={{ fontSize: 12.5 }}>{vistaPrevia}</span> : precioLista == null ? <span className="mut" style={{ fontSize: 12.5 }}>Esta salida no tiene precio de lista.</span> : null}
          </div>
        </>
      ) : (
        <p className="mut" style={{ fontSize: 12.5, marginTop: 10 }}>Ya no se vende: los códigos se quedan, pero no se crean nuevos.</p>
      )}
      {error ? <p style={{ fontSize: 12.5, color: "var(--orange)", marginTop: 10 }}>{error}</p> : null}
      {hecho ? <p className="mut" style={{ fontSize: 12.5, marginTop: 10 }}>Listo: <b className="mono">{hecho}</b> ya funciona en la página de reservar de esta salida.</p> : null}
      <div className="act-row">
        {abierta ? (
          <button
            type="button"
            className="btn btn-orange"
            disabled={guardando || f.codigo.trim().length < 3 || !(valorN > 0)}
            onClick={async () => {
              setGuardando(true);
              setError("");
              setHecho(null);
              const r = await crearCodigo({ slotId, codigo: f.codigo, tipo: f.tipo, valor: valorN, usosMax: f.usosMax ? Number(f.usosMax) : null, vigenteHasta: f.hasta || null, nota: f.nota });
              setGuardando(false);
              if (!r.ok) setError(r.error);
              else {
                setHecho(f.codigo.trim().toUpperCase());
                setF({ ...f, codigo: "", valor: "", nota: "" });
                router.refresh();
              }
            }}
          >
            {guardando ? "Creando…" : "Crear código"}
          </button>
        ) : null}
        <button type="button" className="btn btn-ghost" onClick={onListo}>Cerrar</button>
      </div>
    </div>
  );
}
