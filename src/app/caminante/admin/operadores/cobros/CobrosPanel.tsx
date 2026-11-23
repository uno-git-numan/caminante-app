"use client";

// Los pasos del onboarding de Connect para UN operador, con su semáforo arriba.
// El orden (9 nov 2026): sus datos fiscales —que salen solos de su constancia—
// y la cuenta de cobro, que es lo que hace falta para cobrar · y aparte,
// opcional, la facturación desde el portal (FacturacionPortal, D20), que la
// página pasa armada en `facturacion`.

import { useState } from "react";
import { pedirLinkStripe, refrescarConexion, elegirRegimen, releerConstancia, guardarClabeAction } from "@/lib/payments/connect-actions";
import type { FiscalPrivadoPanel } from "@/lib/operadores/fiscal-privado";
import { REGIMENES } from "@/lib/facturacion/catalogos";
import { FRASE_TARIFA, TASA_PCT } from "@/lib/operadores/comision";

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
  /**
   * Lo que dice su constancia fiscal (constancia-fiscal.ts). `regimenes` son
   * los de negocio que trae: si son varios, la pantalla ofrece SÓLO ésos.
   */
  constancia: { subida: boolean; ok: boolean; porque: string | null; regimenes: string[] };
  /**
   * CURP, domicilio y CLABE para la informativa del SAT (0081). Nunca llegan
   * completos: sólo si están y la CLABE enmascarada.
   */
  privado?: FiscalPrivadoPanel | null;
};

