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
import Link from "next/link";
import AdminShell from "../ui/AdminShell";
import { MI_ALTA_CSS } from "../ui/mi-alta-css";
import { fetchMiAlta } from "@/lib/operadores/mi-alta";
import { nombreDeOperadora } from "@/lib/operadores/expediente";
import { sombreroPuesto } from "@/lib/auth/sombrero";
import { datosDeFirma } from "@/lib/operadores/datos-firma";
import MiAlta from "./MiAlta";
import { pasoDe } from "@/lib/operadores/pasos";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Mi alta · Caminante",
  robots: { index: false, follow: false },
};

export default async function MiAltaPage({
  searchParams,
}: {
  searchParams: Promise<{ operadora?: string }>;
}) {
  const propia = await fetchMiAlta();
  // Sin solicitud y sin operadora no hay recorrido que enseñar.
  if (!propia) redirect("/caminante/admin");

  // ⚠️ LA CASA NO TIENE ALTA PROPIA. Su fila en `operators` existe para
  // atribuirse sus experiencias, no porque haya pasado por el embudo: no mandó
  // solicitud, no tuvo llamada y no se firma un convenio consigo misma. Al
  // entrar aquí veía su propia ficha y salía la contradicción «1 de 6 · puedes
  // vender» —los candados en rojo y el veredicto en verde— porque para la casa
  // `puedeCobrar` está resuelto aparte de los candados.
  //
  // Lo que SÍ tiene la casa es alta que hacer POR otra. El alta se hace
  // acompañada —Luis captura en la llamada— y hasta el 24 sep 2026 podía entrar
  // por separado al expediente, al cobro y a la marca de una operadora con
  // `?operadora=`, pero no a la pantalla que las junta y dice en qué paso va:
  // ésta rebotaba. O sea que la única puerta que enseña el recorrido completo
  // era la única cerrada para quien acompaña el recorrido.
  let datos = propia;
  let porOtra: { id: string; nombre: string } | null = null;
  if (propia.operadora?.esLaCasa) {
    const pedida = ((await searchParams).operadora ?? "").trim();

    // SIN `?operadora=`, EL SOMBRERO DICE DE QUIÉN. Con el de Kéntro puesto,
    // «Mi alta» es la de Kéntro: es lo que el nav ofrece y lo que se espera.
    //
    // ⚠️ PERO SE ESCRIBE EN LA URL, no se lee de la cookie y ya. De aquí salen
    // actos —subir documentos, declarar actividades, conectar Stripe— y un acto
    // nunca se decide con el sombrero (invariante #22). Redirigir a
    // `?operadora=<id>` hace que cada liga de esta pantalla, y cada acción que
    // cuelgue de ella, lleve el id EXPLÍCITO. La cookie sólo eligió el default,
    // una vez, y a la vista.
    if (!pedida) {
      const puesto = await sombreroPuesto();
      if (puesto && !puesto.esLaCasa) {
        redirect(`/caminante/admin/mi-alta?operadora=${encodeURIComponent(puesto.id)}`);
      }
      redirect("/caminante/admin/plataforma/comunidad");
    }

    const nombre = await nombreDeOperadora(pedida);
    if (!nombre) redirect("/caminante/admin/plataforma/comunidad");
    const suya = await fetchMiAlta(pedida);
    if (!suya) redirect("/caminante/admin/plataforma/comunidad");
    datos = suya;
    porOtra = { id: pedida, nombre };
  }

  // ⚠️ LA CASA NO TIENE ALTA, TAMPOCO VISTA POR OTRA. Con `?operadora=` de la
  // fila de la casa (Caminante, mientras cargue `es_la_casa`), esta pantalla
  // pintaba la contradicción de siempre: los candados en rojo y «puedes
  // vender» en verde. Se dice en vez de pintarse mal, y en vez de rebotar —un
  // rebote sin explicación fue justo lo que Luis reportó de esta pantalla—.
  if (datos.operadora?.esLaCasa) {
    return (
      <AdminShell active="panorama">
        <style dangerouslySetInnerHTML={{ __html: MI_ALTA_CSS }} />
        <div className="sec-head">
          <div>
            <span className="eyebrow">
              <span className="sl">{"//"}</span> Alta de {porOtra?.nombre ?? "la casa"}
            </span>
            <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
              Esta operadora <em className="ac">no tiene alta.</em>
            </h2>
          </div>
        </div>
        <div className="verdict casa">
          <span className="n">{"//"}</span>
          <span className="g">
            <b>Es la operadora de la casa: no pasó por el embudo</b>
            <span>
              No mandó solicitud, no firma convenio consigo misma y hoy no paga comisión, así que
              no hay seis candados que seguir. Cuando Druidas exista y esta operadora cobre por su
              cuenta y pague comisión, su alta aparecerá aquí sola.
            </span>
            <span style={{ marginTop: 8 }}>
              <Link href="/caminante/admin/plataforma/comunidad">Ver a las operadoras</Link>
            </span>
          </span>
        </div>
      </AdminShell>
    );
  }

  // LA FIRMA VA DENTRO DEL PASO 03 (lámina «Panel Operadora»). Sólo se arma
  // para la operadora sobre sí misma: la casa no firma por nadie —firmar es un
  // acto, y un acto no se decide con el sombrero (invariante #22)—, así que
  // actuando por otra el paso 03 dice quién firma en vez de ofrecer un botón
  // que rebotaría.
  const firma =
    !porOtra && datos.operadora && !datos.operadora.esLaCasa
      ? await datosDeFirma(datos.operadora.id)
      : null;

  const ORDINAL = ["primero", "segundo", "tercero", "cuarto"];
  const aqui = pasoDe(datos.estado);

  return (
    <AdminShell active="panorama">
      <style dangerouslySetInnerHTML={{ __html: MI_ALTA_CSS }} />
      <div className="sec-head">
        <div>
          <span className="eyebrow">
            <span className="sl">{"//"}</span> {porOtra ? `Alta de ${porOtra.nombre}` : "Mi alta"}
          </span>
          <h2 className="display" style={{ fontSize: 30, marginTop: 8 }}>
            Cuatro pasos, <em className="ac">y va{porOtra ? "" : "s"} en el {ORDINAL[aqui.indice]}.</em>
          </h2>
          <p className="desc">
            Las secciones del panel se abren cuando termine el alta. Aquí se ve dónde va y qué
            falta; se puede asomar a cualquier paso aunque todavía no toque.
          </p>
          {/* ⚠️ EL TEXTO DE ABAJO LE HABLA A LA OPERADORA DE TÚ, y cuando lo lee
              la casa sigue diciendo «tu convenio», «tu marca». No se tradujo a
              tercera persona a propósito: son cuarenta frases transcritas de la
              lámina y reescribirlas duplicaría el copy para ganar poco. Lo que
              sí hace falta es que quien lo lee sepa de quién es el alta que
              está tocando —lo que suba y lo que firme queda a nombre de ella—,
              y eso lo dice este renglón. */}
          {porOtra ? (
            <div className="verdict casa" style={{ marginTop: 14 }}>
              <span className="n">{"//"}</span>
              <span className="g">
                <b>Estás actuando por {porOtra.nombre}</b>
                <span>
                  Lo que subas o captures aquí queda a su nombre, no al tuyo. El texto de esta
                  pantalla le habla a ella de tú.
                </span>
                <span style={{ marginTop: 8 }}>
                  <Link href="/caminante/admin/plataforma/comunidad">Volver a Comunidad</Link>
                  {" · "}
                  <Link href="/caminante/admin/operadores">Ficha del operador</Link>
                </span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <MiAlta datos={datos} porOtra={porOtra?.id ?? null} firma={firma} />
    </AdminShell>
  );
}
