"use client";

// EL PANEL DE UNA TARJETA — transcrito de design/comunidad/dc/comunidad.dc.html
// (los <aside class="cmpanel"> de las etapas 01, 03 y 05, y la columna 07).
//
// Cada etapa enseña lo que toca hacer en ella y nada más:
//   01 Llegó · 02 En conversación → el mensaje (correo o WhatsApp), la llamada
//      con su cita y tu agenda; en 02 además el grupo de WhatsApp (Luis, 21 oct).
//   03 Interesado → cuánto falta por pagar, el recordatorio, el grupo y la liga
//      privada de su salida (que se abrió sola al llegar aquí).
//   04 Pagado · 05 Preparando → lo pagado, el deslinde, el grupo y la liga.
//   06 Viajó → la encuesta.
//   07 Se cayeron → el motivo y «Reabrir».
// Los textos de la lámina se conservan tal cual; lo que la lámina inventaba
// (Ana Robles, $24.000) aquí sale de la base.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Cita, Tarjeta } from "@/lib/comunidad/tablero";
import SuEspacio from "@/app/caminante/admin/ui/SuEspacio";
import {
  abrirFechaParaTarjeta,
  agendarLlamada,
  guardarGrupoWhatsapp,
  mandarMensaje,
  moverTarjeta,
  reabrirTarjeta,
  recordatorioPago,
} from "@/lib/comunidad/tablero-actions";

