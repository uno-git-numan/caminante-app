"use client";

// Controles de export por pieza del kit. Reusa el serializador de SocialExport
// (slide → SVG foreignObject → PNG, imágenes inlined vía fetch CORS), pero
// scopeado al contenedor de UNA pieza (`[data-piece]`) y al wrapper `.kit`.
// El formato (post 4:5 / story 9:16) lo fija la página (?f); el botón del OTRO
// formato navega a ?f=… (así no duplicamos todos los slides en el DOM).
import { useState } from "react";

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

async function slidePng(slide: HTMLElement): Promise<string> {
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
  const [busy, setBusy] = useState<null | "dl" | "copy">(null);
  const other = orient === "post" ? "story" : "post";
  const base = slug.replace(/[^\w-]/g, "").toLowerCase();

  async function descargarActual() {
    const slides = Array.from(document.querySelectorAll<HTMLElement>(`[data-piece="${pieceId}"] .slide`));
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

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <button type="button" onClick={descargarActual} disabled={busy !== null} className="btn btn-orange btn-sm">
        {busy === "dl" ? "Generando…" : `⬇ ${dlLabel}`}
      </button>
      <a href={`?f=${other}#${pieceId}`} className="btn btn-glass btn-sm">Cambiar a {otherLabel}</a>
      {captionText ? (
        <button type="button" onClick={copiar} disabled={busy !== null} className="btn btn-glass btn-sm">
          {busy === "copy" ? "¡Copiado!" : "Copiar caption"}
        </button>
      ) : null}
    </div>
  );
}
