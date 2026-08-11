import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El landing de escritorio (`public/landing/index.html`) ya NO se sirve por
  // rewrite, pero la ruta `/caminante` lo LEE del disco para servirlo tal cual
  // (ver src/lib/publico/landing.ts). En Vercel el `public/` no viaja dentro de
  // la función, así que el archivo se declara aquí para que el trazado lo meta.
  outputFileTracingIncludes: {
    "/caminante": ["./public/landing/index.html"],
  },
  async rewrites() {
    return {
      beforeFiles: [
        // NOTA (ago 2026): /caminante YA NO se reescribe al HTML estático. Ahora
        // lo sirve la ruta React `src/app/caminante/page.tsx`, que renderiza el
        // MISMO HTML (leído del archivo, sin copiarlo) para escritorio y la
        // pantalla móvil nueva debajo de 700px. Un rewrite no podía hacerlo:
        // manda un documento entero o ninguno, y el patrón del sitio móvil pide
        // los dos marcados en el mismo documento (olfatear el user-agent
        // rompería el caché de Vercel). El archivo sigue siendo la fuente.
        //
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
