"use client";

// EL CAJÓN DE LAS ETAPAS 01 Y 02 — la solicitud, y el botón de agendar.
//
// ⚠️ El cajón mostraba los SEIS CANDADOS en las siete etapas, igual que hacía
// la tarjeta antes. En «01 Llegó» eso es contestar una pregunta que nadie hizo:
// abrir esa ficha sirve para leer lo que la operadora mandó y para agendarle la
// llamada, y ninguna de las dos cosas estaba ahí. Había que salirse del tablero
// a otra pantalla para agendar, con la ficha abierta enfrente.
//
// La acción es la MISMA `agendarLlamada` de la bandeja de solicitudes: mismo
// candado de admin, misma validación de hora en CDMX, mismo correo con su .ics.
// Dos caminos a la misma acción, no dos acciones.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { agendarLlamada } from "@/lib/admin/operadores-app-actions";
import type { OperadoraPlataforma } from "@/lib/plataforma/operadoras";
import { proveedorDeLiga } from "@/lib/plataforma/etapas";

const F = ({ k, v }: { k: string; v: string | null }) =>
  v ? (
    <>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </>
  ) : null;

const f = (iso: string, hora = false) =>
  new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City",
    ...(hora ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  });

export default function SolicitudEnCajon({ o }: { o: OperadoraPlataforma }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [liga, setLiga] = useState(o.llamadaUrl ?? "");
  const [cuando, setCuando] = useState(o.llamadaAt ? o.llamadaAt.slice(0, 16) : "");
  const [msg, setMsg] = useState("");
  const [yendo, setYendo] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const s = o.solicitud;
  if (!o.solicitudId || !s) {
    return (
      <p className="gnhint">
        Esta operadora se dio de alta a mano y no pasó por el embudo, así que no hay solicitud que
        leer ni llamada que agendar.
      </p>
    );
  }

  async function mandar() {
    setYendo(true); setErr(null);
    const r = await agendarLlamada(o.solicitudId!, liga, cuando, msg);
    setYendo(false);
    if (!r.ok) { setErr(r.error ?? "No se pudo."); return; }
    // La llamada quedó agendada aunque el correo no saliera: son dos cosas, y
    // callar la segunda es lo que hacía que «invitación enviada» mintiera.
    if (r.aviso) { setErr(r.aviso); router.refresh(); return; }
    setAbierto(false);
    // El tablero se lee del servidor: al agendar, la tarjeta se mueve sola de
    // la columna 01 a la 02. Sin esto habría que recargar a mano para verlo.
    router.refresh();
  }

  return (
    <>
      {o.llamadaAt ? (
        <div className="verdict casa">
          <span className="n">{"//"}</span>
          <span className="g">
            <b>Llamada el {f(o.llamadaAt, true)} h</b>
            <span>
              Por {proveedorDeLiga(o.llamadaUrl)}
              {o.llamadaUrl ? (
                <>
                  {" · "}
                  <a href={o.llamadaUrl} target="_blank" rel="noreferrer">
                    entrar
                  </a>
                </>
              ) : null}
              . Ya se le mandó la invitación con su evento de calendario.
            </span>
          </span>
        </div>
      ) : (
        <div className="verdict no">
          <span className="n">{"//"}</span>
          <span className="g">
            <b>Sin contestar</b>
            <span>
              Su solicitud llegó
              {o.solicitudAt ? ` el ${f(o.solicitudAt)}` : ""} y sigue esperando respuesta.
            </span>
          </span>
        </div>
      )}

      {/* Lo que mandó. Se lee, no se edita: es el registro de lo que declaró
          ese día. Misma rejilla `.dl` que usa la bandeja de solicitudes — no se
          inventa una segunda forma de listar los mismos campos. */}
      <p className="subtitle" style={{ marginTop: 16 }}>Lo que mandó</p>
      <div className="dl" style={{ marginTop: 8 }}>
        <F k="Responsable" v={s.responsable} />
        <F k="Correo" v={s.email} />
        <F k="WhatsApp" v={s.whatsapp} />
        <F k="Desde" v={s.ciudadEstado} />
        <F k="Qué opera" v={s.tipoOperacion} />
        <F k="Seguro de RC" v={s.seguro} />
        <F k="Primeros auxilios" v={s.primerosAuxilios} />
        <F k="Guías por persona" v={s.ratioGuias} />
      </div>

      <div className="act-row" style={{ marginTop: 14 }}>
        <button className="btn btn-orange btn-sm" onClick={() => setAbierto(!abierto)}>
          {o.llamadaAt ? "Reagendar la llamada" : "Agendar la llamada"}
        </button>
      </div>

      {/* `.cmwin` es la ventana del panel y ya trae el estilo de sus inputs; es
          la misma que usa la bandeja de solicitudes para este formulario. */}
      {abierto ? (
        <div className="cmwin" style={{ marginTop: 12, padding: 14, border: "1px solid var(--line)" }}>
          <p className="mut" style={{ fontSize: 12.5, marginBottom: 10 }}>
            Pega la liga de la videollamada —Meet, Zoom, la que uses— y la hora del centro de
            México.
          </p>
          <input
            value={liga}
            placeholder="https://…  liga de la videollamada"
            onChange={(e) => setLiga(e.target.value)}
          />
          <input
            type="datetime-local"
            value={cuando}
            onChange={(e) => setCuando(e.target.value)}
          />
          <textarea
            rows={3}
            value={msg}
            placeholder="Mensaje para el correo (opcional)"
            onChange={(e) => setMsg(e.target.value)}
          />
          <div className="act-row" style={{ marginTop: 12 }}>
            <button className="btn btn-orange btn-sm" disabled={yendo} onClick={() => void mandar()}>
              {yendo ? "Mandando…" : "Mandar la invitación"}
            </button>
            <button className="btn btn-sm" onClick={() => setAbierto(false)}>
              Cancelar
            </button>
            {err ? <span style={{ color: "#b0341a", fontSize: 12.5 }}>{err}</span> : null}
          </div>
          <p className="gnhint" style={{ marginTop: 8 }}>
            Al mandarla le llega un correo con el día, la hora y su evento de calendario, y su
            tarjeta se mueve a «02 En llamada».
          </p>
        </div>
      ) : null}
    </>
  );
}
