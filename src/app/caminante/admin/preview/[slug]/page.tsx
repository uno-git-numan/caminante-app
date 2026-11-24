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
import { fetchThemeForExperience } from "@/lib/operators/branding";
import { candadoDeAlta } from "@/lib/operadores/nav-alta-servidor";

export const dynamic = "force-dynamic";

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
  // Quien sigue en su alta vuelve a Mi alta, no al editor: ver su página es
  // un paso del recorrido, y el que sigue son sus documentos.
  const candado = await candadoDeAlta();
  const enAlta = !!candado && candado.estado !== "abierto";

  return (
    <div>
      <WhiteLabelStyles theme={tema} />
      <div
        style={{
          position: "sticky", top: 0, zIndex: 200, display: "flex",
          alignItems: "center", justifyContent: "center", gap: 14,
          padding: "10px 16px", background: "#20392b", color: "#fbfbf7",
          fontSize: 13, fontFamily: "system-ui, sans-serif", flexWrap: "wrap",
        }}
      >
        <span>
          👁️ Vista previa {esBorrador ? "del BORRADOR" : "(ya publicada)"} — así la verá el
          viajero{esBorrador ? " cuando la publiques. Solo tú puedes ver esta página." : "."}
        </span>
        <Link
          href={`/caminante/admin/experiencias/${slug}`}
          style={{
            color: "#fbfbf7", border: "1px solid rgba(251,251,247,.4)",
            borderRadius: 999, padding: "3px 14px", textDecoration: "none",
          }}
        >
          Seguir editando
        </Link>
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
        ) : null}
      </div>
      <div className={wlDoc(tema)}>
        {e.design === "v2" ? (
          <ExperienceTemplateV2 experience={e} slots={slots} />
        ) : (
          <ExperienceTemplate experience={e} />
        )}
      </div>
    </div>
  );
}