const mxn = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`;
const fechaCorta = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(iso))
    .replace(/\./g, "");
const hoyYmd = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });

type R = { ok: true; waUrl?: string | null; aviso?: string } | { ok: false; error: string };

export default function PanelTarjeta({ t, agenda, operadora, remitente, caidaPedida, onCaidaHecha }: {
  t: Tarjeta;
  agenda: Cita[];
  operadora: string;
  remitente: string | null;
  /** Se soltó en «Se cayeron»: el panel abre pidiendo el motivo. */
  caidaPedida: boolean;
  onCaidaHecha: () => void;
}) {
  const router = useRouter();
  const [pendiente, empezar] = useTransition();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [caida, setCaida] = useState(caidaPedida);
  const [motivo, setMotivo] = useState("");

  const correr = (fn: () => Promise<R>, despues?: () => void) =>
    empezar(async () => {
      const r = await fn();
      if (!r.ok) {
        setAviso({ tipo: "error", texto: r.error });
        return;
      }
      if (r.waUrl) window.open(r.waUrl, "_blank", "noopener");
      setAviso(r.aviso ? { tipo: "ok", texto: r.aviso } : null);
      despues?.();
      router.refresh();
    });

  const enCurso = ["llego", "conversacion"].includes(t.stage);
  const grupoVisible = ["conversacion", "interesado", "pagado", "preparando"].includes(t.stage);
  const pagoVisible = ["interesado", "pagado", "preparando"].includes(t.stage);

  return (
    <>
      <div className="met" style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 }}>
        {t.pago && t.pago.falta === 0 && t.pago.pagado > 0 ? (
          <span className="chip c-paid"><span className="cd" />Pagado</span>
        ) : null}
        <span className="cmtag">{t.origen}</span>
        <span className="cmtag">Llegó el <span className="k">{t.llegoEl}</span></span>
        {t.deslindeFirmado ? <span className="cmtag">Deslinde firmado</span> : null}
        {t.grupoUrl ? <span className="cmtag">En el grupo</span> : null}
        {t.anfitrion ? <span className="cmtag">Anfitrión</span> : null}
        {t.salidaInfo?.privada ? <span className="cmtag">Salida privada · <span className="k">{t.salidaInfo.label}</span></span> : null}
        {!t.anfitrion && t.grupo?.anfitrion ? <span className="cmtag">Grupo de {t.grupo.anfitrion.split(" ")[0]}</span> : null}
      </div>

      {aviso ? (
        <p className={aviso.tipo === "error" ? "cmerr" : "cmnext"} role="status" style={{ marginBottom: 12 }}>
          {aviso.tipo === "error" ? aviso.texto : <><s>✓</s><span>{aviso.texto}</span></>}
        </p>
      ) : null}

      {t.motivoCaida ? (
        <>
          <p className="cmnext" style={{ marginTop: 0 }}><s>·</s><i>{t.motivoCaida}</i></p>
          <div className="salfoot">
            <button type="button" className="btn btn-ghost btn-sm" disabled={pendiente} onClick={() => correr(() => reabrirTarjeta(t.id))}>
              Reabrir
            </button>
          </div>
        </>
      ) : null}

      {enCurso ? <Mensaje t={t} operadora={operadora} remitente={remitente} pendiente={pendiente} correr={correr} /> : null}

      {grupoVisible ? <Grupo t={t} pendiente={pendiente} correr={correr} /> : null}

      {pagoVisible ? <CuantoFalta t={t} pendiente={pendiente} correr={correr} /> : null}

      {/* D2 · «Su espacio»: la liga, la fecha límite y el mínimo, y quién entró. */}
      {t.grupo && (t.anfitrion || !pagoVisible) ? <SuEspacio g={t.grupo} /> : null}

      {enCurso ? <Llamada t={t} agenda={agenda} pendiente={pendiente} correr={correr} /> : null}

      {t.stage === "viajo" ? <Encuesta t={t} /> : null}

      {caida ? (
        <div className="cmwin" style={{ marginTop: 14 }}>
          <div className="wh"><span className="lb">Marcar como caída</span><span className="cd">Con su motivo</span></div>
          <div className="wb">
            <p className="why" style={{ margin: "0 0 8px" }}>Perder es un dato: se guarda con su motivo y se puede reabrir.</p>
            <div className="mini-form" style={{ marginTop: 0 }}>
              <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Buscaba fecha en noviembre. No hay salida ese mes." style={{ flex: "1 1 220px" }} aria-label="Motivo" />
              <button type="button" className="btn btn-orange btn-sm" disabled={pendiente || !motivo.trim()} onClick={() => correr(() => moverTarjeta(t.id, "caido", motivo), () => { setCaida(false); onCaidaHecha(); })}>
                Dar por caída
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCaida(false); onCaidaHecha(); }}>No</button>
            </div>
          </div>
        </div>
      ) : null}

      {!t.motivoCaida && !["viajo", "pagado", "preparando"].includes(t.stage) && !caida ? (
        <div className="salfoot">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCaida(true)}>Marcar como caída</button>
          {t.reservationId ? <a className="btn btn-ghost btn-sm" href="/caminante/admin/pagos">Ver la reserva en Pagos</a> : null}
        </div>
      ) : null}
      {["pagado", "preparando", "viajo"].includes(t.stage) && t.reservationId ? (
        <div className="salfoot"><a className="btn btn-ghost btn-sm" href="/caminante/admin/pagos">Ver la reserva en Pagos</a></div>
      ) : null}
    </>
  );
}

/* ── El mensaje ───────────────────────────────────────────────────────────── */
// «Cat de Nomádika» · «Nomádika de Caminante» · «Caminante» (igual que remitente.ts).
function firmaDe(remitente: string | null, operadora: string): string {
  const op = operadora.trim() || "Caminante";
  if (remitente && remitente.toLowerCase() !== op.toLowerCase()) return `${remitente} de ${op}`;
  if (op.toLowerCase() !== "caminante") return `${op} de Caminante`;
  return op;
}
const ymdCdmx = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
const horaCdmx = (iso: string) => new Intl.DateTimeFormat("es-MX", { timeZone: "America/Mexico_City", hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso)).replace(/\./g, "");
const diaLargo = (ymd: string) => new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(`${ymd}T12:00:00Z`)).replace(/\./g, "");

type Hueco = { k: string; label: string; tipo?: "date" | "time" | "url" | "tel" | "text" };
type Plantilla = { id: string; nombre: string; partes: (string | Hueco)[]; cierre: string };

/**
 * Las plantillas de la lámina. Mientras Meta no apruebe una plantilla de
 * WhatsApp, los huecos se llenan aquí y el texto se abre en el teléfono del
 * operador: lo manda él. Los huecos nacen llenos cuando el dato ya existe
 * (la llamada agendada, la liga de pago, el punto de encuentro de la salida).
 */
const PLANTILLAS: Plantilla[] = [
  { id: "llamada", nombre: "Plantilla · Invitación a llamada", cierre: "Responde a este mensaje y seguimos por aquí.",
    partes: ["Te comparto la liga de nuestra llamada del ", { k: "dia", label: "día", tipo: "date" }, " a las ", { k: "hora", label: "hora", tipo: "time" }, ": ", { k: "liga", label: "liga", tipo: "url" }] },
  { id: "pago", nombre: "Plantilla · Recordatorio de pago", cierre: "Si tienes dudas, respóndeme por aquí.",
    partes: ["Para apartar tu lugar en ", { k: "experiencia", label: "experiencia" }, " falta completar el pago: ", { k: "pagar", label: "liga de pago", tipo: "url" }] },
  { id: "encuentro", nombre: "Plantilla · Punto de encuentro", cierre: "Cualquier cosa ese día, me escribes aquí.",
    partes: ["Nos vemos el ", { k: "dia", label: "día", tipo: "date" }, " en ", { k: "direccion", label: "dirección" }, " a las ", { k: "hora", label: "hora", tipo: "time" }, ". El teléfono del guía es ", { k: "telefono", label: "teléfono", tipo: "tel" }] },
];

function Mensaje({ t, operadora, remitente, pendiente, correr }: { t: Tarjeta; operadora: string; remitente: string | null; pendiente: boolean; correr: (fn: () => Promise<R>, d?: () => void) => void }) {
  const [canal, setCanal] = useState<"correo" | "whatsapp">(t.telefono ? "whatsapp" : "correo");
  const [texto, setTexto] = useState("");
  const [plantillaId, setPlantillaId] = useState("llamada");
  const [huecos, setHuecos] = useState<Record<string, string>>(() => ({
    dia: t.llamada ? ymdCdmx(t.llamada.startsAt) : t.salidaInfo?.inicio ? ymdCdmx(t.salidaInfo.inicio) : "",
    hora: t.llamada ? new Date(t.llamada.startsAt).toLocaleTimeString("en-GB", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit" }) : "",
    liga: t.llamada?.url ?? "",
    experiencia: t.experiencia,
    pagar: t.pagarUrl,
    direccion: t.salidaInfo?.puntoEncuentro ?? "",
    telefono: "",
  }));
  const nombre = t.persona.split(" ")[0];
  const firma = firmaDe(remitente, operadora);
  const bloqueado = canal === "whatsapp" && !t.waVentana.abierta;
  const plantilla = PLANTILLAS.find((x) => x.id === plantillaId) ?? PLANTILLAS[0];
  const completa = plantilla.partes.every((x) => typeof x === "string" || (huecos[x.k] ?? "").trim());
  const valorLegible = (h: Hueco) => {
    const v = (huecos[h.k] ?? "").trim();
    if (!v) return "";
    if (h.tipo === "date" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return diaLargo(v);
    if (h.tipo === "time" && /^\d{2}:\d{2}$/.test(v)) return horaCdmx(`${huecos.dia || "2026-01-01"}T${v}:00-06:00`);
    return v;
  };
  const textoPlantilla = () =>
    `Hola ${nombre}, soy ${firma}. ${plantilla.partes.map((x) => (typeof x === "string" ? x : valorLegible(x))).join("")}. ${plantilla.cierre}`.replace(/\.\s*\./g, ".");
  const cuerpo = bloqueado ? textoPlantilla() : texto;
  const listo = bloqueado ? completa : !!texto.trim();
  const mandar = (pasar: boolean) => correr(() => mandarMensaje(t.id, canal, cuerpo, pasar), () => setTexto(""));

  return (
    <>
      <p className="xh4">El mensaje</p>
      <div className="cmch">
        <button type="button" className={canal === "correo" ? "on" : undefined} onClick={() => setCanal("correo")}>Correo</button>
        <button type="button" className={canal === "whatsapp" ? "on" : undefined} onClick={() => setCanal("whatsapp")}>WhatsApp</button>
      </div>
      <div className={`cmwin ${bloqueado ? "locked" : "open"}`}>
        <div className="wh">
          <span className="lb">{canal === "correo" ? "Correo" : bloqueado ? "WhatsApp · ventana cerrada" : "WhatsApp · ventana abierta"}</span>
          <span className="cd">{canal === "correo" ? (t.email ?? "sin correo") : bloqueado ? "Se llenan huecos" : t.waVentana.cierraEn}</span>
        </div>
        <div className="wb">
          {bloqueado ? (
            <>
              <textarea disabled placeholder="Aquí no se redacta." rows={2} />
              <div className="mini-form" style={{ marginTop: 10 }}>
                <select value={plantillaId} onChange={(e) => setPlantillaId(e.target.value)} aria-label="Plantilla">
                  {PLANTILLAS.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                </select>
              </div>
              <div className="cmtpl" style={{ marginTop: 10 }}>
                Hola <span className="cmslot">{nombre}</span>, soy <span className="cmslot">{firma}</span>.{" "}
                {plantilla.partes.map((x, i) =>
                  typeof x === "string" ? (
                    <span key={i}>{x}</span>
                  ) : (
                    <input
                      key={x.k}
                      className={`cmslot${(huecos[x.k] ?? "").trim() ? "" : " empty"}`}
                      type={x.tipo === "date" || x.tipo === "time" ? x.tipo : "text"}
                      value={huecos[x.k] ?? ""}
                      placeholder={x.label}
                      aria-label={x.label}
                      size={Math.max(6, (huecos[x.k] ?? x.label).length)}
                      onChange={(e) => setHuecos({ ...huecos, [x.k]: e.target.value })}
                      style={{ width: "auto", maxWidth: 260 }}
                    />
                  ),
                )}
                . <span className="fx">{plantilla.cierre}</span>
              </div>
            </>
          ) : (
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={`Hola ${nombre}. Sí hay lugar para ${t.personas} en ${t.experiencia}. ¿Te late si nos vemos 30 minutos por video esta semana para contarte el itinerario?`} rows={4} />
          )}
        </div>
        <p className="why">
          {canal === "correo"
            ? "Sale ahora, firmado por ti. Si responde, te llega al correo de la operadora."
            : bloqueado
              ? "Si nadie escribió en las últimas 24 horas, WhatsApp sólo entrega mensajes con una plantilla aprobada. Se elige la plantilla y se llenan sus huecos; al mandar, el texto se abre en tu WhatsApp y lo envías tú."
              : `${nombre} escribió primero. Mientras la conversación esté abierta puedes redactar libre; el reloj de arriba dice cuánto queda.`}
        </p>
      </div>
      <div className="act-row">
        {t.stage === "llego" ? (
          <button type="button" className="btn btn-orange btn-sm" disabled={pendiente || !listo} onClick={() => mandar(true)}>Mandar y pasar a conversación</button>
        ) : null}
        <button type="button" className={`btn ${t.stage === "llego" ? "btn-ghost" : "btn-orange"} btn-sm`} disabled={pendiente || !listo} onClick={() => mandar(false)}>Mandar</button>
      </div>
    </>
  );
}

/* ── La llamada y tu agenda ───────────────────────────────────────────────── */
function Llamada({ t, agenda, pendiente, correr }: { t: Tarjeta; agenda: Cita[]; pendiente: boolean; correr: (fn: () => Promise<R>, d?: () => void) => void }) {
  const [url, setUrl] = useState("");
  const [fecha, setFecha] = useState(hoyYmd());
  const [hora, setHora] = useState("18:00");
  return (
    <>
      <p className="xh4">La llamada</p>
      <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.55, margin: "-4px 0 10px" }}>
        La reunión la creas en tu cuenta de Zoom o de Google y pegas la liga aquí. Caminante no genera la reunión: la reparte.
      </p>
      {t.llamada ? (
        <p className="cmnext" style={{ marginTop: 0 }}>
          <s>{t.llamada.pasada ? "✓" : "→"}</s>
          <span>{t.llamada.pasada ? "Habló el" : "Llamada el"} <b>{fechaCorta(t.llamada.startsAt)}</b></span>
        </p>
      ) : null}
      <div className="cmwin">
        <div className="wb">
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Liga de la reunión" placeholder="Pega la liga de tu Zoom o tu Meet" />
          <div className="mini-form" style={{ marginTop: 9 }}>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-label="Fecha" style={{ flex: 1, minWidth: 120 }} />
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} aria-label="Hora" style={{ width: 96 }} />
          </div>
          <div className="act-row" style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-orange btn-sm" disabled={pendiente || !url.trim()} onClick={() => correr(() => agendarLlamada(t.id, { url, fecha, hora }), () => setUrl(""))}>
              Agendar y repartir
            </button>
          </div>
        </div>
        <div className="cmfan" style={{ padding: "0 14px 6px" }}>
          <div className="r"><span className="no">01</span><span>Va al mensaje <b style={{ fontWeight: 600 }}>por los dos canales</b><small>Correo y WhatsApp. No es uno u otro: es la cita, y no se puede perder.</small><span className="two"><span className="chip c-conf"><span className="cd" />Correo</span><span className="chip c-conf"><span className="cd" />WhatsApp</span></span></span></div>
          <div className="r"><span className="no">02</span><span>{t.persona.split(" ")[0]} recibe «agregar a mi calendario»<small>Archivo .ics y liga de Google Calendar. Le sirve en cualquier calendario y no tiene que conectar nada.</small></span></div>
          <div className="r"><span className="no">03</span><span>Aparece en tu agenda, aquí abajo<small>Es una lista propia de Caminante, no una integración con tu Google.</small></span></div>
        </div>
      </div>

      <p className="xh4">Tu agenda</p>
      {agenda.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>Ninguna llamada agendada todavía.</p>
      ) : (
        agenda.map((c) => (
          <div className="cmag" key={c.id} style={{ gridTemplateColumns: "60px 1fr" }}>
            <span className="dy">{c.dow}<b>{c.dia}</b>{c.mes}</span>
            <span className="g"><b>{c.persona}</b> · {c.personas} {c.personas === 1 ? "persona" : "personas"}<small>{c.hora} · {c.servicio}</small></span>
          </div>
        ))
      )}
    </>
  );
}

/* ── Su grupo de WhatsApp ─────────────────────────────────────────────────── */
function Grupo({ t, pendiente, correr }: { t: Tarjeta; pendiente: boolean; correr: (fn: () => Promise<R>, d?: () => void) => void }) {
  const [liga, setLiga] = useState("");
  const [copiado, setCopiado] = useState(false);
  const copiar = (s: string) => navigator.clipboard?.writeText(s).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1500); });
  return (
    <>
      <p className="xh4">Su grupo de WhatsApp</p>
      {t.grupoUrl ? (
        <div className="cmwin">
          <div className="wh"><span className="lb">Grupo puesto</span><span className="cd">Pegado una vez</span></div>
          <div className="wb">
            <div className="sallk"><span>{t.grupoUrl.replace(/^https?:\/\//, "")}</span><button type="button" className="btn btn-glass btn-sm" onClick={() => copiar(t.grupoUrl!)}>{copiado ? "Copiado" : "Copiar"}</button></div>
            <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 10 }}>Va incluida en todos los mensajes de esta salida de aquí en adelante.</p>
            <div className="mini-form" style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" disabled={pendiente} onClick={() => correr(() => guardarGrupoWhatsapp(t.id, ""))}>Quitar</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="cmwin locked">
          <div className="wh"><span className="lb">Sin grupo todavía</span><span className="cd">Lo normal al principio</span></div>
          <div className="wb">
            <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 10 }}>El grupo lo creas en tu teléfono —nadie puede crear grupos de WhatsApp desde un sistema— y pegas aquí la liga una sola vez.</p>
            <div className="mini-form" style={{ marginTop: 0 }}>
              <input type="url" value={liga} onChange={(e) => setLiga(e.target.value)} placeholder="chat.whatsapp.com/…" style={{ flex: 1, minWidth: 150 }} aria-label="Liga del grupo" />
              <button type="button" className="btn btn-ghost btn-sm" disabled={pendiente || !liga.trim()} onClick={() => correr(() => guardarGrupoWhatsapp(t.id, liga), () => setLiga(""))}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Cuánto falta + la liga de su salida ──────────────────────────────────── */
function CuantoFalta({ t, pendiente, correr }: { t: Tarjeta; pendiente: boolean; correr: (fn: () => Promise<R>, d?: () => void) => void }) {
  const [copiado, setCopiado] = useState(false);
  const [inicio, setInicio] = useState(t.solicitud?.fecha ?? "");
  const [fin, setFin] = useState("");
  const copiar = (s: string) => navigator.clipboard?.writeText(s).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1500); });
  const pagados = t.pago && t.pago.suman > 0 ? Math.min(t.pago.lugares, Math.floor((t.pago.pagado / t.pago.suman) * t.pago.lugares + 1e-9)) : 0;
  return (
    <>
      <p className="xh4">Cuánto falta</p>
      {t.pago ? (
        <>
          <dl className="dl">
            <dt>Lugares apartados</dt><dd className="mono">{t.pago.lugares}</dd>
            <dt>Suman</dt><dd className="mono">{mxn(t.pago.suman)}</dd>
            <dt>Pagado</dt><dd className="mono">{mxn(t.pago.pagado)}</dd>
            <dt>Falta</dt><dd className="mono" style={t.pago.falta > 0 ? { color: "var(--orange)", fontWeight: 700 } : undefined}>{mxn(t.pago.falta)}</dd>
          </dl>
          <div className={`prog${t.pago.falta > 0 ? " warn" : ""}`} style={{ marginTop: 12 }}>
            <span className="tk2"><i style={{ width: `${t.pago.suman > 0 ? Math.min(100, (t.pago.pagado / t.pago.suman) * 100) : 0}%` }} /></span>
            <span className="fr">{pagados} de {t.pago.lugares} pagados</span>
          </div>
        </>
      ) : (
        <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>
          Todavía no ha apartado lugar: {t.personas} {t.personas === 1 ? "persona" : "personas"} por cobrar.
        </p>
      )}
      {t.stage === "interesado" ? (
        <div className="act-row">
          <button type="button" className="btn btn-orange btn-sm" disabled={pendiente} onClick={() => correr(() => recordatorioPago(t.id))}>Mandar recordatorio ahora</button>
        </div>
      ) : null}

      {t.salidaInfo ? (
        <>
          <p className="xh4">{t.salidaInfo.privada ? "La liga de su espacio" : "Su salida"}</p>
          <div className="sallk"><span>{t.salidaInfo.link.replace(/^https?:\/\//, "")}</span><button type="button" className="btn btn-glass btn-sm" onClick={() => copiar(t.salidaInfo!.link)}>{copiado ? "Copiado" : "Copiar"}</button></div>
          <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.55, marginTop: 9 }}>
            {t.salidaInfo.privada
              ? `El espacio del grupo de la salida ${t.salidaInfo.label}. Quien entre por ahí crea su cuenta (celular y correo), aparta su lugar y firma.`
              : `Salida pública ${t.salidaInfo.label}: cualquiera la ve en el sitio.`}
          </p>
        </>
      ) : t.stage === "interesado" ? (
        <>
          <p className="xh4">Su fecha de grupo</p>
          <div className="cmwin locked">
            <div className="wh"><span className="lb">Sin salida todavía</span><span className="cd">{t.solicitud?.nota ? "Pidió fechas flexibles" : "Falta la fecha"}</span></div>
            <div className="wb">
              {t.solicitud?.nota ? <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 10 }}>«{t.solicitud.nota}»</p> : null}
              <p style={{ fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.6, marginBottom: 10 }}>Al dar la fecha se abre su salida como grupo privado, con liga propia y cupo para {t.personas}.</p>
              <div className="mini-form" style={{ marginTop: 0 }}>
                <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} aria-label="Inicio" style={{ flex: 1, minWidth: 130 }} />
                <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} aria-label="Fin (opcional)" style={{ flex: 1, minWidth: 130 }} />
                <button type="button" className="btn btn-orange btn-sm" disabled={pendiente || !inicio} onClick={() => correr(() => abrirFechaParaTarjeta(t.id, inicio, fin || undefined))}>Abrir la fecha</button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

/* ── La encuesta (Viajó) ──────────────────────────────────────────────────── */
function Encuesta({ t }: { t: Tarjeta }) {
  const e = t.encuesta;
  return (
    <>
      <p className="xh4">La encuesta</p>
      {e.estado === "contesto" ? (
        <>
          <div className="met" style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {e.stars != null ? <span className="cmtag">★ <span className="k">{e.stars}</span></span> : null}
            {e.nps != null ? <span className="cmtag">NPS <span className="k">{e.nps}</span></span> : null}
            {e.publicable ? <span className="chip c-paid"><span className="cd" />Testimonio publicable</span> : null}
          </div>
          <p className="cmnext"><s>✓</s><span>Contestó la encuesta{e.publicable ? " · " : ""}{e.publicable ? <b>testimonio publicable</b> : null}</span></p>
        </>
      ) : e.estado === "invitada" ? (
        <p className="cmnext" style={{ marginTop: 0 }}><s>→</s><span>No ha contestado la encuesta</span></p>
      ) : (
        <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>La encuesta sale sola el día después de volver.</p>
      )}
      <div className="salfoot"><a className="btn btn-ghost btn-sm" href="/caminante/admin/encuesta">Ver en Encuesta</a></div>
    </>
  );
}
