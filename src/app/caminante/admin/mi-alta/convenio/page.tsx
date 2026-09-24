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
          <span className="eyebrow"><span className="sl">{"//"}</span> Paso 03 · Tu convenio</span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            El marco una vez, <em className="ac">y un anexo por actividad.</em>
          </h2>
          <p className="desc">
            Es lo único de todo el camino que bloquea lo que viene: al firmarlo se abre tu catálogo
            el mismo día. Guardamos el documento exacto que leíste en pantalla, no una liga.
          </p>
          <p className="desc" style={{ marginTop: 10 }}>
            <Link href="/caminante/admin/mi-alta">Volver a Mi alta</Link>
          </p>
        </div>
      </div>
      <Convenio datos={datos} />
    </AdminShell>
  );
}
