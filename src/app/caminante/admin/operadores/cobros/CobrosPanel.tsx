"use client";

// Los pasos del onboarding de Connect para UN operador, con su semáforo arriba.
// El orden (9 nov 2026): sus datos fiscales —que salen solos de su constancia—
// y la cuenta de cobro, que es lo que hace falta para cobrar · y aparte,
// opcional, el CSD para facturarle a su cliente desde aquí.

import { useState } from "react";
import { pedirLinkStripe, refrescarConexion, elegirRegimen, releerConstancia, guardarCsd } from "@/lib/payments/connect-actions";
import { REGIMENES } from "@/lib/facturacion/catalogos";

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
  csdCerPath: string | null;
  csdKeyPath: string | null;
  csdVenceAt: string | null;
};

export default function CobrosPanel({
  operador: o,
  faltantes,
  altaEnPlataforma,
  sinEnlaceExterno = false,
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
}) {
  const [ocupado, setOcupado] = useState("");
  const [estado, setEstado] = useState("");

  // La contraseña del CSD viaja a Facturapi en la misma llamada; aquí no se guarda.
  const [passCsd, setPassCsd] = useState("");

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
      fd.set("password", passCsd);
      const r = await guardarCsd(fd);
      setPassCsd("");
      setOcupado("");
      setEstado(r.ok ? "✓ CSD guardado" : `Error: ${r.error}`);
      if (r.ok) window.location.reload();
    } catch (err) {
      setOcupado("");
      setEstado(`Error: ${(err as Error).message}`);
    }
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
      {/* ── B · CSD ─────────────────────────────────────────────────── */}
      <h3 style={{ fontSize: 14, margin: "18px 0 6px" }}>Su CSD (para timbrar)</h3>
      <p className="mut" style={{ fontSize: 12.5, margin: "0 0 10px" }}>
        Los <b>dos</b> archivos que le dio el SAT: el <code>.cer</code> y el <code>.key</code>. Van a
        un bucket privado y solo se ven por liga firmada de 5 minutos. La vigencia y el RFC los
        leemos del propio <code>.cer</code>. <b>Su contraseña no se guarda en nuestra base</b>: va
        directo a Facturapi al crear su organización.
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
            Contraseña del CSD
            <input type="password" value={passCsd} onChange={(ev) => setPassCsd(ev.target.value)} autoComplete="off" placeholder="La del .key" />
          </label>
        </div>
        <p className="mut" style={{ fontSize: 12, margin: "6px 0 0" }}>
          La contraseña va directo al PAC (Facturapi) para activar su sello; Caminante no la guarda.
        </p>
        <button type="submit" className="btn btn-sm" style={{ marginTop: 10 }} disabled={ocupado !== ""}>
          {ocupado === "csd" ? "Subiendo…" : "Subir CSD"}
        </button>
      </form>

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
