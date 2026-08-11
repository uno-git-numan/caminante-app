import type { Metadata } from "next";
import { FIN_CSS } from "@/lib/admin/tablero-css";

// Ruta INMERSIVA: el entregable trae su propio shell (header, nav, página) y
// su CSS usa clases genéricas. Montarla dentro de AdminShell haría que `.adm` y
// el CSS del tablero se pelearan por `.card`, `.row` y `.chip`.

export const metadata: Metadata = {
  title: "Rentabilidad · Admin — Caminante",
  robots: { index: false, follow: false },
};

export default function RentabilidadLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FIN_CSS }} />
      <div className="fin">{children}</div>
    </>
  );
}
