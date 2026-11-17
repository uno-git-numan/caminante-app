"use client";

// FACTURACIÓN DESDE CAMINANTE — la operadora la activa, sube su CSD y firma su
// carta manifiesto sin salir de su panel y sin ver nunca el portal de
// Facturapi (Luis, 12 nov 2026: «igual que Stripe, todo desde nuestra
// plataforma»). D20 y convenio v3.3, Décima tercera §1 bis.
//
// Tres pasos, en este orden y cada uno con su candado en el servidor:
//   1 · Activar: lee el §1 bis TAL CUAL está en su convenio y lo acepta.
//   2 · CSD: los dos archivos y la contraseña van en una petición y se
//       reenvían a Facturapi en memoria; aquí no se guardan (D20 bis).
//   3 · Carta manifiesto: el módulo incrustable de Facturapi. Su e.firma va de
//       su navegador a Facturapi; Caminante no la ve. El marco DICE que es de
//       Facturapi (condición de legal: quien firma sabe a quién entrega su firma).
//
// Mismas piezas que el resto de Cobrar (`mini-form`, `btn`, `mut`): es una
// sección del panel, no una pantalla nueva.

import { useState } from "react";
import type { EstadoPortal, Consentimiento } from "@/lib/facturacion/portal";
import {
  activarFacturacionAction,
  desactivarFacturacionAction,
  subirCsdAction,
  verificarManifiestoAction,
} from "@/lib/facturacion/portal-actions";

const MANIFIESTO_URL = "https://www.facturapi.io/embedded/manifiesto";

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" }) : "";
const negritas = (t: string) => t.split(/\*\*(.+?)\*\*/g).map((x, i) => (i % 2 ? <b key={i}>{x}</b> : x));

