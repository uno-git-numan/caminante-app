import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchExperienceBySlug,
  fetchPublishedExperienceRow,
} from "@/lib/experiences/queries";
import { cleanGrupoToken, fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import { fetchOperatorChipForExperience } from "@/lib/operators/public";
import { fetchThemeForExperience } from "@/lib/operators/branding";
import { fetchExperienceRatings } from "@/lib/experiences/ratings";
import { getCurrentRole } from "@/lib/auth/authorization";
import PubStyles from "../../ui/pub/PubStyles";
import PubShell from "../../ui/pub/PubShell";
import WhiteLabelStyles, { wlDoc } from "../../ui/wl/WhiteLabelStyles";
import ExperienceTemplate from "./ExperienceTemplate";
import ExperienceTemplateV2 from "./ExperienceTemplateV2";
import ExpMovil from "./ExpMovil";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ grupo?: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const e = await fetchExperienceBySlug(slug);
  const title = e?.page?.docTitle || e?.docTitle;
  return { title: title || "Experiencia · Caminante" };
}

export default async function ExperiencePage({ params, searchParams }: Params) {
  const { slug } = await params;
  // Link de grupo privado (?grupo=<token>): revela ADEMÁS la salida privada
  // de ese token. Sin el link, esa fecha no existe para la web.
  const grupoToken = cleanGrupoToken((await searchParams).grupo);

  // Diseño v2 (bespoke ensenada/hongos, data-driven): necesita el id de la fila
  // para leer sus salidas y pintar las fechas en vivo.
  const row = await fetchPublishedExperienceRow(slug);
  if (row?.experience.design === "v2") {
    const [slots, sessionRole, operatorChip, ratings, tema] = await Promise.all([
      fetchOpenSlotsForTemplate(row.id, { grupoToken }),
      getCurrentRole(),
      fetchOperatorChipForExperience(row.id),
      fetchExperienceRatings(),
      // White-label F1: si el viaje es de un operador con marca, el funnel se
      // viste con la suya desde aquí. Best-effort — sin marca devuelve null.
      fetchThemeForExperience(slug),
    ]);
    // Se renderizan los DOS marcados y el CSS decide cuál se ve (corte en
    // 700px, PUB_SWAP_CSS): abajo el teléfono, arriba el escritorio de hoy,
    // intacto. Ver design/publico-movil/PATRON.md.
    return (
      <>
        <PubStyles />
        <WhiteLabelStyles theme={tema} />
        {/* El escritorio de la experiencia lo pinta TEMPLATE_V2_CSS, que habla
            el vocabulario de marca (y encima lo declara en :root). Por eso aquí
            va `wl-doc`, no `wl-app`: no hay una sola utilidad de Tailwind. */}
        <div className={wlDoc(tema) ? `pub-no ${wlDoc(tema)}` : "pub-no"}>
          <ExperienceTemplateV2
            experience={row.experience}
            slots={slots}
            grupoToken={grupoToken}
            sessionRole={sessionRole}
            operatorChip={operatorChip}
          />
        </div>
        <PubShell buypad scope={wlDoc(tema)}>
          <ExpMovil
            experience={row.experience}
            slots={slots}
            grupoToken={grupoToken}
            operatorChip={operatorChip}
            rating={ratings.get(row.id) ?? null}
          />
        </PubShell>
      </>
    );
  }

  // Template legacy (4 caras/contexto/impacto). NO se viste de white-label: no
  // hay ninguna experiencia publicada con este diseño (el constructor genera v2
  // desde hace meses) y su CSS es otro vocabulario más. Si alguna vez vuelve a
  // publicarse una legacy de un operador, hay que darle su propio scope.
  const e = row?.experience ?? (await fetchExperienceBySlug(slug));
  if (!e || e.status !== "published") notFound();
  return <ExperienceTemplate experience={e} />;
}
