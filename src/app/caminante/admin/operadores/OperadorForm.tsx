"use client";

// Editor del perfil público del operador (patrón del dashboard .adm). Fotos vía
// /caminante/api/admin/upload con compresión en el navegador. Cada foto se puede
// AJUSTAR (arrastrar + zoom) — el encuadre se guarda como {zoom,x,y} y se aplica
// igual aquí y en la página pública (adjustStyle). Equipo = repetidor.
import { useRef, useState } from "react";
import { saveOperatorProfile, setOperatorPublic } from "@/lib/operators/admin-actions";
import type { TeamMember, PhotoAdjust } from "@/lib/operators/public";
import { adjustStyle } from "@/lib/operators/photo-style";

type Operador = {
  id: string;
  name: string;
  slug: string;
  bio: string;
  photoUrl: string;
  photoAdjust: PhotoAdjust | null;
  heroPhotoUrl: string;
  heroAdjust: PhotoAdjust | null;
  instagram: string;
  team: TeamMember[];
  isPublic: boolean;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

async function comprimir(file: File, maxLado = 1800, calidad = 0.82): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const esc = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * esc));
    const h = Math.max(1, Math.round(bmp.height * esc));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/jpeg", calidad));
    return blob ?? file;
  } catch {
    return file;
  }
}

async function subir(file: File): Promise<string> {
  const cuerpo = await comprimir(file);
  const fd = new FormData();
  fd.append("file", cuerpo, file.name.replace(/\.[^.]+$/, "") + ".jpg");
  const res = await fetch("/caminante/api/admin/upload", { method: "POST", body: fd });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j?.url) throw new Error(j?.error || `Subida falló (HTTP ${res.status})`);
  return j.url as string;
}

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: 12, border: "1px solid rgba(32,33,28,.18)",
  background: "#fff", fontSize: 14, fontFamily: "inherit",
};
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "#637154", display: "block", marginBottom: 6 };