export default function FacturacionPortal({
  operatorId,
  modo,
  disponible,
  convenioFirmado,
  consentimiento,
  estado,
}: {
  operatorId: string;
  /** `operadora` = ella (o la casa sobre una propia) · `casa` = la plataforma mirando a una externa: sólo ve y desactiva. */
  modo: "operadora" | "casa";
  /** Hay llave de usuario de Facturapi y secreto de cifrado: sin eso no se puede conectar nada. */
  disponible: boolean;
  convenioFirmado: boolean;
  consentimiento: Consentimiento | null;
  estado: EstadoPortal;
}) {
  const [ocupado, setOcupado] = useState("");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [aceptado, setAceptado] = useState(false);
  const [nombre, setNombre] = useState("");
  const [pass, setPass] = useState("");
  const ella = modo === "operadora";

  async function correr(que: string, f: () => Promise<{ ok: true; mensaje?: string } | { ok: false; error: string }>) {
    setOcupado(que);
    setAviso(null);
    const r = await f();
    setOcupado("");
    setAviso(r.ok ? { ok: true, texto: r.mensaje ?? "Listo." } : { ok: false, texto: r.error });
    if (r.ok) window.location.reload();
  }

  function activar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consentimiento) return;
    const fd = new FormData();
    fd.set("operatorId", operatorId);
    fd.set("version", consentimiento.version);
    fd.set("hash", consentimiento.hash);
    fd.set("nombre", nombre);
    if (aceptado) fd.set("aceptado", "on");
    void correr("activar", () => activarFacturacionAction(fd));
  }

  function subirCsd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const cer = (form.elements.namedItem("cer") as HTMLInputElement).files?.[0];
    const key = (form.elements.namedItem("key") as HTMLInputElement).files?.[0];
    if (!cer || !key) {
      setAviso({ ok: false, texto: "Hacen falta los dos archivos: el .cer y el .key." });
      return;
    }
    const fd = new FormData();
    fd.set("operatorId", operatorId);
    fd.set("cer", cer);
    fd.set("key", key);
    fd.set("password", pass);
    setPass("");
    void correr("csd", () => subirCsdAction(fd));
  }

  function desactivar() {
    const motivo = ella
      ? "La operadora desactivó la facturación desde su panel."
      : window.prompt("¿Por qué se desactiva? (queda en el rastro: terminó el convenio, lo pidió ella…)") ?? "";
    if (!ella && !motivo.trim()) return;
    if (!window.confirm("Caminante dejará de facturar a su nombre desde este momento y su certificado se dará de baja en Facturapi. ¿Desactivar?")) return;
    const fd = new FormData();
    fd.set("operatorId", operatorId);
    fd.set("motivo", motivo);
    void correr("desactivar", () => desactivarFacturacionAction(fd));
  }

  const Aviso = aviso ? (
    <p className="mut" style={{ fontSize: 12.5, margin: "10px 0 0", color: aviso.ok ? undefined : "var(--rust, #a5432a)" }}>
      {aviso.ok ? "✓ " : ""}
      {aviso.texto}
    </p>
  ) : null;

  // ── Apagada: el consentimiento ────────────────────────────────────────────
  if (!estado.activa) {
    return (
      <div>
        {estado.bajaPendiente ? (
          <p className="mut" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
            La facturación está apagada, pero el certificado sigue registrado en Facturapi.{" "}
            <button type="button" className="btn btn-sm" onClick={desactivar} disabled={ocupado !== ""}>
              {ocupado === "desactivar" ? "Dando de baja…" : "Darlo de baja"}
            </button>
          </p>
        ) : null}
        {!ella ? (
          <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>
            No la ha activado. La activa ella desde su panel, aceptando las condiciones de su convenio; la casa no la activa por ella.
          </p>
        ) : !disponible ? (
          <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>Muy pronto vas a poder activarla aquí mismo.</p>
        ) : !convenioFirmado ? (
          <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>Primero firma tu convenio de operación (paso 03).</p>
        ) : !consentimiento ? (
          <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>
            Tu convenio vigente no trae las condiciones de la facturación desde el portal. Escríbenos.
          </p>
        ) : (
          <form onSubmit={activar}>
            <p className="mut" style={{ fontSize: 12.5, margin: "0 0 8px" }}>
              Para activarla aceptas este punto de tu convenio ({consentimiento.version}):
            </p>
            <div className="legal" style={{ fontSize: 12.5, lineHeight: 1.55, padding: "10px 12px", border: "1px solid var(--sand)", borderRadius: 10, maxHeight: 260, overflow: "auto" }}>
              <p style={{ margin: 0 }}>{negritas(consentimiento.texto)}</p>
            </div>
            <label className="mut" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, margin: "10px 0 0" }}>
              <input type="checkbox" checked={aceptado} onChange={(e) => setAceptado(e.target.checked)} />
              <span>Acepto estas condiciones a nombre de la operadora.</span>
            </label>
            <div className="mini-form" style={{ marginTop: 8 }}>
              <label>
                Tu nombre completo
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
              </label>
            </div>
            <button type="submit" className="btn btn-sm" style={{ marginTop: 10 }} disabled={ocupado !== "" || !aceptado || !nombre.trim()}>
              {ocupado === "activar" ? "Activando…" : "Activar facturación desde el portal"}
            </button>
          </form>
        )}
        {Aviso}
      </div>
    );
  }

  // ── Activa: certificado, carta y estado ───────────────────────────────────
  return (
    <div>
      <p className="mut" style={{ fontSize: 12.5, margin: "0 0 12px" }}>
        Activada el {fecha(estado.activadaAt)}
        {estado.activadaPor ? ` por ${estado.activadaPor}` : ""}.{" "}
        {estado.listo ? <b>Lista: las facturas de tus ventas se emiten desde aquí, a tu nombre.</b> : "Faltan los pasos de abajo para empezar a facturar."}
      </p>

      <h4 style={{ fontSize: 13.5, margin: "14px 0 6px" }}>a · Tu CSD (Certificado de Sello Digital)</h4>
      {estado.csd ? (
        <p className="mut" style={{ fontSize: 12.5, margin: "0 0 8px" }}>
          ✓ Registrado en Facturapi{estado.csd.serie ? `, número ${estado.csd.serie}` : ""}
          {estado.csd.venceAt ? `, vigente hasta el ${fecha(estado.csd.venceAt)}` : ""}.
          {ella ? " Subir otro lo reemplaza." : ""}
        </p>
      ) : (
        <p className="mut" style={{ fontSize: 12.5, margin: "0 0 8px" }}>
          {ella ? "Los dos archivos que te dio el SAT y su contraseña." : "Todavía no lo sube."}
        </p>
      )}
      {ella ? (
        <form onSubmit={subirCsd}>
          <div className="mini-form" style={{ alignItems: "start" }}>
            <label>
              Certificado (.cer)
              <input type="file" name="cer" accept=".cer" />
            </label>
            <label>
              Llave privada (.key)
              <input type="file" name="key" accept=".key" />
            </label>
            <label>
              Contraseña del CSD
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="off" placeholder="La de tu .key" />
            </label>
          </div>
          <p className="mut" style={{ fontSize: 12, margin: "6px 0 0" }}>
            Van directo a Facturapi, nuestro proveedor autorizado de certificación, que lo custodia. Caminante no guarda tu
            certificado, tu llave ni tu contraseña. Tú respondes por lo que se selle con él mientras no lo des de baja.
          </p>
          <button type="submit" className="btn btn-sm" style={{ marginTop: 10 }} disabled={ocupado !== ""}>
            {ocupado === "csd" ? "Enviando a Facturapi…" : estado.csd ? "Reemplazar CSD" : "Enviar CSD"}
          </button>
        </form>
      ) : null}

      <h4 style={{ fontSize: 13.5, margin: "18px 0 6px" }}>b · Tu carta manifiesto</h4>
      {estado.manifiestoAt ? (
        <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>✓ Firmada (Facturapi la confirmó el {fecha(estado.manifiestoAt)}).</p>
      ) : !estado.csd ? (
        <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>Primero el CSD: con él se crea tu espacio de facturación.</p>
      ) : ella ? (
        <div>
          <p className="mut" style={{ fontSize: 12.5, margin: "0 0 8px" }}>
            El SAT pide que autorices al proveedor de certificación a timbrar tus facturas. La firmas tú con tu e.firma (la FIEL,
            no el CSD).
          </p>
          <div style={{ border: "1px solid var(--sand)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "8px 12px", fontSize: 12, background: "var(--cream, #f6f1e7)", borderBottom: "1px solid var(--sand)" }}>
              🔒 <b>Esta es una página de Facturapi</b> (facturapi.io), nuestro proveedor autorizado de certificación. Tu e.firma
              va de tu navegador directo a Facturapi: Caminante no la recibe ni la guarda.
            </div>
            <iframe
              src={MANIFIESTO_URL}
              title="Firma de la carta manifiesto · Facturapi"
              style={{ width: "100%", height: 640, border: 0, display: "block", background: "#fff" }}
              referrerPolicy="no-referrer"
            />
          </div>
          <button type="button" className="btn btn-sm" style={{ marginTop: 10 }} disabled={ocupado !== ""} onClick={() => void correr("manifiesto", () => verificarManifiestoAction(operatorId))}>
            {ocupado === "manifiesto" ? "Preguntando a Facturapi…" : "Ya la firmé: verificar"}
          </button>
        </div>
      ) : (
        <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>
          Todavía no la firma.{" "}
          <button type="button" className="btn btn-sm" disabled={ocupado !== ""} onClick={() => void correr("manifiesto", () => verificarManifiestoAction(operatorId))}>
            {ocupado === "manifiesto" ? "Preguntando…" : "Verificar con Facturapi"}
          </button>
        </p>
      )}

      <p style={{ margin: "18px 0 0" }}>
        <button type="button" className="btn btn-sm" onClick={desactivar} disabled={ocupado !== ""}>
          {ocupado === "desactivar" ? "Desactivando…" : "Desactivar facturación y dar de baja el certificado"}
        </button>
      </p>
      {Aviso}
    </div>
  );
}
