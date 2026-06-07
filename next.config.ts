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
      ],
      // afterFiles: static immersive experience pages (Caminante 1).
      afterFiles: [
        {
          source: "/caminante/experiencias/ensenada-de-muertos",
          destination: "/experiencias/ensenada-de-muertos/index.html",
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
