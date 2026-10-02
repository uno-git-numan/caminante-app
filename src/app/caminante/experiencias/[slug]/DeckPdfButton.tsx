"use client";

// Botón «Descargar PDF» del deck — genera el PDF EN EL NAVEGADOR y funciona
// IGUAL en móvil y desktop (regla app-first). Nació porque window.print() en
// celular ignora el @page del deck y fragmenta las 9 láminas en cientos de
// páginas (PDF de 468 páginas). Pipeline: cada .slide → SVG foreignObject con
// CSS+fotos inlineadas (mismo serializador probado de SocialExport/Kit) →
// canvas JPEG → PDF ensamblado a mano (sin librerías: páginas + XObjects
// DCTDecode + xref). Una lámina = una página exacta, en cualquier dispositivo.
// Desde el 2 oct 2026 las fotos se dibujan a mano en el canvas (ver slideJpeg):
// WebKit en iPhone no las pintaba dentro del foreignObject.
import { useState } from "react";

const SCALE = 1.5; // 720×1280 → 1080×1920 px de raster por página

async function toDataUrl(url: string): Promise<string> {
  const blob = await fetch(url, { mode: "cors", cache: "no-store" }).then(
    (r) => {
      if (!r.ok) throw new Error("img " + r.status);
      return r.blob();
    },
  );
  return await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = () => rej(new Error("read"));
    fr.readAsDataURL(blob);
  });
}

type PageJpeg = { b64: string; w: number; h: number; pw: number; ph: number };

// Una foto decodificada, lista para drawImage. Cache por URL: la misma foto
// aparece en varias láminas (hero, clones del glass) y se baja una sola vez.
const fotos = new Map<string, Promise<HTMLImageElement>>();
function cargarFoto(src: string): Promise<HTMLImageElement> {
  let p = fotos.get(src);
  if (!p) {
    p = (async () => {
      const data = src.startsWith("data:") ? src : await toDataUrl(src);
      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error("foto"));
        img.src = data;
      });
      if (img.decode) await img.decode().catch(() => undefined);
      return img;
    })();
    fotos.set(src, p);
  }
  return p;
}

// object-position «50% 30%» → fracciones. Sin dato, centrado.
function posicion(objectPosition: string): [number, number] {
  const m = objectPosition.match(/([\d.]+)%\s+([\d.]+)%/);
  return m ? [Number(m[1]) / 100, Number(m[2]) / 100] : [0.5, 0.5];
}

// Rectángulo de un elemento RELATIVO a la lámina, en px CSS.
function rectEn(slide: DOMRect, el: Element) {
  const r = el.getBoundingClientRect();
  return {
    x: r.left - slide.left,
    y: r.top - slide.top,
    w: r.width,
    h: r.height,
  };
}