// Foto con AJUSTE (arrastrar para reposicionar + slider de zoom). shape define el
// recorte del preview: "circle" (avatar/equipo) o "rect" (hero, horizontal).
function FotoAjustable({
  url, adjust, onUrl, onAdjust, label, hint, shape = "circle",
}: {
  url: string;
  adjust: PhotoAdjust | null;
  onUrl: (u: string) => void;
  onAdjust: (a: PhotoAdjust | null) => void;
  label: string;
  hint?: string;
  shape?: "circle" | "rect";
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; w: number; h: number } | null>(null);
  const a: PhotoAdjust = adjust ?? { zoom: 1, x: 0, y: 0 };
  const box = shape === "rect" ? { w: 300, h: 120 } : { w: 150, h: 150 };

  return (
    <div>
      <span style={lbl}>{label}</span>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        {/* preview con recorte + arrastre */}
        <div
          style={{
            width: box.w, height: box.h, borderRadius: shape === "circle" ? "50%" : 14,
            overflow: "hidden", background: "#e8e5dd", position: "relative", flex: "0 0 auto",
            cursor: url ? "grab" : "default", touchAction: "none", border: "1px solid rgba(32,33,28,.14)",
          }}
          onPointerDown={(e) => {
            if (!url) return;
            const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            drag.current = { sx: e.clientX, sy: e.clientY, ox: a.x, oy: a.y, w: r.width, h: r.height };
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
            (e.currentTarget as HTMLDivElement).style.cursor = "grabbing";
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            const dx = ((e.clientX - d.sx) / d.w) * 100;
            const dy = ((e.clientY - d.sy) / d.h) * 100;
            onAdjust({ zoom: a.zoom, x: clamp(d.ox + dx, -150, 150), y: clamp(d.oy + dy, -150, 150) });
          }}
          onPointerUp={(e) => {
            drag.current = null;
            (e.currentTarget as HTMLDivElement).style.cursor = url ? "grab" : "default";
          }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" draggable={false} style={adjustStyle(adjust)} />
          ) : (
            <div style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", color: "#8a8178", fontSize: 12 }}>Sin foto</div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 10 }}>
          <label style={{ ...inp, width: "auto", cursor: "pointer", display: "inline-block", textAlign: "center" }}>
            {busy ? "Subiendo…" : url ? "Cambiar foto" : "Subir foto"}
            <input
              type="file" accept="image/*" style={{ display: "none" }}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setBusy(true); setErr("");
                try { onUrl(await subir(f)); onAdjust(null); } catch (x) { setErr((x as Error).message); }
                setBusy(false);
              }}
            />
          </label>
          {url ? (
            <>
              <div>
                <span style={{ fontSize: 12, color: "#637154" }}>Zoom</span>
                <input
                  type="range" min={1} max={4} step={0.05} value={a.zoom}
                  style={{ width: "100%" }}
                  onChange={(e) => onAdjust({ zoom: Number(e.target.value), x: a.x, y: a.y })}
                />
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <span className="mut" style={{ fontSize: 11.5 }}>Arrastra la foto para reencuadrar.</span>
                <button type="button" onClick={() => onAdjust(null)} style={{ background: "none", border: 0, color: "#637154", fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>
                  Restablecer
                </button>
                <button type="button" onClick={() => { onUrl(""); onAdjust(null); }} style={{ background: "none", border: 0, color: "#a33", fontSize: 12.5, cursor: "pointer" }}>
                  Quitar
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
      {hint ? <div className="mut" style={{ fontSize: 12, marginTop: 6 }}>{hint}</div> : null}
      {err ? <div style={{ color: "#a33", fontSize: 12.5, marginTop: 5 }}>{err}</div> : null}
    </div>
  );
}

export default function OperadorForm({ operador }: { operador: Operador }) {
  const [name, setName] = useState(operador.name);
  const [bio, setBio] = useState(operador.bio);
  const [instagram, setInstagram] = useState(operador.instagram);
  const [photoUrl, setPhotoUrl] = useState(operador.photoUrl);
  const [photoAdjust, setPhotoAdjust] = useState<PhotoAdjust | null>(operador.photoAdjust);
  const [heroPhotoUrl, setHeroPhotoUrl] = useState(operador.heroPhotoUrl);
  const [heroAdjust, setHeroAdjust] = useState<PhotoAdjust | null>(operador.heroAdjust);
  const [team, setTeam] = useState<TeamMember[]>(operador.team);
  const [isPublic, setIsPublic] = useState(operador.isPublic);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const setMember = (i: number, patch: Partial<TeamMember>) =>
    setTeam(team.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  async function guardar() {
    setSaving(true); setStatus("");
    const fd = new FormData();
    fd.set("id", operador.id);
    fd.set("name", name);
    fd.set("bio", bio);
    fd.set("instagram", instagram);
    fd.set("photoUrl", photoUrl);
    fd.set("photoAdjust", JSON.stringify(photoAdjust));
    fd.set("heroPhotoUrl", heroPhotoUrl);
    fd.set("heroAdjust", JSON.stringify(heroAdjust));
    fd.set("team", JSON.stringify(team));
    const res = await saveOperatorProfile(fd);
    setSaving(false);
    setStatus(res.ok ? `✓ Guardado · ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}` : `Error: ${res.error}`);
  }

  async function togglePublicar() {
    setSaving(true); setStatus("");
    const fd = new FormData();
    fd.set("id", operador.id);
    fd.set("publicar", isPublic ? "0" : "1");
    const res = await setOperatorPublic(fd);
    setSaving(false);
    if (res.ok) {
      setIsPublic(!isPublic);
      setStatus(!isPublic ? "✓ Perfil PUBLICADO" : "✓ Perfil pasado a borrador (ya no es visible)");
    } else setStatus(`Error: ${res.error}`);
  }

  return (
    <div className="card" style={{ padding: 24, display: "grid", gap: 20, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <span className={`chip ${isPublic ? "c-paid" : ""}`}>{isPublic ? "Publicado" : "Borrador"}</span>
          <span className="mut" style={{ fontSize: 12.5, marginLeft: 10 }}>/caminante/operador/{operador.slug}</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={`/caminante/operador/${operador.slug}?draft=1`} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-sm">
            Vista previa
          </a>
          <button type="button" className="btn btn-glass btn-sm" disabled={saving} onClick={togglePublicar}>
            {isPublic ? "Pasar a borrador" : "Publicar"}
          </button>
          <button type="button" className="btn btn-orange btn-sm" disabled={saving} onClick={guardar}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
      {status ? <div style={{ fontSize: 13.5, fontWeight: 600, color: status.startsWith("Error") ? "#a33" : "#4f5d44" }}>{status}</div> : null}

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <div>
          <span style={lbl}>Nombre del operador</span>
          <input style={inp} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <span style={lbl}>Instagram (sin @)</span>
          <input style={inp} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="numanhub" />
        </div>
      </div>

      <div>
        <span style={lbl}>Bio (2–3 líneas, voz de marca)</span>
        <textarea style={{ ...inp, minHeight: 84 }} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      <FotoAjustable
        label="Foto / logo del operador (avatar)"
        url={photoUrl} adjust={photoAdjust} onUrl={setPhotoUrl} onAdjust={setPhotoAdjust}
        hint="Arrastra y usa el zoom para centrar tu cara. Vacío = sello Caminante en colores de marca."
      />
      <FotoAjustable
        label="Foto de fondo del hero"
        shape="rect"
        url={heroPhotoUrl} adjust={heroAdjust} onUrl={setHeroPhotoUrl} onAdjust={setHeroAdjust}
        hint="Naturaleza, horizontal. Vacío = fondo verde de marca."
      />

      {/* EQUIPO */}
      <div>
        <span style={lbl}>Equipo (quienes caminan contigo)</span>
        <div style={{ display: "grid", gap: 14 }}>
          {team.map((t, i) => (
            <div key={i} className="card" style={{ padding: 16, display: "grid", gap: 12, background: "#faf9f4" }}>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
                <div>
                  <span style={lbl}>Nombre</span>
                  <input style={inp} value={t.name} onChange={(e) => setMember(i, { name: e.target.value })} />
                </div>
                <div>
                  <span style={lbl}>Vocación / profesión</span>
                  <input style={inp} value={t.role} onChange={(e) => setMember(i, { role: e.target.value })} placeholder="Guía de mar y montaña" />
                </div>
              </div>
              <div>
                <span style={lbl}>Quote (una frase suya)</span>
                <input style={inp} value={t.quote} onChange={(e) => setMember(i, { quote: e.target.value })} placeholder="El agua fría no se aguanta; se respira." />
              </div>
              <FotoAjustable
                label="Foto"
                url={t.photoUrl} adjust={t.adjust} onUrl={(u) => setMember(i, { photoUrl: u })} onAdjust={(adj) => setMember(i, { adjust: adj })}
              />
              <div>
                <button type="button" onClick={() => setTeam(team.filter((_, j) => j !== i))} style={{ background: "none", border: 0, color: "#a33", fontSize: 13, cursor: "pointer" }}>
                  Quitar del equipo
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-glass btn-sm"
          style={{ marginTop: 12 }}
          onClick={() => setTeam([...team, { name: "", role: "", quote: "", photoUrl: "", adjust: null }])}
        >
          + Agregar integrante
        </button>
      </div>
    </div>
  );
}
