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
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
