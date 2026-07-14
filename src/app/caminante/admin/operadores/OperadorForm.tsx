"use client";

// Editor del perfil público del operador (patrón del dashboard .adm). Fotos vía
// /caminante/api/admin/upload con compresión en el navegador (Vercel corta
// bodies >~4.5MB). Equipo = repetidor (foto, nombre, vocación, quote).
import { useState } from "react";
import { saveOperatorProfile, setOperatorPublic } from "@/lib/operators/admin-actions";
import type { TeamMember } from "@/lib/operators/public";

type Operador = {
  id: string;
  name: string;
  slug: string;
  bio: string;
  photoUrl: string;
  heroPhotoUrl: string;
  instagram: string;
  team: TeamMember[];
  isPublic: boolean;
};

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

function FotoInput({ value, onChange, label, hint }: { value: string; onChange: (u: string) => void; label: string; hint?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div>
      <span style={lbl}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" style={{ width: 54, height: 54, borderRadius: 12, objectFit: "cover" }} />
        ) : null}
        <label style={{ ...inp, width: "auto", cursor: "pointer", display: "inline-block" }}>
          {busy ? "Subiendo…" : value ? "Cambiar foto" : "Subir foto"}
          <input
            type="file" accept="image/*" style={{ display: "none" }}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true); setErr("");
              try { onChange(await subir(f)); } catch (x) { setErr((x as Error).message); }
              setBusy(false);
            }}
          />
        </label>
        {value ? (
          <button type="button" onClick={() => onChange("")} style={{ background: "none", border: 0, color: "#a33", fontSize: 13, cursor: "pointer" }}>
            Quitar
          </button>
        ) : null}
      </div>
      {hint ? <div className="mut" style={{ fontSize: 12, marginTop: 5 }}>{hint}</div> : null}
      {err ? <div style={{ color: "#a33", fontSize: 12.5, marginTop: 5 }}>{err}</div> : null}
    </div>
  );
}

export default function OperadorForm({ operador }: { operador: Operador }) {
  const [name, setName] = useState(operador.name);
  const [bio, setBio] = useState(operador.bio);
  const [instagram, setInstagram] = useState(operador.instagram);
  const [photoUrl, setPhotoUrl] = useState(operador.photoUrl);
  const [heroPhotoUrl, setHeroPhotoUrl] = useState(operador.heroPhotoUrl);
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
    fd.set("heroPhotoUrl", heroPhotoUrl);
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

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
        <FotoInput label="Foto / logo del operador (avatar)" value={photoUrl} onChange={setPhotoUrl} hint="Vacío = sello Caminante en colores de marca." />
        <FotoInput label="Foto de fondo del hero" value={heroPhotoUrl} onChange={setHeroPhotoUrl} hint="Naturaleza, horizontal. Vacío = fondo verde de marca." />
      </div>

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
              <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <FotoInput label="Foto" value={t.photoUrl} onChange={(u) => setMember(i, { photoUrl: u })} />
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
          onClick={() => setTeam([...team, { name: "", role: "", quote: "", photoUrl: "" }])}
        >
          + Agregar integrante
        </button>
      </div>
    </div>
  );
}
