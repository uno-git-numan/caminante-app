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
        {/* Meta Pixel (dataset "Caminante Web", id 1510394930300051) — PageView base.
            Alimenta retargeting/Custom Audiences y, con Conversions API, la
            optimización de anuncios a compradores reales. Eventos finos
            (ViewContent/InitiateCheckout/Purchase) se agregan después. */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1510394930300051');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src="https://www.facebook.com/tr?id=1510394930300051&ev=PageView&noscript=1"
          />
        </noscript>
      </body>
    </html>
  );
}
