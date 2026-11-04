"use client";

// CÓDIGOS DE DESCUENTO — en Recursos, junto al pago por fuera (Luis, 3 nov
// 2026: «poder yo hacer códigos de descuento para que en el checkout se ponga
// ese código y se aplique»). Colapsado tras un botón, como el pago manual:
// es una acción puntual. Se viste con las primitivas del tablero (`card pad`,
// `pgf`, `btn`), sin inventar clases.
//
// El descuento aplica al VIAJE (personas × precio), no a los complementos; los
// usos los cuenta el webhook al confirmar el pago. Apagar, no borrar.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExperienciaConSalidas } from "@/lib/admin/transferencias";
import type { CodigoDescuento, TipoDescuento } from "@/lib/descuentos/codigos";
import { apagarCodigo, crearCodigo } from "@/lib/descuentos/acciones";

const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
const fecha = (ymd: string) => new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", day: "numeric", month: "short" }).format(new Date(`${ymd}T12:00:00Z`)).replace(".", "");

function descripcion(c: CodigoDescuento): string {
  const que = c.tipo === "porcentaje" ? `${c.valor}%` : money(c.valor);
  const donde = c.salida ? `${c.experiencia ?? ""} · ${c.salida}` : c.experiencia ? c.experiencia : "cualquier experiencia";
  const usos = c.usosMax != null ? `${c.usos} de ${c.usosMax} usos` : `${c.usos} ${c.usos === 1 ? "uso" : "usos"}`;
  const vig = c.vigenteDesde || c.vigenteHasta ? ` · ${c.vigenteDesde ? `desde ${fecha(c.vigenteDesde)}` : ""}${c.vigenteDesde && c.vigenteHasta ? " " : ""}${c.vigenteHasta ? `hasta ${fecha(c.vigenteHasta)}` : ""}` : "";
  return `${que} · ${donde} · ${usos}${vig}`;
}

