import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caminante Platform",
  description: "Caminante travel platform under numanhub.com/caminante",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className="antialiased">{children}</body>
    </html>
  );
}
