// OG image dinámica por experiencia (convención de archivo de Next: este archivo
// registra solo el og:image de /caminante/experiencias/[slug] automáticamente).
// Cada link compartido en WhatsApp/IG/iMessage se vuelve un mini-anuncio: foto de
// hero + título con el accent naranja de la marca. Colores = los reales del
// template v2 (template-v2-css.ts): orange #ff5d36, cream #fbfbf7, lagoon-deep #0f3f40.

import { ImageResponse } from "next/og";
import { fetchExperienceBySlug } from "@/lib/experiences/queries";
import type { V2Hero } from "@/lib/experiences/types";

export const runtime = "nodejs";
export const alt = "Caminante — experiencias en naturaleza";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// El renderizador (satori) solo puede fetchear URLs ABSOLUTAS. Varias experiencias
// (p.ej. ensenada) guardan la foto de hero como ruta relativa (/landing/... o
// /experiencias/...) → se resuelve contra el dominio canónico. Sin esto: 500.
const SITE = "https://caminante.numanhub.com";
function absoluteUrl(raw: string): string {
  const u = raw.trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `${SITE}${u.startsWith("/") ? "" : "/"}${u}`;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await fetchExperienceBySlug(slug);

  const hero = e?.page?.blocks?.find((b): b is V2Hero => b.type === "hero");
  const title = (hero?.title || e?.title || "Experiencia en naturaleza").trim();
  const accent = (hero?.titleAccent || e?.titleAccent || "").trim();
  const eyebrow = (hero?.eyebrow || e?.estado || "").trim();
  const bgUrl = absoluteUrl(hero?.bg?.url || e?.heroImageUrl || "");

  // La OG image JAMÁS debe responder 500 (un link compartido sin preview = venta
  // perdida). El renderizador falla DURANTE el stream si no puede fetchear la
  // foto (y ahí ya no hay catch posible), así que la pre-descargamos nosotros y
  // se la damos como data-URI; si falla la descarga, la tarjeta sale sin foto.
  let bg = "";
  if (bgUrl) {
    try {
      const r = await fetch(bgUrl);
      const ct = r.headers.get("content-type") || "";
      if (r.ok && ct.startsWith("image/")) {
        const buf = await r.arrayBuffer();
        bg = `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
      }
    } catch {
      // sin foto — la tarjeta de marca se sostiene sola
    }
  }

  return renderCard({ title, accent, eyebrow, bg });
}

function renderCard({
  title,
  accent,
  eyebrow,
  bg,
}: {
  title: string;
  accent: string;
  eyebrow: string;
  bg: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          backgroundColor: "#0f3f40",
          position: "relative",
        }}
      >
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bg}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(180deg, rgba(15,25,22,0.05) 30%, rgba(10,16,14,0.82) 100%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0 72px 56px",
            position: "relative",
          }}
        >
          {eyebrow ? (
            <div
              style={{
                fontSize: 26,
                letterSpacing: 6,
                textTransform: "uppercase",
                color: "#fbfbf7",
                opacity: 0.85,
                marginBottom: 14,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#fbfbf7",
              maxWidth: 1000,
            }}
          >
            <span>{title}</span>
            {accent ? (
              <span style={{ color: "#ff5d36", fontStyle: "italic", marginLeft: 18 }}>
                {accent}
              </span>
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 30,
              fontSize: 24,
              color: "#fbfbf7",
              opacity: 0.9,
            }}
          >
            <span style={{ letterSpacing: 8, textTransform: "uppercase", fontWeight: 700 }}>
              Caminante
            </span>
            <span style={{ margin: "0 16px", color: "#ff5d36" }}>·</span>
            <span>caminante.numanhub.com</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
