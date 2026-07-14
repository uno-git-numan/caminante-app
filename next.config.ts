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
        // NOTA (jul 2026): las páginas de destino (baja-california-sur,
        // estado-de-mexico, …) YA NO se reescriben al HTML estático. Ahora las
        // sirve la ruta dinámica /caminante/destinos/[estado] (data-driven desde
        // la tabla destinos), reproduciendo el diseño pixel-idéntico. Los HTML en
        // public/landing/destinos/*.html quedan como respaldo/fuente del diseño.
        //
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