// ⚠️ LAS FOTOS SE DIBUJAN A MANO, NO DENTRO DEL SVG.
//
// El pipeline original metía las fotos como data URLs dentro del foreignObject
// y rasterizaba todo de un golpe. En iPhone (Safari y Chrome usan WebKit) el
// canvas salía con textos y degradados pero SIN UNA SOLA FOTO (PDFs de Luis,
// 1 y 2 oct 2026), y esperar decode() no lo arregló. Aquí cada <img> se pinta
// con drawImage directo —eso WebKit sí lo hace bien— en el mismo rectángulo y
// con el mismo recorte (object-fit: cover + object-position) que tiene en
// pantalla, y DESPUÉS va la capa SVG con el resto: textos, veils, tarjetas,
// sin ningún <img> y con transparentes las cajas que en el DOM están detrás
// de una foto (.slide, .s-media, las celdas del mosaico, el clon del glass).
// El orden es el del DOM: en el deck la foto siempre es el fondo de su caja.
async function slideJpeg(slide: HTMLElement): Promise<PageJpeg> {
  await document.fonts.ready;
  const w = slide.offsetWidth || 720;
  const h = slide.offsetHeight || 1280;
  const deckClass = slide.closest(".deck")?.className || "deck v";
  const canvas = document.createElement("canvas");
  canvas.width = w * SCALE;
  canvas.height = h * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.scale(SCALE, SCALE);
  // JPEG no tiene transparencia → el fondo de la lámina, explícito.
  ctx.fillStyle = getComputedStyle(slide).backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const sr = slide.getBoundingClientRect();
  // Cajas de media vacías conservan su fondo (gris panel) aunque no haya foto.
  slide.querySelectorAll(".s-media").forEach((m) => {
    const r = rectEn(sr, m);
    ctx.fillStyle = getComputedStyle(m).backgroundColor;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  });

  // 1 · Las fotos, en orden de DOM, recortadas a la caja que las contiene.
  // Los logos del pie (.brandfoot, z-index arriba de todo) van en una segunda
  // pasada DESPUÉS de la capa SVG: si fueran antes, el veil los oscurecería.
  const todas = Array.from(slide.querySelectorAll("img"));
  const alPie = (img: HTMLImageElement) => !!img.closest(".brandfoot");
  const pintar = async (imgs: HTMLImageElement[]) => {
    for (const img of imgs) {
      const src = img.currentSrc || img.getAttribute("src") || "";
      const dest = rectEn(sr, img);
      if (!src || dest.w <= 0 || dest.h <= 0) continue;
      let foto: HTMLImageElement;
      try {
        foto = await cargarFoto(src);
      } catch {
        continue; // una foto rota no tumba el PDF
      }
      const iw = foto.naturalWidth || 1;
      const ih = foto.naturalHeight || 1;
      const cs = getComputedStyle(img);
      const clipBox = img.parentElement
        ? rectEn(sr, img.parentElement)
        : { x: 0, y: 0, w, h };
      ctx.save();
      ctx.beginPath();
      ctx.rect(clipBox.x, clipBox.y, clipBox.w, clipBox.h);
      ctx.clip();
      // CSS filter (blur del glass) sólo donde el canvas lo soporte; si no, la
      // foto va nítida bajo el tinte, que es un degradado digno y no un hueco.
      if ("filter" in ctx && cs.filter && cs.filter !== "none")
        ctx.filter = cs.filter;
      if (cs.objectFit === "cover" || cs.objectFit === "contain") {
        const cover = cs.objectFit === "cover";
        const s = cover
          ? Math.max(dest.w / iw, dest.h / ih)
          : Math.min(dest.w / iw, dest.h / ih);
        const dw = iw * s;
        const dh = ih * s;
        const [px, py] = posicion(cs.objectPosition);
        ctx.drawImage(
          foto,
          dest.x + (dest.w - dw) * px,
          dest.y + (dest.h - dh) * py,
          dw,
          dh,
        );
      } else {
        ctx.drawImage(foto, dest.x, dest.y, dest.w, dest.h);
      }
      ctx.restore();
    }
  };
  await pintar(todas.filter((i) => !alPie(i)));

  // 2 · La capa SVG: todo menos las fotos, con transparentes las cajas que
  // en el DOM están detrás de una foto, para no taparlas.
  const clone = slide.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("img").forEach((i) => i.remove());
  const css =
    Array.from(document.querySelectorAll("style"))
      .map((s) => s.textContent || "")
      .join("\n") +
    "\n.slide,.s-media,.s-mosaic .m,.gclone{background:transparent !important;box-shadow:none !important;}";
  const xhtml = new XMLSerializer().serializeToString(clone);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * SCALE}" height="${h * SCALE}">` +
    `<foreignObject width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" class="${deckClass}" style="width:${w}px;height:${h}px;transform:scale(${SCALE});transform-origin:top left;padding:0;gap:0;margin:0;display:block;background:transparent;font-family:'Geist',system-ui,sans-serif;">` +
    `<style>${css}</style>${xhtml}</div></foreignObject></svg>`;
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  const image = new Image();
  await new Promise<void>((res, rej) => {
    image.onload = () => res();
    image.onerror = () => rej(new Error("svg render"));
    image.src = url;
  });
  if (image.decode) await image.decode().catch(() => undefined);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(image, 0, 0);
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  await pintar(todas.filter(alPie));
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  return {
    b64: dataUrl.split(",")[1],
    w: canvas.width,
    h: canvas.height,
    pw: w,
    ph: h,
  };
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
  obj(
    2,
    `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(" ")}] /Count ${n} >>`,
  );
  pages.forEach((p, i) => {
    obj(
      pageObj(i),
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.pw} ${p.ph}] /Resources << /XObject << /Im0 ${imgObj(i)} 0 R >> >> /Contents ${contObj(i)} 0 R >>`,
    );
    const stream = `q ${p.pw} 0 0 ${p.ph} 0 0 cm /Im0 Do Q`;
    offsets[contObj(i)] = offset;
    push(
      `${contObj(i)} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    );
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
  for (let k = 1; k < total; k++)
    xref += String(offsets[k]).padStart(10, "0") + " 00000 n \n";
  push(xref);
  push(
    `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`,
  );
  return new Blob(parts as BlobPart[], { type: "application/pdf" });
}

export default function DeckPdfButton({ filename }: { filename: string }) {
  const [state, setState] = useState<string | null>(null);

  async function generar() {
    const slides = Array.from(
      document.querySelectorAll<HTMLElement>(".deck .slide"),
    );
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
      <style
        dangerouslySetInnerHTML={{
          __html: "@media print{.deck-dl{display:none !important;}}",
        }}
      />
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
