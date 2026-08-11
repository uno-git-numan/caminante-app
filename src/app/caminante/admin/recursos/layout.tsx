import type { Metadata } from "next";
import { FIN_CSS, FIN_EXTRA_CSS } from "@/lib/admin/tablero-css";

// Ruta INMERSIVA: el entregable trae su propio shell (header, nav, página) y
// su CSS usa clases genéricas. Montarla dentro de AdminShell haría que `.adm` y
// el CSS del tablero se pelearan por `.card`, `.row` y `.chip` — misma
// especificidad, gana la hoja que se cargue después. Por eso el header y el
// nav se dibujan aquí dentro, pero leyendo la MISMA lista que AdminShell
// (`ui/nav.ts`), que es lo que evita que los dos navs vuelvan a derivar.

export const metadata: Metadata = {
  title: "Recursos · Admin — Caminante",
  robots: { index: false, follow: false },
};

export default function RecursosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FIN_CSS + FIN_EXTRA_CSS }} />
      <div className="fin">{children}</div>
    </>
  );
}
