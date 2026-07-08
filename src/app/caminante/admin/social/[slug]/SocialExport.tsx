"use client";

// Exporta cada .slide del deck (variante 4:5) a PNG 1080×1350, SIN dependencia:
// serializa el slide a un <svg><foreignObject> con su CSS (fuentes ya van
// embebidas en base64) e imágenes convertidas a data-URI (fetch → dataURL, el
// bucket público de Supabase manda CORS *) → así el canvas NO se mancha y
// toDataURL('image/png') funciona. Incluye los clones de glass (son <img>).
import { useState } from "react";

const SCALE = 1.5; // 720×900 → 1080×1350

async function toDataUrl(url: string): Promise<string> {
  // mode:cors + no-store = SIEMPRE una petición CORS fresca. Con `force-cache` el
  // navegador reusaba la entrada OPACA que dejó el <img> de la página (que se cargó
  // sin crossorigin) → el fetch en modo cors fallaba y esa imagen salía en blanco.
  // Era una carrera: fallaban justo las slides cuya foto ya estaba cacheada al
  // exportar (el bucket sí manda access-control-allow-origin: *).
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
  await document.fonts.ready; // no rasterizar antes de que Geist esté lista
  const w = slide.offsetWidth || 720;
  const h = slide.offsetHeight || 900;
  const clone = slide.cloneNode(true) as HTMLElement;
  // el botón flotante "Descargar" vive dentro del slide → fuera del PNG
  clone.querySelectorAll(".soc-dl").forEach((b) => b.remove());
  // inline TODAS las imágenes (bg + mosaicos + clones de glass) como data-URI
  const imgs = Array.from(clone.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      // Si NO se puede inlinar, la imagen saldría en blanco en el PNG (el SVG no
      // carga recursos remotos al rasterizar). Mejor fallar visible que exportar
      // una tarjeta sin foto en silencio.
      img.setAttribute("src", await toDataUrl(src));
    }),
  );
  const css = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent || "")
    .join("\n");
  const xhtml = new XMLSerializer().serializeToString(clone);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * SCALE}" height="${h * SCALE}">` +
    `<foreignObject width="100%" height="100%">` +
    // Clonamos SOLO el .slide → se pierde el ancestro .deck que define
    // font-family:Geist (el título la HEREDA, no la declara → caía a serif).
    // La re-declaramos aquí para restaurar la herencia dentro del SVG.
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;transform:scale(${SCALE});transform-origin:top left;font-family:'Geist',system-ui,sans-serif;">` +
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

export default function SocialExport({
  titulo,
  formato = "post",
}: {
  titulo: string;
  formato?: "post" | "story";
}) {
  const [busy, setBusy] = useState<number | "all" | null>(null);
  const base = titulo.replace(/[^\w\sáéíóúñ-]/gi, "").trim().replace(/\s+/g, "-").toLowerCase() || "flyer";
  const nombre = (i: number) => `${base}-${formato}-${String(i + 1).padStart(2, "0")}.png`;
  const dims = formato === "story" ? "1080×1920 (9:16)" : "1080×1350 (4:5)";
  const nota =
    formato === "story"
      ? "Cada tarjeta = una Story / Reel de pantalla completa."
      : "Cada tarjeta = un post del feed de Instagram.";

  async function one(i: number) {
    const slides = Array.from(document.querySelectorAll<HTMLElement>(".slide"));
    if (!slides[i]) return;
    setBusy(i);
    try {
      download(await slidePng(slides[i]), nombre(i));
    } catch (e) {
      alert("No pude generar esa imagen: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function all() {
    const slides = Array.from(document.querySelectorAll<HTMLElement>(".slide"));
    setBusy("all");
    try {
      for (let i = 0; i < slides.length; i++) {
        download(await slidePng(slides[i]), nombre(i));
        await new Promise((r) => setTimeout(r, 350)); // no atropellar las descargas
      }
    } catch (e) {
      alert("Se detuvo la descarga: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        padding: "14px 18px", background: "rgba(32,33,28,.92)", color: "#fff",
        backdropFilter: "blur(8px)", fontFamily: "system-ui", fontSize: 14, flexWrap: "wrap",
      }}
    >
      {/* Selector de formato (la OPCIÓN vive aquí, no como botón del dashboard) */}
      <span style={{ display: "inline-flex", gap: 4, background: "rgba(255,255,255,.12)", borderRadius: 999, padding: 3 }}>
        {(["post", "story"] as const).map((f) => {
          const on = formato === f;
          return (
            <a
              key={f}
              href={`?f=${f}`}
              style={{
                borderRadius: 999, padding: "6px 14px", fontSize: 13, fontWeight: 600,
                textDecoration: "none", color: on ? "#20211c" : "#fff",
                background: on ? "#fff" : "transparent",
              }}
            >
              {f === "post" ? "Post 4:5" : "Story 9:16"}
            </a>
          );
        })}
      </span>
      <span style={{ opacity: 0.8 }}>
        {dims}. {nota}
      </span>
      <button
        type="button"
        onClick={all}
        disabled={busy !== null}
        style={{
          background: "#ff5d36", color: "#fff", border: 0, borderRadius: 999,
          padding: "9px 18px", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
          opacity: busy !== null ? 0.6 : 1,
        }}
      >
        {busy === "all" ? "Generando…" : "Descargar todas (PNG)"}
      </button>
      <span style={{ opacity: 0.6, fontSize: 12.5 }}>
        o usa el botón “Descargar” de cada tarjeta.
      </span>
      {/* Botón por-slide: se inyecta sobre cada slide al montar */}
      <PerSlideButtons onClick={one} busy={busy} />
    </div>
  );
}

function PerSlideButtons({ onClick, busy }: { onClick: (i: number) => void; busy: number | "all" | null }) {
  // Coloca un botón flotante "Descargar" en la esquina de cada slide.
  if (typeof window !== "undefined") {
    queueMicrotask(() => {
      const slides = Array.from(document.querySelectorAll<HTMLElement>(".slide"));
      slides.forEach((s, i) => {
        if (s.querySelector(".soc-dl")) return;
        const b = document.createElement("button");
        b.className = "soc-dl";
        b.textContent = "Descargar";
        b.style.cssText =
          "position:absolute;top:12px;left:12px;z-index:20;background:rgba(32,33,28,.86);color:#fff;border:0;border-radius:999px;padding:7px 14px;font:600 12px system-ui;cursor:pointer;";
        b.onclick = (e) => {
          e.preventDefault();
          onClick(i);
        };
        s.appendChild(b);
      });
    });
  }
  void busy;
  return null;
}
