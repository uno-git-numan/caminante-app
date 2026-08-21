"use client";

// Tarjeta de una SOLICITUD DE OPERADOR. Calcada de EmbajadorCard en look y
// clases, pero con los cuatro escalones que pidió Luis: llegó → se agenda la
// llamada → se le pide el expediente → se aprueba y entra al panel.
//
// ⚠️ Aprobar aquí NO es lo mismo que aprobar a un embajador: abre el panel
// completo (reservas, datos médicos, dinero). Por eso la confirmación lo dice
// con todas sus letras en vez de un «¿seguro?» genérico.
import { useState } from "react";
import {
  agendarLlamada,
  pedirExpediente,
  aprobarOperadorApp,
  rechazarOperadorApp,
} from "@/lib/admin/operadores-app-actions";

const TIPO: Record<string, string> = {
  montana: "Montaña", mar: "Mar", cuevas: "Cuevas",
  naturaleza: "Naturaleza", cultura: "Cultura", mixta: "Mixta",
};
const SEGURO: Record<string, string> = {
  vigente: "Vigente", "vence-pronto": "Vence pronto", tramite: "En trámite", no: "Sin seguro",
};
const PRIMEROS: Record<string, string> = {
  todos: "Todos los guías", algunos: "Algunos guías", botiquin: "Solo botiquín", no: "No",
};
const ANTIG: Record<string, string> = {
  "menos-1": "Menos de 1 año", "1-3": "1 a 3 años", "3-10": "3 a 10 años", "mas-10": "Más de 10 años",
};
const ESTADO: Record<string, { txt: string; cls: string }> = {
  pending: { txt: "Sin revisar", cls: "c-sol" },
  calling: { txt: "Llamada agendada", cls: "c-sol" },
  docs: { txt: "Expediente pedido", cls: "c-sol" },
};

// Lo que se le suele pedir. Editable antes de mandar: a una operadora de
// montaña no se le pide certificación de buceo.
const DOCS_SUGERIDOS = [
  "Póliza de responsabilidad civil vigente",
  "Identificación oficial del responsable",
  "Constancia de situación fiscal",
  "Certificaciones de primeros auxilios",
  "Registro Nacional de Turismo (si aplica)",
];

export type OpAppView = {
  id: string;
  nombreOperadora: string;
  responsable: string;
  email: string;
  whatsapp: string;
  instagram: string | null;
  ciudadEstado: string;
  tipo: string;
  descripcion: string;
  antiguedad: string;
  salidasAno: string | null;
  personasSalida: string | null;
  rangoPrecio: string | null;
  seguro: string;
  primerosAuxilios: string;
  ratioGuias: string;
  incidentes: string;
  porque: string | null;
  conociste: string | null;
  status: string;
  meetUrl: string | null;
  llamadaAt: string | null;
  expediente: { nombre: string; estado: string; archivo: string | null }[];
  marca: { logoUrl?: string; colors?: { primary?: string; accent?: string } } | null;
  marcaDespues: boolean;
  fecha: string;
};

