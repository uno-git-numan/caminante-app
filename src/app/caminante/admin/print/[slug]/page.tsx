// Versión IMPRIMIBLE (→ PDF) de una experiencia, para compartir. Solo-admin.
// Genera un DECK: un slide por sección a tamaño fijo (16:9 horizontal / 9:16
// vertical según ?o=), al estilo de los flyers de referencia. Cada slide = una
// página exacta (@page + page-break) → sin cortes ni componentes perdidos.
// Auto-dispara el diálogo de impresión al cargar → el admin elige "Guardar como PDF".
import { notFound, redirect } from "next/navigation";
import { isCurrentUserAdmin } from "@/lib/auth/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import { fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import { deckCss } from "@/lib/experiences/deck-css";
import ExperienceDeck from "../../../experiencias/[slug]/ExperienceDeck";

export const dynamic = "force-dynamic";

const AUTOPRINT = `
window.addEventListener('load', function () {
  var imgs = Array.prototype.slice.call(document.images);
  Promise.all(imgs.map(function (img) {
    return img.complete ? true : new Promise(function (res) { img.onload = img.onerror = res; });
  })).then(function () { setTimeout(function () { window.print(); }, 600); });
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
  const orient: "h" | "v" = o === "v" ? "v" : "h";

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experiences")
    .select("id, data")
    .eq("slug", slug)
    .maybeSingle();
  if (!row?.data) notFound();

  const e = row.data as Experience;
  if (e.design !== "v2" || !e.page?.blocks?.length) {
    // El deck vive del diseño v2; una experiencia legacy no tiene bloques.
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 560 }}>
        <h1 style={{ fontSize: 20, marginBottom: 10 }}>Aún no se puede generar el PDF</h1>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          Esta experiencia todavía usa el diseño anterior. Edítala y guárdala en el formulario
          nuevo (queda en diseño v2) y el PDF se generará solo.
        </p>
      </div>
    );
  }
  const slots = await fetchOpenSlotsForTemplate((row as { id: string }).id);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: deckCss(orient) }} />
      <ExperienceDeck experience={e} slots={slots} orient={orient} />
      <script dangerouslySetInnerHTML={{ __html: AUTOPRINT }} />
    </>
  );
}
