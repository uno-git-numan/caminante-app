// MI ALTA — la única pantalla del panel que NO es para la casa.
//
// El resto del panel responde «cómo va mi negocio». Ésta responde «cómo voy
// yo», y la hace la operadora. Por eso vive dentro del panel y no en una ruta
// aparte: el día que se abre su alta, lo que ve primero es esto, y las demás
// secciones se van encendiendo detrás.
//
// `fetchMiAlta` estaba escrita y completa desde antes, y NINGÚN componente la
// importaba. Lo que faltaba era exactamente esta pantalla.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminShell from "../ui/AdminShell";
import { MI_ALTA_CSS } from "../ui/mi-alta-css";
import { fetchMiAlta } from "@/lib/operadores/mi-alta";
import MiAlta from "./MiAlta";
import { pasoDe } from "@/lib/operadores/pasos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Mi alta · Caminante",
  robots: { index: false, follow: false },
};

export default async function MiAltaPage() {
  const datos = await fetchMiAlta();
  // Sin solicitud y sin operadora no hay recorrido que enseñar. Es el caso de
  // la casa entrando a su propia URL: se va a su panorama y ya.
  if (!datos) redirect("/caminante/admin");
  const ORDINAL = ["primero", "segundo", "tercero", "cuarto"];
  const aqui = pasoDe(datos.estado);

  return (
    <AdminShell active="panorama">
      <style dangerouslySetInnerHTML={{ __html: MI_ALTA_CSS }} />
      <div className="sec-head">
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> Mi alta
          </span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            Cuatro pasos, <em className="ac">y vas en el {ORDINAL[aqui.indice]}.</em>
          </h2>
          <p className="desc">
            Las secciones del panel se abren cuando termines tu alta. Aquí ves dónde vas y qué
            falta; puedes asomarte a cualquier paso aunque todavía no te toque.
          </p>
        </div>
      </div>
      <MiAlta datos={datos} />
    </AdminShell>
  );
}
