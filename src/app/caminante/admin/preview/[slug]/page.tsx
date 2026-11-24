// Vista previa SOLO-ADMIN de una experiencia en CUALQUIER estado (borrador o
// publicada): renderiza exactamente la misma plantilla que la página pública,
// con un listón arriba que recuerda que es preview. El público jamás la ve —
// además del gate del layout, se re-verifica admin aquí (regla del proyecto).
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { puedeEditarSlug } from "@/lib/auth/alcance";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import { fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import ExperienceTemplate from "../../../experiencias/[slug]/ExperienceTemplate";
import ExperienceTemplateV2 from "../../../experiencias/[slug]/ExperienceTemplateV2";
import WhiteLabelStyles, { wlDoc } from "../../../ui/wl/WhiteLabelStyles";
import PubStyles from "../../../ui/pub/PubStyles";
import PubShell from "../../../ui/pub/PubShell";
import ExpMovil from "../../../experiencias/[slug]/ExpMovil";
import { fetchThemeForExperience } from "@/lib/operators/branding";
import { marcaDePagina } from "@/lib/operators/marca";
import { fetchOperatorChipForExperience, fetchOperatorContactoForExperience } from "@/lib/operators/public";
import { candadoDeAlta } from "@/lib/operadores/nav-alta-servidor";

export const dynamic = "force-dynamic";

// La barra de la vista previa. En escritorio es un listón pegado arriba; en
// teléfono la página pública ocupa la pantalla entera (100dvh) y un listón le
// robaría alto y la haría brincar, así que ahí es una pastilla flotante. Va
// ABAJO, encima de la barra de compra: arriba tapaba el logo de la cabecera,
// que es justo lo que se viene a ver.
const BARRA_CSS = `
.pv-barra{position:sticky;top:0;z-index:300;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;padding:10px 16px;background:#20392b;color:#fbfbf7;font-size:13px;font-family:system-ui,sans-serif}
.pv-barra .corto{display:none}
@media(max-width:699px){
.pv-barra{position:fixed;top:auto;bottom:calc(92px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100vw - 20px);flex-wrap:nowrap;gap:10px;padding:6px 6px 6px 14px;border-radius:999px;font-size:12px;box-shadow:0 10px 26px -12px rgba(0,0,0,.7)}
.pv-barra .largo{display:none}
.pv-barra .corto{display:inline;white-space:nowrap}
}
`;

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Solo sobre SU experiencia (la casa, sobre cualquiera).
  if (!(await puedeEditarSlug((await params).slug))) redirect("/caminante/entrar");

  const { slug } = await params;
  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experiences")
    .select("id, data, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!row?.data) notFound();

  const e = row.data as Experience;
  const esBorrador = row.status !== "published";
  // Diseño v2: mismas fechas en vivo que la página pública (funciona con borradores).
  const slots =
    e.design === "v2"
      ? await fetchOpenSlotsForTemplate((row as { id: string }).id, { includePrivate: true })
      : [];

  // CON LA MARCA DE QUIEN LA OPERA (23 nov 2026). La página pública se viste
  // con el tema de la operadora (white-label F1); esta vista previa no lo
  // pedía, así que una operadora que acababa de poner su logo y sus colores
  // veía su experiencia con los de Caminante. Es la primera vez que ve «lo
  // suyo»: tiene que ser lo que de verdad verá su cliente.
  const tema = await fetchThemeForExperience(slug);
  // Lo mismo que recibe la página pública: el chip «Operada por» (sólo si su
  // perfil ya es público) y el contacto de quien opera en el bloque de cierre.
  const [operatorChip, contactoOperador] = await Promise.all([
    fetchOperatorChipForExperience((row as { id: string }).id),
    fetchOperatorContactoForExperience((row as { id: string }).id),
  ]);
  // Quien sigue en su alta vuelve a Mi alta, no al editor: ver su página es
  // un paso del recorrido, y el que sigue son sus documentos.
  const candado = await candadoDeAlta();
  const enAlta = !!candado && candado.estado !== "abierto";

  return (
    <div>
      <WhiteLabelStyles theme={tema} />
      <style dangerouslySetInnerHTML={{ __html: BARRA_CSS }} />
      {e.design === "v2" ? <PubStyles /> : null}
      <div className="pv-barra">
        <span className="largo">
          👁️ Vista previa {esBorrador ? "del BORRADOR" : "(ya publicada)"} — así la verá el
          viajero{esBorrador ? " cuando la publiques. Solo tú puedes ver esta página." : "."}
        </span>
        <span className="corto">Vista previa</span>
        {/* ⚠️ EN SU ALTA, LA ÚNICA SALIDA ES CONTINUAR. «Seguir editando» abre
            el editor completo —17 secciones—: Luis lo picó a media alta y cayó
            en una pantalla que no tiene nada que ver con lo que estaba
            haciendo. Fuera del alta, el editor es justo a donde se vuelve. */}
        {enAlta ? (
          <Link
            href="/caminante/admin/mi-alta"
            style={{
              color: "#20392b", background: "#fbfbf7", border: "1px solid #fbfbf7",
              borderRadius: 999, padding: "3px 14px", textDecoration: "none", fontWeight: 600,
            }}
          >
            Continuar con mi alta
          </Link>
        ) : (
          <Link
            href={`/caminante/admin/experiencias/${slug}`}
            style={{
              color: "#fbfbf7", border: "1px solid rgba(251,251,247,.4)",
              borderRadius: 999, padding: "3px 14px", textDecoration: "none",
            }}
          >
            Seguir editando
          </Link>
        )}
      </div>
      {e.design === "v2" ? (
        // LOS DOS MARCADOS, IGUAL QUE LA PÁGINA PÚBLICA (23 nov 2026). La
        // pública pinta una plantilla para escritorio y OTRA para teléfono, y
        // el CSS elige (corte en 700 px). Esta vista previa sólo pintaba la de
        // escritorio: en un teléfono enseñaba esa misma, encogida, que no es lo
        // que ve el cliente. «Así la verá el viajero» tiene que ser cierto
        // también en el teléfono, que es donde más se abre.
        <>
          <div className={wlDoc(tema) ? `pub-no ${wlDoc(tema)}` : "pub-no"}>
            <ExperienceTemplateV2 experience={e} slots={slots} operatorChip={operatorChip} contactoOperador={contactoOperador} marca={marcaDePagina(tema)} />
          </div>
          <PubShell buypad scope={wlDoc(tema)}>
            <ExpMovil experience={e} slots={slots} operatorChip={operatorChip} rating={null} marca={marcaDePagina(tema)} />
          </PubShell>
        </>
      ) : (
        <div className={wlDoc(tema)}>
          <ExperienceTemplate experience={e} />
        </div>
      )}
    </div>
  );
}
