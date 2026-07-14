import type { CSSProperties } from "react";
import type { PhotoAdjust } from "@/lib/operators/public";

// Estilo del <img> según el ajuste de encuadre (recorte tipo cropper): base
// object-fit:cover; el zoom + reposición se aplican con translate + scale sobre
// el % del propio contenedor → consistente en cualquier tamaño (editor y página).
// x/y = desplazamiento en % (negativo = arriba/izquierda). Sin ajuste → cover.
export function adjustStyle(a: PhotoAdjust | null | undefined): CSSProperties {
  const base: CSSProperties = { width: "100%", height: "100%", objectFit: "cover", display: "block" };
  if (!a) return base;
  return { ...base, transform: `translate(${a.x}%, ${a.y}%) scale(${a.zoom})`, transformOrigin: "center" };
}
