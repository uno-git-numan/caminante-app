import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Immersive static editorial experience page (Caminante 1).
        source: "/caminante/experiencias/ensenada-de-muertos",
        destination: "/experiencias/ensenada-de-muertos/index.html",
      },
    ];
  },
};

export default nextConfig;
