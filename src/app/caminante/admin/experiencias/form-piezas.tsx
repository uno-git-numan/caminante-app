"use client";

// Las piezas chicas del formulario de experiencia: el campo con su etiqueta, la
// subida de imágenes (con compresión en el navegador) y la lista de renglones.
// Vivían dentro de ExperienceForm.tsx; se sacaron el 19 nov 2026 para que el
// alta rápida (AltaRapida.tsx) use las mismas, no una copia.

import { useState } from "react";

export function Field({ label, hint, auto, children }: { label: React.ReactNode; hint?: string; auto?: boolean; children: React.ReactNode }) {
  return (
    <div className={`field${auto ? " auto" : ""}`}>
      <label>{label}{hint ? <span className="hint"> — {hint}</span> : null}{auto ? <span className="chip-auto">auto</span> : null}</label>
      {children}
    </div>
  );
}
// ── Subida de imágenes con compresión en el navegador ──────────────────────
// Vercel corta cualquier body >~4.5 MB ANTES de llegar a /api/admin/upload,
// así que las fotos de cámara (4–12 MB) morían en silencio. Aquí se
// redimensionan a máx 2560px (sobra para web) y se recomprimen a JPEG antes
// de subir: una foto de 10 MB queda en ~1 MB. Además el sitio carga más rápido.
export async function comprimirImagen(file: File, maxLado = 2560, calidad = 0.82): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions);
    const esc = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * esc));
    const h = Math.max(1, Math.round(bmp.height * esc));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    return await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", calidad));
  } catch {
    return null; // formato no decodificable (p.ej. HEIC en Chrome)
  }
}

// Los LOGOS (colaboradores) se recortan solos al contenido: se detecta el
// bounding box del canal alfa y se elimina el aire transparente alrededor
// (un wordmark en un lienzo 3300×2550 se veía diminuto al renderizar a altura
// fija junto al sello de numan). Salida SIEMPRE PNG (conserva transparencia;
// el compresor JPEG la aplastaría a fondo negro/blanco).
async function recortarLogo(file: File): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file);
    const w0 = bmp.width, h0 = bmp.height;
    const c = document.createElement("canvas");
    c.width = w0; c.height = h0;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0);
    bmp.close();
    const a = ctx.getImageData(0, 0, w0, h0).data;
    let minX = w0, minY = h0, maxX = -1, maxY = -1;
    for (let y = 0; y < h0; y++) {
      for (let x = 0; x < w0; x++) {
        if (a[(y * w0 + x) * 4 + 3] > 16) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return null; // imagen sin píxeles visibles (o JPEG opaco: bbox = todo)
    const m = Math.max(4, Math.round((maxY - minY) / 20)); // margen ~5% del glifo
    const x0 = Math.max(0, minX - m), y0 = Math.max(0, minY - m);
    const cw = Math.min(w0, maxX + m + 1) - x0, ch = Math.min(h0, maxY + m + 1) - y0;
    // Los logos no necesitan más de ~1200px de ancho / 400px de alto.
    const esc = Math.min(1, 1200 / cw, 400 / ch);
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(cw * esc));
    out.height = Math.max(1, Math.round(ch * esc));
    const octx = out.getContext("2d");
    if (!octx) return null;
    octx.drawImage(c, x0, y0, cw, ch, 0, 0, out.width, out.height);
    return await new Promise<Blob | null>((res) => out.toBlob(res, "image/png"));
  } catch {
    return null;
  }
}

export async function subirImagen(file: File, opts?: { logo?: boolean }): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let cuerpo: Blob = file;
  let nombre = file.name;
  if (opts?.logo) {
    // Logo: recortar el aire transparente y quedarnos en PNG (nunca JPEG).
    const rec = await recortarLogo(file);
    if (rec) {
      cuerpo = rec;
      nombre = nombre.replace(/\.[^.]+$/, "") + ".png";
    }
  } else if (file.size > 1_200_000) {
    // Foto: comprimir todo lo que pese >1.2 MB.
    const comp = await comprimirImagen(file);
    if (comp && comp.size < file.size) {
      cuerpo = comp;
      nombre = nombre.replace(/\.[^.]+$/, "") + ".jpg";
    }
  }
  if (cuerpo.size > 4_000_000) {
    return {
      ok: false,
      error:
        cuerpo === file
          ? "No pude comprimir este formato (¿HEIC?). Conviértela a JPG o PNG e inténtalo de nuevo."
          : "La imagen pesa demasiado incluso comprimida. Prueba con una versión más chica.",
    };
  }
  try {
    const fd = new FormData();
    fd.append("file", cuerpo, nombre);
    const res = await fetch("/caminante/api/admin/upload", { method: "POST", body: fd });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j?.url) {
      return { ok: false, error: j?.error || `La subida falló (HTTP ${res.status}). Intenta de nuevo.` };
    }
    return { ok: true, url: j.url as string };
  } catch {
    return { ok: false, error: "Se cortó la conexión al subir. Intenta de nuevo." };
  }
}

export function Uploader({ value, onChange, logo }: { value: string; onChange: (v: string) => void; logo?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setErr(null);
    const r = await subirImagen(f, logo ? { logo: true } : undefined);
    if (r.ok) onChange(r.url);
    else setErr(r.error);
    setBusy(false);
    e.target.value = "";
  }
  return (
    <div className="uploader">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="thumb" />
      ) : null}
      <input type="url" value={value} placeholder="https://… o sube un archivo" onChange={(e) => onChange(e.target.value)} />
      <label className="filebtn">{busy ? "Subiendo…" : "Subir archivo"}<input type="file" accept="image/*" onChange={onFile} disabled={busy} /></label>
      {err ? <div style={{ color: "#b33517", fontSize: 12, marginTop: 4 }}>{err}</div> : null}
    </div>
  );
}
export function StrList({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <>
      <div className="rep-items">
        {items.map((it, i) => (
          <div key={i} className="rep-row">
            <input type="text" className="grow" value={it} placeholder={placeholder} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button type="button" className="rm" onClick={() => onChange(items.filter((_, j) => j !== i))}>Quitar</button>
          </div>
        ))}
      </div>
      <button type="button" className="add" onClick={() => onChange([...items, ""])}>+ Agregar</button>
    </>
  );
}
