"use client";

// Formulario del onboarding de operador — un solo form por secciones con
// PREVIEW EN VIVO de la marca (mini hero + botón + card pintados con los
// colores elegidos, sin recargar). El submit es la server action
// onboardOperator (redirect ?ok=<slug> / ?error=).
import { useRef, useState } from "react";
import { onboardOperator } from "@/lib/operators/onboarding-actions";

export type ExpOpcion = { id: string; slug: string; titulo: string; status: string; operatorId: string | null };
export type OperadorPrefill = {
  id: string; nombre: string; email: string; slug: string; instagram: string;
  logoUrl: string; logoDarkUrl: string; primary: string; accent: string; poweredBy: "discreto" | "visible";
  razonSocial: string; rfc: string; domicilio: string; responsable: string; trato: string;
};

const slugify = (s: string): string =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function OnboardingForm({ experiencias, prefill }: { experiencias: ExpOpcion[]; prefill: OperadorPrefill | null }) {
  const [nombre, setNombre] = useState(prefill?.nombre ?? "");
  const [slug, setSlug] = useState(prefill?.slug ?? "");
  const slugTocado = useRef(!!prefill?.slug);
  const [logoUrl, setLogoUrl] = useState(prefill?.logoUrl ?? "");
  const [primary, setPrimary] = useState(prefill?.primary ?? "#20211c");
  const [accent, setAccent] = useState(prefill?.accent ?? "#ff5d36");
  const [subiendo, setSubiendo] = useState(false);
  const [sending, setSending] = useState(false);

  async function subirLogo(file: File) {
    setSubiendo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/caminante/api/admin/upload", { method: "POST", body: fd });
      const j = (await r.json()) as { url?: string; error?: string };
      if (j.url) setLogoUrl(j.url);
      else alert(j.error || "No se pudo subir el logo.");
    } catch {
      alert("No se pudo subir el logo.");
    } finally {
      setSubiendo(false);
    }
  }

  // Preview: las MISMAS vars de la casa, sobreescritas inline — lo que ves es
  // exactamente lo que themeCssFor() emitirá en el portal.
  const previewVars = {
    "--olive": primary,
    "--orange": accent,
    "--cream": "#fbfbf7",
    "--charcoal": "#20211c",
  } as React.CSSProperties;

  return (
    <form action={onboardOperator} onSubmit={() => setSending(true)}>
      {prefill ? <input type="hidden" name="opId" value={prefill.id} /> : null}

      {/* ── 1 · Identidad ── */}
      <div className="card pad" style={{ marginBottom: 16 }}>
        <span className="subtitle">1 · Identidad</span>
        <div className="mini-form" style={{ gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 220px", fontSize: 12, fontWeight: 600 }}>
            Nombre del operador
            <input
              name="nombre" required value={nombre} placeholder="Kéntro"
              onChange={(e) => {
                setNombre(e.target.value);
                if (!slugTocado.current) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 220px", fontSize: 12, fontWeight: 600 }}>
            Correo
            <input name="email" type="email" required defaultValue={prefill?.email ?? ""} placeholder="hola@operador.com" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 180px", fontSize: 12, fontWeight: 600 }}>
            Slug (su URL: /caminante/o/…)
            <input
              name="slug" required value={slug}
              onChange={(e) => { slugTocado.current = true; setSlug(slugify(e.target.value)); }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 180px", fontSize: 12, fontWeight: 600 }}>
            Instagram (opcional)
            <input name="instagram" defaultValue={prefill?.instagram ?? ""} placeholder="@operador" />
          </label>
        </div>
      </div>

      {/* ── 2 · Marca (con preview en vivo) ── */}
      <div className="card pad" style={{ marginBottom: 16 }}>
        <span className="subtitle">2 · Marca</span>
        <div className="mini-form" style={{ gap: 12, alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 320px", fontSize: 12, fontWeight: 600 }}>
            Logo (URL del bucket, o súbelo)
            <input name="logoUrl" required value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…/logo.png" />
          </label>
          <label className="btn btn-glass btn-sm" style={{ cursor: "pointer" }}>
            {subiendo ? "Subiendo…" : "Subir logo"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && subirLogo(e.target.files[0])} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 320px", fontSize: 12, fontWeight: 600 }}>
            Logo para fondo oscuro (opcional)
            <input name="logoDarkUrl" defaultValue={prefill?.logoDarkUrl ?? ""} placeholder="https://…/logo-blanco.png" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
            Color primario
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} style={{ width: 44, height: 34, padding: 2, border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }} />
              <input name="primary" required value={primary} onChange={(e) => setPrimary(e.target.value)} style={{ width: 96, fontFamily: "var(--mono)" }} />
            </span>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
            Color de acento
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} style={{ width: 44, height: 34, padding: 2, border: "1px solid var(--line)", borderRadius: 8, background: "#fff" }} />
              <input name="accent" required value={accent} onChange={(e) => setAccent(e.target.value)} style={{ width: 96, fontFamily: "var(--mono)" }} />
            </span>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 600 }}>
            Powered by
            <select name="poweredBy" defaultValue={prefill?.poweredBy ?? "discreto"}>
              <option value="discreto">Discreto (pie, mono 11px)</option>
              <option value="visible">Visible</option>
            </select>
          </label>
        </div>

        <div style={{ marginTop: 16, border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", ...previewVars }}>
          <div style={{ background: "var(--charcoal)", padding: "26px 24px", display: "flex", alignItems: "center", gap: 18 }}>
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt="" style={{ height: 26, width: "auto", filter: "brightness(0) invert(1)" }} />
            ) : (
              <span style={{ color: "#fff", fontWeight: 300, letterSpacing: ".14em" }}>LOGO</span>
            )}
            <span style={{ color: "#fff", fontWeight: 200, fontSize: 22 }}>
              Así se ve su hero. <em style={{ color: "var(--orange)", fontStyle: "italic" }}>Con su acento.</em>
            </span>
          </div>
          <div style={{ background: "var(--cream)", padding: "18px 24px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", padding: "10px 22px", borderRadius: 999, background: "var(--orange)", color: "#fff", fontSize: 14, fontWeight: 500 }}>
              Reservar
            </span>
            <span style={{ display: "inline-flex", padding: "10px 22px", borderRadius: 999, border: "1px solid var(--olive)", color: "var(--olive)", fontSize: 14, fontWeight: 500 }}>
              Botón secundario
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--olive)" }}>
              // eyebrow del operador
            </span>
          </div>
        </div>
      </div>

      {/* ── 3 · Legal del deslinde ── */}
      <div className="card pad" style={{ marginBottom: 16 }}>
        <span className="subtitle">3 · Entidad legal (el deslinde de sus viajes va a SU nombre)</span>
        <div className="mini-form" style={{ gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 280px", fontSize: 12, fontWeight: 600 }}>
            Razón social
            <input name="razonSocial" defaultValue={prefill?.razonSocial ?? ""} placeholder="Operador, S.A. de C.V." />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "0 1 180px", fontSize: 12, fontWeight: 600 }}>
            RFC
            <input name="rfc" defaultValue={prefill?.rfc ?? ""} placeholder="XXX000000XX0" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 340px", fontSize: 12, fontWeight: 600 }}>
            Domicilio
            <input name="domicilio" defaultValue={prefill?.domicilio ?? ""} placeholder="Calle, colonia, municipio, C.P." />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 240px", fontSize: 12, fontWeight: 600 }}>
            Responsable (opcional)
            <input name="responsable" defaultValue={prefill?.responsable ?? ""} placeholder="Nombre del responsable" />
          </label>
        </div>
        <p className="mut" style={{ fontSize: 12.5, marginTop: 10 }}>
          NUMAN aparece como comercializador/plataforma; el operador asume la responsabilidad operativa (convenio con cláusula de indemnización).
        </p>
      </div>

      {/* ── 4 · Trato ── */}
      <div className="card pad" style={{ marginBottom: 16 }}>
        <span className="subtitle">4 · Trato (va a las notas del operador)</span>
        <input
          name="trato"
          defaultValue={prefill?.trato ?? ""}
          placeholder="p. ej. Operador white-label · comisión de plataforma 12% · convenio firmado …"
          style={{ width: "100%", fontSize: 13.5, padding: "11px 13px", border: "1px solid var(--line)", borderRadius: 10, background: "#fff" }}
        />
      </div>

      {/* ── 5 · Sus experiencias ── */}
      <div className="card pad" style={{ marginBottom: 20 }}>
        <span className="subtitle">5 · Experiencias que le pertenecen (atribución de ventas + portal)</span>
        <div style={{ display: "grid", gap: 8 }}>
          {experiencias.map((e) => (
            <label key={e.id} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: 14, cursor: "pointer" }}>
              <input type="checkbox" name="experiencias" value={e.id} defaultChecked={!!prefill && e.operatorId === prefill.id} />
              <span style={{ fontWeight: 500 }}>{e.titulo}</span>
              <span className="mut" style={{ fontSize: 12 }}>
                {e.slug} · {e.status === "published" ? "publicada" : "borrador"}
              </span>
            </label>
          ))}
        </div>
        <p className="mut" style={{ fontSize: 12.5, marginTop: 10 }}>
          Solo las marcadas se le atribuyen; las demás no se tocan. Sus ventas futuras quedan a su nombre (comisión congelada por venta).
        </p>
      </div>

      <button type="submit" className="btn btn-orange" disabled={sending || subiendo}>
        {sending ? "Guardando…" : "Guardar operador y ver su portal"}
      </button>
    </form>
  );
}
