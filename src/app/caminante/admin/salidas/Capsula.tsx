"use client";

// LA CÁPSULA DE UNA SALIDA. Transcrita del entregable de Claude Design
// (design/encuesta-v2/dc/salidas.dc.html); las clases `.sal*` viven en
// admin-css.ts, extraídas verbatim de ahí.
//
// Cerrada tiene que poder barrerse en un segundo: si todo está en orden, no debe
// pedir atención. Abierta puede ser densa.
//
// Es cliente solo por el acordeón y por copiar el link. Los datos ya vienen
// resueltos del servidor (`fetchSalidas`); aquí no se consulta ni se calcula.

import { useState } from "react";
import type { Salida } from "@/lib/admin/salidas";
import LinkDeslinde from "@/app/caminante/admin/encuesta/LinkDeslinde";
import { reenviarEncuesta } from "@/lib/feedback/resend-actions";
import { setSlotStatusAction, updateSlot } from "@/lib/admin/eventos-actions";
import {
  reembolsarPersona,
  cancelarSalidaYReembolsar,
  verificarReembolso,
} from "@/lib/payments/reembolsos";
import { iniciales } from "@/lib/admin/formato";
import {
  bonificacionDe,
  FUERZA_MAYOR,
  proponerReembolso,
  type ClaseFuerzaMayor,
  type PropuestaReembolso,
} from "@/lib/cancelacion/politica";
import { pideDocumento } from "@/lib/cancelacion/documento";
import { mandarmeUnaPrueba } from "@/lib/feedback/prueba";
import { generarLinkDeGrupo } from "@/lib/feedback/link-grupo";
import SuEspacio from "@/app/caminante/admin/ui/SuEspacio";
import { LinkEspecial, LinksPendientes } from "./LinkEspecial";
import { CodigosDeSalida } from "./CodigoDescuento";

const pct = (a: number, b: number | null) => (b && b > 0 ? Math.min(100, (a / b) * 100) : a > 0 ? 100 : 0);
/** Con coma decimal: es un número que se lee, no un identificador. */
const dec = (n: number) => n.toFixed(1).replace(".", ",");

/** EDITAR SALIDA — cupo, fechas, etiqueta y precio.
 *
 *  ⚠️ Existe porque al sacar las fechas del formulario de experiencia, el
 *  cupo de una salida ya creada se quedó SIN forma de editarse en escritorio:
 *  el teléfono podía y la computadora no. Una capacidad no se pierde al mover
 *  una pantalla de sitio.
 *
 *  Reusa `updateSlot`, la misma acción que llama el panel móvil, con sus dos
 *  guardas del servidor: el cupo nunca por debajo de lo ya vendido, y el fin
 *  nunca antes del inicio. Aquí se avisan antes de mandar, para no hacer ir y
 *  volver al servidor por un error que ya se ve.
 */