export default function CodigosDescuento({ codigos, experiencias }: { codigos: CodigoDescuento[]; experiencias: ExperienciaConSalidas[] }) {
  const [abierto, setAbierto] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<TipoDescuento>("porcentaje");
  const [valor, setValor] = useState("");
  const [slug, setSlug] = useState("");
  const [slotId, setSlotId] = useState("");
  const [usosMax, setUsosMax] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);
  const [quitando, setQuitando] = useState<string | null>(null);
  const router = useRouter();

  const exp = useMemo(() => experiencias.find((e) => e.slug === slug) ?? null, [experiencias, slug]);
  const activos = codigos.filter((c) => c.activo);
  const apagados = codigos.filter((c) => !c.activo);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setHecho(null);
    const r = await crearCodigo({
      codigo,
      tipo,
      valor: Number(valor),
      experienceSlug: slug || null,
      slotId: slotId || null,
      usosMax: usosMax ? Number(usosMax) : null,
      vigenteDesde: desde || null,
      vigenteHasta: hasta || null,
      nota,
    });
    setGuardando(false);
    if (!r.ok) setError(r.error);
    else {
      setHecho(codigo.trim().toUpperCase());
      setCodigo("");
      setValor("");
      setNota("");
      router.refresh();
    }
  };

  const toggle = (
    <button type="button" className="btn btn-glass" onClick={() => setAbierto((v) => !v)}>
      Códigos de descuento{activos.length ? ` · ${activos.length}` : ""}
    </button>
  );

  if (!abierto) return toggle;

  return (
    <>
      {toggle}
      <div className="card pad" style={{ marginTop: 12 }}>
        <p className="sub" style={{ fontSize: 12.5, margin: 0 }}>
          Un código se teclea en el checkout web y descuenta sobre el viaje (personas × precio), no sobre los
          complementos. El precio lo resuelve el servidor; el código sólo dice cuánto se perdona. Los usos se
          cuentan cuando el pago cae, y la comisión se calcula sobre lo cobrado. Un código que ya no quieres se
          apaga, no se borra.
        </p>

        <form onSubmit={onSubmit}>
          <div className="pgf">
            <label>
              <span className="k">Código</span>
              <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="AMIGOS20" required />
              <span className="h">Letras y números, sin espacios. Se escribe en mayúsculas.</span>
            </label>
            <label>
              <span className="k">Descuento</span>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDescuento)} aria-label="Tipo">
                  <option value="porcentaje">% del viaje</option>
                  <option value="monto">Pesos fijos</option>
                </select>
                <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder={tipo === "porcentaje" ? "20" : "2000"} required style={{ width: 110 }} />
              </div>
            </label>
            <label>
              <span className="k">Experiencia</span>
              <select
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlotId("");
                }}
              >
                <option value="">Cualquiera</option>
                {experiencias.map((e) => (
                  <option key={e.slug} value={e.slug}>
                    {e.nombre}
                  </option>
                ))}
              </select>
              <span className="h">Sin elegir, vale para todas.</span>
            </label>
            <label>
              <span className="k">Salida</span>
              <select value={slotId} onChange={(e) => setSlotId(e.target.value)} disabled={!exp}>
                <option value="">{exp ? "Cualquier salida" : "Primero la experiencia"}</option>
                {(exp?.salidas || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="k">Usos máximos</span>
              <input type="number" min={1} value={usosMax} onChange={(e) => setUsosMax(e.target.value)} placeholder="sin tope" />
            </label>
            <label>
              <span className="k">Vigencia</span>
              <div style={{ display: "flex", gap: 8 }}>
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} aria-label="Desde" />
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Hasta" />
              </div>
              <span className="h">Vacío = sin fecha.</span>
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <span className="k">Para qué</span>
              <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Promo de noviembre para la lista del boletín" />
            </label>
          </div>
          {error ? <p style={{ fontSize: 12.5, color: "var(--orange)", marginTop: 10 }}>{error}</p> : null}
          {hecho ? <p className="sub" style={{ fontSize: 12.5, marginTop: 10 }}>Listo: <b>{hecho}</b> ya funciona en el checkout.</p> : null}
          <div className="actrow">
            <button type="submit" className="btn btn-orange" disabled={guardando || !codigo.trim() || !(Number(valor) > 0)}>
              {guardando ? "Guardando…" : "Crear código"}
            </button>
          </div>
        </form>

        {activos.length ? (
          <>
            <span className="card-lbl" style={{ display: "block", marginTop: 18 }}>Activos · {activos.length}</span>
            {activos.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--line)" }}>
                <span className="chip mono">{c.codigo}</span>
                <span className="sub" style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>{descripcion(c)}{c.nota ? ` · ${c.nota}` : ""}</span>
                <span>
                  <button
                    type="button"
                    className="btn btn-glass btn-sm"
                    disabled={quitando === c.id}
                    onClick={async () => {
                      setQuitando(c.id);
                      const r = await apagarCodigo(c.id);
                      setQuitando(null);
                      if (!r.ok) setError(r.error);
                      else router.refresh();
                    }}
                  >
                    Apagar
                  </button>
                </span>
              </div>
            ))}
          </>
        ) : (
          <p className="sub" style={{ fontSize: 12.5, marginTop: 18 }}>Todavía no hay códigos activos.</p>
        )}
        {apagados.length ? (
          <>
            <span className="card-lbl" style={{ display: "block", marginTop: 14 }}>Apagados · {apagados.length}</span>
            {apagados.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--line)", opacity: 0.6 }}>
                <span className="chip mono">{c.codigo}</span>
                <span className="sub" style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>{descripcion(c)}</span>
                <span>
                  <button type="button" className="btn btn-glass btn-sm" onClick={() => void apagarCodigo(c.id, true).then(() => router.refresh())}>
                    Volver a prender
                  </button>
                </span>
              </div>
            ))}
          </>
        ) : null}
      </div>
    </>
  );
}
