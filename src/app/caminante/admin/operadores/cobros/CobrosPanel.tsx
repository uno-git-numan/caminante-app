"use client";

// Los pasos del onboarding de Connect para UN operador, con su semáforo arriba.
// El orden es el del plan: conectar Stripe → subir su CSD → datos fiscales.

import { useState } from "react";
import { pedirLinkStripe, refrescarConexion, guardarFiscales, guardarCsd } from "@/lib/payments/connect-actions";

export type OperadorCobros = {
  id: string;
  nombre: string;
  email: string;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardedAt: string | null;
  pendientes: string[];
  commissionPct: number | null;
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  cpFiscal: string;
  tipoPersona: string;
  csdCerPath: string | null;
  csdKeyPath: string | null;
  csdVenceAt: string | null;
};

export default function CobrosPanel({
  operador: o,
  faltantes,
}: {
  operador: OperadorCobros;
  faltantes: string[];
}) {
  const [ocupado, setOcupado] = useState("");
  const [estado, setEstado] = useState("");

  const [rfc, setRfc] = useState(o.rfc);
  const [razonSocial, setRazonSocial] = useState(o.razonSocial);
  const [regimenFiscal, setRegimenFiscal] = useState(o.regimenFiscal);
  const [cpFiscal, setCpFiscal] = useState(o.cpFiscal);
  const [tipoPersona, setTipoPersona] = useState(o.tipoPersona);
  const [vence, setVence] = useState(o.csdVenceAt ?? "");

  async function conectar() {
    setOcupado("stripe");
    setEstado("");
    const r = await pedirLinkStripe(o.id, window.location.origin);
    if (!r.ok) {
      setOcupado("");
      setEstado(`Error: ${r.error}`);
      return;
    }
    // Se navega de inmediato: el link caduca y es de un solo uso.
    window.location.href = r.url;
  }

  async function refrescar() {
    setOcupado("refrescar");
    setEstado("");
    const r = await refrescarConexion(o.id);
    setOcupado("");
    setEstado(r.ok ? "✓ Estado actualizado desde Stripe" : `Error: ${r.error}`);
    if (r.ok) window.location.reload();
  }

  // Sube los dos archivos por la ruta gateada y guarda las DOS rutas juntas.
  // Si el .key falla después de que el .cer subió, no se escribe nada: mejor
  // repetir la subida que dejar medio expediente en la base.
  async function subirCsd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const cer = (form.elements.namedItem("cer") as HTMLInputElement).files?.[0];
    const key = (form.elements.namedItem("key") as HTMLInputElement).files?.[0];
    if (!cer || !key) {
      setEstado("Error: hacen falta los dos archivos, el .cer y el .key.");
      return;
    }
    setOcupado("csd");
    setEstado("");
    try {
      const rutas: string[] = [];
      for (const f of [cer, key]) {
        const fd = new FormData();
        fd.set("file", f);
        fd.set("operadorId", o.id);
        const res = await fetch("/caminante/api/admin/csd", { method: "POST", body: fd });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "No se pudo subir.");
        rutas.push(j.path as string);
      }
      const fd = new FormData();
      fd.set("id", o.id);
      fd.set("cerPath", rutas[0]);
      fd.set("keyPath", rutas[1]);
      fd.set("vence", vence);
      const r = await guardarCsd(fd);
      setOcupado("");
      setEstado(r.ok ? "✓ CSD guardado" : `Error: ${r.error}`);
      if (r.ok) window.location.reload();
    } catch (err) {
      setOcupado("");
      setEstado(`Error: ${(err as Error).message}`);
    }
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setOcupado("fiscales");
    setEstado("");
    const fd = new FormData();
    fd.set("id", o.id);
    fd.set("rfc", rfc);
    fd.set("razonSocial", razonSocial);
    fd.set("regimenFiscal", regimenFiscal);
    fd.set("cpFiscal", cpFiscal);
    fd.set("tipoPersona", tipoPersona);
    const r = await guardarFiscales(fd);
    setOcupado("");
    setEstado(r.ok ? "✓ Guardado" : `Error: ${r.error}`);
  }

  const listo = faltantes.length === 0 && Boolean(o.stripeAccountId);

  return (
    <div className="card pad" style={{ marginBottom: 24 }}>
      <span className="subtitle" style={{ margin: 0 }}>
        Cobros · {o.nombre}
      </span>

      {/* Semáforo. Un número que no lleva a ningún lado no sirve: aquí cada
          faltante dice qué hacer y en qué paso. */}
      {listo ? (
        <p className="mut" style={{ fontSize: 13, margin: "8px 0 0", color: "var(--forest)" }}>
          <b>Listo para vender a su nombre.</b> Sus cobros entran a su cuenta de Stripe y Numan
          retiene {o.commissionPct}% como comisión.
        </p>
      ) : !o.stripeAccountId ? (
        <p className="mut" style={{ fontSize: 12.5, margin: "8px 0 0" }}>
          Todavía no está en Connect. Sus ventas cobran por el camino de siempre (el dinero entra a
          NUMAN HUB y se le transfiere a mano) — que es exactamente lo que pasa hoy.
        </p>
      ) : (
        <div style={{ margin: "10px 0 0" }}>
          <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>
            <b>Todavía no puede vender a su nombre.</b> Falta:
          </p>
          <ul style={{ fontSize: 12.5, margin: "6px 0 0", paddingLeft: 18 }}>
            {faltantes.map((f) => (
              <li key={f} style={{ marginBottom: 4 }}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Paso 1 · Conecta tu cuenta ─────────────────────────────── */}
      <h3 style={{ fontSize: 14, margin: "22px 0 6px" }}>1 · Conecta su cuenta de Stripe</h3>
      {!o.stripeAccountId ? (
        <>
          <p className="mut" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
            Crea su cuenta y lo manda al flujo de Stripe: identificación, RFC y CLABE. Los datos de
            verificación los captura él directo en Stripe — nosotros no los vemos ni los guardamos.
          </p>
          <button
            type="button"
            className="btn btn-orange btn-sm"
            onClick={conectar}
            disabled={ocupado !== "" || !o.email}
          >
            {ocupado === "stripe" ? "Abriendo Stripe…" : "Conectar Stripe"}
          </button>
          {!o.email ? (
            <p className="mut" style={{ fontSize: 12, margin: "6px 0 0" }}>
              Necesita un correo antes de conectar. Se captura en su perfil.
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="mut" style={{ fontSize: 12.5, margin: "0 0 8px" }}>
            Cuenta <code>{o.stripeAccountId}</code> ·{" "}
            {o.chargesEnabled ? "cobra ✓" : "todavía no puede cobrar"} ·{" "}
            {o.payoutsEnabled ? "recibe depósitos ✓" : "todavía no recibe depósitos"}
            {o.onboardedAt ? ` · listo desde ${o.onboardedAt.slice(0, 10)}` : ""}
          </p>
          {o.pendientes.length > 0 ? (
            <div style={{ margin: "0 0 10px" }}>
              <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>
                Lo que Stripe todavía le pide (tal cual lo nombra Stripe):
              </p>
              <ul style={{ fontSize: 12, margin: "4px 0 0", paddingLeft: 18 }}>
                {o.pendientes.map((p) => (
                  <li key={p}><code>{p}</code></li>
                ))}
              </ul>
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-sm" onClick={conectar} disabled={ocupado !== ""}>
              {ocupado === "stripe" ? "Abriendo Stripe…" : "Continuar en Stripe"}
            </button>
            <button type="button" className="btn btn-sm" onClick={refrescar} disabled={ocupado !== ""}>
              {ocupado === "refrescar" ? "Preguntando…" : "Refrescar estado"}
            </button>
          </div>
        </>
      )}

      {/* ── Paso 2 · CSD ───────────────────────────────────────────── */}
      <h3 style={{ fontSize: 14, margin: "22px 0 6px" }}>2 · Sube su CSD</h3>
      <p className="mut" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
        Los <b>dos</b> archivos que le dio el SAT: el <code>.cer</code> y el <code>.key</code>. Van a
        un bucket privado y solo se ven por liga firmada de 5 minutos.{" "}
        <b>Su contraseña no se pide aquí y no se guarda en nuestra base</b> — va directo a Facturapi
        al crear su organización.
      </p>
      {o.csdCerPath && o.csdKeyPath ? (
        <p className="mut" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
          CSD cargado{o.csdVenceAt ? `, vigente hasta ${o.csdVenceAt}` : ""}. Subir otro lo
          reemplaza.
        </p>
      ) : null}
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
            Vigente hasta
            <input type="date" value={vence} onChange={(ev) => setVence(ev.target.value)} />
          </label>
        </div>
        <button type="submit" className="btn btn-sm" style={{ marginTop: 10 }} disabled={ocupado !== ""}>
          {ocupado === "csd" ? "Subiendo…" : "Subir CSD"}
        </button>
      </form>

      {/* ── Paso 3 · Datos fiscales ────────────────────────────────── */}
      <h3 style={{ fontSize: 14, margin: "22px 0 6px" }}>3 · Sus datos fiscales</h3>
      <p className="mut" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
        Son los del <b>emisor</b> del CFDI que recibirá su cliente. También se editan desde su
        convenio: es el mismo dato, no dos.
      </p>
      <form onSubmit={guardar}>
        <div className="mini-form" style={{ alignItems: "start" }}>
          <label>
            RFC
            <input value={rfc} onChange={(e) => setRfc(e.target.value)} maxLength={13} placeholder="XAXX010101000" />
          </label>
          <label>
            Razón social
            <input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} maxLength={200} />
          </label>
          <label>
            Régimen fiscal (clave SAT)
            <input value={regimenFiscal} onChange={(e) => setRegimenFiscal(e.target.value)} maxLength={3} placeholder="601" />
          </label>
          <label>
            C.P. fiscal
            <input value={cpFiscal} onChange={(e) => setCpFiscal(e.target.value)} maxLength={5} placeholder="56760" />
          </label>
          <label>
            Persona
            <select value={tipoPersona} onChange={(e) => setTipoPersona(e.target.value)}>
              <option value="">Sin definir</option>
              <option value="fisica">Física</option>
              <option value="moral">Moral</option>
            </select>
          </label>
        </div>
        <button type="submit" className="btn btn-orange btn-sm" style={{ marginTop: 10 }} disabled={ocupado !== ""}>
          {ocupado === "fiscales" ? "Guardando…" : "Guardar datos fiscales"}
        </button>
      </form>

      {estado ? (
        <p className="mut" style={{ fontSize: 12.5, margin: "10px 0 0" }}>{estado}</p>
      ) : null}
    </div>
  );
}