export function EditarSalida({ s, onListo }: { s: Salida; onListo: () => void }) {
  const [f, setF] = useState({
    etiqueta: s.label,
    ini: s.inicioInput,
    fin: s.finInput,
    cupo: s.cupo != null ? String(s.cupo) : "",
    precio: s.precio != null ? String(s.precio) : "",
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cupoN = f.cupo.trim() === "" ? null : parseInt(f.cupo.replace(/\D/g, ""), 10);
  const cupoErr = cupoN != null && (Number.isNaN(cupoN) || cupoN < s.personas);
  // El fin dispara la encuesta +24h: invertido le manda «¿cómo te fue?» a
  // gente que todavía no viaja. Ya pasó con una salida de volcanes.
  const finErr = !!f.fin && !!f.ini && f.fin < f.ini;
  const ok = !cupoErr && !finErr && !!f.ini && !!f.etiqueta.trim();

  return (
    <div className="card pad" style={{ marginTop: 14 }}>
      <span className="subtitle">Editar salida</span>
      <div className="mini-form">
        <label className="mut" style={{ fontSize: 12.5 }}>
          Etiqueta{" "}
          <input
            value={f.etiqueta}
            onChange={(e) => setF({ ...f, etiqueta: e.target.value })}
            style={{ width: 150 }}
          />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Inicio{" "}
          <input type="date" value={f.ini} onChange={(e) => setF({ ...f, ini: e.target.value })} />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Fin{" "}
          <input type="date" value={f.fin} onChange={(e) => setF({ ...f, fin: e.target.value })} />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Cupo{" "}
          <input
            value={f.cupo}
            onChange={(e) => setF({ ...f, cupo: e.target.value })}
            placeholder="sin tope"
            style={{ width: 90 }}
          />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Precio{" "}
          <input
            value={f.precio}
            onChange={(e) => setF({ ...f, precio: e.target.value })}
            placeholder="el de la experiencia"
            style={{ width: 130 }}
          />
        </label>
      </div>

      {cupoErr ? (
        <p style={{ fontSize: 12.5, color: "var(--orange)", marginTop: 10 }}>
          Hay {s.personas} {s.personas === 1 ? "lugar ocupado" : "lugares ocupados"} — el cupo no
          puede quedar abajo de la ocupación.
        </p>
      ) : null}
      {finErr ? (
        <p style={{ fontSize: 12.5, color: "var(--orange)", marginTop: 10 }}>
          El fin no puede ser antes del inicio: es lo que dispara la encuesta, y al revés le
          preguntaría «¿cómo te fue?» a quien todavía no viaja.
        </p>
      ) : null}
      {error ? (
        <p style={{ fontSize: 12.5, color: "var(--orange)", marginTop: 10 }}>{error}</p>
      ) : null}

      <div className="act-row">
        <button
          type="button"
          className="btn btn-orange"
          disabled={!ok || guardando}
          onClick={async () => {
            setGuardando(true);
            setError("");
            const precioN = f.precio.replace(/\D/g, "");
            const r = await updateSlot({
              slotId: s.id,
              slug: s.slug,
              label: f.etiqueta.trim(),
              // Misma convención que el formulario y que el teléfono: inicio a
              // mediodía UTC y fin a las 23:00 UTC, para que ninguna zona
              // horaria mueva la salida un día.
              startsAt: f.ini ? `${f.ini}T12:00:00.000Z` : undefined,
              endsAt: f.fin ? `${f.fin}T23:00:00.000Z` : null,
              capacityTotal: cupoN,
              priceMxn: precioN ? Number(precioN) : null,
            });
            setGuardando(false);
            if (r?.ok === false) setError(r.error);
            else onListo();
          }}
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onListo}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Barra({ etiqueta, hecho, total, warn }: { etiqueta: string; hecho: number; total: number | null; warn?: boolean }) {
  return (
    <div className="progrow">
      <span className="mut">{etiqueta}</span>
      <div className={`prog${warn ? " warn" : ""}`}>
        <div className="tk2">
          <i style={{ width: `${pct(hecho, total)}%` }} />
        </div>
        <span className="fr">
          {hecho}/{total ?? "∞"}
        </span>
      </div>
    </div>
  );
}

const mxn = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

/** DEVOLVER DINERO — una persona, o la salida entera.
 *
 *  ⚠️ Pide MOTIVO y CONFIRMACIÓN escrita, no un `confirm()`. Dos razones: el
 *  diálogo nativo del navegador se auto-cancela en el Chrome automatizado (nos
 *  costó una campaña entera descubrirlo), y sobre todo porque devolver dinero
 *  no se deshace. Escribir el nombre de la salida para cancelarla es la misma
 *  fricción que usa GitHub para borrar un repo, y por el mismo motivo.
 *
 *  El botón NO promete que el dinero ya volvió: se le pide a Stripe, y la
 *  cancelación, el lugar liberado y el correo ocurren cuando Stripe confirma.
 *  El texto lo dice tal cual para que nadie cierre la pantalla creyendo otra cosa.
 */
function Reembolsos({ s, onListo }: { s: Salida; onListo: () => void }) {
  const [motivo, setMotivo] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  // Cuándo se recibió el aviso de cancelación, en hora de CDMX. La política
  // cuenta la fecha y la hora del aviso, no la del clic: si la persona avisó
  // ayer por WhatsApp, se pone ayer. Arranca en «ahora».
  const [avisoLocal, setAvisoLocal] = useState(() => new Date(Date.now() - 6 * 3600_000).toISOString().slice(0, 16));
  // Lo que la casa teclea en vez de la propuesta, por reserva. Sin tecla, la propuesta.
  const [montos, setMontos] = useState<Record<string, string>>({});
  const [causa, setCausa] = useState<"" | "imputable" | "fuerza-mayor">("");
  const [clase, setClase] = useState<ClaseFuerzaMayor | "">("");
  // La ruta del documento ya subido (D24.4) y el estado de la subida.
  const [documento, setDocumento] = useState<{ path: string; nombre: string } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorDoc, setErrorDoc] = useState("");

  const avisoIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(avisoLocal) ? `${avisoLocal}:00-06:00` : null;
  const propuestaDe = (r: Salida["reembolsables"][number]): PropuestaReembolso | null => {
    if (!r.caso || !avisoIso) return null;
    try {
      return proponerReembolso({ ...r.caso, avisoAt: avisoIso, pagado: r.monto, cancela: "cliente" });
    } catch {
      return null; // año sin lista de días de descanso: no se propone con una fecha supuesta
    }
  };

  const vivos = s.reembolsables.filter((r) => !r.enCurso);
  const totalVivo = vivos.reduce((n, r) => n + r.monto, 0);
  const totalBonificacion = vivos.reduce((n, r) => n + bonificacionDe(r.monto), 0);
  // Comparación TOLERANTE. La etiqueta trae guion largo («Oct 8–11») y nadie lo
  // teclea: escribir «oct 8-11» quedaba fuera y el botón no se habilitaba nunca,
  // sin decir por qué. Se normalizan guiones, acentos y espacios — la
  // confirmación es para frenar un descuido, no para ganar un dictado.
  const plano = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[‐-―]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  const escribioLaEtiqueta = plano(confirmacion) === plano(s.label);
  const faltaDocumento = causa === "fuerza-mayor" && clase !== "" && pideDocumento(clase) && !documento;
  const causaLista = causa === "imputable" || (causa === "fuerza-mayor" && clase !== "" && !faltaDocumento);
  const puedeCancelar = escribioLaEtiqueta && causaLista && motivo.trim() !== "";

  const contar = (r: { ok: boolean; reembolsados?: number; monto?: number; avisos?: string[]; error?: string }) => {
    if (!r.ok) { setAviso({ ok: false, texto: r.error || "No se pudo." }); return; }
    const base = `Le pedimos a Stripe ${r.reembolsados} ${r.reembolsados === 1 ? "devolución" : "devoluciones"} por ${mxn(r.monto ?? 0)}. En cuanto Stripe confirme se cancela el lugar y sale el correo.`;
    setAviso({ ok: true, texto: [base, ...(r.avisos ?? [])].join(" · ") });
  };

  return (
    <div className="card pad" style={{ marginTop: 14, borderColor: "rgba(179,53,23,.3)" }}>
      <span className="subtitle">Reembolsos</span>
      <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 4 }}>
        Se devuelve por la misma tarjeta. El lugar vuelve a la venta y la persona recibe su correo
        <b> cuando Stripe confirma</b>, no al apretar el botón. El sistema <b>propone</b> cuánto devolver según
        la política de cancelación que la persona aceptó; puedes cambiarlo escribiendo el motivo.
      </p>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 12 }}>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Aviso recibido (hora del centro de México){" "}
          <input
            type="datetime-local"
            value={avisoLocal}
            onChange={(e) => setAvisoLocal(e.target.value)}
            style={{ width: "min(220px, 100%)" }}
          />
        </label>
        <label className="mut" style={{ fontSize: 12.5 }}>
          Motivo{" "}
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Se dio de baja · Mal clima · Cupo mínimo no alcanzado"
            style={{ width: "min(420px, 100%)" }}
          />
        </label>
      </div>

      {s.reembolsables.length === 0 ? (
        <p className="mut" style={{ fontSize: 12.5, marginTop: 12 }}>
          Nadie de esta salida tiene un cobro vivo que devolver.
        </p>
      ) : (
        <div style={{ marginTop: 12 }}>
          {s.reembolsables.map((r) => {
            const prop = propuestaDe(r);
            const tecleado = montos[r.reservationId];
            const monto = tecleado == null ? (prop ? prop.importe : r.monto) : Number(tecleado);
            const cambiada = prop != null && Math.abs(monto - prop.importe) > 0.01;
            const montoSirve = Number.isFinite(monto) && monto > 0 && monto <= r.monto + 0.01;
            // Sin regla que proponer, o con una política que la persona no
            // aceptó en línea (referencia, salvo el piso legal): decide la
            // casa y lo que decide queda escrito (D24.1). El servidor lo exige igual.
            const soloReferencia =
              prop != null && r.caso != null && !r.caso.aceptada && prop.regla !== "arrepentimiento-legal" && prop.regla !== "operacion";
            const faltaMotivo = (cambiada || prop == null || soloReferencia) && !motivo.trim();
            return (
              <div key={r.reservationId} style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span className="av">{iniciales(r.nombre)}</span>
                  <span style={{ fontSize: 14 }}>{r.nombre}</span>
                  <span className="mut" style={{ fontSize: 12.5 }}>pagó {mxn(r.monto)}</span>
                  {r.enCurso ? (
                    <>
                      <span className="mut" style={{ fontSize: 12.5 }}>Reembolso en curso</span>
                      {/* Un «en curso» sin salida no es información: es un callejón.
                          Este botón le pregunta a Stripe y cierra lo que falte. */}
                      {r.reembolsoId ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={!!ocupado}
                          onClick={async () => {
                            setOcupado(r.reservationId);
                            setAviso(null);
                            const v = await verificarReembolso(r.reembolsoId!);
                            setAviso(v.ok ? { ok: true, texto: v.mensaje } : { ok: false, texto: v.error });
                            setOcupado("");
                            onListo();
                          }}
                        >
                          {ocupado === r.reservationId ? "Preguntando a Stripe…" : "Verificar con Stripe"}
                        </button>
                      ) : null}
                    </>
                  ) : !r.porStripe ? (
                    <span className="mut" style={{ fontSize: 12.5 }}>Se cobró fuera de Stripe — devuélvelo por banco</span>
                  ) : (
                    <>
                      <label className="mut" style={{ fontSize: 12.5 }}>
                        Devolver ${" "}
                        <input
                          inputMode="decimal"
                          value={tecleado ?? (prop ? String(prop.importe) : String(r.monto))}
                          onChange={(e) => setMontos((m) => ({ ...m, [r.reservationId]: e.target.value.replace(/[^0-9.]/g, "") }))}
                          style={{ width: 110 }}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={!!ocupado || !montoSirve || faltaMotivo || !avisoIso}
                        onClick={async () => {
                          setOcupado(r.reservationId);
                          setAviso(null);
                          contar(
                            await reembolsarPersona(
                              r.reservationId,
                              motivo,
                              Math.abs(monto - r.monto) < 0.01 ? undefined : monto,
                              avisoIso ?? undefined,
                            ),
                          );
                          setOcupado("");
                          onListo();
                        }}
                      >
                        {ocupado === r.reservationId ? "Pidiendo a Stripe…" : montoSirve ? `Reembolsar ${mxn(monto)}` : "Reembolsar"}
                      </button>
                    </>
                  )}
                </div>
                {!r.enCurso ? (
                  <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.55, marginTop: 4, marginLeft: 44 }}>
                    {prop ? (
                      <>
                        <b>Propuesta: {prop.pct} % · {mxn(prop.importe)}.</b> {prop.porque}
                        {soloReferencia
                          ? " Esta persona no aceptó la política en línea (reserva anterior a la política publicada o capturada a mano): la propuesta usa la de la experiencia sólo como referencia. En la duda se resuelve a su favor; decide el monto y escribe el motivo."
                          : ""}
                        {prop.importe <= 0 && r.porStripe ? " Si aun así devuelves algo, escribe cuánto y el motivo." : ""}
                        {cambiada && faltaMotivo && montoSirve ? " Cambiaste la propuesta: escribe el motivo." : ""}
                      </>
                    ) : (
                      r.caso
                        ? "Sin propuesta: ni la reserva ni la experiencia tienen política de cancelación elegida, y no aplica el arrepentimiento de ley (art. 56). Decide el monto y escribe el motivo."
                        : "Sin propuesta: falta la fecha de la salida o la de la reserva. Decide el monto y escribe el motivo."
                    )}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancelar la salida entera. Detrás de la confirmación escrita porque no
          es «lo mismo pero a todos»: además cierra la fecha para siempre. */}
      <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 14 }}>
        <span className="subtitle">Cancelar la salida</span>
        <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 4 }}>
          Devuelve el <b>100 %</b> a las {vivos.length} {vivos.length === 1 ? "persona" : "personas"} con cobro vivo
          ({mxn(totalVivo)}), cierra la fecha y avisa a cada quien. <b>No se deshace.</b>
        </p>

        <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.7 }}>
          <div className="mut" style={{ fontSize: 12.5 }}>¿Por qué se cancela?</div>
          <label style={{ display: "block" }}>
            <input type="radio" name={`causa-${s.id}`} checked={causa === "imputable"} onChange={() => setCausa("imputable")} />{" "}
            Por una causa de quien opera (cupo, logística, proveedor, decisión propia)
          </label>
          <label style={{ display: "block" }}>
            <input type="radio" name={`causa-${s.id}`} checked={causa === "fuerza-mayor"} onChange={() => setCausa("fuerza-mayor")} />{" "}
            Por fuerza mayor
          </label>
          {causa === "fuerza-mayor" ? (
            <select value={clase} onChange={(e) => setClase(e.target.value as ClaseFuerzaMayor | "")} style={{ marginTop: 6, width: "min(460px, 100%)" }}>
              <option value="">Elige cuál…</option>
              {(Object.keys(FUERZA_MAYOR) as ClaseFuerzaMayor[]).map((k) => (
                <option key={k} value={k}>
                  {FUERZA_MAYOR[k]}
                </option>
              ))}
            </select>
          ) : null}
          {causa === "imputable" ? (
            <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}>
              Además de la devolución, a cada persona se le debe una <b>bonificación del 20 %</b> de lo que pagó
              ({mxn(totalBonificacion)} en total). Se paga por <b>transferencia</b>, que haces tú, en 5 días
              hábiles: quedan como «por pagar» en Pagos y el correo de la cancelación le pide a cada quien su cuenta.
            </p>
          ) : null}
          {causa === "fuerza-mayor" && clase === "emergencia-guia" ? (
            <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 6 }}>
              Con fuerza mayor no hay bonificación. La emergencia del guía se acredita con la <b>declaración de quien
              opera</b>: escríbela en el motivo (qué pasó y por qué no hubo sustituto). <b>No subas ni describas
              diagnósticos ni partes médicos</b>: son datos de salud y no se guardan.
            </p>
          ) : null}
          {causa === "fuerza-mayor" && clase !== "" && clase !== "emergencia-guia" ? (
            <div style={{ marginTop: 6 }}>
              <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                Con fuerza mayor no hay bonificación, y hay que probarla: <b>sube el documento</b> que la acredita
                (reporte, aviso o cierre de la autoridad; PDF o imagen, hasta 10 MB) y en el motivo escribe la
                autoridad o fuente, la fecha y la liga o folio.
              </p>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
                disabled={subiendo || !!ocupado}
                style={{ marginTop: 6 }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  setErrorDoc("");
                  setDocumento(null);
                  if (!file) return;
                  setSubiendo(true);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await fetch("/caminante/api/admin/fuerza-mayor", { method: "POST", body: fd });
                    const j = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
                    if (!res.ok || !j.path) setErrorDoc(j.error || "No se pudo subir el documento.");
                    else setDocumento({ path: j.path, nombre: file.name });
                  } catch {
                    setErrorDoc("No se pudo subir el documento.");
                  }
                  setSubiendo(false);
                }}
              />
              <span className="mut" style={{ fontSize: 12.5, marginLeft: 8, color: errorDoc ? "#b33517" : undefined }}>
                {subiendo ? "Subiendo…" : errorDoc ? errorDoc : documento ? `Subido: ${documento.nombre}` : "Sin documento todavía."}
              </span>
            </div>
          ) : null}
        </div>

        <p className="mut" style={{ fontSize: 12.5, lineHeight: 1.6, marginTop: 10 }}>
          Para confirmar, escribe la etiqueta de la salida: <b>{s.label}</b>
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
          <input
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            placeholder={s.label}
            style={{ width: "min(260px, 100%)" }}
          />
          <button
            type="button"
            className="btn btn-orange"
            disabled={!puedeCancelar || !!ocupado}
            onClick={async () => {
              if (!causaLista) return;
              setOcupado("salida");
              setAviso(null);
              contar(
                await cancelarSalidaYReembolsar(
                  s.id,
                  motivo,
                  causa === "fuerza-mayor"
                    ? { tipo: "fuerza-mayor", clase: clase as ClaseFuerzaMayor, documento: documento?.path ?? null }
                    : { tipo: "imputable" },
                ),
              );
              setOcupado("");
              setConfirmacion("");
              onListo();
            }}
          >
            {ocupado === "salida" ? "Cancelando…" : "Cancelar salida y reembolsar a todos"}
          </button>
          {!puedeCancelar ? (
            <span className="mut" style={{ fontSize: 12.5 }}>
              {faltaDocumento
                ? "Sube el documento que acredita la fuerza mayor."
                : !causaLista
                ? "Elige por qué se cancela."
                : !motivo.trim()
                  ? "Escribe el motivo arriba."
                  : <>Escribe <b>{s.label}</b> para habilitarlo.</>}
            </span>
          ) : null}
        </div>
      </div>

      {aviso ? (
        <p
          style={{
            fontSize: 12.5,
            lineHeight: 1.6,
            marginTop: 12,
            color: aviso.ok ? "var(--olive)" : "#b33517",
          }}
        >
          {aviso.texto}
        </p>
      ) : null}
    </div>
  );
}

