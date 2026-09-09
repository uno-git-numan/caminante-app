// EL EXPEDIENTE — paso 02 del alta, y después la sección donde vive para
// siempre. Es la misma pantalla vista desde dos momentos.
//
// Cuelga de `mi-alta/` a propósito: sólo tiene sentido para quien está dándose
// de alta o manteniendo lo suyo. La casa no entra, por la misma razón que no
// entra a «Mi alta» — no pasó por el embudo y no firma un convenio consigo
// misma.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../ui/AdminShell";
import { EXPEDIENTE_CSS } from "../../ui/expediente-css";
import { fetchMiAlta } from "@/lib/operadores/mi-alta";
import { fetchExpediente } from "@/lib/operadores/expediente";
import Expediente from "./Expediente";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tu expediente · Caminante",
  robots: { index: false, follow: false },
};

export default async function ExpedientePage() {
  const alta = await fetchMiAlta();
  if (!alta) redirect("/caminante/admin");
  if (alta.operadora?.esLaCasa) redirect("/caminante/admin");

  // ⚠️ SIN OPERADORA NO HAY EXPEDIENTE, y no es un error: quien mandó su
  // solicitud y todavía no la aprobamos no tiene fila en `operators`, así que
  // tampoco tiene dónde colgar documentos. Mandarlo a «Mi alta» le enseña el
  // paso donde SÍ está, en vez de una pantalla vacía que parecería rota.
  const operatorId = alta.operadora?.id;
  if (!operatorId) redirect("/caminante/admin/mi-alta");

  const datos = await fetchExpediente(operatorId);

  return (
    <AdminShell active="panorama">
      <style dangerouslySetInnerHTML={{ __html: EXPEDIENTE_CSS }} />
      <div className="sec-head" style={{ marginBottom: 18 }}>
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Paso 02 · Tu expediente
          </span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            Lo general una vez, <em className="ac">y una carpeta por actividad.</em>
          </h2>
          <p className="desc">
            De este expediente depende que nadie se lastime en una montaña, así que se pide
            completo y se revisa uno por uno. Lo que sirve para todo se sube una sola vez; lo
            que es propio de una actividad vive en su carpeta. Nada se sube dos veces.
          </p>
          <p className="desc" style={{ marginTop: 10 }}>
            <Link href="/caminante/admin/mi-alta">Volver a Mi alta</Link>
          </p>
        </div>
      </div>
      <Expediente datos={datos} />
    </AdminShell>
  );
}
