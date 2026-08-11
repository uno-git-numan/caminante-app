import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchExperienceBySlug,
  fetchPublishedExperienceRow,
} from "@/lib/experiences/queries";
import { cleanGrupoToken, fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import { fetchOperatorChipForExperience } from "@/lib/operators/public";
import { fetchExperienceRatings } from "@/lib/experiences/ratings";
import { getCurrentRole } from "@/lib/auth/authorization";
import PubStyles from "../../ui/pub/PubStyles";
import PubShell from "../../ui/pub/PubShell";
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
    const [slots, sessionRole, operatorChip, ratings] = await Promise.all([
      fetchOpenSlotsForTemplate(row.id, { grupoToken }),
      getCurrentRole(),
      fetchOperatorChipForExperience(row.id),
      fetchExperienceRatings(),
    ]);
    // Se renderizan los DOS marcados y el CSS decide cuál se ve (corte en
    // 700px, PUB_SWAP_CSS): abajo el teléfono, arriba el escritorio de hoy,
    // intacto. Ver design/publico-movil/PATRON.md.
    return (
      <>
        <PubStyles />
        <div className="pub-no">
          <ExperienceTemplateV2
            experience={row.experience}
            slots={slots}
            grupoToken={grupoToken}
            sessionRole={sessionRole}
            operatorChip={operatorChip}
          />
        </div>
        <PubShell buypad>
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

  // Template legacy (4 caras/contexto/impacto).
  const e = row?.experience ?? (await fetchExperienceBySlug(slug));
  if (!e || e.status !== "published") notFound();
  return <ExperienceTemplate experience={e} />;
}
