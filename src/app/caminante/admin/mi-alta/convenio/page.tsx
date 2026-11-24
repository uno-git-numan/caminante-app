// EL CONVENIO Y SUS ANEXOS — el paso que abre el catálogo.
//
// Vive bajo `mi-alta/` como el expediente: sólo tiene sentido para quien se
// está dando de alta o mantiene lo suyo. La casa no entra — no firma un
// convenio consigo misma.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../ui/AdminShell";
import { MI_ALTA_CSS } from "../../ui/mi-alta-css";
import { fetchMiAlta } from "@/lib/operadores/mi-alta";
import Convenio from "./Convenio";
import { datosDeFirma } from "@/lib/operadores/datos-firma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tu convenio · Caminante",
  robots: { index: false, follow: false },
};

export default async function ConvenioPage() {
  const alta = await fetchMiAlta();
  if (!alta) redirect("/caminante/admin");
  if (alta.operadora?.esLaCasa) redirect("/caminante/admin");
  const operatorId = alta.operadora?.id;
  if (!operatorId) redirect("/caminante/admin/mi-alta");

  const datos = await datosDeFirma(operatorId);

  return (
    <AdminShell active="panorama">
      <style dangerouslySetInnerHTML={{ __html: MI_ALTA_CSS }} />
      <div className="sec-head" style={{ marginBottom: 18 }}>
        <div>
          <span className="eyebrow"><span className="sl">{"//"}</span> Paso 04 · Tu convenio</span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            El marco una vez, <em className="ac">y un anexo por actividad.</em>
          </h2>
          <p className="desc">
            Con tu firma tu experiencia ya se puede publicar; después sólo falta tu cuenta de
            cobro. Guardamos el documento exacto que leíste en pantalla, no una liga.
          </p>
          <p className="desc" style={{ marginTop: 10 }}>
            <Link href="/caminante/admin/mi-alta">Volver a Mi alta</Link>
          </p>
        </div>
      </div>
      <Convenio datos={datos} />
      {/* CADA PASO DICE QUÉ SIGUE (Luis, 23 nov 2026: «debería de haber un
          botón para continuar»). Mi alta abre sola en el primero que falta. */}
      {false ? null : (
        <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 26 }}>
          <Link className="btn btn-orange" href="/caminante/admin/mi-alta">
            Continuar con mi alta
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
