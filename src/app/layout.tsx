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

// Id del pixel (dataset "Caminante Web"). Configurable por env, con fallback al
// literal — así nada se rompe si falta la env. El mismo id vive en los HTML
// estáticos (public/landing/*.html) y en lib/meta/capi.ts.
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "1510394930300051";

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
        {/* Meta Pixel (dataset "Caminante Web") — PageView base en todas las rutas
            React. Los eventos finos de embudo (ViewContent/InitiateCheckout/Lead/
            CompleteRegistration) se disparan desde sus componentes cliente vía
            lib/meta/pixel; el Purchase es server-side vía Conversions API
            (lib/meta/capi). Las páginas estáticas (landing/destinos) traen su
            propio snippet base porque no pasan por este layout. */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
      </body>
    </html>
  );
}
