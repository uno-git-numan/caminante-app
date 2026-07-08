import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caminante — Naturaleza en movimiento",
  description: "Experiencias inmersivas en la naturaleza. Retiros, caminatas y aventuras que conectan cuerpo, mente y entorno.",
  openGraph: {
    title: "Caminante — Naturaleza en movimiento",
    description: "Experiencias inmersivas en la naturaleza. Retiros, caminatas y aventuras.",
    siteName: "Caminante",
    locale: "es_MX",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className="antialiased">
        {children}
        {/* Vercel Web Analytics — tráfico, referrers, páginas. Requiere Analytics
            habilitado en el proyecto de Vercel (sirve /_vercel/insights/script.js). */}
        <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
