"use client";

// Los pasos del onboarding de Connect para UN operador, con su semáforo arriba.
// El orden es el del plan: conectar Stripe → CSD (llega con A3) → datos fiscales.

import { useState } from "react";
import { pedirLinkStripe, refrescarConexion, guardarFiscales } from "@/lib/payments/connect-actions";

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
  rfcConvenio: string;
  razonSocialConvenio: string;
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

  // Pre-llenado: si la columna plana está vacía pero el convenio ya tiene el
  // dato, se muestra el del convenio para que se guarde con un clic en vez de
  // volver a teclearlo.
  const [rfc, setRfc] = useState(o.rfc || o.rfcConvenio);
  const [razonSocial, setRazonSocial] = useState(o.razonSocial || o.razonSocialConvenio);
  const [regimenFiscal, setRegimenFiscal] = useState(o.regimenFiscal);
  const [cpFiscal, setCpFiscal] = useState(o.cpFiscal);
  const [tipoPersona, setTipoPersona] = useState(o.tipoPersona);

  const heredado =
    (!o.rfc && !!o.rfcConvenio) || (!o.razonSocial && !!o.razonSocialConvenio);

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
      <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>
        Pendiente: llega con la facturación multi-emisor. El SAT entrega <b>dos</b> archivos
        (<code>.cer</code> y <code>.key</code>) y hoy el expediente guarda una sola ruta; se resuelve
        con una migración chica antes de conectarlo a Facturapi. La contraseña del CSD no se
        guardará nunca en nuestra base: va directo a Facturapi al crear su organización.
      </p>

      {/* ── Paso 3 · Datos fiscales ────────────────────────────────── */}
      <h3 style={{ fontSize: 14, margin: "22px 0 6px" }}>3 · Sus datos fiscales</h3>
      <p className="mut" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
        Son los del <b>emisor</b> del CFDI que recibirá su cliente.
        {heredado ? " Pre-llenados desde el convenio: revísalos y guarda." : ""}
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
