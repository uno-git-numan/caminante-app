// LA PÁGINA QUE NO EXISTE, EN ESPAÑOL Y CON REGRESO (23 nov 2026).
//
// Hasta hoy una dirección mal escrita enseñaba el «404 · This page could not be
// found» de fábrica: en inglés, sin marca y sin a dónde ir. Regla app-first:
// siempre hay camino de vuelta. Y si la liga sólo traía un signo pegado al
// final, `LigaConSobras` la corrige sola antes de que esto se alcance a leer.
//
// Estilos en línea a propósito: esta página puede salir en cualquier ruta, con
// o sin la hoja de cada sección.

import LigaConSobras from "./LigaConSobras";

export const metadata = { title: "No encontramos esa página — Caminante" };

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#fbfbf7",
        color: "#20211c",
        fontFamily: "'Geist', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <LigaConSobras />
      <div style={{ maxWidth: 440, textAlign: "center" }}>
        <p style={{ fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", color: "#637154", margin: 0 }}>
          Caminante
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: "-.02em", lineHeight: 1.2, margin: "14px 0 10px" }}>
          No encontramos esa página.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "#4d5046", margin: 0 }}>
          Puede que la liga esté incompleta o que la página haya cambiado de lugar. Revisa que la dirección esté
          completa, o vuelve al inicio.
        </p>
        <p style={{ marginTop: 22 }}>
          <a
            href="/caminante"
            style={{
              display: "inline-block",
              background: "#ff5d36",
              color: "#fff",
              textDecoration: "none",
              borderRadius: 999,
              padding: "11px 24px",
              fontSize: 14.5,
              fontWeight: 600,
            }}
          >
            Ir al inicio
          </a>
        </p>
      </div>
    </main>
  );
}
