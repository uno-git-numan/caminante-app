// Versión IMPRIMIBLE (→ PDF) de una experiencia, para compartir. Solo-admin.
// Renderiza la misma página v2 con una hoja de impresión que: fuerza el color
// de fondos/fotos (si no, Chrome imprime los bloques oscuros en blanco), fija
// alturas de las secciones a sangre, evita cortes feos y elige orientación
// (vertical/horizontal) según ?o=. Auto-dispara el diálogo de impresión al
// cargar (tras cargar las imágenes) → el admin elige "Guardar como PDF".
import { notFound, redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import { fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import ExperienceTemplate from "../../../experiencias/[slug]/ExperienceTemplate";
import ExperienceTemplateV2 from "../../../experiencias/[slug]/ExperienceTemplateV2";

export const dynamic = "force-dynamic";

function printCss(landscape: boolean): string {
  // Alturas de las secciones a sangre, afinadas por orientación (A4).
  const heroH = landscape ? 600 : 840;
  const bandH = landscape ? 440 : 520;
  return `
@page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 0; }
@media print {
  html, body { background:#fff !important; }
  *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  /* fuera el chrome no imprimible */
  .nav, .drawer, .print-bar { display: none !important; }
  /* secciones a pantalla completa → alturas fijas y predecibles en papel */
  .hero { min-height: 0 !important; height: ${heroH}px !important; }
  .medi { min-height: 0 !important; height: ${bandH}px !important; }
  .itin, .faq, .close { min-height: 0 !important; }
  .section { padding: 34px 0 !important; }
  /* evitar que se partan a la mitad los elementos atómicos */
  .day, .rep-card, .ally, .qa, .date-card, .tariff, .glasscard, .glasscard-c,
  .pk, .inc-item, .pt, .mosaic, .photo, .crow { break-inside: avoid; }
  /* backdrop-filter no imprime → fondo sólido para que se lea el glass */
  .glass, .glasscard, .glasscard-c, .date-card { backdrop-filter: none !important; }
}
`;
}

const AUTOPRINT = `
window.addEventListener('load', function () {
  var imgs = Array.prototype.slice.call(document.images);
  Promise.all(imgs.map(function (img) {
    return img.complete ? true : new Promise(function (res) { img.onload = img.onerror = res; });
  })).then(function () { setTimeout(function () { window.print(); }, 500); });
});
`;

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ o?: string }>;
}) {
  if (!(await isCurrentUserAdmin())) redirect("/caminante/entrar");

  const { slug } = await params;
  const { o } = await searchParams;
  const landscape = o === "h";

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experiences")
    .select("id, data")
    .eq("slug", slug)
    .maybeSingle();
  if (!row?.data) notFound();

  const e = row.data as Experience;
  const slots =
    e.design === "v2" ? await fetchOpenSlotsForTemplate((row as { id: string }).id) : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printCss(landscape) }} />
      {e.design === "v2" ? (
        <ExperienceTemplateV2 experience={e} slots={slots} />
      ) : (
        <ExperienceTemplate experience={e} />
      )}
      <script dangerouslySetInnerHTML={{ __html: AUTOPRINT }} />
    </>
  );
}
