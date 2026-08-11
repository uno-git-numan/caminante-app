import { PUB_CSS, PUB_CSS_MOVIL, PUB_SWAP_CSS } from "@/lib/publico/movil-css";

// Inyecta el CSS del sitio público móvil.
//
// Dos modos, y la diferencia importa:
//
//   · `swap` (el normal) — la ruta YA tiene vista de escritorio. El diseño se
//     encierra en `@media (max-width:699px)` y arriba de 700px se esconde el
//     `.pub` y se enseña el marcado de siempre. Escritorio intacto.
//   · `solo` — la ruta es NUEVA (hoy da 404). No hay escritorio que respetar,
//     así que el diseño aplica en todo ancho; el propio entregable trae su
//     presentación para pantalla grande (la tarjeta de 390px centrada).

export default function PubStyles({ modo = "swap" }: { modo?: "swap" | "solo" }) {
  const css = modo === "solo" ? PUB_CSS : `${PUB_CSS_MOVIL}\n${PUB_SWAP_CSS}`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
