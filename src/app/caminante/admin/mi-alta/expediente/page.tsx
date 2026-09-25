// EL EXPEDIENTE — paso 02 del alta, y después la sección donde vive para
// siempre. Es la misma pantalla vista desde dos momentos.
//
// Cuelga de `mi-alta/` a propósito: sólo tiene sentido para quien está dándose
// de alta o manteniendo lo suyo. La casa no tiene expediente propio —no pasó por
// el embudo y no firma un convenio consigo misma— pero SÍ entra aquí POR una
// operadora (`?operadora=<id>`): es onboarding. Hasta el 22 sep 2026 la casa
// era rebotada sin más, y cuando el candado mandaba a una operadora atorada a
// esta pantalla y la pantalla la rebotaba también, nadie podía subir un papel
// por nadie (design/mvp/MVP.md §1).

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdminShell from "../../ui/AdminShell";
import { EXPEDIENTE_CSS } from "../../ui/expediente-css";
import { fetchMiAlta } from "@/lib/operadores/mi-alta";
import { alcanceActual } from "@/lib/auth/alcance";
import { fetchExpediente, fetchBorradorDelCandado, nombreDeOperadora } from "@/lib/operadores/expediente";
import Expediente from "./Expediente";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Tu expediente · Caminante",
  robots: { index: false, follow: false },
};

export default async function ExpedientePage({
  searchParams,
}: {
  searchParams: Promise<{ borrador?: string; actividad?: string; operadora?: string }>;
}) {
  // El equipo de numan (0070) entra POR una operadora, como la casa.
  const equipoNuman = (await alcanceActual())?.tipo === "equipo";
  const alta = equipoNuman ? null : await fetchMiAlta();
  if (!alta && !equipoNuman) redirect("/caminante/admin");
  const q = await searchParams;

  // ¿De quién es el expediente que se pinta? De la operadora en sesión — o, si
  // quien entra es la casa, de la que pidió por query string. La casa sin decir
  // por quién no tiene nada que ver aquí: va a Comunidad, donde están todas.
  //
  // ⚠️ Que la casa PUEDA decir cualquier id no es un hueco: es la casa. Lo que
  // sí se comprueba es que exista, para no pintar un expediente en blanco de
  // nadie con cara de «está vacío».
  let operatorId: string;
  let porOtra: { id: string; nombre: string } | null = null;
  if (equipoNuman || alta?.operadora?.esLaCasa) {
    const pedida = (q.operadora ?? "").trim();
    const nombre = pedida ? await nombreDeOperadora(pedida) : null;
    if (!pedida || !nombre) redirect("/caminante/admin/plataforma/comunidad");
    operatorId = pedida;
    porOtra = { id: pedida, nombre };
  } else {
    // ⚠️ SIN OPERADORA NO HAY EXPEDIENTE, y no es un error: quien mandó su
    // solicitud y todavía no la aprobamos no tiene fila en `operators`, así que
    // tampoco tiene dónde colgar documentos. Mandarlo a «Mi alta» le enseña el
    // paso donde SÍ está, en vez de una pantalla vacía que parecería rota.
    const propia = alta?.operadora?.id;
    if (!propia) redirect("/caminante/admin/mi-alta");
    operatorId = propia;
  }

  const datos = await fetchExpediente(operatorId);

  // ⚠️ EL BORRADOR SE RESUELVE CONTRA LA BASE Y CONTRA EL DUEÑO. El slug llega
  // por query string, o sea que lo puede escribir cualquiera: sin filtrar por
  // `operator_id` esta pantalla diría el título de una experiencia ajena.
  const traido = await fetchBorradorDelCandado(operatorId, q.borrador, q.actividad);

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
            {porOtra ? (
              <Link href="/caminante/admin/plataforma/comunidad">Volver a Comunidad</Link>
            ) : (
              <Link href="/caminante/admin/mi-alta">Volver a Mi alta</Link>
            )}
          </p>
        </div>
      </div>
      <Expediente datos={datos} traido={traido} porOtra={porOtra} />
    </AdminShell>
  );
}
