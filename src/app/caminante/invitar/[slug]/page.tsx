// Invitación imprimible (→ PDF) PÚBLICA de una experiencia, para compartir con
// amigos. Es el MISMO deck/flyer del admin (un slide por sección), pero sin
// gate: solo experiencias PUBLICADAS y solo su info pública (fechas abiertas
// públicas; nunca revela salidas privadas). Auto-dispara "Guardar como PDF".
// Vertical por defecto (mejor para compartir por teléfono). El <title> = el
// título de la experiencia → el archivo se guarda como "<Título>.pdf".
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Experience } from "@/lib/experiences/types";
import { fetchOpenSlotsForTemplate } from "@/lib/experiences/availability";
import { deckCss, DECK_GLASS_SCRIPT } from "@/lib/experiences/deck-css";
import ExperienceDeck from "../../experiencias/[slug]/ExperienceDeck";
import DeckPdfButton from "../../experiencias/[slug]/DeckPdfButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experiences")
    .select("data, status")
    .eq("slug", slug)
    .maybeSingle();
  const e = row?.status === "published" ? (row.data as Experience) : undefined;
  const title =
    [e?.title, e?.titleAccent].filter(Boolean).join(" ").trim() || e?.docTitle || "Experiencia Caminante";
  return { title };
}

// Espera IMÁGENES (decodificadas) + FUENTES antes de imprimir. img.decode()
// garantiza que la foto esté rasterizada; img.complete puede ser true sin estar
// pintada → con fotos pesadas Chrome imprime ANTES y el PDF sale sin fotos/flat.
// .catch para que una foto rota no cuelgue el Promise.all; red de seguridad a 7s.
const AUTOPRINT = `
window.addEventListener('load', function () {
  // Móvil: window.print() ignora el @page del deck y fragmenta las láminas en
  // cientos de páginas → ahí NO auto-imprimimos; el botón «Descargar PDF»
  // (DeckPdfButton) genera el PDF correcto en el navegador.
  if (window.matchMedia && matchMedia('(pointer: coarse)').matches) return;
  var imgs = Array.prototype.slice.call(document.images);
  var imgsReady = Promise.all(imgs.map(function (img) {
    if (img.decode) return img.decode().then(function(){return true;}).catch(function () { return true; });
    return img.complete ? true : new Promise(function (res) { img.onload = img.onerror = res; });
  }));
  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  var safety = new Promise(function (res) { setTimeout(res, 7000); });
  Promise.race([Promise.all([imgsReady, fontsReady]), safety]).then(function () {
    setTimeout(function () { window.print(); }, 400);
  });
});
`;

export default async function InvitarPDFPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ o?: string }>;
}) {
  const { slug } = await params;
  const { o } = await searchParams;
  const orient: "h" | "v" = o === "h" ? "h" : "v"; // vertical por defecto

  const sb = createSupabaseAdminClient();
  const { data: row } = await sb
    .from("experiences")
    .select("id, data, status")
    .eq("slug", slug)
    .maybeSingle();
  // Solo PUBLICADAS (los borradores no se comparten).
  if (!row?.data || row.status !== "published") notFound();

  const e = row.data as Experience;
  if (e.design !== "v2" || !e.page?.blocks?.length) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", maxWidth: 560 }}>
        <h1 style={{ fontSize: 20, marginBottom: 10 }}>Invitación no disponible</h1>
        <p style={{ color: "#555", lineHeight: 1.6 }}>
          Esta experiencia aún no tiene su invitación lista. Comparte su página directamente por
          ahora.
        </p>
      </div>
    );
  }
  // Sin includePrivate → solo fechas públicas (jamás expone salidas de grupo).
  const slots = await fetchOpenSlotsForTemplate((row as { id: string }).id);

  const titulo =
    [e.title, e.titleAccent].filter(Boolean).join(" ").trim() || e.docTitle || "Experiencia Caminante";
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: deckCss(orient) }} />
      <DeckPdfButton filename={titulo} />
      <ExperienceDeck experience={e} slots={slots} orient={orient} />
      <script dangerouslySetInnerHTML={{ __html: DECK_GLASS_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: AUTOPRINT }} />
    </>
  );
}
