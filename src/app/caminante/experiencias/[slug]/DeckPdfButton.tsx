"use client";

// Botón «Descargar PDF» del deck — genera el PDF EN EL NAVEGADOR y funciona
// IGUAL en móvil y desktop (regla app-first). Nació porque window.print() en
// celular ignora el @page del deck y fragmenta las 9 láminas en cientos de
// páginas (PDF de 468 páginas). Pipeline: cada .slide → SVG foreignObject con
// CSS+fotos inlineadas (mismo serializador probado de SocialExport/Kit) →
// canvas JPEG → PDF ensamblado a mano (sin librerías: páginas + XObjects
// DCTDecode + xref). Una lámina = una página exacta, en cualquier dispositivo.
import { useState } from "react";

const SCALE = 1.5; // 720×1280 → 1080×1920 px de raster por página

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

type PageJpeg = { b64: string; w: number; h: number; pw: number; ph: number };

async function slideJpeg(slide: HTMLElement): Promise<PageJpeg> {
  await document.fonts.ready;
  const w = slide.offsetWidth || 720;
  const h = slide.offsetHeight || 1280;
  const deckClass = slide.closest(".deck")?.className || "deck v";
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
    `<div xmlns="http://www.w3.org/1999/xhtml" class="${deckClass}" style="width:${w}px;height:${h}px;transform:scale(${SCALE});transform-origin:top left;padding:0;gap:0;margin:0;display:block;font-family:'Geist',system-ui,sans-serif;">` +
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
  // JPEG no tiene transparencia → fondo blanco explícito (si no, sale negro).
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  return { b64: dataUrl.split(",")[1], w: canvas.width, h: canvas.height, pw: w, ph: h };
}

// PDF mínimo válido: catálogo + páginas; cada página = content stream que pinta
// su JPEG (XObject /DCTDecode) a página completa. MediaBox en pt = px CSS del
// slide (720×1280) → una lámina por página, tamaño exacto.
function buildPdf(pages: PageJpeg[]): Blob {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  let offset = 0;
  const push = (d: Uint8Array | string) => {
    const u = typeof d === "string" ? enc.encode(d) : d;
    parts.push(u);
    offset += u.length;
  };
  const n = pages.length;
  const pageObj = (i: number) => 3 + i * 3;
  const contObj = (i: number) => 4 + i * 3;
  const imgObj = (i: number) => 5 + i * 3;
  const total = 3 + 3 * n; // /Size (incluye el objeto 0)
  const offsets: number[] = new Array(total).fill(0);
  const obj = (num: number, body: string) => {
    offsets[num] = offset;
    push(`${num} 0 obj\n${body}\nendobj\n`);
  };

  push("%PDF-1.4\n");
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a])); // marcador binario

  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  obj(2, `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(" ")}] /Count ${n} >>`);
  pages.forEach((p, i) => {
    obj(
      pageObj(i),
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.pw} ${p.ph}] /Resources << /XObject << /Im0 ${imgObj(i)} 0 R >> >> /Contents ${contObj(i)} 0 R >>`,
    );
    const stream = `q ${p.pw} 0 0 ${p.ph} 0 0 cm /Im0 Do Q`;
    offsets[contObj(i)] = offset;
    push(`${contObj(i)} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`);
    const bin = Uint8Array.from(atob(p.b64), (c) => c.charCodeAt(0));
    offsets[imgObj(i)] = offset;
    push(
      `${imgObj(i)} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bin.length} >>\nstream\n`,
    );
    push(bin);
    push("\nendstream\nendobj\n");
  });

  const xrefStart = offset;
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let k = 1; k < total; k++) xref += String(offsets[k]).padStart(10, "0") + " 00000 n \n";
  push(xref);
  push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);
  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

export default function DeckPdfButton({ filename }: { filename: string }) {
  const [state, setState] = useState<string | null>(null);

  async function generar() {
    const slides = Array.from(document.querySelectorAll<HTMLElement>(".deck .slide"));
    if (!slides.length) return;
    try {
      const pages: PageJpeg[] = [];
      for (let i = 0; i < slides.length; i++) {
        setState(`Generando ${i + 1}/${slides.length}…`);
        pages.push(await slideJpeg(slides[i]));
      }
      setState("Armando PDF…");
      const blob = buildPdf(pages);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${filename.replace(/[\\/:*?"<>|]/g, "")}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 30000);
      setState("PDF descargado ✓");
      setTimeout(() => setState(null), 3000);
    } catch (e) {
      setState(null);
      alert("No pude generar el PDF: " + (e as Error).message);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: "@media print{.deck-dl{display:none !important;}}" }} />
      <button
        type="button"
        className="deck-dl"
        onClick={generar}
        disabled={state !== null && state !== "PDF descargado ✓"}
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 60,
          background: "rgba(32,33,28,.85)",
          color: "#fff",
          border: "none",
          borderRadius: 999,
          padding: "11px 18px",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: '"Geist",system-ui,sans-serif',
          cursor: "pointer",
          backdropFilter: "blur(6px)",
        }}
      >
        {state ?? "⬇ Descargar PDF"}
      </button>
    </>
  );
}