export default function CobrosPanel({
  operador: o,
  faltantes,
  altaEnPlataforma,
  sinEnlaceExterno = false,
  facturacion,
}: {
  operador: OperadorCobros;
  faltantes: string[];
  /**
   * El alta de la cuenta DENTRO de la plataforma (mi-alta/cobrar/AltaCobro).
   * Cuando viene, sustituye al botón que manda al enlace de verificación: la
   * operadora captura aquí y no sale. Lo decide la página por cuenta y por
   * bandera (alta-cobro.ts); este panel sólo pinta lo que le den.
   */
  altaEnPlataforma?: React.ReactNode;
  /**
   * La operadora mirando lo suyo: NO se le ofrece el enlace de Stripe (Luis,
   * 11 nov 2026). `pedirLinkStripe` también se lo niega en el servidor.
   */
  sinEnlaceExterno?: boolean;
  /**
   * La facturación desde el portal (mi-alta/cobrar/FacturacionPortal, D20):
   * activar, CSD y carta manifiesto. La arma la página, que sabe quién mira.
   */
  facturacion?: React.ReactNode;
}) {
  const [ocupado, setOcupado] = useState("");
  const [estado, setEstado] = useState("");

  const [clabe, setClabe] = useState("");
  const [banco, setBanco] = useState("");
  const [pideBanco, setPideBanco] = useState(false);

  async function guardarLaClabe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOcupado("clabe");
    setEstado("");
    const r = await guardarClabeAction(o.id, clabe, pideBanco ? banco : null);
    setOcupado("");
    if (r.ok) {
      setEstado(`✓ CLABE guardada (${r.banco})`);
      window.location.reload();
    } else {
      setPideBanco(Boolean(r.pideBanco));
      setEstado(`Error: ${r.error}`);
    }
  }

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
    setEstado(r.ok ? "✓ Estado actualizado" : `Error: ${r.error}`);
    if (r.ok) window.location.reload();
  }

  async function regimen(clave: string) {
    setOcupado("regimen");
    setEstado("");
    const r = await elegirRegimen(o.id, clave);
    setOcupado("");
    setEstado(r.ok ? "✓ Régimen elegido" : `Error: ${r.error}`);
  }

  async function releer() {
    setOcupado("releer");
    setEstado("");
    const r = await releerConstancia(o.id);
    setOcupado("");
    setEstado(r.ok ? "✓ Constancia leída otra vez" : `Error: ${r.error}`);
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
          <b>Listo para vender a su nombre.</b> Sus cobros entran a su cuenta de cobro y Numan
          retiene {o.commissionPct != null ? `${o.commissionPct}%` : `${TASA_PCT.plataforma} % o ${TASA_PCT.venta} % (según quién traiga al cliente)`} como comisión.
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

      {/* ── Datos fiscales: salen de la constancia (Luis, 9 nov 2026) ── */}
      {/* «Que salgan de la constancia y no pidamos.» NUMAN le factura su
          comisión con ellos, así que sí detienen el cobro; pero nadie los
          teclea: los escribe la lectura de la constancia cuando el SAT la
          confirma. Aquí sólo se enseñan, y quedan dos botones para lo que una
          persona todavía puede tener que hacer. */}
      <h3 style={{ fontSize: 14, margin: "22px 0 6px" }}>Sus datos fiscales</h3>
      {o.rfc && o.regimenFiscal ? (
        <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>
          {o.razonSocial} · RFC {o.rfc} · régimen {etiquetaRegimen(o.regimenFiscal)} · C.P. {o.cpFiscal}.{" "}
          Salen de su constancia fiscal confirmada con el SAT.
        </p>
      ) : o.rfc && o.constancia.ok && o.constancia.regimenes.length > 1 ? (
        <>
          <p className="mut" style={{ fontSize: 12.5, margin: "0 0 8px" }}>
            {o.razonSocial} · RFC {o.rfc}. Su constancia trae más de un régimen de negocio: ¿con cuál
            le facturamos la comisión?
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {o.constancia.regimenes.map((c) => (
              <button key={c} type="button" className="btn btn-sm" onClick={() => regimen(c)} disabled={ocupado !== ""}>
                {etiquetaRegimen(c)}
              </button>
            ))}
          </div>
        </>
      ) : !o.constancia.subida ? (
        <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>
          Salen solos de su Constancia de Situación Fiscal: súbela en el{" "}
          <a href={`/caminante/admin/mi-alta/expediente?operadora=${encodeURIComponent(o.id)}`}>expediente</a> y aquí aparecen en un minuto.
        </p>
      ) : (
        <>
          <p className="mut" style={{ fontSize: 12.5, margin: "0 0 8px" }}>
            Su constancia está subida pero todavía no da sus datos: {o.constancia.porque ?? "falta leerla."}
          </p>
          <button type="button" className="btn btn-sm" onClick={releer} disabled={ocupado !== ""}>
            {ocupado === "releer" ? "Leyendo…" : "Volver a leer la constancia"}
          </button>
        </>
      )}

      {/* ── Para el SAT: CURP, domicilio y CLABE (0081) ────────────────
          La informativa mensual de plataformas los pide (LIVA 18-J III). CURP
          y domicilio salen de la constancia; la CLABE se captura una vez y el
          banco sale de ella. */}
      {o.rfc ? (
        <div style={{ margin: "10px 0 0" }}>
          <p className="mut" style={{ fontSize: 12.5, margin: "0 0 6px" }}>
            {o.tipoPersona === "fisica" ? (
              <>CURP: {o.privado?.curp ? "✓ de su constancia" : "pendiente (sale de su constancia)"} · </>
            ) : null}
            Domicilio fiscal: {o.privado?.domicilio ?? "pendiente (sale de su constancia)"}
          </p>
          {o.privado?.clabe ? (
            <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>
              CLABE para sus depósitos: {o.privado.clabe} · {o.privado.banco}
            </p>
          ) : (
            <form onSubmit={guardarLaClabe} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <label className="mut" style={{ fontSize: 12.5 }}>
                CLABE donde recibe sus depósitos{" "}
                <input
                  value={clabe}
                  onChange={(e) => setClabe(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="18 dígitos"
                  style={{ width: 190 }}
                />
              </label>
              {pideBanco ? (
                <label className="mut" style={{ fontSize: 12.5 }}>
                  Banco <input value={banco} onChange={(e) => setBanco(e.target.value)} style={{ width: 160 }} />
                </label>
              ) : null}
              <button type="submit" className="btn btn-sm" disabled={ocupado !== "" || clabe.replace(/\D/g, "").length !== 18}>
                {ocupado === "clabe" ? "Guardando…" : "Guardar CLABE"}
              </button>
            </form>
          )}
          {o.tipoPersona === "fisica" && o.regimenFiscal === "626" ? (
            <p className="mut" style={{ fontSize: 12, margin: "6px 0 0" }}>
              Está en RESICO: Caminante le retiene ISR e IVA por cada venta. Que lo revise con su contador.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── Paso 1 · Conecta tu cuenta ─────────────────────────────── */}
      <h3 style={{ fontSize: 14, margin: "22px 0 6px" }}>1 · Conecta su cuenta de cobro</h3>
      {altaEnPlataforma ? (
        altaEnPlataforma
      ) : sinEnlaceExterno && !o.chargesEnabled ? (
        <p className="mut" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
          Tu cuenta de cobro la preparamos nosotros. Cuando necesitemos un dato tuyo (identificación,
          CLABE) te lo pedimos aquí mismo; no tienes que entrar a ningún otro sitio.
        </p>
      ) : !o.stripeAccountId ? (
        <>
          <p className="mut" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
            Crea su cuenta de cobro y lo lleva a verificarla: identificación, RFC y CLABE. Esos datos
            van directo a verificación — nosotros no los vemos ni los guardamos.
          </p>
          <button
            type="button"
            className="btn btn-orange btn-sm"
            onClick={conectar}
            disabled={ocupado !== "" || !o.email}
          >
            {ocupado === "stripe" ? "Abriendo…" : "Conectar la cuenta de cobro"}
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
                Lo que todavía falta para verificar la cuenta:
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
              {ocupado === "stripe" ? "Abriendo…" : "Continuar la verificación"}
            </button>
            <button type="button" className="btn btn-sm" onClick={refrescar} disabled={ocupado !== ""}>
              {ocupado === "refrescar" ? "Preguntando…" : "Refrescar estado"}
            </button>
          </div>
        </>
      )}

      {/* ── Facturación: opcional, después (Luis, 9 nov 2026) ──────── */}
      {/* «Facilitemos todo para poder cobrar lo antes posible… y si quieren
          facturación, que se prenda en un paso posterior, pero no sea un
          cuello para empezar a cobrar.» Hasta hoy eran los pasos 2 y 3 y los
          dos detenían la venta. Ahora no detienen nada: si no se prende, la
          operadora le factura a su cliente por fuera, como siempre. */}
      <h3 id="facturacion" style={{ fontSize: 15, margin: "30px 0 4px", paddingTop: 14, borderTop: "1px solid var(--sand)" }}>
        2 · Facturación desde Caminante <span className="mut" style={{ fontWeight: 400, fontSize: 12.5 }}>· opcional, cuando quieras</span>
      </h3>
      <p className="mut" style={{ fontSize: 12.5, margin: "0 0 4px" }}>
        No hace falta para cobrar. Si la prendes, timbramos a tu nombre las facturas de tus viajeros y el
        comprobante de cada pago. Si no, facturas por tu cuenta como siempre.
      </p>
      {facturacion ?? (
        <p className="mut" style={{ fontSize: 12.5, margin: 0 }}>Se activa desde el panel de la operadora.</p>
      )}

      {estado ? (
        <p className="mut" style={{ fontSize: 12.5, margin: "10px 0 0" }}>{estado}</p>
      ) : null}
    </div>
  );
}

/** «612 · Personas físicas con actividades…» desde la clave; si no está en el catálogo, la clave sola. */
function etiquetaRegimen(clave: string): string {
  return REGIMENES.find((r) => r.clave === clave)?.label ?? clave;
}