export default function Capsula({ s, sitio, esCasa = false }: { s: Salida; sitio: string; esCasa?: boolean }) {
  const [abierta, setAbierta] = useState(false);
  const [editando, setEditando] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [conCodigo, setConCodigo] = useState(false);
  const [reembolsando, setReembolsando] = useState(false);
  const [tokenGrupo, setTokenGrupo] = useState(s.tokenGrupo);
  const [generando, setGenerando] = useState(false);
  const [probando, setProbando] = useState(false);
  const [prueba, setPrueba] = useState("");
  const faltan = s.titulares - s.firmados;
  // «Grave» se reserva para la salida que va a viajar sin encuesta: si viaja
  // así, no hay forma de saber cómo estuvo, y el único síntoma es el silencio.
  // Ya pasó — hongos, 26 jul, 18 personas.
  const grave = !s.pasada && !s.encuestaArmada;
  const alerta = !s.pasada && faltan > 0;

  return (
    <article className={`card salcard${grave ? " grave" : alerta ? " alerta" : ""}`}>
      <div className="pad xhead" onClick={() => setAbierta((v) => !v)} style={{ cursor: "pointer" }}>
        <div className="saltop">
          <div className="g">
            <h3>
              {s.experiencia} <span className="chev2" style={{ transform: abierta ? "rotate(180deg)" : undefined }}>▾</span>
            </h3>
            <p className="meta">
              {[s.label, s.privada ? "Salida privada" : null, s.grupo?.anfitrion ? `Grupo de ${s.grupo.anfitrion.split(" ")[0]}` : null, s.lugar, s.operador ? `operada por ${s.operador}` : null].filter(Boolean).join(" · ")}
            </p>
          </div>
          <span className={`salwhen${s.cerca ? " cerca" : ""}`}>{s.cuando}</span>
        </div>

        {s.pasada ? (
          <>
            <div className="salmtr">
              <div>
                <div className="v">
                  {s.stars != null ? dec(s.stars) : "—"}
                  <span className="st"> ★</span>
                </div>
                {/* ⚠️ El promedio NUNCA va solo: su denominador vive pegado. */}
                <div className="d">
                  promedio de <b>{s.respuestas}</b> {s.respuestas === 1 ? "respuesta" : "respuestas"}
                </div>
              </div>
              <div>
                <div className="v">
                  {s.nps != null ? (s.nps > 0 ? `+${s.nps}` : s.nps) : "—"}
                  <span className="u"> NPS</span>
                </div>
                <div className="d">
                  {s.promotores} promotores · {s.pasivos} pasivos · {s.detractores} detractores
                </div>
              </div>
              <div>
                <div className="v">
                  {s.invitadas ? Math.round((s.respuestas / s.invitadas) * 100) : 0}
                  <span className="u">%</span>
                </div>
                <div className="d">
                  <b>
                    {s.respuestas} de {s.invitadas}
                  </b>{" "}
                  respondieron
                </div>
              </div>
            </div>
            <div className="salsig">
              {s.peor ? (
                <span className="pend">
                  <s>↓</s>Lo más bajo: {s.peor.label} ({dec(s.peor.stars)})
                </span>
              ) : null}
              {s.publicables ? (
                <span className="ok">
                  <s>✎</s>
                  {s.publicables} {s.publicables === 1 ? "testimonio listo" : "testimonios listos"} para publicar
                </span>
              ) : null}
              {s.repiten ? (
                <span className="ok">
                  <s>↻</s>
                  {s.repiten} {s.repiten === 1 ? "quiere" : "quieren"} repetir
                </span>
              ) : null}
              {s.queFalto ? (
                <span className="pend">
                  <s>{"//"}</s>1 dijo qué faltó
                </span>
              ) : null}
              {s.sinResponder.length ? (
                <span className="pend">
                  <s>·</s>
                  {s.sinResponder.length} {s.sinResponder.length === 1 ? "falta" : "faltan"} de responder
                </span>
              ) : null}
              {!s.respuestas && !s.sinResponder.length ? (
                <span className="pend">
                  <s>·</s>Nadie recibió la encuesta
                </span>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <div className="salbars">
              <Barra etiqueta="Lugares" hecho={s.personas} total={s.cupo} />
              <Barra etiqueta="Deslindes" hecho={s.firmados} total={s.titulares} warn={faltan > 0} />
            </div>
            <div className="salsig">
              {faltan > 0 ? (
                <span className={s.cerca ? "crit" : "pend"}>
                  <s>⚠</s>
                  {faltan} {faltan === 1 ? "persona sin firmar" : "personas sin firmar"}
                  {s.cerca ? `, y la salida es ${s.cuando.toLowerCase()}` : ""}
                </span>
              ) : (
                <span className="ok">
                  <s>✓</s>Todos firmaron
                </span>
              )}
              {s.encuestaArmada ? (
                <span className="ok">
                  <s>✓</s>Encuesta armada
                </span>
              ) : (
                <span className="crit">
                  <s>⚠</s>Va a viajar sin encuesta: no habrá cómo saber cómo estuvo
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className={`xbody${abierta ? " on" : ""}`}>
        <div className="pad" style={{ paddingTop: 0 }}>
          {s.pasada ? (
            <>
              {s.queFalto ? (
                <p className="salsay">
                  «{s.queFalto.texto}»<small>Qué faltó · {s.queFalto.autor}</small>
                </p>
              ) : null}
              {s.respondieron.length ? (
                <>
                  <div className="xh4">Respondieron · {s.respondieron.length}</div>
                  {s.respondieron.map((r, i) => (
                    <div className="salper" key={i}>
                      <span className="av">{iniciales(r.nombre)}</span>
                      <span className="nm">
                        {r.nombre}
                        {r.texto ? <span className="tx">«{r.texto}»</span> : null}
                        {r.sinReserva ? <small>entró por el link de grupo, sin reserva</small> : null}
                      </span>
                      <span className="rt">
                        <span className="qz">
                          <span className="s">★</span> {r.stars ?? "—"}
                          {r.nps != null ? ` · NPS ${r.nps}` : ""}
                        </span>
                        {r.publicable ? (
                          <span className="chip c-pub">
                            <span className="cd" style={{ background: "var(--olive)" }} />
                            Publicable
                          </span>
                        ) : null}
                      </span>
                    </div>
                  ))}
                </>
              ) : null}

              {/* Perseguir al que NO respondió es la mitad del trabajo, igual
                  que con las firmas. Mismas tres acciones: correo, copiar el
                  link, y WhatsApp cuando hay teléfono — porque el correo no
                  siempre llega y una encuesta sin respuestas no mide nada. */}
              {s.sinResponder.length ? (
                <>
                  <div className="xh4">Faltan por responder · {s.sinResponder.length}</div>
                  {s.sinResponder.map((p) => (
                    <div className="salper" key={p.feedbackId}>
                      <span className="av">{iniciales(p.nombre)}</span>
                      <span className="nm">
                        {p.nombre}
                        <small>{[p.email, p.telefono || "sin teléfono"].filter(Boolean).join(" · ")}</small>
                      </span>
                      <span className="rt">
                        <span className="st">Sin responder</span>
                        {p.email ? (
                          <form action={reenviarEncuesta} style={{ display: "inline" }}>
                            <input type="hidden" name="feedbackId" value={p.feedbackId} />
                            <button
                              type="submit"
                              className="btn btn-glass btn-sm"
                              style={{ padding: "3px 9px", fontSize: 11.5 }}
                              title={`Reenviar la encuesta a ${p.email}`}
                            >
                              ✉ Recordar
                            </button>
                          </form>
                        ) : null}
                        {p.token ? (
                          <LinkDeslinde
                            tipo="encuesta"
                            link={`${sitio}/caminante/feedback/${p.token}`}
                            telefono={p.telefono}
                            nombre={p.nombre}
                            experiencia={s.experiencia}
                          />
                        ) : null}
                      </span>
                    </div>
                  ))}
                </>
              ) : null}

              {/* «Nadie recibió» solo si de verdad no se mandó. Antes esta línea
                  aparecía cuando NADIE HABÍA RESPONDIDO, sobre siete correos ya
                  entregados: el tablero afirmaba lo contrario de lo que pasaba y
                  mandó a perseguir un bug que no existía. */}
              {s.invitadas === 0 ? (
                <div className="empty" style={{ border: 0 }}>
                  A nadie de esta salida se le mandó la encuesta.
                </div>
              ) : !s.respondieron.length ? (
                <div className="empty" style={{ border: 0 }}>
                  Encuesta enviada a {s.invitadas}{" "}
                  {s.invitadas === 1 ? "persona" : "personas"} · nadie ha respondido todavía.
                  Mándales el link de abajo por WhatsApp.
                </div>
              ) : null}

              <div className="salfoot">
                {/* EL LINK, SIEMPRE A LA MANO. Antes solo aparecía si la salida
                    ya tenía token, y las salidas viejas no lo tienen: quedaba una
                    pantalla que decía «nadie respondió» sin ofrecer con qué
                    arreglarlo. Ahora, si falta, se genera de un clic. */}
                {tokenGrupo ? (
                  <div className="sallk">
                    <span>{`${sitio}/caminante/feedback/salida/${tokenGrupo}`}</span>
                    <LinkDeslinde
                      link={`${sitio}/caminante/feedback/salida/${tokenGrupo}`}
                      telefono={null}
                      nombre=""
                      experiencia={s.experiencia}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={generando}
                    onClick={async () => {
                      setGenerando(true);
                      const r = await generarLinkDeGrupo(s.id);
                      if (r.ok) setTokenGrupo(r.token);
                      setGenerando(false);
                    }}
                  >
                    {generando ? "Generando…" : "Generar link de la encuesta"}
                  </button>
                )}
                {/* Prueba SEGURA: no recibe destinatario, va a tu propio correo.
                    Ver lib/feedback/prueba.ts — nació de mandarle dos duplicados
                    a una clienta por apretar el renglón equivocado. */}
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={probando}
                  onClick={async () => {
                    setProbando(true);
                    const r = await mandarmeUnaPrueba(s.experienceId);
                    setPrueba(r.ok ? `Prueba enviada a ${r.a}` : r.error);
                    setProbando(false);
                  }}
                >
                  {probando ? "Mandando…" : "Mandarme una prueba a mí"}
                </button>
                {prueba ? (
                  <span className="mut" style={{ fontSize: 12.5 }}>{prueba}</span>
                ) : null}
                <a href={`/caminante/admin/roster/${s.id}`} className="btn btn-ghost">
                  Ver roster
                </a>
              </div>
            </>
          ) : (
            <>
              {s.pendientes.length ? (
                <>
                  <div className="xh4">Faltan por firmar · {s.pendientes.length}</div>
                  {s.pendientes.map((p) => (
                    <div className="salper" key={p.reservationId}>
                      <span className="av">{iniciales(p.nombre)}</span>
                      <span className="nm">
                        {p.nombre}
                        <small>{[p.email, p.telefono || "sin teléfono"].filter(Boolean).join(" · ")}</small>
                      </span>
                      <span className="rt">
                        <span className="st">Pendiente</span>
                        <LinkDeslinde
                          link={`${sitio}/caminante/registro/${s.slug}?reserva=${p.reservationId}`}
                          telefono={p.telefono}
                          nombre={p.nombre}
                          experiencia={s.experiencia}
                        />
                      </span>
                    </div>
                  ))}
                </>
              ) : null}
              {s.firmadosLista.length ? (
                <>
                  <div className="xh4">Firmaron · {s.firmadosLista.length}</div>
                  <div className="pchips">
                    {s.firmadosLista.map((f, i) => (
                      <span className="pchip ok" key={i}>
                        <span className="av">{iniciales(f.nombre)}</span>
                        {f.nombre}
                        <span className="dt">{f.fecha}</span>
                      </span>
                    ))}
                  </div>
                </>
              ) : null}
              <LinksPendientes links={s.linksPendientes} />
              {/* D3 · la salida privada trae su espacio del grupo debajo del roster. */}
              {s.grupo ? <SuEspacio g={s.grupo} abrir /> : null}
              <div className="salfoot">
                <a href={`/caminante/admin/roster/${s.id}`} className="btn btn-ghost">
                  Ver roster
                </a>
                {/* Cerrar deja de VENDER, no borra: la fecha, sus reservas y su
                    roster siguen enteros. Vive aquí y ya no en la ficha de la
                    experiencia, para que todo lo que le pasa a una salida pase
                    en un solo lugar. */}
                <form action={setSlotStatusAction} style={{ display: "inline" }}>
                  <input type="hidden" name="slotId" value={s.id} />
                  <input type="hidden" name="slug" value={s.slug} />
                  <input type="hidden" name="status" value={s.estado === "open" ? "closed" : "open"} />
                        <button type="submit" className="btn btn-ghost">
                    {s.estado === "open" ? "Cerrar ventas" : "Reabrir ventas"}
                  </button>
                </form>
                {/* Editar vive AQUÍ porque aquí vive la salida. Al sacar las
                    fechas del formulario de experiencia, el cupo de una salida
                    ya creada se quedó sin forma de editarse en escritorio: el
                    teléfono podía y la computadora no. */}
                {s.pasada ? null : (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setEditando((v) => !v)}
                  >
                    {editando ? "Cerrar edición" : "Editar cupo y fechas"}
                  </button>
                )}
                {/* Cobrar con descuento o monto fijo a UNA persona de ESTA salida
                    (Luis, 28 oct 2026). Sólo mientras se vende. */}
                {!s.pasada && s.estado === "open" ? (
                  <button type="button" className="btn btn-ghost" onClick={() => setCobrando((v) => !v)}>
                    {cobrando ? "Cerrar link especial" : "Link de pago especial"}
                  </button>
                ) : null}
                {/* Los códigos de descuento son DE la salida (Luis, 4 nov 2026):
                    se crean aquí mientras se vende; los que ya existen se ven
                    y se apagan aunque esté cerrada. */}
                {!s.pasada && (s.estado === "open" || s.codigos.length) ? (
                  <button type="button" className="btn btn-ghost" onClick={() => setConCodigo((v) => !v)}>
                    {conCodigo ? "Cerrar códigos" : `Código de descuento${s.codigos.filter((c) => c.activo).length ? ` · ${s.codigos.filter((c) => c.activo).length}` : ""}`}
                  </button>
                ) : null}
                {/* Dinero. Solo aparece para la casa: `reembolsables` llega
                    vacío para un operador (la devolución sale de la cuenta de
                    NUMAN HUB, no de la suya). */}
                {esCasa ? (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setReembolsando((v) => !v)}
                  >
                    {reembolsando ? "Cerrar reembolsos" : "Reembolsar o cancelar"}
                  </button>
                ) : null}
                {s.estado !== "open" ? (
                  <span className="mut" style={{ fontSize: 12.5 }}>
                    Ya no se vende. La fecha y su gente siguen aquí.
                  </span>
                ) : null}
              </div>
              {editando ? <EditarSalida s={s} onListo={() => setEditando(false)} /> : null}
              {cobrando ? <LinkEspecial slotId={s.id} precioLista={s.precioLista} gente={s.grupo?.gente} onListo={() => setCobrando(false)} /> : null}
              {conCodigo ? <CodigosDeSalida slotId={s.id} codigos={s.codigos} titulo={s.experiencia} fechaLarga={s.fechaLarga} liga={s.ligaVenta} abierta={s.estado === "open"} precioLista={s.precioLista} onListo={() => setConCodigo(false)} /> : null}
              {reembolsando ? <Reembolsos s={s} onListo={() => setReembolsando(false)} /> : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
