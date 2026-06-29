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
        // Página de experiencia estática (intercepta antes del template dinámico [slug]).
        {
          source: "/caminante/experiencias/ensenada-de-muertos",
          destination: "/landing/experiencias/ensenada-de-muertos.html",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
