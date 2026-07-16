"use client";

// Controles de export por pieza del kit. Reusa el serializador de SocialExport
// (slide → SVG foreignObject → PNG, imágenes inlined vía fetch CORS), pero
// scopeado al contenedor de UNA pieza (`[data-piece]`) y al wrapper `.kit`.
// El formato (post 4:5 / story 9:16) lo fija la página (?f); el botón del OTRO
// formato navega a ?f=… (así no duplicamos todos los slides en el DOM).
import { useState } from "react";
import { publicarPieza, programarPieza } from "@/lib/social/publish-actions";

const SCALE = 1.5; // 720×900 → 1080×1350 · 720×1280 → 1080×1920

async function toDataUrl(url: string): Promise<string> {
  const blob = await fetch(url, { mode: "cors", cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error("img " + r.status);
    return r.blob();
  });
  return await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(new Error("read"));
    fr.readAsDataURL(blob);
  });
}

export async function slidePng(slide: HTMLElement): Promise<string> {
  await document.fonts.ready;
  const w = slide.offsetWidth || 720;
  const h = slide.offsetHeight || 900;
  const kitClass = slide.closest(".kit")?.className || "kit post";
  const clone = slide.cloneNode(true) as HTMLElement;
  const imgs = Array.from(clone.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      img.setAttribute("src", await toDataUrl(src));
    }),
  );
  const css = Array.from(document.querySelectorAll("style")).map((s) => s.textContent || "").join("\n");
  const xhtml = new XMLSerializer().serializeToString(clone);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * SCALE}" height="${h * SCALE}">` +
    `<foreignObject width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" class="${kitClass}" style="width:${w}px;height:${h}px;transform:scale(${SCALE});transform-origin:top left;padding:0;gap:0;margin:0;display:block;font-family:'Geist',system-ui,sans-serif;">` +
    `<style>${css}</style>${xhtml}</div></foreignObject></svg>`;
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const image = new Image();
  await new Promise<void>((res, rej) => {
    image.onload = () => res();
    image.onerror = () => rej(new Error("svg render"));
    image.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = w * SCALE;
  canvas.height = h * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function download(dataUrl: string, name: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  a.click();
}

export function KitPieceControls({
  pieceId,
  slug,
  orient,
  captionText,
}: {
  pieceId: string;
  slug: string;
  orient: "post" | "story";
  captionText?: string;
}) {
  const [busy, setBusy] = useState<null | "dl" | "copy" | "prev" | "pub" | "sched">(null);
  const [preview, setPreview] = useState<string[] | null>(null); // PNGs generados (idénticos al download)
  const [pi, setPi] = useState(0); // lámina visible en el preview
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null); // resultado publicar/programar
  const [schedOpen, setSchedOpen] = useState(false); // modal de programar
  const [schedAt, setSchedAt] = useState(""); // datetime-local elegido
  const other = orient === "post" ? "story" : "post";
  const base = slug.replace(/[^\w-]/g, "").toLowerCase();

  function slidesDe(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>(`[data-piece="${pieceId}"] .slide`));
  }

  // Genera los PNG de las láminas (idénticos a la descarga) y los sube al bucket
  // público → devuelve sus URLs EN ORDEN (Instagram publica desde URL, no bytes).
  async function generarYSubir(): Promise<string[]> {
    const slides = slidesDe();
    if (!slides.length) throw new Error("No hay láminas para esta pieza.");
    const urls: string[] = [];
    for (let i = 0; i < slides.length; i++) {
      const dataUrl = await slidePng(slides[i]);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${base}-${pieceId.toLowerCase()}-${orient}-${String(i + 1).padStart(2, "0")}.png`, { type: "image/png" });
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/caminante/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("No se pudo subir la imagen (" + res.status + ").");
      const j = await res.json();
      if (!j?.url) throw new Error("La subida no devolvió URL.");
      urls.push(j.url as string);
    }
    return urls;
  }

  async function publicarAhora() {
    const kind = orient === "story" ? "la story" : "el post";
    if (!confirm(`¿Publicar ${kind} de ${pieceId} en Instagram AHORA?`)) return;
    setBusy("pub");
    setNote(null);
    try {
      const imageUrls = await generarYSubir();
      const res = await publicarPieza({ slug, pieceId, format: orient, caption: captionText, imageUrls });
      setNote(res.ok ? { ok: true, text: "¡Publicado en Instagram!" + (res.permalink ? ` ${res.permalink}` : "") } : { ok: false, text: res.error || "No se pudo publicar." });
    } catch (e) {
      setNote({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function confirmarProgramar() {
    if (!schedAt) { alert("Elige fecha y hora."); return; }
    setBusy("sched");
    setNote(null);
    try {
      const imageUrls = await generarYSubir();
      const res = await programarPieza({ slug, pieceId, format: orient, caption: captionText, imageUrls, scheduledAt: new Date(schedAt).toISOString() });
      if (res.ok) {
        setNote({ ok: true, text: `Programada para ${new Date(schedAt).toLocaleString("es-MX")}. La verás en «Cola de redes».` });
        setSchedOpen(false);
        setSchedAt("");
      } else {
        setNote({ ok: false, text: res.error || "No se pudo programar." });
      }
    } catch (e) {
      setNote({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function descargarActual() {
    const slides = slidesDe();
    if (!slides.length) return;
    setBusy("dl");
    try {
      for (let i = 0; i < slides.length; i++) {
        download(await slidePng(slides[i]), `${base}-${pieceId.toLowerCase()}-${orient}-${String(i + 1).padStart(2, "0")}.png`);
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (e) {
      alert("No pude generar: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  // Genera los MISMOS PNG que la descarga y los muestra en grande → ves cómo
  // van a quedar las fotos ANTES de bajarlas.
  async function verPreview() {
    const slides = slidesDe();
    if (!slides.length) return;
    setBusy("prev");
    try {
      const pngs: string[] = [];
      for (const s of slides) pngs.push(await slidePng(s));
      setPi(0);
      setPreview(pngs);
    } catch (e) {
      alert("No pude generar la vista previa: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function descargarDesdePreview() {
    if (!preview) return;
    for (let i = 0; i < preview.length; i++) {
      download(preview[i], `${base}-${pieceId.toLowerCase()}-${orient}-${String(i + 1).padStart(2, "0")}.png`);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  async function copiar() {
    if (!captionText) return;
    setBusy("copy");
    try {
      await navigator.clipboard.writeText(captionText);
      setTimeout(() => setBusy(null), 900);
    } catch {
      setBusy(null);
    }
  }

  const dlLabel = orient === "post" ? "Descargar POST (4:5)" : "Descargar STORY (9:16)";
  const otherLabel = other === "post" ? "POST (4:5)" : "STORY (9:16)";
  const n = preview?.length ?? 0;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <button type="button" onClick={verPreview} disabled={busy !== null} className="btn btn-glass btn-sm">
        {busy === "prev" ? "Generando…" : "👁 Vista previa"}
      </button>
      <button type="button" onClick={descargarActual} disabled={busy !== null} className="btn btn-orange btn-sm">
        {busy === "dl" ? "Generando…" : `⬇ ${dlLabel}`}
      </button>
      <a href={`?f=${other}#${pieceId}`} className="btn btn-glass btn-sm">Cambiar a {otherLabel}</a>
      {captionText ? (
        <button type="button" onClick={copiar} disabled={busy !== null} className="btn btn-glass btn-sm">
          {busy === "copy" ? "¡Copiado!" : "Copiar caption"}
        </button>
      ) : null}

      <span style={{ width: 1, height: 22, background: "rgba(32,33,28,.14)", margin: "0 2px" }} aria-hidden />
      <button type="button" onClick={publicarAhora} disabled={busy !== null} className="btn btn-orange btn-sm" title="Publica esta pieza en la cuenta de Instagram conectada">
        {busy === "pub" ? "Publicando…" : `📸 Publicar ${orient === "post" ? "POST" : "STORY"}`}
      </button>
      <button type="button" onClick={() => { setSchedOpen(true); setNote(null); }} disabled={busy !== null} className="btn btn-glass btn-sm">
        🗓 Programar
      </button>

      {note ? (
        <div style={{ flexBasis: "100%", fontSize: 13, marginTop: 4, color: note.ok ? "#4f5d44" : "#c23c1c", background: note.ok ? "rgba(99,113,84,.12)" : "rgba(255,93,54,.1)", borderRadius: 8, padding: "8px 12px", wordBreak: "break-word" }}>
          {note.ok ? "✅ " : "⚠️ "}{note.text}
        </div>
      ) : null}

      {schedOpen ? (
        <div onClick={() => setSchedOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20,21,18,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, backdropFilter: "blur(3px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", width: 360, maxWidth: "92vw", boxShadow: "0 30px 80px -30px rgba(0,0,0,.6)" }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "#637154" }}>Programar publicación</div>
            <div style={{ fontSize: 15, margin: "6px 0 4px" }}>{pieceId} · {orient === "post" ? "Post 4:5" : "Story 9:16"}</div>
            <div style={{ fontSize: 12.5, color: "rgba(32,33,28,.55)", marginBottom: 14 }}>Se generan las láminas ahora y se guardan; el robot la publica ese día.</div>
            <input type="datetime-local" value={schedAt} onChange={(e) => setSchedAt(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(32,33,28,.2)", fontFamily: "inherit", fontSize: 14 }} />
            <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setSchedOpen(false)} className="btn btn-glass btn-sm">Cancelar</button>
              <button type="button" onClick={confirmarProgramar} disabled={busy !== null} className="btn btn-orange btn-sm">{busy === "sched" ? "Guardando…" : "Programar"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {preview ? (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000, background: "rgba(20,21,18,.86)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 24, gap: 14, backdropFilter: "blur(4px)",
          }}
        >
          <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>
            Vista previa · lo que se descarga {n > 1 ? `· ${pi + 1} / ${n}` : ""}
          </div>
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 14, maxWidth: "100%" }}>
            {n > 1 ? (
              <button type="button" aria-label="Anterior" onClick={() => setPi((p) => (p - 1 + n) % n)}
                style={arrowStyle}>‹</button>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview[pi]} alt={`Lámina ${pi + 1}`}
              style={{ maxHeight: "78vh", maxWidth: n > 1 ? "78vw" : "92vw", borderRadius: 14, boxShadow: "0 30px 80px -30px rgba(0,0,0,.8)", background: "#fff" }} />
            {n > 1 ? (
              <button type="button" aria-label="Siguiente" onClick={() => setPi((p) => (p + 1) % n)}
                style={arrowStyle}>›</button>
            ) : null}
          </div>
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={descargarDesdePreview} className="btn btn-orange btn-sm">⬇ {dlLabel}</button>
            <button type="button" onClick={() => setPreview(null)} className="btn btn-glass btn-sm">Cerrar</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const arrowStyle: React.CSSProperties = {
  flex: "0 0 auto", width: 44, height: 44, borderRadius: 999, border: "1px solid rgba(255,255,255,.3)",
  background: "rgba(255,255,255,.12)", color: "#fff", fontSize: 24, lineHeight: 1, cursor: "pointer",
};