export default function OperadorAppCard({ app }: { app: OpAppView }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<"ok" | "no" | null>(null);
  const [panel, setPanel] = useState<"llamada" | "docs" | null>(null);
  const [meet, setMeet] = useState(app.meetUrl ?? "");
  const [cuando, setCuando] = useState(app.llamadaAt?.slice(0, 16) ?? "");
  const [msg, setMsg] = useState("");
  const [docs, setDocs] = useState<string[]>(DOCS_SUGERIDOS.slice(0, 3));
  const est = ESTADO[app.status] ?? { txt: app.status, cls: "c-sol" };

  async function correr(tag: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(tag); setErr(null);
    try {
      const r = await fn();
      if (!r.ok) setErr(r.error || "No se pudo.");
      else if (tag === "ok") setDone("ok");
      else if (tag === "no") setDone("no");
      else setPanel(null);
    } catch { setErr("No se pudo. Inténtalo de nuevo."); }
    finally { setBusy(null); }
  }

  const F = ({ k, v }: { k: string; v: string }) => (
    <><dt>{k}</dt><dd style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>{v}</dd></>
  );

  return (
    <div className="card" style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 600, fontSize: 15.5 }}>{app.nombreOperadora}</span>
        <span className="chip c-sol">{TIPO[app.tipo] ?? app.tipo}</span>
        <span className="chip">{est.txt}</span>
        <span className="mut" style={{ fontSize: 12.5, marginLeft: "auto" }}>{app.fecha}</span>
      </div>

      <div className="dl" style={{ marginTop: 12, gridTemplateColumns: "auto 1fr" }}>
        <F k="Responsable" v={app.responsable} />
        <F k="Correo" v={app.email} />
        <F k="WhatsApp" v={app.whatsapp} />
        {app.instagram ? <F k="Instagram" v={app.instagram} /> : null}
        <F k="Dónde opera" v={app.ciudadEstado} />
        <F k="Qué opera" v={app.descripcion} />
        <F k="Antigüedad" v={ANTIG[app.antiguedad] ?? app.antiguedad} />
        {app.salidasAno ? <F k="Salidas al año" v={app.salidasAno} /> : null}
        {app.personasSalida ? <F k="Personas por salida" v={app.personasSalida} /> : null}
        {app.rangoPrecio ? <F k="Rango de precio" v={app.rangoPrecio} /> : null}
      </div>

      {/* El filtro real: lo que decide si esta persona opera gente o no. */}
      <div style={{ marginTop: 14, padding: "12px 14px", background: "#f6f4ef", borderLeft: "2.5px solid #637154" }}>
        <div className="mut" style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
          Cómo cuida a la gente
        </div>
        <div className="dl" style={{ gridTemplateColumns: "auto 1fr" }}>
          <F k="Seguro RC" v={SEGURO[app.seguro] ?? app.seguro} />
          <F k="Primeros auxilios" v={PRIMEROS[app.primerosAuxilios] ?? app.primerosAuxilios} />
          <F k="Guías por persona" v={app.ratioGuias} />
          <F k="Un incidente que manejó" v={app.incidentes} />
        </div>
      </div>

      {app.porque ? <div className="dl" style={{ marginTop: 12, gridTemplateColumns: "auto 1fr" }}><F k="Por qué Caminante" v={app.porque} /></div> : null}

      {/* Marca declarada al aplicar */}
      <div className="dl" style={{ marginTop: 12, gridTemplateColumns: "auto 1fr" }}>
        <dt>Su marca</dt>
        <dd style={{ textAlign: "left" }}>
          {app.marca?.colors?.primary ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <i style={{ width: 15, height: 15, borderRadius: 3, background: app.marca.colors.primary, display: "inline-block" }} />
              <i style={{ width: 15, height: 15, borderRadius: 3, background: app.marca.colors.accent, display: "inline-block" }} />
              <span className="mut" style={{ fontSize: 12.5 }}>
                {app.marca.colors.primary} · {app.marca.colors.accent}
                {app.marca.logoUrl ? " · con logo" : " · sin logo"}
              </span>
            </span>
          ) : app.marcaDespues ? (
            <span className="mut">La configura después (así lo eligió)</span>
          ) : (
            <span className="mut">No la capturó</span>
          )}
        </dd>
      </div>

      {app.expediente.length ? (
        <div className="dl" style={{ marginTop: 12, gridTemplateColumns: "auto 1fr" }}>
          <dt>Expediente</dt>
          <dd style={{ textAlign: "left" }}>
            {app.expediente.map((d) => (
              <div key={d.nombre} style={{ fontSize: 13 }}>
                <span className="mut">{d.estado === "recibido" ? "✓" : "·"}</span> {d.nombre}
              </div>
            ))}
          </dd>
        </div>
      ) : null}

      {app.meetUrl ? (
        <div className="dl" style={{ marginTop: 8, gridTemplateColumns: "auto 1fr" }}>
          <dt>Llamada</dt>
          <dd style={{ textAlign: "left" }}>
            <a href={app.meetUrl} target="_blank" rel="noreferrer">{app.meetUrl}</a>
            {app.llamadaAt ? <span className="mut"> · {new Date(app.llamadaAt).toLocaleString("es-MX")}</span> : null}
          </dd>
        </div>
      ) : null}

      {panel === "llamada" ? (
        <div style={{ marginTop: 14, padding: 14, border: "1px solid #ddd6c9" }}>
          <p className="mut" style={{ fontSize: 12.5, marginBottom: 10 }}>
            Abre <a href="https://meet.google.com/new" target="_blank" rel="noreferrer">meet.google.com/new</a>, copia la liga y pégala aquí.
          </p>
          <input className="in" placeholder="https://meet.google.com/abc-defg-hij" value={meet} onChange={(e) => setMeet(e.target.value)} />
          <input className="in" type="datetime-local" style={{ marginTop: 8 }} value={cuando} onChange={(e) => setCuando(e.target.value)} />
          <textarea className="in" style={{ marginTop: 8 }} rows={3} placeholder="Mensaje para el correo (opcional)" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="act-row">
            <button className="btn btn-orange btn-sm" disabled={busy !== null}
              onClick={() => correr("llamada", () => agendarLlamada(app.id, meet, cuando, msg))}>
              {busy === "llamada" ? "Mandando…" : "Mandar invitación"}
            </button>
            <button className="btn btn-sm" onClick={() => setPanel(null)}>Cancelar</button>
          </div>
        </div>
      ) : null}

      {panel === "docs" ? (
        <div style={{ marginTop: 14, padding: 14, border: "1px solid #ddd6c9" }}>
          <p className="mut" style={{ fontSize: 12.5, marginBottom: 10 }}>
            Le llega un link privado con token, que expira en 21 días.
          </p>
          {DOCS_SUGERIDOS.map((d) => (
            <label key={d} style={{ display: "block", fontSize: 13.5, marginBottom: 5 }}>
              <input type="checkbox" checked={docs.includes(d)}
                onChange={(e) => setDocs(e.target.checked ? [...docs, d] : docs.filter((x) => x !== d))} />{" "}
              {d}
            </label>
          ))}
          <textarea className="in" style={{ marginTop: 8 }} rows={3} placeholder="Mensaje para el correo (opcional)" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <div className="act-row">
            <button className="btn btn-orange btn-sm" disabled={busy !== null}
              onClick={() => correr("docs", () => pedirExpediente(app.id, docs, msg))}>
              {busy === "docs" ? "Mandando…" : `Pedir ${docs.length} documento(s)`}
            </button>
            <button className="btn btn-sm" onClick={() => setPanel(null)}>Cancelar</button>
          </div>
        </div>
      ) : null}

      <div className="act-row">
        {done === "ok" ? (
          <span className="chip c-paid">Aprobado — ya es operador y tiene acceso al panel</span>
        ) : done === "no" ? (
          <span className="chip c-canc">Rechazado (correo enviado)</span>
        ) : (
          <>
            <button className="btn btn-sm" disabled={busy !== null} onClick={() => setPanel(panel === "llamada" ? null : "llamada")}>
              {app.meetUrl ? "Reagendar llamada" : "Agendar llamada"}
            </button>
            <button className="btn btn-sm" disabled={busy !== null} onClick={() => setPanel(panel === "docs" ? null : "docs")}>
              Pedir expediente
            </button>
            <button className="btn btn-orange btn-sm" disabled={busy !== null}
              onClick={() => {
                if (!confirm(`Aprobar a ${app.nombreOperadora} le da ACCESO AL PANEL: reservas, datos médicos de clientes y dinero. ¿Seguro?`)) return;
                correr("ok", () => aprobarOperadorApp(app.id));
              }}>
              {busy === "ok" ? "Aprobando…" : "Aprobar operador"}
            </button>
            <button className="btn btn-danger btn-sm" disabled={busy !== null}
              onClick={() => {
                const m = prompt(`¿Por qué no procede ${app.nombreOperadora}? (queda guardado, no se le manda)`);
                if (m === null) return;
                correr("no", () => rechazarOperadorApp(app.id, m));
              }}>
              {busy === "no" ? "Rechazando…" : "Rechazar"}
            </button>
          </>
        )}
        {err ? <span className="mut" style={{ color: "#b0341a", fontSize: 12.5 }}>{err}</span> : null}
      </div>
    </div>
  );
}
