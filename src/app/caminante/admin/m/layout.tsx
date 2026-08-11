import type { Metadata } from "next";
import { MOVIL_CSS } from "@/lib/admin/movil-css";

// La app de admin en móvil se sirve como aplicación: ocupa la pantalla, trae su
// propia barra de pestañas y su propio regreso. El gate de admin lo pone el
// layout de /caminante/admin, que envuelve a este.

export const metadata: Metadata = {
  title: "Caminante · Admin",
  // Sin zoom del navegador: los targets ya son de 44pt y el zoom accidental al
  // tocar dos veces rompe la sensación de app.
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  robots: { index: false, follow: false },
};

export default function MovilLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MOVIL_CSS }} />
      {children}
    </>
  );
}
