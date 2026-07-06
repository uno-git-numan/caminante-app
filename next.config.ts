import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles: overrides the app route at /caminante with the static landing.
      beforeFiles: [
        {
          source: "/caminante",
          destination: "/landing/index.html",
        },
        // Páginas de destino estáticas (mismo patrón que el landing).
        {
          source: "/caminante/destinos/baja-california-sur",
          destination: "/landing/destinos/baja-california-sur.html",
        },
        {
          source: "/caminante/destinos/estado-de-mexico",
          destination: "/landing/destinos/estado-de-mexico.html",
        },
        // NOTA (jul 2026): ensenada-de-muertos y recoleccion-de-hongos YA NO se
        // reescriben al HTML estático. Ahora las sirve el template dinámico v2
        // (data.design === "v2" → ExperienceTemplateV2), pixel-idéntico al diseño
        // bespoke pero leyendo de la BD (fechas/cupo en vivo). El HTML estático
        // queda en public/landing/experiencias/*.html como respaldo/referencia.
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
